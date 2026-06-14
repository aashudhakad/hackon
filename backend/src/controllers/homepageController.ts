import { Request, Response } from 'express';
import { homepageService, HomepageRequest } from '../services/homepageService';

/**
 * Homepage module controllers.
 *
 * GET /api/homepage/personalized  — AI-predicted intents (time/weather/behavior)
 * GET /api/homepage/trending      — analytics-driven local trending intents
 * GET /api/homepage/smart-bundles — prebuilt quick bundles (reuses bundle repo)
 * GET /api/homepage/full          — all three sections in one response
 *
 * All inputs are optional query params; the homepage always renders something
 * (deterministic fallbacks) even with no location, no orders, or no AI.
 */
function parseReq(req: Request): HomepageRequest {
  const q = req.query;
  const num = (v: unknown) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  return {
    userId: typeof q.userId === 'string' ? q.userId : undefined,
    pincode: typeof q.pincode === 'string' ? q.pincode : undefined,
    lat: num(q.lat),
    lon: num(q.lon),
    tzOffsetMinutes: num(q.tz),
  };
}

export async function getPersonalized(req: Request, res: Response): Promise<void> {
  res.json(await homepageService.personalized(parseReq(req)));
}

export async function getTrending(req: Request, res: Response): Promise<void> {
  res.json(await homepageService.trending(parseReq(req)));
}

export async function getHomepageSmartBundles(_req: Request, res: Response): Promise<void> {
  res.json(await homepageService.smartBundles());
}

export async function getHomepageFull(req: Request, res: Response): Promise<void> {
  res.json(await homepageService.full(parseReq(req)));
}
