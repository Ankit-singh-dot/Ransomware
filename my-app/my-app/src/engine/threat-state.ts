// AEGIS Threat State Machine
// Manages incident lifecycle transitions with strict state validation.

import { createLogger } from '../logger';
import type { ThreatState } from '../types/threats';

const logger = createLogger('threat-state');

// Valid state transitions
const TRANSITIONS: Record<ThreatState, ThreatState[]> = {
  NORMAL:          ['OBSERVING', 'SUSPICIOUS', 'THREAT_DETECTED'],
  OBSERVING:       ['NORMAL', 'SUSPICIOUS', 'THREAT_DETECTED'],
  SUSPICIOUS:      ['NORMAL', 'OBSERVING', 'THREAT_DETECTED'],
  THREAT_DETECTED: ['CONTAINING', 'RESOLVED'],
  CONTAINING:      ['CONTAINED', 'THREAT_DETECTED'], // can fail and go back
  CONTAINED:       ['RECOVERING', 'RESOLVED'],
  RECOVERING:      ['RECOVERED', 'CONTAINED'],       // can fail and go back
  RECOVERED:       ['RESOLVED'],
  RESOLVED:        ['NORMAL'],                        // can re-open
};

/**
 * Validate whether a state transition is allowed.
 */
export function canTransition(from: ThreatState, to: ThreatState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Attempt a state transition. Throws if invalid.
 */
export function transition(from: ThreatState, to: ThreatState): ThreatState {
  if (!canTransition(from, to)) {
    const msg = `Invalid state transition: ${from} → ${to}`;
    logger.error(msg, { from, to, allowedTransitions: TRANSITIONS[from] });
    throw new Error(msg);
  }

  logger.info('state_transition', { from, to });
  return to;
}

/**
 * Determine the appropriate state based on threat score and current state.
 */
export function evaluateState(
  currentState: ThreatState,
  threatScore: number,
  thresholds: {
    observeAt: number;
    suspiciousAt: number;
    threatAt: number;
  }
): ThreatState {
  // Don't change state if we're in an action state (containing, recovering, etc.)
  if (['CONTAINING', 'CONTAINED', 'RECOVERING', 'RECOVERED', 'RESOLVED'].includes(currentState)) {
    return currentState;
  }

  let targetState: ThreatState = 'NORMAL';

  if (threatScore >= thresholds.threatAt) {
    targetState = 'THREAT_DETECTED';
  } else if (threatScore >= thresholds.suspiciousAt) {
    targetState = 'SUSPICIOUS';
  } else if (threatScore >= thresholds.observeAt) {
    targetState = 'OBSERVING';
  }

  // Check if the transition is valid
  if (targetState === currentState) return currentState;
  if (canTransition(currentState, targetState)) return targetState;

  return currentState;
}

/**
 * Get severity level for a threat state.
 */
export function getStateSeverity(state: ThreatState): 'normal' | 'warning' | 'critical' | 'success' {
  switch (state) {
    case 'NORMAL':
      return 'normal';
    case 'OBSERVING':
    case 'SUSPICIOUS':
      return 'warning';
    case 'THREAT_DETECTED':
    case 'CONTAINING':
      return 'critical';
    case 'CONTAINED':
    case 'RECOVERING':
      return 'warning';
    case 'RECOVERED':
    case 'RESOLVED':
      return 'success';
    default:
      return 'normal';
  }
}
