// AEGIS Containment Types — Containment and recovery actions

export type ContainmentStatus =
  | 'REQUESTED'
  | 'RUNNING'
  | 'SUCCESS'
  | 'FAILED'
  | 'ROLLED_BACK';

export type ContainmentAction =
  | 'STOP_PROCESS'
  | 'ISOLATE_CONTAINER'
  | 'BLOCK_NETWORK'
  | 'FREEZE_WORKLOAD'
  | 'SURGICAL_STRIKE';

export interface ContainmentRequest {
  requestId: string;
  incidentId: string;
  workloadId: string;
  containerId: string;
  action: ContainmentAction;
  targetProcessId?: number;
  status: ContainmentStatus;
  requestedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface RecoveryRequest {
  requestId: string;
  incidentId: string;
  workloadId: string;
  snapshotId: string;
  status: ContainmentStatus;
  filesTotal: number;
  filesRecovered: number;
  filesFailed: number;
  requestedAt: Date;
  completedAt?: Date;
  error?: string;
}

export interface SnapshotInfo {
  snapshotId: string;
  workloadId: string;
  path: string;
  fileCount: number;
  totalSize: number;
  createdAt: Date;
}
