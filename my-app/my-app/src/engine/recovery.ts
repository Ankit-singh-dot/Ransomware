// AEGIS Recovery System
// Creates snapshots before attack, identifies affected files, restores from snapshot.
// Works with Docker volumes/bind mounts.

import { createLogger } from '../logger';
import { execInContainer } from '../docker/manager';
import type { SnapshotInfo } from '../types/containment';

const logger = createLogger('recovery');

// In-memory snapshot registry
const snapshots: Map<string, SnapshotInfo> = new Map();

/**
 * Create a snapshot of the sandbox filesystem inside a container.
 * Copies /sandbox/data to /sandbox/snapshots/<timestamp>.
 */
export async function createSnapshot(
  containerId: string,
  workloadId: string,
  sandboxPath = '/sandbox/data'
): Promise<SnapshotInfo | null> {
  const snapshotId = `snap_${Date.now()}`;
  const snapshotPath = `/sandbox/snapshots/${snapshotId}`;

  logger.info('snapshot_started', { containerId, workloadId, sandboxPath, snapshotPath });

  try {
    // Create snapshot directory
    await execInContainer(containerId, ['mkdir', '-p', snapshotPath]);

    // Copy sandbox data to snapshot
    const copyResult = await execInContainer(containerId, [
      'cp', '-a', `${sandboxPath}/.`, snapshotPath,
    ]);

    if (copyResult.exitCode !== 0) {
      logger.error('snapshot_copy_failed', { output: copyResult.output });
      return null;
    }

    // Count files and total size
    const countResult = await execInContainer(containerId, [
      'sh', '-c', `find ${snapshotPath} -type f | wc -l`,
    ]);
    const fileCount = parseInt(countResult.output.trim(), 10) || 0;

    const sizeResult = await execInContainer(containerId, [
      'sh', '-c', `du -sb ${snapshotPath} | cut -f1`,
    ]);
    const totalSize = BigInt(sizeResult.output.trim() || '0');

    const snapshot: SnapshotInfo = {
      snapshotId,
      workloadId,
      path: snapshotPath,
      fileCount,
      totalSize: Number(totalSize),
      createdAt: new Date(),
    };

    snapshots.set(snapshotId, snapshot);

    logger.info('snapshot_completed', {
      snapshotId,
      fileCount,
      totalSize: Number(totalSize),
    });

    return snapshot;
  } catch (error) {
    logger.error('snapshot_failed', { containerId, error: String(error) });
    return null;
  }
}

/**
 * Identify files that were modified/affected during an attack.
 * Compares current sandbox state with snapshot.
 */
export async function identifyAffectedFiles(
  containerId: string,
  snapshotPath: string,
  sandboxPath = '/sandbox/data'
): Promise<{
  affected: string[];
  deleted: string[];
  added: string[];
}> {
  try {
    // Find files that differ between snapshot and current state
    const diffResult = await execInContainer(containerId, [
      'sh', '-c',
      `diff -rq ${snapshotPath} ${sandboxPath} 2>/dev/null || true`,
    ]);

    const affected: string[] = [];
    const deleted: string[] = [];
    const added: string[] = [];

    const lines = diffResult.output.split('\n').filter(Boolean);
    for (const line of lines) {
      if (line.startsWith('Files ') && line.includes(' differ')) {
        // "Files /snapshot/foo and /sandbox/data/foo differ"
        const match = line.match(/Files .+ and (.+) differ/);
        if (match) affected.push(match[1]);
      } else if (line.startsWith('Only in ' + snapshotPath)) {
        // File was deleted from sandbox
        const match = line.match(/Only in (.+): (.+)/);
        if (match) deleted.push(`${match[1]}/${match[2]}`);
      } else if (line.startsWith('Only in ' + sandboxPath)) {
        // File was added (possibly renamed target)
        const match = line.match(/Only in (.+): (.+)/);
        if (match) added.push(`${match[1]}/${match[2]}`);
      }
    }

    logger.info('affected_files_identified', {
      affected: affected.length,
      deleted: deleted.length,
      added: added.length,
    });

    return { affected, deleted, added };
  } catch (error) {
    logger.error('identify_affected_failed', { error: String(error) });
    return { affected: [], deleted: [], added: [] };
  }
}

