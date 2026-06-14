import mongoose from 'mongoose';
import { env } from './env';
import { logger } from './logger';

let connected = false;

/**
 * Connects to MongoDB Atlas. The connection is optional at boot: if it fails,
 * the server still starts so that pure/deterministic endpoints remain usable.
 */
export async function connectMongo(): Promise<typeof mongoose | null> {
  if (connected) return mongoose;
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(env.mongoUri, { dbName: env.mongoDbName });
    connected = true;
    logger.info('MongoDB connected', { db: env.mongoDbName });
    return mongoose;
  } catch (err) {
    logger.error('MongoDB connection failed', { error: (err as Error).message });
    return null;
  }
}

export function isMongoConnected(): boolean {
  return mongoose.connection.readyState === 1;
}

export async function disconnectMongo(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
