import { isMongoConnected } from '../config/db';
import { SmartBundleModel, toSmartBundle } from '../models/SmartBundle';
import { SmartBundle } from '../types/domain';
import { SAMPLE_SMART_BUNDLES } from '../seed/seedData';

/**
 * Smart Bundle repository (Task 9.1).
 *
 * Lists 4..6 Smart Bundles (Requirement 2.1) and retrieves a pre-assembled
 * basket by id (Requirement 2.2). Falls back to in-memory samples when Mongo is
 * not connected.
 */
export const smartBundleRepository = {
  async list(): Promise<SmartBundle[]> {
    if (isMongoConnected()) {
      const docs = await SmartBundleModel.find().limit(6).exec();
      if (docs.length > 0) return docs.map((d) => toSmartBundle(d.toObject()));
    }
    return SAMPLE_SMART_BUNDLES.map(clone);
  },

  async findById(id: string): Promise<SmartBundle | null> {
    if (isMongoConnected()) {
      const doc = await SmartBundleModel.findOne({ id }).exec();
      if (doc) return toSmartBundle(doc.toObject());
    }
    return SAMPLE_SMART_BUNDLES.find((b) => b.id === id) ?? null;
  },
};

function clone(bundle: SmartBundle): SmartBundle {
  return JSON.parse(JSON.stringify(bundle)) as SmartBundle;
}
