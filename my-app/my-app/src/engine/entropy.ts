import { execInContainer } from '../docker/manager';
import { createLogger } from '../logger';

const logger = createLogger('entropy');

/**
 * Calculates the Shannon Entropy of a buffer.
 * Returns a value between 0.0 (perfectly predictable) and 8.0 (perfectly random/encrypted).
 */
export function calculateShannonEntropy(buffer: Buffer): number {
  if (buffer.length === 0) return 0;

  const frequencies = new Array(256).fill(0);
  for (let i = 0; i < buffer.length; i++) {
    frequencies[buffer[i]]++;
  }

  let entropy = 0;
  const length = buffer.length;

  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const p = frequencies[i] / length;
      entropy -= p * Math.log2(p);
    }
  }

  return entropy;
}

/**
 * Reads a sample of a file from a container and calculates its entropy.
 */
export async function analyzeFileEntropy(containerId: string, filePath: string): Promise<number | null> {
  try {
    // Read the first 1024 bytes of the file for a fast sample
    // Using base64 to safely transfer binary data over the docker exec bridge
    const result = await execInContainer(containerId, [
      'sh', '-c', `head -c 1024 "${filePath}" | base64`
    ]);

    if (result.exitCode !== 0 || !result.output) {
      return null;
    }

    // Clean any newlines from the base64 output
    const cleanBase64 = result.output.replace(/[\r\n]+/g, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    
    const entropy = calculateShannonEntropy(buffer);
    
    logger.debug('entropy_calculated', { filePath, entropy, bytes: buffer.length });
    return entropy;
  } catch (error) {
    logger.error('entropy_analysis_failed', { filePath, error: String(error) });
    return null;
  }
}
