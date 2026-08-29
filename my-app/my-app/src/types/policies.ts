// AEGIS Policy Types — Policy engine configuration

import { type AutonomyMode } from './threats';

export interface Policy {
  policyId: string;
  name: string;
  description: string;
  enabled: boolean;
  autonomyMode: AutonomyMode;
  thresholds: PolicyThresholds;
  actions: PolicyAction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PolicyThresholds {
  observeAt: number;    // score threshold to start observing (e.g., 30)
  suspiciousAt: number; // score threshold for suspicious state (e.g., 50)
  threatAt: number;     // score threshold for threat detected (e.g., 75)
  containAt: number;    // score threshold for auto-containment (e.g., 90)
}

export type PolicyActionType =
  | 'LOG'
  | 'ALERT'
  | 'STOP_PROCESS'
  | 'ISOLATE_CONTAINER'
  | 'BLOCK_NETWORK'
  | 'FREEZE_WORKLOAD'
  | 'SNAPSHOT'
  | 'RECOVER';

export interface PolicyAction {
  actionType: PolicyActionType;
  triggerScore: number;
  requiresApproval: boolean;
  enabled: boolean;
}

export interface PolicyEvaluation {
  policyId: string;
  threatScore: number;
  recommendedActions: PolicyActionType[];
  requiresApproval: boolean;
  evaluatedAt: Date;
}
