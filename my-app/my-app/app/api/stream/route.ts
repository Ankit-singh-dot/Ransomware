// SSE Stream Endpoint — Real-time event broadcast to dashboard
import { NextRequest } from 'next/server';
import { addSSEListener, removeSSEListener } from '@/src/engine/agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial heartbeat
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`));

      const listener = (event: string, data: unknown) => {
        try {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          // Stream closed
        }
      };

      addSSEListener(listener);

      // Heartbeat every 15s to keep connection alive
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`event: heartbeat\ndata: ${JSON.stringify({ ts: Date.now() })}\n\n`));
        } catch {
          clearInterval(heartbeat);
        }
      }, 15_000);

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        removeSSEListener(listener);
        clearInterval(heartbeat);
        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
