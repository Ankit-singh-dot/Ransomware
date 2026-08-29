// AEGIS Risk Scoring Engine
// Aggregates threat signals into an explainable risk score.
// Every score has a human-readable breakdown.

import { createLogger } from '../logger';
import type { ThreatSignal, ThreatAssessment, ThreatState } from '../types/threats';
import { analyzeWorkload } from './detection';
import { evaluateState } from './threat-state';

const logger = createLogger('risk-engine');

// In-memory risk tracking per workload
const riskState: Map<string, {
  currentScore: number;
  currentState: ThreatState;
  lastSignals: ThreatSignal[];
  firstAnomalyAt?: Date;
  incidentId?: string;
}> = new Map();

/**
 * Calculate explainable risk score for a workload.
 * Combines all detection signals and returns a full assessment.
 */
export function assessRisk(
  workloadId: string,
  thresholds = { observeAt: 30, suspiciousAt: 50, threatAt: 75 }
): ThreatAssessment {
  const signals = analyzeWorkload(workloadId);
  const totalScore = Math.min(
    signals.reduce((sum, s) => sum + s.score, 0),
    100
  );

  // Get or create workload risk state
  let state = riskState.get(workloadId);
  if (!state) {
    state = {
      currentScore: 0,
      currentState: 'NORMAL' as ThreatState,
      lastSignals: [],
    };
    riskState.set(workloadId, state);
  }

  const previousState = state.currentState;
  const newState = evaluateState(state.currentState, totalScore, thresholds);

  // Track when anomaly first appeared
  if (totalScore > 0 && !state.firstAnomalyAt) {
    state.firstAnomalyAt = new Date();
  }
  if (totalScore === 0) {
    state.firstAnomalyAt = undefined;
  }

  // Update state
  state.currentScore = totalScore;
  state.currentState = newState;
  state.lastSignals = signals;

  if (newState !== previousState) {
    logger.warn('threat_state_changed', {
      workloadId,
      from: previousState,
      to: newState,
      score: totalScore,
    });
  }

  return {
    totalScore,
    signals,
    state: newState,
    previousState,
    assessedAt: new Date(),
    workloadId,
    incidentId: state.incidentId,
  };
}

/**
 * Get the current risk state for a workload (without re-analyzing).
 */
export function getRiskState(workloadId: string) {
  return riskState.get(workloadId) || {
    currentScore: 0,
    currentState: 'NORMAL' as ThreatState,
    lastSignals: [],
  };
}

/**
 * Set the incident ID associated with a workload's risk state.
 */
export function setIncidentId(workloadId: string, incidentId: string): void {
  const state = riskState.get(workloadId);
  if (state) {
    state.incidentId = incidentId;
  }
}

/**
 * Force a state change (used by containment/recovery).
 */
export function forceState(workloadId: string, newState: ThreatState): void {
  const state = riskState.get(workloadId);
  if (state) {
    logger.info('state_forced', { workloadId, from: state.currentState, to: newState });
    state.currentState = newState;
  }
}

/**
 * Reset risk state for a workload.
 */
export function resetRiskState(workloadId: string): void {
  riskState.delete(workloadId);
  logger.info('risk_state_reset', { workloadId });
}

/**
 * Get all active risk states.
 */
export function getAllRiskStates() {
  const result: Record<string, {
    currentScore: number;
    currentState: ThreatState;
    signalCount: number;
  }> = {};

  for (const [workloadId, state] of riskState) {
    result[workloadId] = {
      currentScore: state.currentScore,
      currentState: state.currentState,
      signalCount: state.lastSignals.length,
    };
  }

  return result;
}
