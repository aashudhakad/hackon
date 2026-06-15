'use client';

import { createContext, useContext, useState, useEffect, useRef, ReactNode, useCallback } from 'react';
import { CartLine, Product, CategoryRow, BasketTier, TierName } from './types';
import { useAuth } from './auth';
import {
  addLine,
  cartCount,
  cartTotal,
  clearCategory,
  decLine,
  incLine,
  removeLine,
  selectInCategory,
  selectedIdForCategory,
} from './bundle';

export type Mode = 'quick' | 'flash';

/** Serializable shopping/cart snapshot persisted to localStorage. */
interface PersistedCart {
  cart: CartLine[];
  mode: Mode;
  submittedIntent: string;
  categories: string[];
  rows: CategoryRow[];
  tiers: Record<TierName, BasketTier> | null;
  flashTier: TierName;
  crossSell: Product[];
  unfulfilled: string[];
}

interface CartContextType {
  cart: CartLine[];
  mode: Mode;
  submittedIntent: string;
  categories: string[];
  rows: CategoryRow[];
  tiers: Record<TierName, BasketTier> | null;
  flashTier: TierName;
  crossSell: Product[];
  unfulfilled: string[];

  total: number;
  count: number;
  currency: string;

  setCart: (cart: CartLine[]) => void;
  addToCart: (product: Product) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  toggleQuickProduct: (product: Product) => void;

  setMode: (mode: Mode) => void;
  setSubmittedIntent: (intent: string) => void;
  setCategories: (categories: string[]) => void;
  setRows: (rows: CategoryRow[]) => void;
  setTiers: (tiers: Record<TierName, BasketTier> | null) => void;
  setFlashTier: (tier: TierName) => void;
  setCrossSell: (products: Product[]) => void;
  setUnfulfilled: (unfulfilled: string[]) => void;

  resetCart: () => void;
  saveCartState: () => void;
  restoreCartState: () => boolean;
  clearUserCart: () => void;
  /** Explicit guest→user merge. Usually unnecessary (handled automatically on auth change). Idempotent. */
  mergeGuestCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const GUEST_KEY = 'cartState_guest';

function keyFor(userId: string | null): string {
  return userId ? `cartState_${userId}` : GUEST_KEY;
}

function safeParse(raw: string | null): Partial<PersistedCart> | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Partial<PersistedCart>;
  } catch {
    return null;
  }
}

