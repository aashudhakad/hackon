/**
 * Shared domain types for Amazon Instant Engine.
 *
 * These types are the single contract between the four input modalities
 * (typed text, voice, image, Smart Bundle) and downstream bundle generation,
 * exactly as described in the design document.
 */

/** A single required component extracted from an intent (e.g. "Flour"). */
export interface RequiredComponent {
  /** Human-readable component name, e.g. "Flour", "Butter". */
  name: string;
  /** Defined ordering used to render Category_Rows. */
  sequence: number;
  /** Category/theme attributes used for cross-sell relevance. */
  themes: string[];
}

/** The structured intent — the contract between inputs and bundle generation. */
export interface StructuredIntent {
  /** Original natural-language text, 1..500 chars. */
  rawText: string;
  /** At least one component when parsing succeeds. */
  components: RequiredComponent[];
}

export type Availability = 'in-stock' | 'out-of-stock';

/**
 * Raw catalog product as imported from the source CSV. These are the columns
 * persisted in MongoDB (plus a generated `id` and an `availability` flag).
 */
export interface RawProduct {
  id: string;
  name: string;
  mainCategory: string; // CSV: main_category
  subCategory: string; // CSV: sub_category
  category: string; // CSV: Category (granular, e.g. "ghee", "chocolate")
  image: string; // CSV: image
  link: string; // CSV: link
  ratings: number; // CSV: ratings (0..5)
  noOfRatings: number; // CSV: no_of_ratings
  discountPrice: number; // CSV: discount_price (INR)
  actualPrice: number; // CSV: actual_price (INR)
  availability: Availability;
}

/**
 * A catalog product: the raw CSV fields plus the domain fields the
 * deterministic engine works with. Domain fields are derived from the raw
 * fields by `normalizeProduct` on read (see services/productNormalize).
 */
export interface Product extends RawProduct {
  /** Best-effort brand derived from the product name. */
  brand: string;
  /** Which RequiredComponent.name this product fulfills (= category). */
  component: string;
  /** Price in store currency (INR), >= 0 (= discountPrice). */
  price: number;
  currency: string;
  /** Relevance ranking score derived from ratings & noOfRatings. */
  rank: number;
  /** Category/theme attributes for cross-sell. */
  themes: string[];
}

export type TierName = 'Budget' | 'Balanced' | 'Premium';

export const TIER_NAMES: TierName[] = ['Budget', 'Balanced', 'Premium'];

export interface BasketTier {
  tier: TierName;
  /** One Selected_Item per fulfilled component. */
  items: Product[];
  /** Sum of available item prices, >= 0. */
  total: number;
}

export type CategoryRowState = 'normal' | 'empty' | 'unavailable' | 'substituted';

export interface CategoryRow {
  component: RequiredComponent;
  /** Up to 50, descending rank. */
  alternatives: Product[];
  /** null when no in-stock alternative exists. */
  selectedItemId: string | null;
  state: CategoryRowState;
}

export interface Bundle {
  intent: StructuredIntent;
  rows: CategoryRow[];
  /** Budget.total <= Balanced.total <= Premium.total. */
  tiers: Record<TierName, BasketTier>;
  /** Integer 0..100. */
  confidence: number;
  /** Components with no in-stock product. */
  unfulfilledComponents: string[];
  /** null when confidence == 0. */
  explanation: string | null;
  /** True when confidence is in [0, 49]. */
  lowConfidence: boolean;
}

export interface SmartBundle {
  id: string;
  /** Non-empty, <= 60 chars. */
  label: string;
  preassembled: Record<TierName, BasketTier>;
}

export interface CartSummary {
  items: Product[];
  /** Excludes unavailable components, >= 0. */
  total: number;
  currency: string;
}

export type OrderStatus = 'confirmed' | 'processing' | 'in-transit' | 'delivered' | 'failed';

export interface Order {
  id: string;
  userId?: string;
  items: Product[];
  total: number;
  createdAt: string;
  status: OrderStatus;
  paymentMethod?: string;
  currency?: string;
}

export interface Catalog {
  products: Product[];
}

export interface ImageInput {
  mimeType: 'image/jpeg' | 'image/png';
  sizeBytes: number;
  data: Buffer;
}

export interface AudioClip {
  mimeType: string;
  /** > 1000 and <= 60000. */
  durationMs: number;
  /** <= 10 MB. */
  sizeBytes: number;
  data: Buffer;
}

export type RecognitionSource = 'client-recognizer' | 'audio-intent-processor';

export interface RecognizedIntent {
  text: string;
  source: RecognitionSource;
}
