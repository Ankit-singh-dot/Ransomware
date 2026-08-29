// AEGIS Agent — The core orchestrator that ties everything together.
// Collects events → processes → detects → scores → decides → contains → recovers.
// This is the "digital immune system" runtime.

import { createLogger } from '../logger';
import type { AegisEvent } from '../types/events';
import type { ThreatAssessment, TimelineEntry, ThreatState } from '../types/threats';
import type { PolicyEvaluation } from '../types/policies';
import type { ContainmentResult } from './containment';
import { processEvent, clearBuffers } from './event-processor';
import { assessRisk, forceState, resetRiskState, setIncidentId, getRiskState } from './risk-engine';
import { evaluatePolicy, shouldAutoContain, getActivePolicy } from './policy-engine';
import { executeFullContainment } from './containment';
import { createSnapshot, recoverFromSnapshot, identifyAffectedFiles, getSnapshot, listSnapshots } from './recovery';

const logger = createLogger('agent');

// ─── SSE Broadcasting ──────────────────────────────────────────
type SSEListener = (event: string, data: unknown) => void;
const sseListeners: Set<SSEListener> = new Set();

export function addSSEListener(listener: SSEListener): void {
  sseListeners.add(listener);
}

export function removeSSEListener(listener: SSEListener): void {
  sseListeners.delete(listener);
}

function broadcast(event: string, data: unknown): void {
  for (const listener of sseListeners) {
    try {
      listener(event, data);
    } catch {
      // Don't let a broken listener crash the agent
    }
  }
}

// ─── Agent State ───────────────────────────────────────────────

interface AgentState {
  running: boolean;
  aegisEnabled: boolean;
  workloadId: string | null;
  containerId: string | null;
  snapshotId: string | null;
  incidentId: string | null;
  timeline: TimelineEntry[];
  metrics: {
    eventsProcessed: number;
    detectionTimeMs: number | null;
    containmentTimeMs: number | null;
    filesAtRisk: number;
    filesAffected: number;
    filesRecovered: number;
  };
  analysisInterval: ReturnType<typeof setInterval> | null;
  attackStartedAt: Date | null;
  c2IpAddress: string | null;
}

const state: AgentState = {
  running: false,
  aegisEnabled: true,
  workloadId: null,
  containerId: null,
  snapshotId: null,
  incidentId: null,
  timeline: [],
  metrics: {
    eventsProcessed: 0,
    detectionTimeMs: null,
    containmentTimeMs: null,
    filesAtRisk: 0,
    filesAffected: 0,
    filesRecovered: 0,
  },
  analysisInterval: null,
  attackStartedAt: null,
  c2IpAddress: null,
};

// ─── Timeline ──────────────────────────────────────────────────

function addTimelineEntry(entry: Omit<TimelineEntry, 'timestamp'>): void {
  const full: TimelineEntry = { ...entry, timestamp: new Date() };
  state.timeline.push(full);
  broadcast('timeline', full);
}

// ─── Agent Lifecycle ───────────────────────────────────────────

/**
 * Initialize the AEGIS agent for a workload.
 */
export async function startAgent(
  workloadId: string,
  containerId: string
): Promise<void> {
  state.running = true;
  state.workloadId = workloadId;
  state.containerId = containerId;
  state.timeline = [];
  state.metrics = {
    eventsProcessed: 0,
    detectionTimeMs: null,
    containmentTimeMs: null,
    filesAtRisk: 0,
    filesAffected: 0,
    filesRecovered: 0,
  };
  state.attackStartedAt = null;
  state.incidentId = null;
  state.c2IpAddress = null;

  clearBuffers();
  resetRiskState(workloadId);

  logger.info('agent_started', { workloadId, containerId });

  addTimelineEntry({
    type: 'event',
    title: 'AEGIS Agent Started',
    description: `Monitoring workload ${workloadId}`,
    severity: 'info',
  });

  // Create initial snapshot
  if (state.aegisEnabled) {
    const snapshot = await createSnapshot(containerId, workloadId);
    if (snapshot) {
      state.snapshotId = snapshot.snapshotId;
      state.metrics.filesAtRisk = snapshot.fileCount;

      addTimelineEntry({
        type: 'event',
        title: 'Snapshot Created',
        description: `Protected ${snapshot.fileCount} files in sandbox`,
        severity: 'info',
      });

      broadcast('snapshot', snapshot);
    }
  }

  // Start periodic analysis
  state.analysisInterval = setInterval(() => {
    if (state.running && state.aegisEnabled && state.workloadId) {
      runAnalysisCycle();
    }
  }, 500); // Analyze every 500ms for fast detection

  broadcast('status', getAgentStatus());
}

/**
 * Stop the AEGIS agent.
 */
