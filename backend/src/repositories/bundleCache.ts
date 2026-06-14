import { env } from '../config/env';
import { logger } from '../config/logger';
import { getRedis } from '../config/redis';
import { Bundle } from '../types/domain';

/**
 * Redis bundle cache with silent fallback (Task 9.2).
 *
 * Property 23 (Requirement 8.6): a cached bundle round-trips equal to the
 * generated one. Requirement 8.7: cache failures never surface an error — the
 * caller silently regenerates.
 */
const KEY_PREFIX = 'bundle:';

/** Normalizes intent text into a stable cache key. */
export function cacheKey(intentText: string): string {
  return KEY_PREFIX + intentText.trim().toLowerCase().replace(/\s+/g, ' ');
}

export const bundleCache = {
  /** Returns the cached bundle, or null on miss/any failure. */
  async get(intentText: string): Promise<Bundle | null> {
    const redis = getRedis();
    if (!redis) return null;
    try {
      const raw = await redis.get(cacheKey(intentText));
      if (!raw) return null;
      return JSON.parse(raw) as Bundle;
    } catch (err) {
      logger.warn('Bundle cache get failed; will regenerate', {
        error: (err as Error).message,
      });
      return null;
    }
  },

  /** Stores a bundle. Failures are swallowed (best-effort cache). */
  async set(intentText: string, bundle: Bundle): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try {
      await redis.set(
        cacheKey(intentText),
        JSON.stringify(bundle),
        'EX',
        env.bundleCacheTtlSeconds,
      );
    } catch (err) {
      logger.warn('Bundle cache set failed', { error: (err as Error).message });
    }
  },
};
