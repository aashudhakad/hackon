import { connectMongo, disconnectMongo, isMongoConnected } from '../config/db';
import { logger } from '../config/logger';
import { ProductModel } from '../models/Product';
import { SmartBundleModel } from '../models/SmartBundle';
import { SAMPLE_PRODUCTS, SAMPLE_SMART_BUNDLES } from './seedData';

/**
 * Seeds MongoDB with the sample catalog and Smart Bundles. Idempotent: clears
 * the collections first. Run with `npm run seed`.
 */
async function seed(): Promise<void> {
  await connectMongo();
  if (!isMongoConnected()) {
    logger.error('Cannot seed: MongoDB is not connected. Check MONGODB_URI.');
    process.exit(1);
  }

  await ProductModel.deleteMany({});
  await SmartBundleModel.deleteMany({});

  await ProductModel.insertMany(SAMPLE_PRODUCTS);
  await SmartBundleModel.insertMany(SAMPLE_SMART_BUNDLES);

  logger.info('Seed complete', {
    products: SAMPLE_PRODUCTS.length,
    smartBundles: SAMPLE_SMART_BUNDLES.length,
  });

  await disconnectMongo();
  process.exit(0);
}

seed().catch((err) => {
  logger.error('Seed failed', { error: (err as Error).message });
  process.exit(1);
});
