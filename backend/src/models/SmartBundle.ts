import { Schema, model } from 'mongoose';
import { BasketTier, Product, SmartBundle, TierName } from '../types/domain';

// Products are embedded as full normalized objects; allow all fields.
const ProductSubSchema = new Schema<Product>({}, { _id: false, strict: false });

const BasketTierSubSchema = new Schema<BasketTier>(
  {
    tier: { type: String, enum: ['Budget', 'Balanced', 'Premium'], required: true },
    items: { type: [ProductSubSchema], default: [] },
    total: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const SmartBundleSchema = new Schema<SmartBundle>(
  {
    id: { type: String, required: true, unique: true, index: true },
    label: { type: String, required: true, maxlength: 60 },
    preassembled: {
      type: Map,
      of: BasketTierSubSchema,
      required: true,
    },
  },
  { timestamps: true, versionKey: false },
);

/**
 * Mongoose stores `preassembled` as a Map; this helper normalizes it back to
 * the typed Record<TierName, BasketTier> shape used across the app.
 */
export function toSmartBundle(doc: {
  id: string;
  label: string;
  preassembled: Map<string, BasketTier> | Record<string, BasketTier>;
}): SmartBundle {
  const source =
    doc.preassembled instanceof Map
      ? Object.fromEntries(doc.preassembled)
      : doc.preassembled;
  return {
    id: doc.id,
    label: doc.label,
    preassembled: source as Record<TierName, BasketTier>,
  };
}

export const SmartBundleModel = model<SmartBundle>('SmartBundle', SmartBundleSchema);