/**
 * Recover files from a snapshot.
 * Restores affected files from the snapshot to the sandbox.
 */
export async function recoverFromSnapshot(
  containerId: string,
  snapshotPath: string,
  sandboxPath = '/sandbox/data'
): Promise<{
  filesRecovered: number;
  filesFailed: number;
  artifactsCleaned: number;
  errors: string[];
}> {
  logger.info('recovery_started', { containerId, snapshotPath, sandboxPath });

  try {
    // Get list of affected files first
    const { affected, deleted, added } = await identifyAffectedFiles(
      containerId,
      snapshotPath,
      sandboxPath
    );

    let filesRecovered = 0;
    let filesFailed = 0;
    let artifactsCleaned = 0;
    const errors: string[] = [];

    // Restore affected files from snapshot
    for (const filePath of affected) {
      const relativePath = filePath.replace(sandboxPath, '');
      const snapshotFile = `${snapshotPath}${relativePath}`;

      const result = await execInContainer(containerId, [
        'cp', '-f', snapshotFile, filePath,
      ]);

      if (result.exitCode === 0) {
        filesRecovered++;
      } else {
        filesFailed++;
        errors.push(`Failed to restore: ${filePath}`);
      }
    }

    // Restore deleted files
    for (const filePath of deleted) {
      const relativePath = filePath.replace(snapshotPath, '');
      const targetPath = `${sandboxPath}${relativePath}`;

      // Ensure parent directory exists
      const parentDir = targetPath.substring(0, targetPath.lastIndexOf('/'));
      await execInContainer(containerId, ['mkdir', '-p', parentDir]);

      const result = await execInContainer(containerId, [
        'cp', '-f', filePath, targetPath,
      ]);

      if (result.exitCode === 0) {
        filesRecovered++;
      } else {
        filesFailed++;
        errors.push(`Failed to restore deleted: ${targetPath}`);
      }
    }

    // Clean up added files (ransomware artifacts)
    for (const filePath of added) {
      if (filePath.includes('RANSOM_NOTE')) {
        // Ransom Note Hijack (Counter-Strike)
        const hijackMsg = '\\n==================================================\\n                 [ AEGIS ]\\n        THREAT NEUTRALIZED.\\n        MALWARE VAPORIZED BY AEGIS.\\n\\n        NICE TRY. YOUR ENCRYPTION FAILED.\\n==================================================\\n';
        const result = await execInContainer(containerId, ['sh', '-c', `echo -e "${hijackMsg}" > "${filePath}"`]);
        if (result.exitCode === 0) artifactsCleaned++;
        logger.info('ransom_note_hijacked', { filePath });
      } else {
        const result = await execInContainer(containerId, ['rm', '-rf', filePath]);
        if (result.exitCode === 0) artifactsCleaned++;
      }
    }

    logger.info('recovery_completed', {
      filesRecovered,
      filesFailed,
      artifactsCleaned,
      errorCount: errors.length,
    });

    return { filesRecovered, filesFailed, artifactsCleaned, errors };
  } catch (error) {
    logger.error('recovery_failed', { error: String(error) });
    return { filesRecovered: 0, filesFailed: 0, artifactsCleaned: 0, errors: [String(error)] };
  }
}

/**
 * Get snapshot info by ID.
 */
export function getSnapshot(snapshotId: string): SnapshotInfo | undefined {
  return snapshots.get(snapshotId);
}

/**
 * List all snapshots for a workload.
 */
export function listSnapshots(workloadId: string): SnapshotInfo[] {
  return Array.from(snapshots.values()).filter((s) => s.workloadId === workloadId);
}
