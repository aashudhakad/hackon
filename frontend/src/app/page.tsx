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
        
        // Both modes: pre-select default items (Flash: tier items, Quick: default from rows)
        if (mode === 'flash') {
          setCart(linesFromProducts(r.tiers.Balanced?.items ?? []));
        } else {
          // Pre-select one product per category (the recommended one)
          const defaultCart: any[] = [];
          for (const row of r.rows) {
            const product = row.alternatives.find((p: any) => p.id === row.selectedItemId) ?? row.alternatives[0];
            if (product && product.availability === 'in-stock') {
              defaultCart.push({ product, quantity: 1 });
            }
          }
          setCart(defaultCart);
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
          // Pre-select one product per category
          const defaultCart: any[] = [];
          for (const row of visionRows) {
            const product = row.alternatives.find((p: any) => p.id === row.selectedItemId) ?? row.alternatives[0];
            if (product && product.availability === 'in-stock') {
              defaultCart.push({ product, quantity: 1 });
            }
          }
          setCart(defaultCart);
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
          // Pre-select one product per category
          const defaultCart: any[] = [];
          for (const row of b.rows) {
            const product = row.alternatives.find((p: any) => p.id === row.selectedItemId) ?? row.alternatives[0];
            if (product && product.availability === 'in-stock') {
              defaultCart.push({ product, quantity: 1 });
            }
          }
          setCart(defaultCart);
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
    <div className={`${themeClass} min-h-screen relative`}>
      {/* User Menu - Top Right */}
      <div className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50">
        <UserMenu />
      </div>

      {error && (
        <div className="sticky top-0 z-30 mx-auto max-w-2xl px-3 sm:px-4">
          <div className="mt-3 flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-xl border border-red-200 bg-red-50 px-3 sm:px-4 py-3 text-sm text-red-700 gap-2">
            <span className="break-words">{error}</span>
            <button onClick={() => setError(null)} className="self-end sm:self-auto sm:ml-3 font-medium underline text-xs sm:text-sm whitespace-nowrap">
              Dismiss
            </button>
          </div>
        </div>
      )}

      {loadingMsg && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-white/70 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 px-4">
            {mode === 'flash' ? (
              <BoltIcon className="flash-bolt h-10 w-10 sm:h-12 sm:w-12 text-red-600" />
            ) : (
              <span className="h-8 w-8 sm:h-10 sm:w-10 animate-spin rounded-full border-4 border-gray-200 border-t-[var(--accent)]" />
            )}
            <span className="text-xs sm:text-sm font-medium text-gray-600 text-center">{loadingMsg}</span>
          </div>
        </div>
      )}

      <main className="mx-auto max-w-2xl px-3 sm:px-4 pb-16">
        <section className="pt-6 sm:pt-8">
          <div className="mb-4 sm:mb-6 flex flex-col items-center gap-2 sm:gap-3">
            {mode === 'flash' ? (
              <div className="flex items-center gap-2 text-red-600">
                <BoltIcon className="flash-bolt h-6 w-6 sm:h-7 sm:w-7" />
                <span className="text-base sm:text-lg font-extrabold uppercase tracking-wide">Flash Mode</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-blue-600">
                <GridIcon className="h-6 w-6 sm:h-7 sm:w-7" />
                <span className="text-base sm:text-lg font-extrabold uppercase tracking-wide">Quick Mode</span>
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

        <section className="mt-8 sm:mt-10">
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
