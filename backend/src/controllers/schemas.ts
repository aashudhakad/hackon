import { z } from 'zod';

/** Request body schemas for the API endpoints. */

export const intentSchema = z.object({
  text: z.string(),
});

export const structuredIntentSchema = z.object({
  rawText: z.string(),
  components: z
    .array(
      z.object({
        name: z.string(),
        sequence: z.number(),
        themes: z.array(z.string()).default([]),
      }),
    )
    .min(1),
});

/** /api/bundle accepts either raw text or an already-structured intent. */
export const bundleSchema = z.union([
  z.object({ text: z.string() }),
  z.object({ intent: structuredIntentSchema }),
]);

export const crossSellSchema = z.object({
  intent: structuredIntentSchema,
});

const productSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    category: z.string().optional(),
    component: z.string().optional(),
    price: z.number().min(0),
    currency: z.string().optional(),
    availability: z.enum(['in-stock', 'out-of-stock']),
    quantity: z.number().int().positive().optional(),
  })
  .passthrough();

export const checkoutSchema = z.object({
  items: z.array(productSchema),
  paymentMethod: z.string().optional(),
});

export const audioIntentSchema = z.object({
  durationMs: z.coerce.number().positive().optional(),
});

/** /api/normal and /api/quick accept a free-text intent and/or precomputed categories. */
export const modeSchema = z
  .object({
    intent: z.string().optional(),
    categories: z.array(z.string()).optional(),
  })
  .refine((v) => (v.intent && v.intent.trim().length > 0) || (v.categories && v.categories.length > 0), {
    message: 'Provide an intent or a list of categories.',
  });

export type IntentBody = z.infer<typeof intentSchema>;
export type BundleBody = z.infer<typeof bundleSchema>;
export type CrossSellBody = z.infer<typeof crossSellSchema>;
export type CheckoutBody = z.infer<typeof checkoutSchema>;
