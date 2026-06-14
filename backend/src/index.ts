import { createApp } from './app';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectMongo, disconnectMongo } from './config/db';
import { disconnectRedis, getRedis } from './config/redis';
import { ensureIndexes } from './models/ensureIndexes';
import { tempImageStore } from './services/tempImageStore';

/** Server bootstrap: connect optional dependencies, then start listening. */
async function bootstrap(): Promise<void> {
  // MongoDB and Redis are best-effort; the app degrades to in-memory/no-cache.
  await connectMongo();
  await ensureIndexes();
  getRedis();

  // Periodic cleanup of expired temporary image uploads (image-intent flow).
  tempImageStore.startCleanup();

  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`Amazon Instant Engine backend listening on port ${env.port}`, {
      env: env.nodeEnv,
      llm: env.llmEnabled ? 'http' : 'stub',
    });
  });

  const shutdown = async (signal: string) => {
    logger.info(`Received ${signal}, shutting down`);
    server.close(async () => {
      await disconnectMongo().catch(() => undefined);
      await disconnectRedis().catch(() => undefined);
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

bootstrap().catch((err) => {
  logger.error('Fatal startup error', { error: (err as Error).message });
  process.exit(1);
});
