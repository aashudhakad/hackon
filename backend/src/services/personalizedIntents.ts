import { randomUUID } from 'crypto';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { callGeminiJSON } from './geminiClient';
import { humanizeCategory } from './homepageSignals';
import { HomepageContext, HomepageIntent } from '../types/homepage';

/**
 * Predicts 5–6 personalized shopping INTENTS (never products) from context +
 * behavior signals. Uses Gemini when configured, with a deterministic
 * rules-based fallback so the section always renders.
 */

const MIN_INTENTS = 5;
const MAX_INTENTS = 6;

function buildPrompt(ctx: HomepageContext, topCategories: string[]): string {
  return [
    'You are the personalization engine for an intent-first quick-commerce app.',
    'Predict what the user is most likely to want to SHOP for RIGHT NOW.',
    'You predict shopping INTENTS (situations/needs), NOT specific products.',
    '',
    'Context:',
    `- Time of day: ${ctx.timeBucket}`,
    `- Day: ${ctx.dayOfWeek}${ctx.isWeekend ? ' (weekend)' : ''}`,
    `- Season: ${ctx.season}`,
    `- Weather: ${ctx.weather.condition} (${ctx.weather.bucket})`,
    `- Recently purchased categories (most frequent first): ${
      topCategories.length ? topCategories.map(humanizeCategory).join(', ') : 'none yet'
    }`,
    '',
    `Return ${MIN_INTENTS}-${MAX_INTENTS} predicted intents as STRICT JSON:`,
    '{ "intents": [',
    '  { "title": "Beat the Heat", "query": "cold drinks, ice cream and juices",',
    '    "confidence": 91, "reason": "Hot weather and repeated cold-beverage orders", "emoji": "🥤" }',
    '] }',
    '',
    'Rules:',
    '1. "title" is a short catchy intent name (<= 28 chars).',
    '2. "query" is a natural shopping phrase listing the kinds of items needed',
    '   (this is fed into the shopping engine). Do NOT name brands.',
    '3. "confidence" is an integer 0-100 reflecting how likely the user needs this now.',
    '4. "reason" is one short sentence (<= 90 chars) referencing the context.',
    '5. "emoji" is a single relevant emoji.',
    '6. Make them genuinely relevant to the time/weather/season/behavior — not generic.',
    '7. Order by confidence, highest first.',
  ].join('\n');
}

interface RawIntent {
  title?: unknown;
  query?: unknown;
  confidence?: unknown;
  reason?: unknown;
  emoji?: unknown;
}

function sanitize(raw: unknown): HomepageIntent[] {
  const arr = Array.isArray(raw)
    ? raw
    : ((raw as { intents?: unknown[] })?.intents ?? []);
  const out: HomepageIntent[] = [];
  for (const item of arr as RawIntent[]) {
    const title = String(item?.title ?? '').trim().slice(0, 40);
    const query = String(item?.query ?? '').trim().slice(0, 200);
    if (!title || !query) continue;
    const confNum = Number(item?.confidence);
    const confidence = Number.isFinite(confNum)
      ? Math.max(0, Math.min(100, Math.round(confNum)))
      : 70;
    out.push({
      id: randomUUID(),
      title,
      query,
      emoji: typeof item?.emoji === 'string' ? item.emoji.slice(0, 4) : undefined,
      reason: String(item?.reason ?? '').trim().slice(0, 120) || undefined,
      confidence,
      source: 'personalized',
    });
    if (out.length >= MAX_INTENTS) break;
  }
  return out;
}

/**
 * Deterministic fallback intents derived purely from context + signals.
 * Guarantees the section is never empty even if the LLM is unavailable.
 */
export function fallbackIntents(ctx: HomepageContext, topCategories: string[]): HomepageIntent[] {
  const picks: Array<Omit<HomepageIntent, 'id' | 'source'>> = [];

  // Weather-driven
  if (ctx.weather.bucket === 'hot') {
    picks.push({ title: 'Beat the Heat', query: 'cold drinks, ice cream and chilled juices', confidence: 90, reason: 'Hot weather right now', emoji: '🥤' });
  } else if (ctx.weather.bucket === 'cold') {
    picks.push({ title: 'Warm Up', query: 'tea, coffee and soup', confidence: 88, reason: 'Cold weather right now', emoji: '☕' });
  } else if (ctx.weather.bucket === 'rainy') {
    picks.push({ title: 'Rainy Day Cravings', query: 'instant noodles, pakora mix, tea and snacks', confidence: 86, reason: 'It is raining in your area', emoji: '🌧️' });
  }

  // Time-driven
  if (ctx.timeBucket === 'morning') {
    picks.push({ title: 'Quick Breakfast', query: 'bread, eggs, milk, cornflakes and butter', confidence: 84, reason: 'Morning ordering pattern', emoji: '🍳' });
  } else if (ctx.timeBucket === 'afternoon') {
    picks.push({ title: 'Midday Refresh', query: 'cold drinks, buttermilk and light snacks', confidence: 78, reason: 'Afternoon pick-me-up', emoji: '🧃' });
  } else if (ctx.timeBucket === 'evening') {
    picks.push({ title: 'Evening Snacks', query: 'namkeen, biscuits, chips and tea', confidence: 85, reason: 'Typical evening snack time', emoji: '🍪' });
  } else {
    picks.push({ title: 'Late Night Bites', query: 'instant noodles, chips, chocolate and cold drinks', confidence: 80, reason: 'Late-night cravings', emoji: '🌙' });
  }

  // Day-driven
  if (ctx.isWeekend) {
    picks.push({ title: 'Movie Night', query: 'popcorn, cold drinks, chips and chocolate', confidence: 82, reason: 'Weekend relaxation', emoji: '🍿' });
  } else {
    picks.push({ title: 'Office Emergency Kit', query: 'coffee, biscuits, energy drinks and snacks', confidence: 76, reason: 'Weekday work hours', emoji: '💼' });
  }

  // Behavior-driven (from recent orders)
  for (const cat of topCategories.slice(0, 2)) {
    picks.push({
      title: `Restock ${humanizeCategory(cat)}`,
      query: humanizeCategory(cat).toLowerCase(),
      confidence: 74,
      reason: 'Based on your recent orders',
      emoji: '🔁',
    });
  }

  // Always-useful staple
  picks.push({ title: 'Pantry Staples', query: 'rice, atta, cooking oil, sugar and salt', confidence: 70, reason: 'Everyday essentials', emoji: '🛒' });

  // De-dupe by title, clamp to MAX.
  const seen = new Set<string>();
  const result: HomepageIntent[] = [];
  for (const p of picks) {
    if (seen.has(p.title)) continue;
    seen.add(p.title);
    result.push({ ...p, id: randomUUID(), source: 'personalized' });
    if (result.length >= MAX_INTENTS) break;
  }
  return result;
}

export async function generatePersonalizedIntents(
  ctx: HomepageContext,
  topCategories: string[],
): Promise<HomepageIntent[]> {
  if (env.geminiEnabled) {
    try {
      const parsed = await callGeminiJSON(buildPrompt(ctx, topCategories));
      const intents = sanitize(parsed);
      if (intents.length >= MIN_INTENTS) return intents.slice(0, MAX_INTENTS);
      logger.warn('Personalized intents: too few from Gemini, using fallback', {
        got: intents.length,
      });
    } catch (err) {
      logger.warn('Personalized intents: Gemini failed, using fallback', {
        error: (err as Error).message,
      });
    }
  }
  return fallbackIntents(ctx, topCategories);
}
