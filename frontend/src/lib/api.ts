import { BasketTier, Bundle, CategoryRow, HomepageFull, Order, Product, SmartBundle, StructuredIntent, TierName } from './types';

/**
 * Thin API client. All calls go through Next's `/api/*` rewrite, which proxies
 * to the backend (configured via NEXT_PUBLIC_API_BASE_URL).
 */

export class ApiError extends Error {
  code: string;
  rawText?: string;
  status: number;

  constructor(message: string, code: string, status: number, rawText?: string) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.rawText = rawText;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const err = (data as { error?: { code?: string; message?: string; rawText?: string } }).error;
    throw new ApiError(
      err?.message ?? 'Request failed',
      err?.code ?? 'UNKNOWN',
      res.status,
      err?.rawText,
    );
  }
  return data as T;
}

export interface BundleResponse {
  bundle: Bundle;
  crossSell: Product[];
  cached: boolean;
}

export interface VisionResponse extends BundleResponse {
  intent: StructuredIntent;
}

export interface QuickResponse {
  categories: string[];
  rows: CategoryRow[];
  crossSell: Product[];
  unfulfilledComponents: string[];
}

export interface FlashResponse {
  categories: string[];
  tiers: Record<TierName, BasketTier>;
  crossSell: Product[];
  unfulfilledComponents: string[];
}

/** Combined smart-shop response: Quick rows + Flash tiers from one AI relevance pass. */
export interface ShopResponse {
  categories: string[];
  rows: CategoryRow[];
  tiers: Record<TierName, BasketTier>;
  crossSell: Product[];
  unfulfilledComponents: string[];
  cached: boolean;
}

export const api = {
  parseIntent(text: string) {
    return request<{ intent: StructuredIntent }>('/api/intent', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  generateBundle(text: string) {
    return request<BundleResponse>('/api/bundle', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  /** Quick mode: Category Grid with up to 5 best products per category. */
  quickMode(params: { intent?: string; categories?: string[] }) {
    return request<QuickResponse>('/api/quick', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /** Flash mode: Budget/Balanced/Premium 3-tier baskets. */
  flashMode(params: { intent?: string; categories?: string[] }) {
    return request<FlashResponse>('/api/flash', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  /**
   * Smart shop: one call returns relevance-filtered, LLM-ranked Quick rows AND
   * Flash tiers. Preferred over quickMode/flashMode for text intents.
   */
  shop(params: { intent?: string; categories?: string[] }) {
    return request<ShopResponse>('/api/shop', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  listSmartBundles() {
    return request<{ smartBundles: SmartBundle[] }>('/api/smart-bundles');
  },

  /** Homepage module: personalized + trending + smart bundles in one call. */
  homepageFull(params: { lat?: number; lon?: number; pincode?: string; userId?: string; tz?: number }) {
    const qs = new URLSearchParams();
    if (typeof params.lat === 'number') qs.set('lat', String(params.lat));
    if (typeof params.lon === 'number') qs.set('lon', String(params.lon));
    if (params.pincode) qs.set('pincode', params.pincode);
    if (params.userId) qs.set('userId', params.userId);
    if (typeof params.tz === 'number') qs.set('tz', String(params.tz));
    const q = qs.toString();
    return request<HomepageFull>(`/api/homepage/full${q ? `?${q}` : ''}`);
  },

  getSmartBundle(id: string) {
    return request<{ smartBundle: SmartBundle; activeTier: string }>(
      `/api/smart-bundles/${encodeURIComponent(id)}`,
    );
  },

  crossSell(intent: StructuredIntent) {
    return request<{ crossSell: Product[] }>('/api/cross-sell', {
      method: 'POST',
      body: JSON.stringify({ intent }),
    });
  },

  checkout(items: Array<Product & { quantity?: number }>, paymentMethod?: string) {
    return request<{ order: Order }>('/api/checkout', {
      method: 'POST',
      body: JSON.stringify({ items, paymentMethod }),
    });
  },

  /** Image -> intent -> bundle (multipart, so no JSON Content-Type). */
  async vision(file: File): Promise<VisionResponse> {
    const form = new FormData();
    form.append('image', file);
    const res = await fetch('/api/vision', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (data as { error?: { code?: string; message?: string } }).error;
      throw new ApiError(err?.message ?? 'Vision failed', err?.code ?? 'UNKNOWN', res.status);
    }
    return data as VisionResponse;
  },

  /** Audio clip -> recognized text (server fallback path). */
  async audioIntent(blob: Blob, durationMs: number): Promise<{ recognizedText: string }> {
    const form = new FormData();
    form.append('audio', blob, 'clip.webm');
    form.append('durationMs', String(durationMs));
    const res = await fetch('/api/audio-intent', { method: 'POST', body: form });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = (data as { error?: { code?: string; message?: string } }).error;
      throw new ApiError(err?.message ?? 'Audio failed', err?.code ?? 'UNKNOWN', res.status);
    }
    return data as { recognizedText: string };
  },
};
