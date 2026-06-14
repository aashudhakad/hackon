import { Request, Response } from 'express';
import { catalogRepository } from '../repositories/catalogRepository';
import { bundleService } from '../services/bundleService';
import { crossSellEngine } from '../services/crossSellEngine';
import { CrossSellBody } from './schemas';

/**
 * POST /api/cross-sell — thematic recommendations for a generated bundle
 * (Req 6.2-6.4). Returns 3..4 theme-relevant products, or [] to hide the strip.
 */
export async function getCrossSell(req: Request, res: Response): Promise<void> {
  const { intent } = req.body as CrossSellBody;

  const { bundle } = await bundleService.getOrGenerate(intent);
  const catalog = await catalogRepository.getCatalog();
  const crossSell = crossSellEngine.select(bundle, catalog);

  res.json({ crossSell });
}
