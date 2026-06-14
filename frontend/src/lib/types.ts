/** Domain types mirroring the backend contract (see backend/src/types/domain.ts). */

export type Availability = 'in-stock' | 'out-of-stock';

export interface RequiredComponent {
  name: string;
  sequence: number;
  themes: string[];
}

export interface StructuredIntent {
  rawText: string;
  components: RequiredComponent[];
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  // CSV-derived catalog fields
  mainCategory: string;
  subCategory: string;
  category: string;
  image: string;
  link: string;
  ratings: number;
  noOfRatings: number;
  discountPrice: number;
  actualPrice: number;
  // Domain fields used by the UI/engine
  component: string;
  price: number;
  currency: string;
  rank: number;
  availability: Availability;
  themes: string[];
}

export type TierName = 'Budget' | 'Balanced' | 'Premium';

export const TIER_NAMES: TierName[] = ['Budget', 'Balanced', 'Premium'];

export interface BasketTier {
  tier: TierName;
  items: Product[];
  total: number;
}

export type CategoryRowState = 'normal' | 'empty' | 'unavailable' | 'substituted';

export interface CategoryRow {
  component: RequiredComponent;
  alternatives: Product[];
  selectedItemId: string | null;
  state: CategoryRowState;
}

export interface Bundle {
  intent: StructuredIntent;
  rows: CategoryRow[];
  tiers: Record<TierName, BasketTier>;
  confidence: number;
  unfulfilledComponents: string[];
  explanation: string | null;
  lowConfidence: boolean;
}

export interface SmartBundle {
  id: string;
  label: string;
  preassembled: Record<TierName, BasketTier>;
}

export interface Order {
  id: string;
  items: Product[];
  total: number;
  createdAt: string;
  status: 'confirmed' | 'failed';
  paymentMethod?: string;
}

/** A line in the cart: a specific product plus its quantity. */
export interface CartLine {
  product: Product;
  quantity: number;
}

export interface PaymentMethod {
  id: string;
  label: string;
  hint: string;
}

export interface ApiErrorShape {
  code: string;
  message: string;
  rawText?: string;
}
