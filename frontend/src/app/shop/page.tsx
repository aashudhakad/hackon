'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { Mode, ModeToggle } from '@/components/ModeToggle';
import { TierBaskets } from '@/components/TierBaskets';
import { CategoryGrid } from '@/components/CategoryGrid';
import { CrossSellStrip } from '@/components/CrossSellStrip';
import { BoltIcon } from '@/components/icons';
import { linesFromProducts } from '@/lib/bundle';
import { TierName } from '@/lib/types';

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
    incrementItem,
    decrementItem,
    setRows,
    setTiers,
  } = useCart();

  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Wait for cart to initialize before checking for redirect
  useEffect(() => {
    // Small delay to let cart context load from localStorage
    const timer = setTimeout(() => {
      setIsInitialized(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect if no shopping data (only after initialization)
  useEffect(() => {
    if (isInitialized && !submittedIntent && !categories.length) {
      router.push('/');
    }
  }, [isInitialized, submittedIntent, categories, router]);

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
        // Flash mode: replace cart with balanced tier
        setCart(linesFromProducts((tiers ?? {})[flashTier]?.items ?? []));
      } else if (rows.length === 0 && categories.length > 0) {
        setLoadingMsg('Loading categories…');
        try {
          const r = await api.quickMode({ categories });
          setRows(r.rows);
          // Quick mode: keep current cart (don't clear it)
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

  return (
    <div className="relative">
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

      <main className="mx-auto max-w-2xl space-y-4 sm:space-y-5 px-3 sm:px-4 pb-28 pt-4 sm:pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
          <button onClick={() => router.push('/')} className="text-xs sm:text-sm text-gray-500 hover:text-gray-800">
            ← New search
          </button>
          <ModeToggle mode={mode} onChange={switchModeShopping} />
        </div>

        {/* <p className="truncate text-xs sm:text-sm text-gray-400">Intent: {submittedIntent}</p> */}

        {unfulfilled.length > 0 && (
          <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 break-words">
            Couldn&apos;t find: {unfulfilled.map((u) => u.replace(/_/g, ' ')).join(', ')}
          </p>
        )}

        {mode === 'flash' && tiers ? (
          <TierBaskets 
            tiers={tiers} 
            activeTier={flashTier} 
            cart={cart}
            onSelectTier={handleSelectTier}
            onAdd={addToCart}
            onIncrement={incrementItem}
            onDecrement={decrementItem}
          />
        ) : (
          <div>
            {/* <h2 className="mb-3 text-sm sm:text-base font-semibold text-gray-800">
              Your basket — add items with + or remove with -
            </h2> */}
            <CategoryGrid 
              rows={rows} 
              cart={cart} 
              onAdd={addToCart}
              onIncrement={incrementItem}
              onDecrement={decrementItem}
            />
          </div>
        )}

        <CrossSellStrip 
          products={crossSell} 
          cart={cart}
          onAdd={addToCart}
          onIncrement={incrementItem}
          onDecrement={decrementItem}
        />

        {/* Cart Summary Bar */}
        {count > 0 && (
          <div className="fixed inset-x-0 bottom-0 z-20 bg-white border-t border-gray-200 shadow-lg">
            <div className="mx-auto max-w-2xl px-3 sm:px-4 py-3 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-600">{count} {count === 1 ? 'item' : 'items'}</p>
                  <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                    {currency} {total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2 sm:gap-3 flex-shrink-0">
                  <button
                    onClick={() => router.push('/cart')}
                    className="rounded-lg bg-gray-100 px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-700 hover:bg-gray-200 transition whitespace-nowrap"
                  >
                    View Cart
                  </button>
                  <button
                    onClick={() => router.push('/cart')}
                    className="rounded-lg bg-[var(--accent)] px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium text-white hover:opacity-90 transition whitespace-nowrap"
                  >
                    Checkout
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