export function stopAgent(): void {
  if (state.analysisInterval) {
    clearInterval(state.analysisInterval);
    state.analysisInterval = null;
  }
  state.running = false;
  logger.info('agent_stopped');
  broadcast('status', getAgentStatus());
}

/**
 * Enable/disable AEGIS protection.
 */
export function setAegisEnabled(enabled: boolean): void {
  state.aegisEnabled = enabled;
  logger.info('aegis_protection_toggled', { enabled });
  broadcast('status', getAgentStatus());
}

// ─── Event Ingestion ───────────────────────────────────────────

/**
 * Ingest an event from the monitored workload.
 */
export function ingestEvent(event: AegisEvent): void {
  const accepted = processEvent(event);
  if (!accepted) return;

  state.metrics.eventsProcessed++;

  // Track when suspicious activity first appears
  if (event.eventType === 'FILE_WRITE' || event.eventType === 'FILE_RENAME') {
    if (!state.attackStartedAt && state.metrics.eventsProcessed > 10) {
      // heuristic: first sign of rapid activity after initial quiet period
    }
  }

  // Extract C2 IP from Ping or Network commands
  if (!state.c2IpAddress) {
    if (event.processName.includes('ping')) {
      const ipMatch = event.processName.match(/ping.*\\b(\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3})\\b/);
      if (ipMatch) state.c2IpAddress = ipMatch[1];
    } else if (event.networkDestination) {
      state.c2IpAddress = event.networkDestination;
    }
    
    if (state.c2IpAddress) {
      logger.info('c2_ip_extracted', { ip: state.c2IpAddress });
      broadcast('status', getAgentStatus());
    }
  }

  broadcast('event', {
    eventId: event.eventId,
    eventType: event.eventType,
    processName: event.processName,
    filePath: event.filePath,
    timestamp: event.timestamp,
  });
}

// ─── Analysis Cycle ────────────────────────────────────────────

let lastState: ThreatState = 'NORMAL';

async function runAnalysisCycle(): Promise<void> {
  if (!state.workloadId || !state.containerId) return;

  const policy = getActivePolicy();
  const assessment = assessRisk(state.workloadId, policy.thresholds);

  // Broadcast threat assessment
  broadcast('threat', {
    score: assessment.totalScore,
    state: assessment.state,
    signals: assessment.signals,
  });

  // Broadcast real-time metrics (updates events processed, detection times, etc)
  broadcast('metrics', state.metrics);

  // State transition events
  if (assessment.state !== lastState) {
    handleStateChange(lastState, assessment.state, assessment);
    lastState = assessment.state;
  }

  // Auto-containment check
  if (
    assessment.state === 'THREAT_DETECTED' &&
    shouldAutoContain(assessment.totalScore)
  ) {
    await handleContainment(assessment);
  }
}

function handleStateChange(
  from: ThreatState,
  to: ThreatState,
  assessment: ThreatAssessment
): void {
  const severityMap: Record<string, 'info' | 'warning' | 'critical' | 'success'> = {
    NORMAL: 'info',
    OBSERVING: 'warning',
    SUSPICIOUS: 'warning',
    THREAT_DETECTED: 'critical',
    CONTAINING: 'critical',
    CONTAINED: 'success',
    RECOVERING: 'info',
    RECOVERED: 'success',
    RESOLVED: 'success',
  };

  addTimelineEntry({
    type: 'state_change',
    title: `State: ${to}`,
    description: `Threat score: ${assessment.totalScore}%. ${assessment.signals.length} active signals.`,
    severity: severityMap[to] || 'info',
    metadata: {
      from,
      to,
      score: assessment.totalScore,
      signalCount: assessment.signals.length,
    },
  });

  if (to === 'SUSPICIOUS') {
    state.attackStartedAt = state.attackStartedAt || new Date();

    addTimelineEntry({
      type: 'detection',
      title: 'Suspicious Behavior Detected',
      description: assessment.signals.map((s) => `+${s.score} ${s.description}`).join(', '),
      severity: 'warning',
    });
  }

  if (to === 'THREAT_DETECTED') {
    if (!state.attackStartedAt) state.attackStartedAt = new Date();
    state.metrics.detectionTimeMs = Date.now() - state.attackStartedAt.getTime();

    addTimelineEntry({
      type: 'detection',
      title: 'Ransomware Behavior Confirmed',
      description: `Threat score: ${assessment.totalScore}%. Detection time: ${state.metrics.detectionTimeMs}ms`,
      severity: 'critical',
    });

    // Evaluate policy
    const policyResult = evaluatePolicy(assessment.totalScore);
    broadcast('policy', policyResult);
  }
}

