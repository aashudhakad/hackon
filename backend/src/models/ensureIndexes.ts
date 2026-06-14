import { logger } from '../config/logger';
import { isMongoConnected } from '../config/db';
import { ProductModel } from './Product';

/**
 * Builds all model indexes once MongoDB is connected. `createIndexes()` is
 * idempotent — it only creates indexes that are missing, so it is safe to run
 * on every startup. Index builds run in the background on Atlas and do not
 * block reads/writes on existing data.
 */
export async function ensureIndexes(): Promise<void> {
  if (!isMongoConnected()) {
    logger.warn('Skipping index creation: MongoDB not connected');
    return;
  }
  try {
    await ProductModel.createIndexes();
    logger.info('Product indexes ensured');
  } catch (err) {
    logger.error('Failed to ensure indexes', { error: (err as Error).message });
  }
}
