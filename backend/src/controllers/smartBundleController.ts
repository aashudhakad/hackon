import { Request, Response } from 'express';
import { NotFoundError } from '../errors';
import { smartBundleRepository } from '../repositories/smartBundleRepository';

/**
 * Smart Bundle controllers.
 *
 * GET /api/smart-bundles      — list (clamped to 6) cards (Req 1.4-1.6, 2.1).
 * GET /api/smart-bundles/:id  — pre-assembled 3-tier basket; loads WITHOUT
 *                               invoking free-text generation (Property 5, 2.2).
 */
export async function listSmartBundles(_req: Request, res: Response): Promise<void> {
  const bundles = await smartBundleRepository.list();
  // Clamp to a maximum of 6 cards (Requirement 1.5, Property 1).
  res.json({ smartBundles: bundles.slice(0, 6) });
}

export async function getSmartBundle(req: Request, res: Response): Promise<void> {
  const bundle = await smartBundleRepository.findById(req.params.id);
  if (!bundle) {
    throw new NotFoundError('Smart bundle could not be loaded.');
  }
  res.json({ smartBundle: bundle, activeTier: 'Balanced' });
}
