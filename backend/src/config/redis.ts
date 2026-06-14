import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let client: Redis | null = null;

/**
 * Lazily creates a Redis client. Redis is treated as a best-effort cache:
 * connection or command failures never throw to callers (Requirement 8.7).
 */
export function getRedis(): Redis | null {
  if (client) return client;
  try {
    client = new Redis(env.redisUrl, {
      lazyConnect: false,
      maxRetriesPerRequest: 1,
      // Keep failures quiet; the bundle cache silently falls back to regeneration.
      retryStrategy: (times) => (times > 3 ? null : Math.min(times * 200, 1000)),
    });
    client.on('error', (err) => logger.warn('Redis error', { error: err.message }));
    client.on('connect', () => logger.info('Redis connected'));
    return client;
  } catch (err) {
    logger.warn('Redis init failed', { error: (err as Error).message });
    return null;
  }
}

export async function disconnectRedis(): Promise<void> {
  if (client) {
    await client.quit().catch(() => undefined);
    client = null;
  }
}
