// AEGIS Threat Types — Threat detection, scoring, and state management

export type ThreatState =
  | 'NORMAL'
  | 'OBSERVING'
  | 'SUSPICIOUS'
  | 'THREAT_DETECTED'
  | 'CONTAINING'
  | 'CONTAINED'
  | 'RECOVERING'
  | 'RECOVERED'
  | 'RESOLVED';

export type AutonomyMode =
  | 'OBSERVE'
  | 'SUGGEST'
  | 'APPROVAL'
  | 'AUTO_CONTAIN';

export interface ThreatSignal {
  signalId: string;
  signalType: string;
  description: string;
  score: number;       // contribution to overall threat score
  maxScore: number;    // maximum possible contribution
  evidence: string;    // human-readable evidence
  timestamp: Date;
}

export interface ThreatAssessment {
  totalScore: number;          // 0-100
  signals: ThreatSignal[];
  state: ThreatState;
  previousState: ThreatState;
  assessedAt: Date;
  workloadId: string;
  incidentId?: string;
}

export interface IncidentSummary {
  incidentId: string;
  workloadId: string;
  state: ThreatState;
  threatScore: number;
  detectedAt: Date;
  containedAt?: Date;
  recoveredAt?: Date;
  resolvedAt?: Date;
  filesAtRisk: number;
  filesAffected: number;
  filesRecovered: number;
  detectionLatencyMs: number;
  containmentLatencyMs?: number;
  signals: ThreatSignal[];
  affectedProcesses: number[];
  timelineEvents: TimelineEntry[];
}

export interface TimelineEntry {
  timestamp: Date;
  type: 'event' | 'detection' | 'state_change' | 'action' | 'recovery';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  metadata?: Record<string, unknown>;
}
