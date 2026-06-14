import { Request, Response } from 'express';
import { intentParser } from '../services/intentParser';
import { bundleService } from '../services/bundleService';
import { crossSellEngine } from '../services/crossSellEngine';
import { catalogRepository } from '../repositories/catalogRepository';
import { StructuredIntent } from '../types/domain';
import { BundleBody } from './schemas';

/**
 * Intent + Bundle controllers.
 *
 * POST /api/intent  — parse typed intent into a StructuredIntent (Req 7).
 * POST /api/bundle  — cache-first generate/retrieve a bundle + cross-sell (Req 8).
 *
 * Validation, timeout, and parser errors propagate to the central error
 * handler, which retains the user's text where applicable (Req 7.3, 7.5, 7.6).
 */
export async function parseIntent(req: Request, res: Response): Promise<void> {
  const { text } = req.body as { text: string };
  const intent = await intentParser.parse(text);
  res.json({ intent });
}

export async function generateBundle(req: Request, res: Response): Promise<void> {
  const body = req.body as BundleBody;

  const intent: StructuredIntent =
    'intent' in body ? body.intent : await intentParser.parse(body.text);

  const { bundle, cached } = await bundleService.getOrGenerate(intent);

  const catalog = await catalogRepository.getCatalog();
  const crossSell = crossSellEngine.select(bundle, catalog);

  res.json({ bundle, crossSell, cached });
}
