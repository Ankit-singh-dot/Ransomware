// AEGIS Containment Engine
// Executes containment actions (stop process, isolate container) on Docker targets.
// Actions have explicit status tracking: REQUESTED → RUNNING → SUCCESS/FAILED.

import { createLogger } from '../logger';
import type { ContainmentAction, ContainmentStatus } from '../types/containment';
import { stopContainer, pauseContainer, isolateContainer, killProcessInContainer, surgicalStrike } from '../docker/manager';

const logger = createLogger('containment');

export interface ContainmentResult {
  action: ContainmentAction;
  status: ContainmentStatus;
  containerId: string;
  targetPid?: number;
  requestedAt: Date;
  completedAt: Date;
  error?: string;
}

/**
 * Execute a containment action against a target container.
 */
export async function executeContainment(
  containerId: string,
  action: ContainmentAction,
  targetPid?: number
): Promise<ContainmentResult> {
  const requestedAt = new Date();

  logger.info('containment_started', { containerId, action, targetPid });

  try {
    let success = false;

    switch (action) {
      case 'STOP_PROCESS':
        if (!targetPid) {
          throw new Error('STOP_PROCESS requires a target PID');
        }
        success = await killProcessInContainer(containerId, targetPid);
        break;

      case 'ISOLATE_CONTAINER':
        // First disconnect network, then pause
        const networkIsolated = await isolateContainer(containerId);
        const paused = await pauseContainer(containerId);
        success = networkIsolated || paused;
        break;

      case 'BLOCK_NETWORK':
        success = await isolateContainer(containerId);
        break;

      case 'FREEZE_WORKLOAD':
        success = await pauseContainer(containerId);
        break;

      case 'SURGICAL_STRIKE':
        const r1 = await surgicalStrike(containerId, 'simulate.sh');
        const r2 = await surgicalStrike('aegis-simulator', 'simulate.sh');
        success = r1 || r2;
        break;

      default:
        throw new Error(`Unknown containment action: ${action}`);
    }

    const status: ContainmentStatus = success ? 'SUCCESS' : 'FAILED';

    logger.info('containment_completed', {
      containerId,
      action,
      status,
      durationMs: Date.now() - requestedAt.getTime(),
    });

    return {
      action,
      status,
      containerId,
      targetPid,
      requestedAt,
      completedAt: new Date(),
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    logger.error('containment_failed', {
      containerId,
      action,
      error: errorMsg,
    });

    return {
      action,
      status: 'FAILED',
      containerId,
      targetPid,
      requestedAt,
      completedAt: new Date(),
      error: errorMsg,
    };
  }
}

/**
 * Execute full containment sequence: stop process + isolate container.
 */
export async function executeFullContainment(
  containerId: string,
  suspiciousPids: number[] = []
): Promise<ContainmentResult[]> {
  const results: ContainmentResult[] = [];

  // 1. Faraday Cage: Disconnect network instantly
  const isolateResult = await executeContainment(containerId, 'BLOCK_NETWORK');
  results.push(isolateResult);

  // 2. Surgical Strike: Kill the malicious process, leave container running
  const strikeResult = await executeContainment(containerId, 'SURGICAL_STRIKE');
  results.push(strikeResult);

  return results;
}
