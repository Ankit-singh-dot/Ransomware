

import { createLogger } from '../logger';
import type { AegisEvent } from '../types/events';
import type { ThreatSignal } from '../types/threats';
import { getBufferedEvents, calculateEventStats } from './event-processor';

const logger = createLogger('detection');

// Signal type identifiers
export const SIGNAL_TYPES = {
  FILE_MOD_RATE: 'FILE_MOD_RATE',
  MASS_RENAME: 'MASS_RENAME',
  ENTROPY_SPIKE: 'ENTROPY_SPIKE',
  DIR_SPREAD: 'DIR_SPREAD',
  PROCESS_ANOMALY: 'PROCESS_ANOMALY',
  NETWORK_ANOMALY: 'NETWORK_ANOMALY',
  CANARY_TRIPWIRE: 'CANARY_TRIPWIRE',
} as const;

// Configurable detection thresholds
export interface DetectionConfig {
  fileModRateThreshold: number;       // writes/sec to trigger signal
  massRenameThreshold: number;        // renames/sec to trigger signal
  entropyDeltaThreshold: number;      // entropy change to flag
  dirSpreadThreshold: number;         // unique dirs touched to flag
  maxScoreFileModRate: number;        // max score contribution
  maxScoreMassRename: number;
  maxScoreEntropySpike: number;
  maxScoreDirSpread: number;
  maxScoreProcessAnomaly: number;
  maxScoreNetworkAnomaly: number;
}

const DEFAULT_CONFIG: DetectionConfig = {
  fileModRateThreshold: 5,
  massRenameThreshold: 3,
  entropyDeltaThreshold: 2.0,
  dirSpreadThreshold: 5,
  maxScoreFileModRate: 30,
  maxScoreMassRename: 20,
  maxScoreEntropySpike: 20,
  maxScoreDirSpread: 15,
  maxScoreProcessAnomaly: 10,
  maxScoreNetworkAnomaly: 5,
};

/**
 * Analyze buffered events for a workload and extract threat signals.
 * Each signal has a score, explanation, and evidence.
 */
export function analyzeWorkload(
  workloadId: string,
  config: DetectionConfig = DEFAULT_CONFIG
): ThreatSignal[] {
  const events = getBufferedEvents(workloadId);
  const stats = calculateEventStats(workloadId);
  const signals: ThreatSignal[] = [];

  if (events.length === 0) return signals;

  // 1. File modification rate
  signals.push(detectFileModRate(stats, config));

  // 2. Mass rename behavior
  signals.push(detectMassRename(events, stats, config));

  // 3. Entropy anomaly
  signals.push(detectEntropySpike(events, config));

  // 4. Directory spread
  signals.push(detectDirSpread(stats, config));

  // 5. Process anomaly
  signals.push(detectProcessAnomaly(events, config));

  // 6. Network anomaly
  signals.push(detectNetworkAnomaly(events, config));

  // 7. Canary Honeypot Tripwire (Instant 100 Score)
  signals.push(detectCanaryTripwire(events));

  // Filter to only signals with score > 0
  const activeSignals = signals.filter((s) => s.score > 0);

  if (activeSignals.length > 0) {
    logger.info('behavioral_analysis_complete', {
      workloadId,
      signalCount: activeSignals.length,
      totalScore: activeSignals.reduce((sum, s) => sum + s.score, 0),
    });
  }

  return activeSignals;
}

function detectFileModRate(stats: ReturnType<typeof calculateEventStats>, config: DetectionConfig): ThreatSignal {
  const rate = stats.fileWritesPerSecond;
  let score = 0;

  if (rate >= config.fileModRateThreshold) {
    // Scale linearly from threshold to 4x threshold
    const intensity = Math.min(rate / (config.fileModRateThreshold * 4), 1);
    score = Math.round(intensity * config.maxScoreFileModRate);
  }

  return {
    signalId: `sig_fmr_${Date.now()}`,
    signalType: SIGNAL_TYPES.FILE_MOD_RATE,
    description: 'Abnormally high file modification rate',
    score,
    maxScore: config.maxScoreFileModRate,
    evidence: `${rate} file writes/sec (threshold: ${config.fileModRateThreshold}/sec)`,
    timestamp: new Date(),
  };
}

function detectMassRename(events: AegisEvent[], stats: ReturnType<typeof calculateEventStats>, config: DetectionConfig): ThreatSignal {
  const renameRate = stats.fileRenamesPerSecond;
  let score = 0;

  if (renameRate >= config.massRenameThreshold) {
    const intensity = Math.min(renameRate / (config.massRenameThreshold * 4), 1);
    score = Math.round(intensity * config.maxScoreMassRename);
  }

  // Check for extension changes (more suspicious than same-ext renames)
  const extensionChanges = events.filter((e) => {
    if (e.eventType !== 'FILE_RENAME' || !e.filePath || !e.oldFilePath) return false;
    const oldExt = e.oldFilePath.split('.').pop();
    const newExt = e.filePath.split('.').pop();
    return oldExt !== newExt;
  }).length;

  if (extensionChanges > 3) {
    score = Math.min(score + Math.round((extensionChanges / 20) * config.maxScoreMassRename), config.maxScoreMassRename);
  }

  return {
    signalId: `sig_mr_${Date.now()}`,
    signalType: SIGNAL_TYPES.MASS_RENAME,
    description: 'Mass file rename activity',
    score,
    maxScore: config.maxScoreMassRename,
    evidence: `${renameRate} renames/sec, ${extensionChanges} extension changes (threshold: ${config.massRenameThreshold}/sec)`,
    timestamp: new Date(),
  };
}

