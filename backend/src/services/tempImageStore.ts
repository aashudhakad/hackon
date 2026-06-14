import { promises as fsp } from 'fs';
import { mkdirSync } from 'fs';
import os from 'os';
import path from 'path';
import { randomUUID } from 'crypto';
import { logger } from '../config/logger';

/**
 * Temporary image storage for the image-intent pipeline.
 *
 * Uploaded images are written to a dedicated OS temp directory with a unique,
 * timestamped filename, processed, then deleted immediately. A periodic sweep
 * is the safety net: any file older than the TTL (5 minutes) is removed even if
 * a request crashed before its own cleanup ran. No image is ever stored
 * permanently.
 */

/** Directory holding in-flight uploads. */
export const TEMP_DIR = path.join(os.tmpdir(), 'image-intent-uploads');
/** Max lifetime of a temp file before the sweeper deletes it. */
export const TTL_MS = 5 * 60 * 1000;
/** How often the sweeper runs. */
const SWEEP_INTERVAL_MS = 60 * 1000;

// Ensure the temp directory exists at module load (synchronous, runs once).
try {
  mkdirSync(TEMP_DIR, { recursive: true });
} catch (err) {
  logger.error('image-intent: failed to create temp directory', {
    dir: TEMP_DIR,
    error: (err as Error).message,
  });
}

/** Builds a unique, timestamped filename preserving the original extension. */
function uniqueName(originalName?: string): string {
  const ext = path.extname(originalName ?? '').toLowerCase() || '.img';
  return `${Date.now()}-${randomUUID()}${ext}`;
}

/** Deletes a temp file, tolerating already-removed files. Never throws. */
async function remove(filePath: string | undefined): Promise<void> {
  if (!filePath) return;
  try {
    await fsp.unlink(filePath);
    logger.info('image-intent: temp file deleted', { file: path.basename(filePath) });
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      logger.warn('image-intent: temp file delete failed', {
        file: path.basename(filePath),
        error: (err as Error).message,
      });
    }
  }
}

/** Removes every file in TEMP_DIR older than TTL_MS. Never throws. */
async function sweep(): Promise<void> {
  let files: string[];
  try {
    files = await fsp.readdir(TEMP_DIR);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code !== 'ENOENT') {
      logger.warn('image-intent: cleanup sweep failed to read dir', {
        error: (err as Error).message,
      });
    }
    return;
  }

  const now = Date.now();
  let deleted = 0;
  for (const name of files) {
    const filePath = path.join(TEMP_DIR, name);
    try {
      const stat = await fsp.stat(filePath);
      if (now - stat.mtimeMs > TTL_MS) {
        await fsp.unlink(filePath);
        deleted += 1;
      }
    } catch (err) {
      const code = (err as NodeJS.ErrnoException).code;
      if (code !== 'ENOENT') {
        logger.warn('image-intent: cleanup sweep failed for file', {
          file: name,
          error: (err as Error).message,
        });
      }
    }
  }

  if (deleted > 0) {
    logger.info('image-intent: cleanup sweep executed', { deleted });
  }
}

let timer: NodeJS.Timeout | null = null;

/** Starts the periodic cleanup sweeper (idempotent). */
function startCleanup(): void {
  if (timer) return;
  timer = setInterval(() => {
    void sweep();
  }, SWEEP_INTERVAL_MS);
  // Do not keep the event loop alive solely for the sweeper.
  timer.unref?.();
  logger.info('image-intent: cleanup sweeper started', {
    dir: TEMP_DIR,
    ttlMs: TTL_MS,
    intervalMs: SWEEP_INTERVAL_MS,
  });
}

/** Stops the cleanup sweeper (used in tests/shutdown). */
function stopCleanup(): void {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
}

export const tempImageStore = {
  dir: TEMP_DIR,
  ttlMs: TTL_MS,
  uniqueName,
  remove,
  sweep,
  startCleanup,
  stopCleanup,
};
