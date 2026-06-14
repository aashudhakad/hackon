import { isMongoConnected } from '../config/db';
import { ProductModel } from '../models/Product';
import { Catalog, Product, RawProduct } from '../types/domain';
import { normalizeProduct } from '../services/productNormalize';
import { SAMPLE_PRODUCTS } from '../seed/seedData';

export interface Pagination {
  page?: number;
  limit?: number;
}

/** Default number of best products fetched per category for bundle building. */
export const DEFAULT_PER_CATEGORY = 24;

/**
 * Catalog repository (Task 9.1).
 *
 * Category-based retrieval is the hot path. Instead of loading the whole
 * catalog into memory (which does not scale past a few thousand rows), it runs
 * an indexed, already-sorted, paginated query per category against the
 * `category_availability_rank` compound index. Sorting by
 * `ratings desc, noOfRatings desc` matches the derived `rank` order, so the
 * "best products first" ordering is served by the index with no in-memory sort.
 */
export const catalogRepository = {
  /**
   * Fetches in-stock products for an exact category, ranked best-first, with
   * pagination. Uses the compound index and `.lean()` for minimal overhead.
   */
  async getProductsByCategory(category: string, pg: Pagination = {}): Promise<Product[]> {
    const target = category.trim().toLowerCase();
    const limit = Math.max(1, Math.min(pg.limit ?? DEFAULT_PER_CATEGORY, 100));
    const page = Math.max(1, pg.page ?? 1);
    const skip = (page - 1) * limit;

    if (isMongoConnected()) {
      const docs = await ProductModel.find({ category: target, availability: 'in-stock' })
        .sort({ ratings: -1, noOfRatings: -1 })
        .skip(skip)
        .limit(limit)
        .lean<RawProduct[]>()
        .exec();
      return docs.map((d) => normalizeProduct(toRaw(d)));
    }

    // In-memory fallback (Mongo offline).
    return SAMPLE_PRODUCTS.filter((p) => p.category.toLowerCase() === target)
      .sort((a, b) => b.rank - a.rank)
      .slice(skip, skip + limit)
      .map((p) => ({ ...p }));
  },

  /**
   * Fetches the best products for several categories in parallel, returning a
   * small Catalog containing only the relevant rows. This keeps the working set
   * tiny regardless of total collection size (scales to 1M+ products).
   */
  async getProductsByCategories(
    categories: string[],
    perCategoryLimit = DEFAULT_PER_CATEGORY,
  ): Promise<Catalog> {
    const lists = await Promise.all(
      categories.map((c) => this.getProductsByCategory(c, { limit: perCategoryLimit })),
    );
    return { products: lists.flat() };
  },

  /**
   * Full catalog read. Retained only for the in-memory fallback and small
   * datasets; the per-category methods above are preferred in production.
   */
  async getCatalog(): Promise<Catalog> {
    if (isMongoConnected()) {
      const docs = await ProductModel.find().lean<RawProduct[]>().exec();
      if (docs.length > 0) return { products: docs.map((d) => normalizeProduct(toRaw(d))) };
    }
    return { products: SAMPLE_PRODUCTS.map((p) => ({ ...p })) };
  },

  async findById(id: string): Promise<Product | null> {
    if (isMongoConnected()) {
      const doc = await ProductModel.findOne({ id }).lean<RawProduct>().exec();
      return doc ? normalizeProduct(toRaw(doc)) : null;
    }
    return SAMPLE_PRODUCTS.find((p) => p.id === id) ?? null;
  },
};

/** Strips Mongo-internal fields, keeping only the raw CSV-backed columns. */
function toRaw(d: RawProduct & { _id?: unknown }): RawProduct {
  return {
    id: d.id,
    name: d.name,
    mainCategory: d.mainCategory ?? '',
    subCategory: d.subCategory ?? '',
    category: d.category,
    image: d.image ?? '',
    link: d.link ?? '',
    ratings: d.ratings ?? 0,
    noOfRatings: d.noOfRatings ?? 0,
    discountPrice: d.discountPrice ?? 0,
    actualPrice: d.actualPrice ?? 0,
    availability: d.availability ?? 'in-stock',
  };
}
