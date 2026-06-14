import { Bundle, StructuredIntent } from '../types/domain';
import { catalogRepository } from '../repositories/catalogRepository';
import { bundleCache } from '../repositories/bundleCache';
import { bundleGenerator } from './bundleGenerator';

/**
 * Bundle orchestration: cache-first retrieval then deterministic generation
 * (Requirements 8.1, 8.6, 8.7). Cache failures are handled inside bundleCache,
 * so this always returns a bundle.
 */
export const bundleService = {
  async getOrGenerate(intent: StructuredIntent): Promise<{ bundle: Bundle; cached: boolean }> {
    const cached = await bundleCache.get(intent.rawText);
    if (cached) return { bundle: cached, cached: true };

    const catalog = await catalogRepository.getCatalog();
    const bundle = bundleGenerator.generate(intent, catalog);

    await bundleCache.set(intent.rawText, bundle);
    return { bundle, cached: false };
  },
};
