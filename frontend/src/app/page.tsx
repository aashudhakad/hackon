'use client';

import { useCallback, useMemo, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import {
  BasketTier,
  CartLine,
  CategoryRow,
  Order,
  PaymentMethod,
  Product,
  TierName,
} from '@/lib/types';
import {
  addLine,
  cartCount,
  cartTotal,
  clearCategory,
  decLine,
  incLine,
  linesFromProducts,
  removeLine,
  selectInCategory,
  selectedIdForCategory,
  smartBundleToBundle,
  toCheckoutItems,
} from '@/lib/bundle';
import { IntentBar } from '@/components/IntentBar';
import { Homepage } from '@/components/homepage/Homepage';
import { TierBaskets } from '@/components/TierBaskets';
import { CategoryGrid } from '@/components/CategoryGrid';
import { CartSummary } from '@/components/CartSummary';
import { CrossSellStrip } from '@/components/CrossSellStrip';
import { CheckoutBar } from '@/components/CheckoutBar';
import { PaymentModal } from '@/components/PaymentModal';
import { OrderConfirmation } from '@/components/OrderConfirmation';
import { ModeToggle, Mode } from '@/components/ModeToggle';
import { BoltIcon } from '@/components/icons';
import { UserMenu } from '@/components/UserMenu';

type Screen = 'hub' | 'shopping' | 'confirmed';

/** Seeds cart lines from each row's default selected product (the pre-made basket). */
function defaultLinesFromRows(rows: CategoryRow[]): CartLine[] {
  const lines: CartLine[] = [];
  for (const row of rows) {
    const product =
      row.alternatives.find((p) => p.id === row.selectedItemId) ?? row.alternatives[0];
    if (product && product.availability === 'in-stock') lines.push({ product, quantity: 1 });
  }
  return lines;
}

export default function HomePage() {
  const [screen, setScreen] = useState<Screen>('hub');
  const [mode, setMode] = useState<Mode>('quick');
  const [intentText, setIntentText] = useState('');

  const [submittedIntent, setSubmittedIntent] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [tiers, setTiers] = useState<Record<TierName, BasketTier> | null>(null);
  const [flashTier, setFlashTier] = useState<TierName>('Balanced');
  const [crossSell, setCrossSell] = useState<Product[]>([]);
  const [unfulfilled, setUnfulfilled] = useState<string[]>([]);

  const [cart, setCart] = useState<CartLine[]>([]);

  const [loadingMsg, setLoadingMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPayment, setShowPayment] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);

  // ---- Load shopping data for an intent via the single smart-shop call ----
  const loadShop = useCallback(
    async (intent: string, forMode: Mode) => {
      const r = await api.shop({ intent });
      setCategories(r.categories);
      setRows(r.rows);
      setTiers(r.tiers);
      setCrossSell(r.crossSell);
      setUnfulfilled(r.unfulfilledComponents);
      setFlashTier('Balanced');
      if (forMode === 'flash') setCart(linesFromProducts(r.tiers.Balanced?.items ?? []));
      else setCart(defaultLinesFromRows(r.rows));
    },
    [],
  );

  const submitIntent = useCallback(
    async (text: string) => {
      setError(null);
      setLoadingMsg(mode === 'flash' ? 'Finding the best picks…' : 'Finding the best picks…');
      try {
        setSubmittedIntent(text);
        setRows([]);
        setTiers(null);
        setCrossSell([]);
        await loadShop(text, mode);
        setScreen('shopping');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Something went wrong.');
      } finally {
        setLoadingMsg(null);
      }
    },
    [mode, loadShop],
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
        if (mode === 'flash') setCart(linesFromProducts(bundle.tiers.Balanced?.items ?? []));
        else setCart(defaultLinesFromRows(visionRows));
        setScreen('shopping');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Image could not be processed.');
      } finally {
        setLoadingMsg(null);
      }
    },
    [mode],
  );

  const handleSmartBundle = useCallback(
    async (id: string) => {
      setError(null);
      setLoadingMsg('Loading basket…');
      try {
        const { smartBundle } = await api.getSmartBundle(id);
        const b = smartBundleToBundle(smartBundle);
        let cross: Product[] = [];
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
        if (mode === 'flash') setCart(linesFromProducts(b.tiers.Balanced?.items ?? []));
        else setCart(defaultLinesFromRows(b.rows));
        setScreen('shopping');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Basket could not be loaded.');
      } finally {
        setLoadingMsg(null);
      }
    },
    [mode],
  );

  // ---- Mode switch on the shopping screen (no refetch — both views preloaded) ----
  const switchModeShopping = useCallback(
    async (next: Mode) => {
      if (next === mode) return;
      setError(null);

      // Quick rows + Flash tiers are loaded together by /api/shop, so toggling
      // is instant. Fall back to a fetch only if a view is somehow missing.
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
        setCart(linesFromProducts((tiers ?? {} as Record<TierName, BasketTier>)[flashTier]?.items ?? []));
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
    [mode, tiers, rows, categories, flashTier],
  );

  // ---- Cart handlers ----
  const handleQuickToggle = useCallback((product: Product) => {
    setCart((prev) =>
      selectedIdForCategory(prev, product.component) === product.id
        ? clearCategory(prev, product.component)
        : selectInCategory(prev, product),
    );
  }, []);

  const handleSelectTier = useCallback(
    (tier: TierName) => {
      if (!tiers) return;
      setFlashTier(tier);
      setCart(linesFromProducts(tiers[tier]?.items ?? []));
    },
    [tiers],
  );

  const handleAddCrossSell = useCallback((product: Product) => {
    setCart((prev) => addLine(prev, product));
  }, []);

  const handleInc = useCallback((id: string) => setCart((prev) => incLine(prev, id)), []);
  const handleDec = useCallback((id: string) => setCart((prev) => decLine(prev, id)), []);
  const handleRemove = useCallback((id: string) => setCart((prev) => removeLine(prev, id)), []);

  const total = useMemo(() => cartTotal(cart), [cart]);
  const count = useMemo(() => cartCount(cart), [cart]);
  const currency = cart[0]?.product.currency ?? 'INR';

  const confirmPayment = useCallback(
    async (method: PaymentMethod) => {
      if (cart.length === 0) return;
      setSubmitting(true);
      setError(null);
      try {
        const { order: o } = await api.checkout(toCheckoutItems(cart), method.label);
        setOrder(o);
        setShowPayment(false);
        setScreen('confirmed');
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Order was not placed.');
      } finally {
        setSubmitting(false);
      }
    },
    [cart],
  );

  const resetToHub = useCallback(() => {
    setScreen('hub');
    setRows([]);
    setTiers(null);
    setCategories([]);
    setCrossSell([]);
    setCart([]);
    setOrder(null);
    setIntentText('');
    setError(null);
    setShowPayment(false);
  }, []);

  const themeClass = mode === 'flash' ? 'theme-flash' : 'theme-quick';

  // ---- Render ----

  if (screen === 'confirmed' && order) {
    return (
      <div className={`${themeClass} min-h-screen`}>
        <main className="mx-auto max-w-2xl px-4">
          <OrderConfirmation order={order} onDone={resetToHub} />
        </main>
      </div>
    );
  }

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

      {screen === 'hub' && (
        <main className="mx-auto max-w-2xl px-4 pb-16">
          <section className="pt-8">
            <div className="mb-6 flex flex-col items-center gap-3">
              {mode === 'flash' && (
                <div className="flex items-center gap-2 text-red-600">
                  <BoltIcon className="flash-bolt h-7 w-7" />
                  <span className="text-lg font-extrabold uppercase tracking-wide">Flash Mode</span>
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
      )}

      {screen === 'shopping' && (
        <>
          <main className="mx-auto max-w-2xl space-y-5 px-4 pb-28 pt-6">
            <div className="flex items-center justify-between gap-3">
              <button onClick={resetToHub} className="text-sm text-gray-500 hover:text-gray-800">
                ← New intent
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
                <CategoryGrid rows={rows} cart={cart} onToggle={handleQuickToggle} />
              </div>
            )}

            <CrossSellStrip products={crossSell} onAdd={handleAddCrossSell} />

            <CartSummary
              lines={cart}
              total={total}
              currency={currency}
              onInc={handleInc}
              onDec={handleDec}
              onRemove={handleRemove}
            />
          </main>

          <div className="fixed inset-x-0 bottom-0 z-20">
            <CheckoutBar
              total={total}
              currency={currency}
              itemCount={count}
              onProceed={() => setShowPayment(true)}
            />
          </div>

          {showPayment && (
            <PaymentModal
              total={total}
              currency={currency}
              submitting={submitting}
              onCancel={() => setShowPayment(false)}
              onConfirm={confirmPayment}
            />
          )}
        </>
      )}
    </div>
  );
}