function detectEntropySpike(events: AegisEvent[], config: DetectionConfig): ThreatSignal {
  // Look for events that recorded entropy changes
  const entropyEvents = events.filter(
    (e) => e.metadata && typeof (e.metadata as Record<string, unknown>).entropyBefore === 'number' &&
           typeof (e.metadata as Record<string, unknown>).entropyAfter === 'number'
  );

  let maxDelta = 0;
  let suspiciousCount = 0;

  for (const event of entropyEvents) {
    const meta = event.metadata as Record<string, number>;
    const delta = meta.entropyAfter - meta.entropyBefore;
    if (delta > maxDelta) maxDelta = delta;
    if (delta > config.entropyDeltaThreshold && meta.entropyAfter > 7.0) {
      suspiciousCount++;
    }
  }

  let score = 0;
  if (suspiciousCount > 0) {
    const intensity = Math.min(suspiciousCount / 10, 1);
    score = Math.round(intensity * config.maxScoreEntropySpike);
  }

  return {
    signalId: `sig_es_${Date.now()}`,
    signalType: SIGNAL_TYPES.ENTROPY_SPIKE,
    description: 'Significant entropy increase detected',
    score,
    maxScore: config.maxScoreEntropySpike,
    evidence: `${suspiciousCount} files with entropy spike > ${config.entropyDeltaThreshold}, max delta: ${maxDelta.toFixed(2)}`,
    timestamp: new Date(),
  };
}

function detectDirSpread(stats: ReturnType<typeof calculateEventStats>, config: DetectionConfig): ThreatSignal {
  let score = 0;

  if (stats.uniqueDirectories >= config.dirSpreadThreshold) {
    const intensity = Math.min(stats.uniqueDirectories / (config.dirSpreadThreshold * 4), 1);
    score = Math.round(intensity * config.maxScoreDirSpread);
  }

  return {
    signalId: `sig_ds_${Date.now()}`,
    signalType: SIGNAL_TYPES.DIR_SPREAD,
    description: 'Suspicious directory spread pattern',
    score,
    maxScore: config.maxScoreDirSpread,
    evidence: `${stats.uniqueDirectories} directories touched (threshold: ${config.dirSpreadThreshold})`,
    timestamp: new Date(),
  };
}

function detectProcessAnomaly(events: AegisEvent[], config: DetectionConfig): ThreatSignal {
  // Detect processes spawning suspicious children or unusual process chains
  const processStarts = events.filter((e) => e.eventType === 'PROCESS_START');
  const processMap = new Map<number, number>(); // pid → child count

  for (const event of processStarts) {
    const parent = event.parentProcessId;
    processMap.set(parent, (processMap.get(parent) || 0) + 1);
  }

  let score = 0;
  let maxChildren = 0;

  for (const [, childCount] of processMap) {
    if (childCount > maxChildren) maxChildren = childCount;
    if (childCount > 3) {
      score = Math.min(score + 5, config.maxScoreProcessAnomaly);
    }
  }

  return {
    signalId: `sig_pa_${Date.now()}`,
    signalType: SIGNAL_TYPES.PROCESS_ANOMALY,
    description: 'Suspicious process lineage',
    score,
    maxScore: config.maxScoreProcessAnomaly,
    evidence: `${processStarts.length} process starts, max ${maxChildren} children from single parent`,
    timestamp: new Date(),
  };
}

function detectNetworkAnomaly(events: AegisEvent[], config: DetectionConfig): ThreatSignal {
  const networkEvents = events.filter((e) => e.eventType === 'NETWORK_CONNECT');
  let score = 0;

  // Simple heuristic: network activity during high file modification is suspicious
  if (networkEvents.length > 0) {
    const fileWriteEvents = events.filter((e) => e.eventType === 'FILE_WRITE');
    if (fileWriteEvents.length > 10 && networkEvents.length > 0) {
      score = Math.min(networkEvents.length * 2, config.maxScoreNetworkAnomaly);
    }
  }

  const uniqueDestinations = new Set(networkEvents.map((e) => e.networkDestination).filter(Boolean));

  return {
    signalId: `sig_na_${Date.now()}`,
    signalType: SIGNAL_TYPES.NETWORK_ANOMALY,
    description: 'Network anomaly during file activity',
    score,
    maxScore: config.maxScoreNetworkAnomaly,
    evidence: `${networkEvents.length} network connections to ${uniqueDestinations.size} unique destinations`,
    timestamp: new Date(),
  };
}

function detectCanaryTripwire(events: AegisEvent[]): ThreatSignal {
  // Check if any event touches our known canary honeypots
  const canaryTriggered = events.find((e) => {
    const path = e.filePath || e.oldFilePath || '';
    return path.includes('FINANCE_PASSWORDS.txt') || path.includes('DO_NOT_DELETE.canary');
  });

  if (canaryTriggered) {
    return {
      signalId: `sig_canary_${Date.now()}`,
      signalType: SIGNAL_TYPES.CANARY_TRIPWIRE,
      description: 'CRITICAL: Canary honeypot file modified!',
      score: 100, // Instant critical score
      maxScore: 100,
      evidence: `Process ${canaryTriggered.processName} modified canary file: ${canaryTriggered.filePath || canaryTriggered.oldFilePath}`,
      timestamp: new Date(),
    };
  }

  return {
    signalId: `sig_canary_${Date.now()}`,
    signalType: SIGNAL_TYPES.CANARY_TRIPWIRE,
    description: 'Canary intact',
    score: 0,
    maxScore: 100,
    evidence: 'No canary files touched',
    timestamp: new Date(),
  };
}

