// AEGIS Agent Status & Control API
import { NextRequest, NextResponse } from 'next/server';
import {
  getAgentStatus,
  startAgent,
  stopAgent,
  resetAgent,
  setAegisEnabled,
  ingestEvent,
} from '@/src/engine/agent';
import { updatePolicy } from '@/src/engine/policy-engine';

export async function GET() {
  return NextResponse.json(getAgentStatus());
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action } = body;

  switch (action) {
    case 'start': {
      const { workloadId, containerId } = body;
      if (!workloadId || !containerId) {
        return NextResponse.json({ error: 'workloadId and containerId required' }, { status: 400 });
      }
      await startAgent(workloadId, containerId);
      return NextResponse.json({ status: 'started', ...getAgentStatus() });
    }

    case 'stop':
      stopAgent();
      return NextResponse.json({ status: 'stopped' });

    case 'reset':
      resetAgent();
      return NextResponse.json({ status: 'reset' });

    case 'toggle': {
      const { enabled } = body;
      setAegisEnabled(!!enabled);
      return NextResponse.json({ status: 'toggled', enabled: !!enabled });
    }

    case 'policy': {
      const { autonomyMode, thresholds } = body;
      updatePolicy({ autonomyMode, thresholds });
      return NextResponse.json({ status: 'policy_updated' });
    }

    default:
      return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}
