import { Request, Response } from 'express';
import { generateCategoriesForIntent, sanitizeCategories } from '../services/geminiClient';
import { catalogRepository } from '../repositories/catalogRepository';
import { bundleGenerator } from '../services/bundleGenerator';
import { crossSellEngine } from '../services/crossSellEngine';
import { Bundle, RequiredComponent, StructuredIntent } from '../types/domain';

/** Max product alternatives per category row in Quick mode. */
const QUICK_MAX_PER_CATEGORY = 5;

interface ModeBody {
  intent?: string;
  categories?: string[];
}

/**
 * Resolves the category list for a request: uses pre-supplied categories when
 * present (so a second mode call can skip the LLM), otherwise asks Gemini.
 */
async function resolveCategories(body: ModeBody): Promise<string[]> {
  if (Array.isArray(body.categories) && body.categories.length > 0) {
    return sanitizeCategories(body.categories);
  }
  return generateCategoriesForIntent(body.intent ?? '');
}

/** Builds a deterministic Bundle from a category list + per-category products. */
async function buildBundle(
  intent: string,
  categories: string[],
): Promise<{ bundle: Bundle; crossSell: ReturnType<typeof crossSellEngine.select> }> {
  const components: RequiredComponent[] = categories.map((c, i) => ({
    name: c,
    sequence: i,
    themes: [c],
  }));
  const structured: StructuredIntent = { rawText: intent || categories.join(', '), components };

  // Indexed, per-category fetch (top products each) — avoids scanning the
  // whole collection, so this scales to 1M+ products.
  const catalog = await catalogRepository.getProductsByCategories(categories);
  const bundle = bundleGenerator.generate(structured, catalog);
  const crossSell = crossSellEngine.select(bundle, catalog);
  return { bundle, crossSell };
}

/**
 * POST /api/quick — Quick mode: Goal-Oriented Category Grid.
 * Returns one row per required category with up to 5 best products each and a
 * default Selected_Item per row (a pre-made, editable basket).
 */
export async function quickMode(req: Request, res: Response): Promise<void> {
  const body = req.body as ModeBody;
  const categories = await resolveCategories(body);
  const { bundle, crossSell } = await buildBundle(body.intent ?? '', categories);

  const rows = bundle.rows.map((row) => ({
    ...row,
    alternatives: row.alternatives.slice(0, QUICK_MAX_PER_CATEGORY),
  }));

  res.json({
    categories,
    rows,
    crossSell,
    unfulfilledComponents: bundle.unfulfilledComponents,
  });
}

/**
 * POST /api/flash — Flash mode: Super Quick 3-tier baskets.
 * Returns Budget/Balanced/Premium pre-assembled baskets for 1-click checkout.
 */
export async function flashMode(req: Request, res: Response): Promise<void> {
  const body = req.body as ModeBody;
  const categories = await resolveCategories(body);
  const { bundle, crossSell } = await buildBundle(body.intent ?? '', categories);

  res.json({
    categories,
    tiers: bundle.tiers,
    crossSell,
    unfulfilledComponents: bundle.unfulfilledComponents,
  });
}
