import { homepageCache, locationBucket } from '../repositories/homepageCache';
import { smartBundleRepository } from '../repositories/smartBundleRepository';
import { getWeather } from './weatherService';
import { buildContext, topOrderedCategories } from './homepageSignals';
import { generatePersonalizedIntents } from './personalizedIntents';
import { getTrendingIntents } from './trendingService';
import {
  HomepageContext,
  HomepageFullResponse,
  PersonalizedResponse,
  SmartBundlesResponse,
  TrendingResponse,
} from '../types/homepage';

/** Cache TTLs (seconds). Normalized outputs only — never raw prompts. */
const TTL = {
  personalized: 30 * 60,
  trending: 60 * 60,
  bundles: 6 * 60 * 60,
};

export interface HomepageRequest {
  userId?: string;
  pincode?: string;
  lat?: number;
  lon?: number;
  tzOffsetMinutes?: number;
}

function location(req: HomepageRequest): HomepageContext['location'] {
  if (req.pincode || typeof req.lat === 'number') {
    return { pincode: req.pincode, lat: req.lat, lon: req.lon };
  }
  return null;
}

/** Builds weather + context once; reused by personalized and trending. */
async function resolveContext(req: HomepageRequest): Promise<HomepageContext> {
  const loc = location(req);
  const weather = await getWeather(req.lat, req.lon);
  return buildContext(weather, loc, req.tzOffsetMinutes);
}

export const homepageService = {
  async personalized(req: HomepageRequest, ctx?: HomepageContext): Promise<PersonalizedResponse> {
    const context = ctx ?? (await resolveContext(req));
    const key = [
      'personalized',
      req.userId ?? 'anon',
      locationBucket(context.location),
      context.timeBucket,
      context.dayOfWeek,
      context.weather.bucket,
    ].join(':');

    const cached = await homepageCache.get<Omit<PersonalizedResponse, 'cached'>>(key);
    if (cached) return { ...cached, cached: true };

    const topCategories = await topOrderedCategories();
    const intents = await generatePersonalizedIntents(context, topCategories);
    const payload = { intents, context };
    await homepageCache.set(key, payload, TTL.personalized);
    return { ...payload, cached: false };
  },

  async trending(req: HomepageRequest, ctx?: HomepageContext): Promise<TrendingResponse> {
    const context = ctx ?? (await resolveContext(req));
    const key = ['trending', locationBucket(context.location), context.weather.bucket, context.season].join(':');

    const cached = await homepageCache.get<{ intents: TrendingResponse['intents'] }>(key);
    if (cached) return { intents: cached.intents, cached: true };

    const intents = await getTrendingIntents(context);
    await homepageCache.set(key, { intents }, TTL.trending);
    return { intents, cached: false };
  },

  async smartBundles(): Promise<SmartBundlesResponse> {
    const key = 'bundles';
    const cached = await homepageCache.get<{ smartBundles: SmartBundlesResponse['smartBundles'] }>(key);
    if (cached) return { smartBundles: cached.smartBundles, cached: true };

    const smartBundles = await smartBundleRepository.list();
    await homepageCache.set(key, { smartBundles }, TTL.bundles);
    return { smartBundles, cached: false };
  },

  async full(req: HomepageRequest): Promise<HomepageFullResponse> {
    // Compute context once, share across personalized + trending.
    const context = await resolveContext(req);
    const [personalized, trending, smartBundles] = await Promise.all([
      this.personalized(req, context),
      this.trending(req, context),
      this.smartBundles(),
    ]);
    return { personalized, trending, smartBundles };
  },
};
