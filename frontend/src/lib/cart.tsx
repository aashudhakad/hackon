'use client';

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { CartLine, Product, CategoryRow, BasketTier, TierName } from './types';
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
} from './bundle';

export type Mode = 'quick' | 'flash';

interface CartContextType {
  // Cart state
  cart: CartLine[];
  mode: Mode;
  submittedIntent: string;
  categories: string[];
  rows: CategoryRow[];
  tiers: Record<TierName, BasketTier> | null;
  flashTier: TierName;
  crossSell: Product[];
  unfulfilled: string[];
  
  // Cart metadata
  total: number;
  count: number;
  currency: string;
  
  // Cart actions
  setCart: (cart: CartLine[]) => void;
  addToCart: (product: Product) => void;
  incrementItem: (productId: string) => void;
  decrementItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  toggleQuickProduct: (product: Product) => void;
  
  // Shopping state actions
  setMode: (mode: Mode) => void;
  setSubmittedIntent: (intent: string) => void;
  setCategories: (categories: string[]) => void;
  setRows: (rows: CategoryRow[]) => void;
  setTiers: (tiers: Record<TierName, BasketTier> | null) => void;
  setFlashTier: (tier: TierName) => void;
  setCrossSell: (products: Product[]) => void;
  setUnfulfilled: (unfulfilled: string[]) => void;
  
  // Utility
  resetCart: () => void;
  saveCartState: () => void;
  restoreCartState: () => boolean;
  clearUserCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Get cart storage key for current user
function getCartKey(): string {
  if (typeof window === 'undefined') return 'cartState';
  
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      return `cartState_${user.id}`;
    } catch {
      return 'cartState';
    }
  }
  return 'cartState_guest';
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [mode, setMode] = useState<Mode>('quick');
  const [submittedIntent, setSubmittedIntent] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [rows, setRows] = useState<CategoryRow[]>([]);
  const [tiers, setTiers] = useState<Record<TierName, BasketTier> | null>(null);
  const [flashTier, setFlashTier] = useState<TierName>('Balanced');
  const [crossSell, setCrossSell] = useState<Product[]>([]);
  const [unfulfilled, setUnfulfilled] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Track current user and clear cart when user changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const userStr = localStorage.getItem('user');
    const userId = userStr ? JSON.parse(userStr)?.id : null;
    
    if (userId !== currentUserId) {
      setCurrentUserId(userId);
      
      // Load cart for this user
      const cartKey = getCartKey();
      const saved = localStorage.getItem(cartKey);
      
      if (saved) {
        try {
          const cartState = JSON.parse(saved);
          setCart(cartState.cart || []);
          setMode(cartState.mode || 'quick');
          setSubmittedIntent(cartState.submittedIntent || '');
          setCategories(cartState.categories || []);
          setRows(cartState.rows || []);
          setTiers(cartState.tiers || null);
          setFlashTier(cartState.flashTier || 'Balanced');
          setCrossSell(cartState.crossSell || []);
          setUnfulfilled(cartState.unfulfilled || []);
        } catch (error) {
          console.error('Failed to restore cart state:', error);
        }
      } else {
        // Clear cart if no saved state for this user
        setCart([]);
        setMode('quick');
        setSubmittedIntent('');
        setCategories([]);
        setRows([]);
        setTiers(null);
        setFlashTier('Balanced');
        setCrossSell([]);
        setUnfulfilled([]);
      }
    }
  }, [currentUserId]);

  // Calculate cart metadata
  const total = cartTotal(cart);
  const count = cartCount(cart);
  const currency = cart[0]?.product.currency ?? 'INR';

  // Cart actions
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => addLine(prev, product));
  }, []);

  const incrementItem = useCallback((productId: string) => {
    setCart((prev) => incLine(prev, productId));
  }, []);

  const decrementItem = useCallback((productId: string) => {
    setCart((prev) => decLine(prev, productId));
  }, []);

  const removeItem = useCallback((productId: string) => {
    setCart((prev) => removeLine(prev, productId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const toggleQuickProduct = useCallback((product: Product) => {
    setCart((prev) =>
      selectedIdForCategory(prev, product.component) === product.id
        ? clearCategory(prev, product.component)
        : selectInCategory(prev, product),
    );
  }, []);

  const resetCart = useCallback(() => {
    setCart([]);
    setMode('quick');
    setSubmittedIntent('');
    setCategories([]);
    setRows([]);
    setTiers(null);
    setFlashTier('Balanced');
    setCrossSell([]);
    setUnfulfilled([]);
  }, []);

  // Clear cart for current user (used on logout)
  const clearUserCart = useCallback(() => {
    const cartKey = getCartKey();
    localStorage.removeItem(cartKey);
    resetCart();
  }, [resetCart]);

  // Save cart state to localStorage
  const saveCartState = useCallback(() => {
    const cartKey = getCartKey();
    const cartState = {
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
    localStorage.setItem(cartKey, JSON.stringify(cartState));
  }, [cart, mode, submittedIntent, categories, rows, tiers, flashTier, crossSell, unfulfilled]);

  // Restore cart state from localStorage
  const restoreCartState = useCallback(() => {
    try {
      const cartKey = getCartKey();
      const saved = localStorage.getItem(cartKey);
      if (saved) {
        const cartState = JSON.parse(saved);
        setCart(cartState.cart || []);
        setMode(cartState.mode || 'quick');
        setSubmittedIntent(cartState.submittedIntent || '');
        setCategories(cartState.categories || []);
        setRows(cartState.rows || []);
        setTiers(cartState.tiers || null);
        setFlashTier(cartState.flashTier || 'Balanced');
        setCrossSell(cartState.crossSell || []);
        setUnfulfilled(cartState.unfulfilled || []);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to restore cart state:', error);
      return false;
    }
  }, []);

  // Auto-save cart state to localStorage when it changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (cart.length > 0 || submittedIntent || categories.length > 0) {
      const cartKey = getCartKey();
      const cartState = {
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
      localStorage.setItem(cartKey, JSON.stringify(cartState));
    }
  }, [cart, mode, submittedIntent, categories, rows, tiers, flashTier, crossSell, unfulfilled]);

  return (
    <CartContext.Provider
      value={{
        // State
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
        
        // Actions
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