/** Merges two cart-line lists, summing quantities for the same product id. */
function mergeLines(a: CartLine[], b: CartLine[]): CartLine[] {
  const map = new Map<string, CartLine>();
  for (const line of [...a, ...b]) {
    const existing = map.get(line.product.id);
    if (existing) existing.quantity += line.quantity;
    else map.set(line.product.id, { ...line });
  }
  return [...map.values()];
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();

  const [cart, setCart] = useState<CartLine[]>([]);
  const [mode, setMode] = useState<Mode>('quick');
  const [submittedIntent, setSubmittedIntent] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [tiers, setTiers] = useState<Record<TierName, BasketTier> | null>(null);
  const [flashTier, setFlashTier] = useState<TierName>('Balanced');
  const [crossSell, setCrossSell] = useState<Product[]>([]);
  const [unfulfilled, setUnfulfilled] = useState<string[]>([]);

  // localStorage key the cart is currently bound to.
  const [storageKey, setStorageKey] = useState<string>(GUEST_KEY);
  // Persistence is gated until the first identity-driven hydration runs.
  const hydratedRef = useRef(false);
  // Tracks the last applied identity so we only re-bind/merge on real changes.
  const lastIdentityRef = useRef<string | null | undefined>(undefined);

  /** Applies a persisted snapshot (or resets when null) to live state. */
  const applyState = useCallback((s: Partial<PersistedCart> | null) => {
    setCart(s?.cart ?? []);
    setMode(s?.mode ?? 'quick');
    setSubmittedIntent(s?.submittedIntent ?? '');
    setCategories(s?.categories ?? []);
    setRows(s?.rows ?? []);
    setTiers(s?.tiers ?? null);
    setFlashTier(s?.flashTier ?? 'Balanced');
    setCrossSell(s?.crossSell ?? []);
    setUnfulfilled(s?.unfulfilled ?? []);
  }, []);

  /** Merges the guest cart into the user's stored cart, writes it, clears guest. */
  const performMerge = useCallback((userId: string): { key: string; merged: PersistedCart } => {
    const userKey = keyFor(userId);
    const guest = safeParse(localStorage.getItem(GUEST_KEY));
    const userState = safeParse(localStorage.getItem(userKey));

    const mergedLines = mergeLines(userState?.cart ?? [], guest?.cart ?? []);
    // Keep the guest's active shopping session if it has one, else the user's.
    const guestHasSession = !!(guest && (guest.submittedIntent || (guest.rows && guest.rows.length)));
    const session = (guestHasSession ? guest : userState ?? guest) ?? {};

    const merged: PersistedCart = {
      cart: mergedLines,
      mode: session.mode ?? 'quick',
      submittedIntent: session.submittedIntent ?? '',
      categories: session.categories ?? [],
      rows: session.rows ?? [],
      tiers: session.tiers ?? null,
      flashTier: session.flashTier ?? 'Balanced',
      crossSell: session.crossSell ?? [],
      unfulfilled: session.unfulfilled ?? [],
    };

    localStorage.setItem(userKey, JSON.stringify(merged));
    localStorage.removeItem(GUEST_KEY);
    return { key: userKey, merged };
  }, []);

  /**
   * Single source of truth for cart ownership: react to auth identity changes.
   * - Guest → user (login/signup/OAuth): merge the guest cart into the user's
   *   cart so nothing is lost, then bind to the user's key.
   * - User → guest (logout): bind back to the guest key.
   * - On first load: hydrate the correct cart once auth has resolved.
   */
  useEffect(() => {
    if (authLoading) return; // wait until we know who the user is
    const uid = user?.id ?? null;
    if (hydratedRef.current && lastIdentityRef.current === uid) return;

    if (uid) {
      const { key, merged } = performMerge(uid);
      setStorageKey(key);
      applyState(merged);
    } else {
      setStorageKey(GUEST_KEY);
      applyState(safeParse(localStorage.getItem(GUEST_KEY)));
    }
    lastIdentityRef.current = uid;
    hydratedRef.current = true;
  }, [user?.id, authLoading, performMerge, applyState]);

  // Persist on any change — only after hydration and to the active key.
  useEffect(() => {
    if (typeof window === 'undefined' || !hydratedRef.current) return;
    const snapshot: PersistedCart = {
      cart,
      mode,
      submittedIntent,
      categories,
      rows,
      tiers,
      flashTier,
      crossSell,
      unfulfilled,
    };
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  }, [cart, mode, submittedIntent, categories, rows, tiers, flashTier, crossSell, unfulfilled, storageKey]);

  const total = cartTotal(cart);
  const count = cartCount(cart);
  const currency = cart[0]?.product.currency ?? 'INR';

  const addToCart = useCallback((product: Product) => setCart((prev) => addLine(prev, product)), []);
  const incrementItem = useCallback((productId: string) => setCart((prev) => incLine(prev, productId)), []);
  const decrementItem = useCallback((productId: string) => setCart((prev) => decLine(prev, productId)), []);
  const removeItem = useCallback((productId: string) => setCart((prev) => removeLine(prev, productId)), []);
  const clearCart = useCallback(() => setCart([]), []);

  const toggleQuickProduct = useCallback((product: Product) => {
    setCart((prev) =>
      selectedIdForCategory(prev, product.component) === product.id
        ? clearCategory(prev, product.component)
        : selectInCategory(prev, product),
    );
  }, []);

  const resetCart = useCallback(() => applyState(null), [applyState]);

  // Logout helper: clears live state. The auth-change effect re-binds to guest.
  // The user's saved cart is intentionally kept so it returns on next login.
  const clearUserCart = useCallback(() => applyState(null), [applyState]);

  // Explicit merge (kept for the public API). Idempotent: guest key is removed
  // after merging, so repeat calls are no-ops.
  const mergeGuestCart = useCallback(() => {
    if (typeof window === 'undefined') return;
    const uid = (() => {
      try {
        return JSON.parse(localStorage.getItem('user') || 'null')?.id ?? null;
      } catch {
        return null;
      }
    })();
    if (!uid) return;
    const { key, merged } = performMerge(uid);
    hydratedRef.current = true;
    lastIdentityRef.current = uid;
    setStorageKey(key);
    applyState(merged);
  }, [performMerge, applyState]);

  const saveCartState = useCallback(() => {
    if (typeof window === 'undefined') return;
    const snapshot: PersistedCart = {
      cart, mode, submittedIntent, categories, rows, tiers, flashTier, crossSell, unfulfilled,
    };
    localStorage.setItem(storageKey, JSON.stringify(snapshot));
  }, [cart, mode, submittedIntent, categories, rows, tiers, flashTier, crossSell, unfulfilled, storageKey]);

  const restoreCartState = useCallback(() => {
    const saved = safeParse(localStorage.getItem(storageKey));
    if (saved) {
      applyState(saved);
      return true;
    }
    return false;
  }, [storageKey, applyState]);

  return (
    <CartContext.Provider
      value={{
        cart,
        mode,
        submittedIntent,
        categories,
        rows,
        tiers,
        flashTier,
        crossSell,
        unfulfilled,
        total,
        count,
        currency,
        setCart,
        addToCart,
        incrementItem,
        decrementItem,
        removeItem,
        clearCart,
        toggleQuickProduct,
        setMode,
        setSubmittedIntent,
        setCategories,
        setRows,
        setTiers,
        setFlashTier,
        setCrossSell,
        setUnfulfilled,
        resetCart,
        saveCartState,
        restoreCartState,
        clearUserCart,
        mergeGuestCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
