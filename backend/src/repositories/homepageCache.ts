import { getRedis } from '../config/redis';
import { logger } from '../config/logger';

/**
 * Redis cache for homepage outputs.
 *
 * We cache NORMALIZED homepage responses (not raw prompts), keyed by the
 * dimensions that actually change the result: user, location, and the time/
 * weather/day buckets. Redis is best-effort — any failure silently degrades to
 * a fresh computation, exactly like the bundle cache.
 */
const PREFIX = 'hp:';

export const homepageCache = {
  async get<T>(key: string): Promise<T | null> {
    const redis = getRedis();
    if (!redis) return null;
    try {
      const raw = await redis.get(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch (err) {
      logger.warn('homepageCache get failed', { error: (err as Error).message });
      return null;
    }
  },

  async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    const redis = getRedis();
    if (!redis) return;
    try {
      await redis.set(PREFIX + key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      logger.warn('homepageCache set failed', { error: (err as Error).message });
    }
  },
};

/** Coarse location bucket: pincode if given, else a ~11km lat/lon grid cell. */
export function locationBucket(loc: { pincode?: string; lat?: number; lon?: number } | null): string {
  if (!loc) return 'anon';
  if (loc.pincode) return `pin:${loc.pincode}`;
  if (typeof loc.lat === 'number' && typeof loc.lon === 'number') {
    return `geo:${loc.lat.toFixed(1)}:${loc.lon.toFixed(1)}`;
  }
  return 'anon';
}
