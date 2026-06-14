'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { linesFromProducts, smartBundleToBundle } from '@/lib/bundle';
import { IntentBar } from '@/components/IntentBar';
import { Homepage } from '@/components/homepage/Homepage';
import { ModeToggle } from '@/components/ModeToggle';
import { BoltIcon, GridIcon } from '@/components/icons';
import { UserMenu } from '@/components/UserMenu';

/** Seeds cart lines from each row's default selected product */
function defaultLinesFromRows(rows: any[]): any[] {
  const lines: any[] = [];
  for (const row of rows) {
    const product =
      row.alternatives.find((p: any) => p.id === row.selectedItemId) ?? row.alternatives[0];
    if (product && product.availability === 'in-stock') lines.push({ product, quantity: 1 });
  }
  return lines;
}

export default function HomePage() {
  const router = useRouter();
  const {
    mode,
    setMode,
    setCart,
    setSubmittedIntent,
    setCategories,
    setRows,
    setTiers,
    setFlashTier,
    setCrossSell,
    setUnfulfilled,
  } = useCart();

  const [intentText, setIntentText] = useState('');
  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load shopping data for an intent
  const submitIntent = useCallback(
    async (text: string) => {
      setError(null);
      setLoadingMsg(mode === 'flash' ? 'Finding the best picks…' : 'Finding the best picks…');
      try {
        const r = await api.shop({ intent: text });
        setSubmittedIntent(text);
        setCategories(r.categories);
        setRows(r.rows);
        setTiers(r.tiers);
        setCrossSell(r.crossSell);
        setUnfulfilled(r.unfulfilledComponents);
        setFlashTier('Balanced');
        
        if (mode === 'flash') {
          setCart(linesFromProducts(r.tiers.Balanced?.items ?? []));
        } else {
          setCart(defaultLinesFromRows(r.rows));
        }
        
        router.push('/shop');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Something went wrong.');
      } finally {
        setLoadingMsg(null);
      }
    },
    [mode, router, setSubmittedIntent, setCategories, setRows, setTiers, setCrossSell, setUnfulfilled, setFlashTier, setCart],
  );

  const handleVisionFile = useCallback(
    async (file: File) => {
      setError(null);
      setLoadingMsg('Analyzing image…');
      try {
        const { bundle, crossSell: cross } = await api.vision(file);
        setSubmittedIntent(bundle.intent.rawText);
        setCategories(bundle.intent.components.map((c) => c.name));
        setCrossSell(cross);
        setUnfulfilled(bundle.unfulfilledComponents);
        
        const visionRows = bundle.rows.map((row) => ({
          ...row,
          alternatives: row.alternatives.slice(0, 5),
        }));
        setRows(visionRows);
        setTiers(bundle.tiers);
        setFlashTier('Balanced');
        
        if (mode === 'flash') {
          setCart(linesFromProducts(bundle.tiers.Balanced?.items ?? []));
        } else {
          setCart(defaultLinesFromRows(visionRows));
        }
        
        router.push('/shop');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Image could not be processed.');
      } finally {
        setLoadingMsg(null);
      }
    },
    [mode, router, setSubmittedIntent, setCategories, setCrossSell, setUnfulfilled, setRows, setTiers, setFlashTier, setCart],
  );

  const handleSmartBundle = useCallback(
    async (id: string) => {
      setError(null);
      setLoadingMsg('Loading basket…');
      try {
        const { smartBundle } = await api.getSmartBundle(id);
        const b = smartBundleToBundle(smartBundle);
        let cross: any[] = [];
        try {
          cross = (await api.crossSell(b.intent)).crossSell;
        } catch {
          cross = [];
        }
        
        setSubmittedIntent(smartBundle.label);
        setCategories(b.intent.components.map((c) => c.name));
        setRows(b.rows);
        setTiers(b.tiers);
        setFlashTier('Balanced');
        setCrossSell(cross);
        setUnfulfilled([]);
        
        if (mode === 'flash') {
          setCart(linesFromProducts(b.tiers.Balanced?.items ?? []));
        } else {
          setCart(defaultLinesFromRows(b.rows));
        }
        
        router.push('/shop');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Basket could not be loaded.');
      } finally {
        setLoadingMsg(null);
      }
    },
    [mode, router, setSubmittedIntent, setCategories, setRows, setTiers, setFlashTier, setCrossSell, setUnfulfilled, setCart],
  );

  const themeClass = mode === 'flash' ? 'theme-flash' : 'theme-quick';

  return (
    <div className={`${themeClass} min-h-screen`}>
      {/* User Menu - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <UserMenu />
      </div>

      {error && (
        <div className="sticky top-0 z-30 mx-auto max-w-2xl px-4">
          <div className="mt-3 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-3 font-medium underline">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loadingMsg && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3">
            {mode === 'flash' ? (
              <BoltIcon className="flash-bolt h-12 w-12 text-red-600" />
            ) : (
              <span className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--accent)]" />
            )}
            <span className="text-sm font-medium text-gray-600">{loadingMsg}</span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-4 pb-16">
        <section className="pt-8">
          <div className="mb-6 flex flex-col items-center gap-3">
            {mode === 'flash' ? (
              <div className="flex items-center gap-2 text-red-600">
                <BoltIcon className="flash-bolt h-7 w-7" />
                <span className="text-lg font-extrabold uppercase tracking-wide">Flash Mode</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-blue-600">
                <GridIcon className="h-7 w-7" />
                <span className="text-lg font-extrabold uppercase tracking-wide">Quick Mode</span>
              </div>
            )}
            <ModeToggle mode={mode} onChange={setMode} />
          </div>

          <IntentBar
            value={intentText}
            onChange={setIntentText}
            onSubmit={submitIntent}
            onVisionStart={() => setError(null)}
            onVisionFile={handleVisionFile}
            onRecognized={(text) => setIntentText(text)}
            onError={setError}
            disabled={!!loadingMsg}
          />
        </section>

        <section className="mt-10">
          <Homepage
            onIntent={submitIntent}
            onBundle={handleSmartBundle}
            disabled={!!loadingMsg}
          />
        </section>
      </main>
    </div>
  );
}
