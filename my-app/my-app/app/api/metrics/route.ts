// AEGIS Metrics API
import { NextResponse } from 'next/server';
import { getAgentStatus, getMetrics, getTimeline } from '@/src/engine/agent';
import { getAllRiskStates } from '@/src/engine/risk-engine';
import { getActivePolicy } from '@/src/engine/policy-engine';

export async function GET() {
  const status = getAgentStatus();
  const metrics = getMetrics();
  const risks = getAllRiskStates();
  const policy = getActivePolicy();
  const timeline = getTimeline();

  return NextResponse.json({
    agent: {
      running: status.running,
      aegisEnabled: status.aegisEnabled,
      workloadId: status.workloadId,
      containerId: status.containerId,
    },
    threat: {
      state: status.threatState,
      score: status.threatScore,
      signals: status.signals,
    },
    metrics: {
      ...metrics,
      detectionTimeFormatted: metrics.detectionTimeMs ? `${metrics.detectionTimeMs}ms` : null,
      containmentTimeFormatted: metrics.containmentTimeMs ? `${metrics.containmentTimeMs}ms` : null,
    },
    risks,
    policy,
    timeline: timeline.slice(-50),
  });
}
