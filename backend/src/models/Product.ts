import { Schema, model } from 'mongoose';
import { RawProduct } from '../types/domain';

/**
 * Product schema mirroring the source CSV columns:
 * name, main_category, sub_category, image, link, ratings, no_of_ratings,
 * discount_price, actual_price, category.
 *
 * Engine fields (component, price, rank, themes, brand) are derived on read by
 * the catalog repository via normalizeProduct, so they are not stored here.
 */
const ProductSchema = new Schema<RawProduct>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    mainCategory: { type: String, default: '' },
    subCategory: { type: String, default: '' },
    category: { type: String, required: true },
    image: { type: String, default: '' },
    link: { type: String, default: '' },
    ratings: { type: Number, default: 0 },
    noOfRatings: { type: Number, default: 0 },
    discountPrice: { type: Number, default: 0, min: 0 },
    actualPrice: { type: Number, default: 0, min: 0 },
    availability: {
      type: String,
      enum: ['in-stock', 'out-of-stock'],
      required: true,
      default: 'in-stock',
    },
  },
  { timestamps: true, versionKey: false },
);

/**
 * Primary retrieval index for category-based product lookup.
 *
 * Follows the ESR (Equality → Sort → Range) rule:
 *   - Equality:  category, availability   (exact-match filters)
 *   - Sort:      ratings desc, noOfRatings desc  (== derived `rank` order)
 *
 * A query like `{ category: "milk", availability: "in-stock" }` sorted by
 * ratings/noOfRatings is answered entirely from this index: MongoDB seeks
 * directly to the "milk" + "in-stock" key range and walks it in already-sorted
 * order, so `.limit()` / `.skip()` pagination reads only the rows it returns.
 * No collection scan and no in-memory sort, which is what keeps it fast at 1M+
 * documents. The leading `category` prefix also serves plain
 * `{ category }` equality queries.
 */
ProductSchema.index(
  { category: 1, availability: 1, ratings: -1, noOfRatings: -1 },
  { name: 'category_availability_rank' },
);

export const ProductModel = model<RawProduct>('Product', ProductSchema);
