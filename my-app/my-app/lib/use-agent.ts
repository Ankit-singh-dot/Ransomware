// AEGIS Dashboard API hook — fetch and mutate agent state
'use client';

import { useState, useCallback } from 'react';

const API_BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useAgent() {
  const [loading, setLoading] = useState(false);

  const getStatus = useCallback(() => fetchJSON(`${API_BASE}/agent`), []);

  const startAgent = useCallback(async (workloadId: string, containerId: string) => {
    setLoading(true);
    try {
      return await fetchJSON(`${API_BASE}/agent`, {
        method: 'POST',
        body: JSON.stringify({ action: 'start', workloadId, containerId }),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const stopAgent = useCallback(async () => {
    return fetchJSON(`${API_BASE}/agent`, {
      method: 'POST',
      body: JSON.stringify({ action: 'stop' }),
    });
  }, []);

  const resetAgent = useCallback(async () => {
    return fetchJSON(`${API_BASE}/agent`, {
      method: 'POST',
      body: JSON.stringify({ action: 'reset' }),
    });
  }, []);

  const toggleAegis = useCallback(async (enabled: boolean) => {
    return fetchJSON(`${API_BASE}/agent`, {
      method: 'POST',
      body: JSON.stringify({ action: 'toggle', enabled }),
    });
  }, []);

  const updatePolicy = useCallback(async (autonomyMode: string) => {
    return fetchJSON(`${API_BASE}/agent`, {
      method: 'POST',
      body: JSON.stringify({ action: 'policy', autonomyMode }),
    });
  }, []);

  const getMetrics = useCallback(() => fetchJSON(`${API_BASE}/metrics`), []);

  const startSimulation = useCallback(async (mode: string = 'ransomware', containerId?: string, target: 'in-process' | 'docker' = 'in-process') => {
    setLoading(true);
    try {
      return await fetchJSON(`${API_BASE}/simulator`, {
        method: 'POST',
        body: JSON.stringify({
          mode,
          target,
          speed: 'fast',
          containerId: containerId || 'sim-container',
          workloadId: containerId || 'sim-container',
        }),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const stopSimulation = useCallback(async () => {
    return fetchJSON(`${API_BASE}/simulator`, { method: 'DELETE' });
  }, []);

  return {
    loading,
    getStatus,
    startAgent,
    stopAgent,
    resetAgent,
    toggleAegis,
    updatePolicy,
    getMetrics,
    startSimulation,
    stopSimulation,
  };
}
