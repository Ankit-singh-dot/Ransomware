// SSE hook — connects to the AEGIS real-time event stream
'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

export type SSEEventType =
  | 'connected'
  | 'heartbeat'
  | 'event'
  | 'threat'
  | 'status'
  | 'timeline'
  | 'containment'
  | 'recovery'
  | 'metrics'
  | 'policy'
  | 'snapshot';

type SSEHandler = (data: unknown) => void;

export function useSSE() {
  const [connected, setConnected] = useState(false);
  const handlersRef = useRef<Map<SSEEventType, Set<SSEHandler>>>(new Map());
  const eventSourceRef = useRef<EventSource | null>(null);

  const subscribe = useCallback((event: SSEEventType, handler: SSEHandler) => {
    if (!handlersRef.current.has(event)) {
      handlersRef.current.set(event, new Set());
    }
    handlersRef.current.get(event)!.add(handler);

    return () => {
      handlersRef.current.get(event)?.delete(handler);
    };
  }, []);

  useEffect(() => {
    const es = new EventSource('/api/stream');
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setConnected(true);
    });

    const eventTypes: SSEEventType[] = [
      'event', 'threat', 'status', 'timeline',
      'containment', 'recovery', 'metrics', 'policy', 'snapshot', 'heartbeat',
    ];

    for (const type of eventTypes) {
      es.addEventListener(type, (e: MessageEvent) => {
        try {
          const data = JSON.parse(e.data);
          const handlers = handlersRef.current.get(type);
          if (handlers) {
            for (const handler of handlers) {
              handler(data);
            }
          }
        } catch {
          // Ignore parse errors
        }
      });
    }

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, []);

  return { connected, subscribe };
}
