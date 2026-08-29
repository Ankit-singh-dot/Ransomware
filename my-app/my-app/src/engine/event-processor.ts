// AEGIS Event Processor
// Normalizes, deduplicates, buffers, and persists events.
// The central pipeline between raw collection and detection.

import { createLogger } from '../logger';
import type { AegisEvent, EventStats } from '../types/events';

const logger = createLogger('event-processor');

// In-memory event buffer for windowed analysis
const eventBuffer: Map<string, AegisEvent[]> = new Map(); // workloadId → events
const processedEventIds = new Set<string>(); // idempotency
const BUFFER_WINDOW_MS = 10_000; // 10-second sliding window
const MAX_BUFFER_SIZE = 10_000;

/**
 * Process an incoming event: validate, deduplicate, buffer.
 * Returns true if the event was accepted.
 */
export function processEvent(event: AegisEvent): boolean {
  // Idempotency check
  if (processedEventIds.has(event.eventId)) {
    logger.debug('duplicate_event_skipped', { eventId: event.eventId });
    return false;
  }

  // Mark as processed
  processedEventIds.add(event.eventId);

  // Prevent unbounded growth of idempotency set
  if (processedEventIds.size > MAX_BUFFER_SIZE * 2) {
    const toDelete = Array.from(processedEventIds).slice(0, MAX_BUFFER_SIZE);
    toDelete.forEach((id) => processedEventIds.delete(id));
  }

  // Buffer by workload
  const workloadId = event.containerId;
  if (!eventBuffer.has(workloadId)) {
    eventBuffer.set(workloadId, []);
  }

  const buffer = eventBuffer.get(workloadId)!;
  buffer.push(event);

  // Trim old events outside the window
  const cutoff = Date.now() - BUFFER_WINDOW_MS;
  while (buffer.length > 0 && buffer[0].timestamp.getTime() < cutoff) {
    buffer.shift();
  }

  // Cap buffer size
  while (buffer.length > MAX_BUFFER_SIZE) {
    buffer.shift();
  }

  logger.debug('event_processed', {
    eventId: event.eventId,
    type: event.eventType,
    workloadId,
    bufferSize: buffer.length,
  });

  return true;
}

/**
 * Get buffered events for a workload within the analysis window.
 */
export function getBufferedEvents(workloadId: string): AegisEvent[] {
  const buffer = eventBuffer.get(workloadId) || [];
  const cutoff = Date.now() - BUFFER_WINDOW_MS;
  return buffer.filter((e) => e.timestamp.getTime() >= cutoff);
}

/**
 * Calculate real-time statistics for a workload's event buffer.
 */
export function calculateEventStats(workloadId: string): EventStats {
  const events = getBufferedEvents(workloadId);

  if (events.length === 0) {
    return {
      totalEvents: 0,
      eventsPerSecond: 0,
      fileWritesPerSecond: 0,
      fileRenamesPerSecond: 0,
      fileDeletesPerSecond: 0,
      uniqueDirectories: 0,
      uniqueExtensionsChanged: 0,
    };
  }

  const timeSpanMs = Math.max(
    events[events.length - 1].timestamp.getTime() - events[0].timestamp.getTime(),
    1000 // minimum 1 second
  );
  const timeSpanSec = timeSpanMs / 1000;

  const fileWrites = events.filter((e) => e.eventType === 'FILE_WRITE').length;
  const fileRenames = events.filter((e) => e.eventType === 'FILE_RENAME').length;
  const fileDeletes = events.filter((e) => e.eventType === 'FILE_DELETE').length;

  const directories = new Set<string>();
  const extensionChanges = new Set<string>();

  for (const event of events) {
    if (event.filePath) {
      const dir = event.filePath.substring(0, event.filePath.lastIndexOf('/'));
      if (dir) directories.add(dir);
    }
    if (event.eventType === 'FILE_RENAME' && event.filePath && event.oldFilePath) {
      const oldExt = event.oldFilePath.split('.').pop() || '';
      const newExt = event.filePath.split('.').pop() || '';
      if (oldExt !== newExt) {
        extensionChanges.add(`${oldExt}→${newExt}`);
      }
    }
  }

  return {
    totalEvents: events.length,
    eventsPerSecond: Number((events.length / timeSpanSec).toFixed(1)),
    fileWritesPerSecond: Number((fileWrites / timeSpanSec).toFixed(1)),
    fileRenamesPerSecond: Number((fileRenames / timeSpanSec).toFixed(1)),
    fileDeletesPerSecond: Number((fileDeletes / timeSpanSec).toFixed(1)),
    uniqueDirectories: directories.size,
    uniqueExtensionsChanged: extensionChanges.size,
  };
}

/**
 * Clear all buffers (used for reset/testing).
 */
export function clearBuffers(): void {
  eventBuffer.clear();
  processedEventIds.clear();
  logger.info('buffers_cleared');
}

/**
 * Get all active workload IDs with buffered events.
 */
export function getActiveWorkloads(): string[] {
  return Array.from(eventBuffer.keys()).filter(
    (id) => getBufferedEvents(id).length > 0
  );
}
