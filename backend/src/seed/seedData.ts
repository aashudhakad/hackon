import { BasketTier, Product, RawProduct, SmartBundle, TierName } from '../types/domain';
import { normalizeProduct } from '../services/productNormalize';

/**
 * Sample catalog and Smart Bundles in the CSV-aligned shape.
 *
 * Used as the in-memory fallback when MongoDB is not connected. Real data is
 * imported from the source CSV via `node seedProduct.js`.
 */

const MAIN = 'grocery & gourmet foods';
const SUB = 'All Grocery & Gourmet Foods';

function raw(
  id: string,
  name: string,
  category: string,
  ratings: number,
  noOfRatings: number,
  discountPrice: number,
  actualPrice: number,
): RawProduct {
  return {
    id,
    name,
    mainCategory: MAIN,
    subCategory: SUB,
    category,
    image: '',
    link: '',
    ratings,
    noOfRatings,
    discountPrice,
    actualPrice,
    availability: 'in-stock',
  };
}

const RAW_PRODUCTS: RawProduct[] = [
  raw('ghee-1', 'Mother Dairy Pure Healthy Ghee, 1L', 'ghee', 4.2, 7251, 835, 845),
  raw('ghee-2', 'Amul Pure Ghee, 1L', 'ghee', 4.4, 12000, 610, 650),
  raw('ghee-3', 'Patanjali Cow Ghee, 1L', 'ghee', 4.1, 5400, 540, 600),
  raw('choc-1', 'Cadbury Dairy Milk Crispello Chocolate Bar, 35g', 'chocolate', 4.3, 2292, 30, 30),
  raw('choc-2', "Hershey's Milk Chocolate Bar, 100g", 'chocolate', 4.5, 3300, 120, 150),
  raw('choc-3', 'Amul Dark Chocolate, 150g', 'chocolate', 4.2, 1800, 90, 100),
  raw('gtea-1', 'TE-A-ME Purify Green Tea, 100 Tea Bags', 'green_tea', 4.6, 1438, 227, 325),
  raw('gtea-2', 'Lipton Honey Lemon Green Tea, 100 Bags', 'green_tea', 4.4, 2100, 290, 360),
  raw('syrup-1', "Hershey's Chocolate Syrup, 200g", 'syrups', 4.4, 1998, 91, 95),
  raw('syrup-2', "Hershey's Strawberry Syrup, 200g", 'syrups', 4.2, 900, 110, 120),
  raw('bisc-1', 'Parle Monaco Classic, 400g', 'biscuits', 4.3, 289, 79, 80),
  raw('bisc-2', 'Britannia Good Day Cashew, 600g', 'biscuits', 4.5, 5200, 140, 160),
  raw('htea-1', 'Tata Tea Premium Teaveda, 250g', 'herbal_tea', 4.0, 2444, 126, 145),
  raw('htea-2', 'Organic India Tulsi Green Tea, 100 Bags', 'herbal_tea', 4.5, 3100, 320, 400),
  raw('bcer-1', 'Nestle NAN PRO 4 Follow-Up Formula Powder, 400g', 'baby_cereal', 4.6, 2012, 580, 740),
  raw('bcer-2', 'Cerelac Wheat Apple, 300g', 'baby_cereal', 4.5, 8800, 240, 260),
  raw('coffee-1', 'Nescafe Classic Instant Coffee, 100g', 'coffee', 4.4, 9000, 320, 340),
  raw('coffee-2', 'Bru Instant Coffee, 200g', 'coffee', 4.2, 4100, 250, 280),
];

export const SAMPLE_PRODUCTS: Product[] = RAW_PRODUCTS.map(normalizeProduct);

const byId = new Map(SAMPLE_PRODUCTS.map((p) => [p.id, p]));
const pick = (id: string): Product => {
  const product = byId.get(id);
  if (!product) throw new Error(`Unknown sample product: ${id}`);
  return { ...product };
};

function buildTier(tier: TierName, ids: string[]): BasketTier {
  const items = ids.map(pick);
  return { tier, items, total: items.reduce((acc, i) => acc + i.price, 0) };
}

export const SAMPLE_SMART_BUNDLES: SmartBundle[] = [
  {
    id: 'sb-pantry-staples',
    label: 'Pantry Staples',
    preassembled: {
      Budget: buildTier('Budget', ['ghee-3', 'bisc-1']),
      Balanced: buildTier('Balanced', ['ghee-2', 'bisc-2']),
      Premium: buildTier('Premium', ['ghee-1', 'bisc-2']),
    },
  },
  {
    id: 'sb-tea-time',
    label: 'Tea Time',
    preassembled: {
      Budget: buildTier('Budget', ['gtea-1', 'bisc-1']),
      Balanced: buildTier('Balanced', ['gtea-2', 'bisc-2']),
      Premium: buildTier('Premium', ['htea-2', 'bisc-2']),
    },
  },
  {
    id: 'sb-chocolate-treats',
    label: 'Chocolate Treats',
    preassembled: {
      Budget: buildTier('Budget', ['choc-1', 'syrup-1']),
      Balanced: buildTier('Balanced', ['choc-3', 'syrup-1']),
      Premium: buildTier('Premium', ['choc-2', 'syrup-2']),
    },
  },
  {
    id: 'sb-morning-coffee',
    label: 'Morning Coffee',
    preassembled: {
      Budget: buildTier('Budget', ['coffee-2']),
      Balanced: buildTier('Balanced', ['coffee-1']),
      Premium: buildTier('Premium', ['coffee-1', 'choc-2']),
    },
  },
];
