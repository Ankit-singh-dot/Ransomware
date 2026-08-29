// AEGIS Event Ingestion API
// Receives events from the agent/simulator and feeds them into the detection pipeline.

import { NextRequest, NextResponse } from 'next/server';
import { ingestEvent, getAgentStatus } from '@/src/engine/agent';
import { getBufferedEvents, calculateEventStats } from '@/src/engine/event-processor';
import { analyzeFileEntropy } from '@/src/engine/entropy';
import type { AegisEvent } from '@/src/types/events';
import crypto from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Support single event or batch
    const events: Partial<AegisEvent>[] = Array.isArray(body) ? body : [body];

    let accepted = 0;
    for (const rawEvent of events) {
      const event: AegisEvent = {
        eventId: rawEvent.eventId || crypto.randomUUID(),
        timestamp: rawEvent.timestamp ? new Date(rawEvent.timestamp) : new Date(),
        containerId: rawEvent.containerId || 'unknown',
        processId: rawEvent.processId || 0,
        parentProcessId: rawEvent.parentProcessId || 0,
        processName: rawEvent.processName || 'unknown',
        eventType: rawEvent.eventType || 'FILE_WRITE',
        filePath: rawEvent.filePath,
        oldFilePath: rawEvent.oldFilePath,
        networkDestination: rawEvent.networkDestination,
        networkPort: rawEvent.networkPort,
        fileSize: rawEvent.fileSize,
        entropy: rawEvent.entropy,
        metadata: rawEvent.metadata,
      };

      ingestEvent(event);
      accepted++;

      // Real-time asynchronous Entropy Analysis (The Math Feature)
      if (event.eventType === 'FILE_WRITE' && event.filePath && event.containerId) {
        analyzeFileEntropy(event.containerId, event.filePath).then((entropy) => {
          if (entropy !== null && entropy > 7.0) {
            // Synthesize an ENTROPY_UPDATE event if we detect high randomness (encryption)
            ingestEvent({
              ...event,
              eventId: crypto.randomUUID(),
              eventType: 'ENTROPY_UPDATE' as any,
              metadata: { entropyBefore: 4.0, entropyAfter: entropy },
            });
          }
        }).catch(() => {});
      }
    }

    return NextResponse.json({ accepted, total: events.length });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid event data', details: String(error) },
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const workloadId = searchParams.get('workloadId');

  if (!workloadId) {
    // Return status overview
    const status = getAgentStatus();
    return NextResponse.json({
      workloadId: status.workloadId,
      eventsProcessed: status.metrics.eventsProcessed,
    });
  }

  const events = getBufferedEvents(workloadId);
  const stats = calculateEventStats(workloadId);

  return NextResponse.json({ events: events.slice(-100), stats });
}