async function handleContainment(assessment: ThreatAssessment): Promise<void> {
  if (!state.containerId || !state.workloadId) return;

  // Prevent double containment
  const riskState = getRiskState(state.workloadId);
  if (['CONTAINING', 'CONTAINED', 'RECOVERING', 'RECOVERED', 'RESOLVED'].includes(riskState.currentState)) {
    return;
  }

  forceState(state.workloadId, 'CONTAINING');

  addTimelineEntry({
    type: 'action',
    title: 'Containment Initiated',
    description: 'Stopping suspicious processes and isolating container',
    severity: 'critical',
  });

  broadcast('containment', { status: 'CONTAINING', containerId: state.containerId });

  // Execute containment
  const results = await executeFullContainment(state.containerId);
  const anySucceeded = results.some((r) => r.status === 'SUCCESS');

  if (anySucceeded) {
    forceState(state.workloadId, 'CONTAINED');
    state.metrics.containmentTimeMs = state.attackStartedAt
      ? Date.now() - state.attackStartedAt.getTime()
      : null;

    addTimelineEntry({
      type: 'action',
      title: 'Workload Contained',
      description: `Containment completed in ${state.metrics.containmentTimeMs}ms`,
      severity: 'success',
    });

    broadcast('containment', { status: 'CONTAINED', results });

    // Start recovery
    await handleRecovery();
  } else {
    addTimelineEntry({
      type: 'action',
      title: 'Containment Partially Failed',
      description: results.filter((r) => r.status === 'FAILED').map((r) => r.error).join(', '),
      severity: 'critical',
    });

    broadcast('containment', { status: 'FAILED', results });
  }
}

async function handleRecovery(): Promise<void> {
  if (!state.containerId || !state.workloadId || !state.snapshotId) return;

  const snapshot = getSnapshot(state.snapshotId);
  if (!snapshot) return;

  forceState(state.workloadId, 'RECOVERING');

  addTimelineEntry({
    type: 'recovery',
    title: 'Recovery Started',
    description: 'Identifying affected files and restoring from snapshot',
    severity: 'info',
  });

  broadcast('recovery', { status: 'RECOVERING' });

  // Identify affected files
  const affected = await identifyAffectedFiles(
    state.containerId,
    snapshot.path
  );
  state.metrics.filesAffected = affected.affected.length + affected.deleted.length;

  // Recover
  const result = await recoverFromSnapshot(state.containerId, snapshot.path);
  state.metrics.filesRecovered = result.filesRecovered;

  forceState(state.workloadId, 'RECOVERED');

  addTimelineEntry({
    type: 'recovery',
    title: 'Recovery Complete',
    description: `${result.filesRecovered} files restored, ${result.filesFailed} failed`,
    severity: 'success',
  });

  if (result.artifactsCleaned > 0) {
    addTimelineEntry({
      type: 'action',
      title: 'Malware Vaporized',
      description: `AEGIS systematically tracked and erased ${result.artifactsCleaned} malicious artifacts created by the ransomware.`,
      severity: 'success',
    });
  }

  broadcast('recovery', {
    status: 'RECOVERED',
    filesAffected: state.metrics.filesAffected,
    filesRecovered: result.filesRecovered,
    filesFailed: result.filesFailed,
  });

  broadcast('metrics', state.metrics);
}

// ─── Public API ────────────────────────────────────────────────

export function getAgentStatus() {
  const riskState = state.workloadId ? getRiskState(state.workloadId) : null;

  return {
    running: state.running,
    aegisEnabled: state.aegisEnabled,
    workloadId: state.workloadId,
    containerId: state.containerId,
    snapshotId: state.snapshotId,
    threatState: riskState?.currentState || 'NORMAL',
    threatScore: riskState?.currentScore || 0,
    signals: riskState?.lastSignals || [],
    metrics: state.metrics,
    timeline: state.timeline,
    c2IpAddress: state.c2IpAddress,
    policy: getActivePolicy(),
  };
}

export function getTimeline(): TimelineEntry[] {
  return [...state.timeline];
}

export function getMetrics() {
  return { ...state.metrics };
}

/**
 * Reset the agent for a new demo run.
 */
export function resetAgent(): void {
  stopAgent();
  state.workloadId = null;
  state.containerId = null;
  state.snapshotId = null;
  state.incidentId = null;
  state.c2IpAddress = null;
  state.timeline = [];
  state.metrics = {
    eventsProcessed: 0,
    detectionTimeMs: null,
    containmentTimeMs: null,
    filesAtRisk: 0,
    filesAffected: 0,
    filesRecovered: 0,
  };
  state.attackStartedAt = null;
  lastState = 'NORMAL';
  clearBuffers();
  logger.info('agent_reset');
  broadcast('status', getAgentStatus());
}
