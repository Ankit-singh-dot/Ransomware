// AEGIS Event Types — Normalized event model for security monitoring

export type EventType =
  | 'FILE_READ'
  | 'FILE_WRITE'
  | 'FILE_RENAME'
  | 'FILE_DELETE'
  | 'PROCESS_START'
  | 'PROCESS_EXIT'
  | 'NETWORK_CONNECT';

export interface AegisEvent {
  eventId: string;
  timestamp: Date;
  containerId: string;
  processId: number;
  parentProcessId: number;
  processName: string;
  eventType: EventType;
  filePath?: string;
  oldFilePath?: string; // for renames
  networkDestination?: string;
  networkPort?: number;
  fileSize?: number;
  entropy?: number;
  metadata?: Record<string, unknown>;
}

export interface EventBatch {
  events: AegisEvent[];
  workloadId: string;
  receivedAt: Date;
}

export interface EventStats {
  totalEvents: number;
  eventsPerSecond: number;
  fileWritesPerSecond: number;
  fileRenamesPerSecond: number;
  fileDeletesPerSecond: number;
  uniqueDirectories: number;
  uniqueExtensionsChanged: number;
}
