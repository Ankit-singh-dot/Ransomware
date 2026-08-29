// AEGIS Policy Engine
// Evaluates threat scores against configured policies to determine actions.
// Separates DETECTION from DECISION.

import { createLogger } from '../logger';
import type { AutonomyMode } from '../types/threats';
import type { PolicyActionType, PolicyEvaluation } from '../types/policies';

const logger = createLogger('policy-engine');

// Default policy configuration
let activePolicy = {
  policyId: 'default',
  autonomyMode: 'AUTO_CONTAIN' as AutonomyMode,
  thresholds: {
    observeAt: 30,
    suspiciousAt: 50,
    threatAt: 75,
    containAt: 75,
  },
};

/**
 * Evaluate a threat score against the active policy.
 * Returns recommended actions and whether approval is needed.
 */
export function evaluatePolicy(threatScore: number): PolicyEvaluation {
  const actions: PolicyActionType[] = [];
  let requiresApproval = false;

  // Determine actions based on score and thresholds
  if (threatScore >= activePolicy.thresholds.containAt) {
    actions.push('STOP_PROCESS', 'ISOLATE_CONTAINER', 'SNAPSHOT', 'RECOVER');
  } else if (threatScore >= activePolicy.thresholds.threatAt) {
    actions.push('SNAPSHOT', 'ALERT');
  } else if (threatScore >= activePolicy.thresholds.suspiciousAt) {
    actions.push('ALERT');
  } else if (threatScore >= activePolicy.thresholds.observeAt) {
    actions.push('LOG');
  }

  // Apply autonomy mode
  switch (activePolicy.autonomyMode) {
    case 'OBSERVE':
      // Only log, never act
      return {
        policyId: activePolicy.policyId,
        threatScore,
        recommendedActions: ['LOG'],
        requiresApproval: false,
        evaluatedAt: new Date(),
      };

    case 'SUGGEST':
      // Recommend but don't execute containment
      requiresApproval = true;
      break;

    case 'APPROVAL':
      // Execute non-destructive actions, require approval for containment
      requiresApproval = actions.includes('STOP_PROCESS') || actions.includes('ISOLATE_CONTAINER');
      break;

    case 'AUTO_CONTAIN':
      // Execute all actions automatically
      requiresApproval = false;
      break;
  }

  const evaluation: PolicyEvaluation = {
    policyId: activePolicy.policyId,
    threatScore,
    recommendedActions: actions,
    requiresApproval,
    evaluatedAt: new Date(),
  };

  if (actions.length > 0) {
    logger.info('policy_evaluated', {
      score: threatScore,
      actions,
      requiresApproval,
      autonomyMode: activePolicy.autonomyMode,
    });
  }

  return evaluation;
}

/**
 * Update the active policy configuration.
 */
export function updatePolicy(config: {
  policyId?: string;
  autonomyMode?: AutonomyMode;
  thresholds?: Partial<typeof activePolicy.thresholds>;
}): void {
  if (config.policyId) activePolicy.policyId = config.policyId;
  if (config.autonomyMode) activePolicy.autonomyMode = config.autonomyMode;
  if (config.thresholds) {
    activePolicy.thresholds = { ...activePolicy.thresholds, ...config.thresholds };
  }

  logger.info('policy_updated', {
    policyId: activePolicy.policyId,
    autonomyMode: activePolicy.autonomyMode,
    thresholds: activePolicy.thresholds,
  });
}

/**
 * Get current policy configuration.
 */
export function getActivePolicy() {
  return { ...activePolicy };
}

/**
 * Check if containment should auto-execute (no approval needed).
 */
export function shouldAutoContain(threatScore: number): boolean {
  if (activePolicy.autonomyMode !== 'AUTO_CONTAIN') return false;
  return threatScore >= activePolicy.thresholds.containAt;
}
