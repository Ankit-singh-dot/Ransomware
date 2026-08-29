// AEGIS Simulator Control API
// Start/stop the safe ransomware simulator via Docker exec.

import { NextRequest, NextResponse } from 'next/server';
import { execInContainer } from '@/src/docker/manager';
import { ingestEvent } from '@/src/engine/agent';
import type { AegisEvent, EventType } from '@/src/types/events';
import crypto from 'crypto';
import { createLogger } from '@/src/logger';

const logger = createLogger('simulator-api');

// In-process simulation for when Docker is not available (demo/development)
let simulationRunning = false;
let simulationInterval: ReturnType<typeof setInterval> | null = null;

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { mode = 'ransomware', target = 'in-process', speed = 'fast' } = body;

  if (target === 'docker') {
    // Run simulator in Docker container
    try {
      const containerId = body.containerId || 'aegis-simulator';
      const result = await execInContainer(containerId, [
        '/simulator/simulate.sh', mode, speed,
      ]);
      return NextResponse.json({ status: 'completed', output: result.output, exitCode: result.exitCode });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // In-process simulation (for development without Docker)
  if (simulationRunning) {
    return NextResponse.json({ error: 'Simulation already running' }, { status: 409 });
  }

  simulationRunning = true;
  const containerId = body.containerId || 'sim-container';
  const workloadId = body.workloadId || containerId;

  logger.info('simulation_started', { mode, target });

  if (mode === 'normal') {
    runNormalSimulation(containerId, workloadId);
  } else {
    runRansomwareSimulation(containerId, workloadId, speed);
  }

  return NextResponse.json({ status: 'started', mode });
}

export async function DELETE() {
  if (simulationInterval) {
    clearInterval(simulationInterval);
    simulationInterval = null;
  }
  simulationRunning = false;
  return NextResponse.json({ status: 'stopped' });
}

export async function GET() {
  return NextResponse.json({ running: simulationRunning });
}

// ─── In-Process Simulators ──────────────────────────────────────

function emitEvent(containerId: string, type: EventType, data: Partial<AegisEvent>) {
  const event: AegisEvent = {
    eventId: crypto.randomUUID(),
    timestamp: new Date(),
    containerId,
    processId: data.processId || 1000 + Math.floor(Math.random() * 100),
    parentProcessId: data.parentProcessId || 1,
    processName: data.processName || 'simulator',
    eventType: type,
    filePath: data.filePath,
    oldFilePath: data.oldFilePath,
    networkDestination: data.networkDestination,
    networkPort: data.networkPort,
    fileSize: data.fileSize,
    entropy: data.entropy,
    metadata: data.metadata,
  };

  ingestEvent(event);
}

function runNormalSimulation(containerId: string, workloadId: string) {
  const files = [
    '/sandbox/data/logs/normal_activity.log',
    '/sandbox/data/document_1.txt',
    '/sandbox/data/config_1.conf',
  ];
  let i = 0;

  simulationInterval = setInterval(() => {
    if (i >= 20) {
      if (simulationInterval) clearInterval(simulationInterval);
      simulationRunning = false;
      return;
    }

    const file = files[i % files.length];
    emitEvent(containerId, 'FILE_READ', {
      filePath: file,
      processName: 'normal-worker',
      processId: 100,
      parentProcessId: 1,
    });

    if (i % 5 === 0) {
      emitEvent(containerId, 'FILE_WRITE', {
        filePath: '/sandbox/data/logs/normal_activity.log',
        processName: 'normal-worker',
        processId: 100,
        parentProcessId: 1,
      });
    }

    i++;
  }, 500);
}

function runRansomwareSimulation(containerId: string, workloadId: string, speed: string) {
  const delay = speed === 'fast' ? 50 : speed === 'slow' ? 500 : 200;
  const simulatorPid = 1337;
  const parentPid = 666;

  const victims: string[] = [];
  victims.push(`/sandbox/data/FINANCE_PASSWORDS.txt`);
  victims.push(`/sandbox/data/DO_NOT_DELETE.canary`);
  for (let i = 1; i <= 50; i++) victims.push(`/sandbox/data/document_${i}.txt`);
  for (let i = 1; i <= 20; i++) victims.push(`/sandbox/data/config_${i}.conf`);
  for (let i = 1; i <= 30; i++) victims.push(`/sandbox/data/reports/report_${i}.csv`);
  for (let i = 1; i <= 15; i++) victims.push(`/sandbox/data/projects/project_${i}.md`);
  for (let i = 1; i <= 20; i++) victims.push(`/sandbox/data/logs/app_${i}.log`);

  let fileIndex = 0;

  // Emit process start
  emitEvent(containerId, 'PROCESS_START', {
    processId: simulatorPid,
    parentProcessId: parentPid,
    processName: 'ransomware-sim',
    metadata: { command: './simulate.sh ransomware' },
  });

  // Drop Ransom Note
  setTimeout(() => {
    emitEvent(containerId, 'FILE_WRITE', {
      processId: simulatorPid,
      parentProcessId: parentPid,
      processName: 'ransomware-sim',
      filePath: '/sandbox/data/RANSOM_NOTE.txt',
    });
  }, 100);

  simulationInterval = setInterval(() => {
    if (fileIndex >= victims.length || !simulationRunning) {
      if (simulationInterval) clearInterval(simulationInterval);
      simulationRunning = false;

      // Emit process exit
      emitEvent(containerId, 'PROCESS_EXIT', {
        processId: simulatorPid,
        parentProcessId: parentPid,
        processName: 'ransomware-sim',
      });

      return;
    }

    const file = victims[fileIndex];

    // Phase 1: Write (encrypt)
    emitEvent(containerId, 'FILE_WRITE', {
      filePath: file,
      processId: simulatorPid,
      parentProcessId: parentPid,
      processName: 'ransomware-sim',
      fileSize: 2048,
      metadata: {
        entropyBefore: 4.2 + Math.random() * 0.5,
        entropyAfter: 7.5 + Math.random() * 0.4,
      },
    });

    // Phase 2: Rename (every other file)
    if (fileIndex % 2 === 0) {
      const ext = file.includes('.conf') ? '.locked' : '.encrypted';
      emitEvent(containerId, 'FILE_RENAME', {
        filePath: file + ext,
        oldFilePath: file,
        processId: simulatorPid,
        parentProcessId: parentPid,
        processName: 'ransomware-sim',
      });
    }

    // Phase 3: Occasional network callback
    if (fileIndex % 20 === 0) {
      emitEvent(containerId, 'NETWORK_CONNECT', {
        processId: simulatorPid,
        parentProcessId: parentPid,
        processName: 'ransomware-sim',
        networkDestination: '198.51.100.42',
        networkPort: 443,
        metadata: { protocol: 'TCP', suspicious: true },
      });
    }

    fileIndex++;
  }, delay);
}
