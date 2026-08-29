

import Docker from 'dockerode';
import { PassThrough } from 'stream';
import { createLogger } from '../logger';

const logger = createLogger('docker');

let docker: Docker | null = null;

/**
 * Get or create Docker client instance.
 */
export function getDocker(): Docker {
  if (!docker) {
    docker = new Docker({ socketPath: '/var/run/docker.sock' });
    logger.info('docker_client_initialized');
  }
  return docker;
}

/**
 * List running containers.
 */
export async function listContainers(): Promise<Docker.ContainerInfo[]> {
  try {
    const d = getDocker();
    return await d.listContainers({ all: true });
  } catch (error) {
    logger.error('list_containers_failed', { error: String(error) });
    return [];
  }
}

/**
 * Get container by ID.
 */
export function getContainer(containerId: string): Docker.Container {
  return getDocker().getContainer(containerId);
}

/**
 * Execute a command inside a running container.
 */
export async function execInContainer(
  containerId: string,
  cmd: string[]
): Promise<{ exitCode: number; output: string }> {
  try {
    const container = getContainer(containerId);
    const exec = await container.exec({
      Cmd: cmd,
      AttachStdout: true,
      AttachStderr: true,
    });

    return new Promise((resolve, reject) => {
      exec.start({ Detach: false }, (err: Error, stream: any) => {
        if (err) return reject(err);

        let output = '';
        const outStream = new PassThrough();
        outStream.on('data', (chunk: Buffer) => {
          output += chunk.toString('utf8');
        });

        // Dockerode provides modems to demultiplex the stream
        container.modem.demuxStream(stream, outStream, outStream);

        stream.on('end', async () => {
          const inspect = await exec.inspect();
          resolve({
            exitCode: inspect.ExitCode ?? 0,
            output: output.trim(),
          });
        });
      });
    });
  } catch (error) {
    logger.error('exec_failed', { containerId, cmd, error: String(error) });
    return { exitCode: -1, output: String(error) };
  }
}

/**
 * Stop a container (used for containment).
 */
export async function stopContainer(containerId: string): Promise<boolean> {
  try {
    const container = getContainer(containerId);
    await container.stop({ t: 5 }); // 5-second grace period
    logger.info('container_stopped', { containerId });
    return true;
  } catch (error) {
    logger.error('container_stop_failed', { containerId, error: String(error) });
    return false;
  }
}

/**
 * Pause a container (freeze workload).
 */
export async function pauseContainer(containerId: string): Promise<boolean> {
  try {
    const container = getContainer(containerId);
    await container.pause();
    logger.info('container_paused', { containerId });
    return true;
  } catch (error) {
    logger.error('container_pause_failed', { containerId, error: String(error) });
    return false;
  }
}

/**
 * Disconnect container from all networks (isolate).
 */
export async function isolateContainer(containerId: string): Promise<boolean> {
  try {
    const d = getDocker();
    const container = getContainer(containerId);
    const info = await container.inspect();

    const networks = Object.keys(info.NetworkSettings.Networks);
    for (const networkName of networks) {
      const network = d.getNetwork(networkName);
      await network.disconnect({ Container: containerId, Force: true });
      logger.info('container_network_disconnected', { containerId, network: networkName });
    }

    return true;
  } catch (error) {
    logger.error('container_isolate_failed', { containerId, error: String(error) });
    return false;
  }
}

/**
 * Kill a specific process inside a container.
 */
export async function killProcessInContainer(
  containerId: string,
  pid: number,
  signal = 'SIGKILL'
): Promise<boolean> {
  const result = await execInContainer(containerId, ['kill', `-${signal.replace('SIG', '')}`, String(pid)]);
  if (result.exitCode === 0) {
    logger.info('process_killed', { containerId, pid, signal });
    return true;
  }
  logger.error('process_kill_failed', { containerId, pid, signal, output: result.output });
  return false;
}

/**
 * Surgically kill a process by name pattern.
 */
export async function surgicalStrike(containerId: string, processName: string): Promise<boolean> {
  const result = await execInContainer(containerId, ['pkill', '-9', '-f', processName]);
  logger.info('surgical_strike_executed', { containerId, processName, exitCode: result.exitCode });
  // pkill returns 0 if at least one process was killed
  return result.exitCode === 0;
}

/**
 * Get container inspect info.
 */
export async function inspectContainer(containerId: string): Promise<Docker.ContainerInspectInfo | null> {
  try {
    const container = getContainer(containerId);
    return await container.inspect();
  } catch (error) {
    logger.error('inspect_failed', { containerId, error: String(error) });
    return null;
  }
}

/**
 * Check if Docker is available.
 */
export async function isDockerAvailable(): Promise<boolean> {
  try {
    const d = getDocker();
    await d.ping();
    return true;
  } catch {
    return false;
  }
}
