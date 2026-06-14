'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { Mode, ModeToggle } from '@/components/ModeToggle';
import { TierBaskets } from '@/components/TierBaskets';
import { CategoryGrid } from '@/components/CategoryGrid';
import { CrossSellStrip } from '@/components/CrossSellStrip';
import { UserMenu } from '@/components/UserMenu';
import { BoltIcon } from '@/components/icons';
import { linesFromProducts } from '@/lib/bundle';
import { TierName } from '@/lib/types';

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

export default function ShopPage() {
  const router = useRouter();
  const {
    cart,
    mode,
    setMode,
    submittedIntent,
    categories,
    rows,
    tiers,
    flashTier,
    setFlashTier,
    crossSell,
    unfulfilled,
    count,
    total,
    currency,
    setCart,
    addToCart,
    toggleQuickProduct,
    setRows,
    setTiers,
  } = useCart();

  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Redirect if no shopping data
  useEffect(() => {
    if (!submittedIntent && !categories.length) {
      router.push('/');
    }
  }, [submittedIntent, categories, router]);

  const switchModeShopping = useCallback(
    async (next: Mode) => {
      if (next === mode) return;
      setError(null);

      if (next === 'flash') {
        if (!tiers && categories.length > 0) {
          setLoadingMsg('Building baskets…');
          try {
            const r = await api.flashMode({ categories });
            setTiers(r.tiers);
          } catch (err) {
            setError(err instanceof ApiError ? err.message : 'Could not build baskets.');
            setLoadingMsg(null);
            return;
          } finally {
            setLoadingMsg(null);
          }
        }
        setCart(linesFromProducts((tiers ?? {})[flashTier]?.items ?? []));
      } else if (rows.length === 0 && categories.length > 0) {
        setLoadingMsg('Loading categories…');
        try {
          const r = await api.quickMode({ categories });
          setRows(r.rows);
          setCart(defaultLinesFromRows(r.rows));
        } catch (err) {
          setError(err instanceof ApiError ? err.message : 'Could not load categories.');
          setLoadingMsg(null);
          return;
        } finally {
          setLoadingMsg(null);
        }
      }
      setMode(next);
    },
    [mode, tiers, rows, categories, flashTier, setMode, setCart, setTiers, setRows],
  );

  const handleSelectTier = useCallback(
    (tier: TierName) => {
      if (!tiers) return;
      setFlashTier(tier);
      setCart(linesFromProducts(tiers[tier]?.items ?? []));
    },
    [tiers, setFlashTier, setCart],
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

      <main className="mx-auto max-w-2xl space-y-5 px-4 pb-28 pt-6">
        <div className="flex items-center justify-between gap-3">
          <button onClick={() => router.push('/')} className="text-sm text-gray-500 hover:text-gray-800">
            ← New search
          </button>
          <ModeToggle mode={mode} onChange={switchModeShopping} />
        </div>

        <p className="truncate text-sm text-gray-400">Intent: {submittedIntent}</p>

        {unfulfilled.length > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Couldn&apos;t find: {unfulfilled.map((u) => u.replace(/_/g, ' ')).join(', ')}
          </p>
        )}

        {mode === 'flash' && tiers ? (
          <TierBaskets tiers={tiers} activeTier={flashTier} onSelectTier={handleSelectTier} />
        ) : (
          <div>
            <h2 className="mb-3 font-semibold text-gray-800">
              Your basket — swipe each row to swap or drop items
            </h2>
            <CategoryGrid rows={rows} cart={cart} onToggle={toggleQuickProduct} />
          </div>
        )}

        <CrossSellStrip products={crossSell} onAdd={addToCart} />

        {/* Cart Summary Bar */}
        {count > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-20 bg-white border-t border-gray-200 shadow-lg">
            <div className="mx-auto max-w-2xl px-4 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{count} {count === 1 ? 'item' : 'items'}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {currency} {total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => router.push('/cart')}
                    className="rounded-lg bg-gray-100 px-6 py-3 text-sm font-medium text-gray-700 hover:bg-gray-200 transition"
                  >
                    View Cart
                  </button>
                  <button
                    onClick={() => router.push('/cart')}
                    className="rounded-lg bg-[var(--accent)] px-6 py-3 text-sm font-medium text-white hover:opacity-90 transition"
                  >
                    Proceed to Checkout
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
