'use client';

import { formatPrice } from '@/lib/format';

interface CheckoutBarProps {
  total: number;
  currency: string;
  itemCount: number;
  onProceed: () => void;
}

/**
 * Sticky bottom checkout bar. Shows the cart total and a "Proceed to checkout"
 * action that opens the payment method selection (it does NOT place the order
 * directly). Disabled with an empty-cart message when the cart is empty.
 */
export function CheckoutBar({ total, currency, itemCount, onProceed }: CheckoutBarProps) {
  const empty = itemCount === 0;

  return (
    <div className="border-t border-gray-200 bg-white px-4 py-3 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        <div>
          <p className="text-xs text-gray-500">{empty ? 'Cart is empty' : `${itemCount} item(s)`}</p>
          <p className="text-lg font-bold text-gray-900">{formatPrice(total, currency)}</p>
        </div>
        <button
          type="button"
          disabled={empty}
          onClick={onProceed}
          className="rounded-xl bg-[var(--accent)] px-6 py-3 font-semibold text-[var(--accent-fg)] transition enabled:hover:bg-[var(--accent-strong)] disabled:cursor-not-allowed disabled:opacity-40"
        >
          Proceed to checkout
        </button>
      </div>
    </div>
  );
}
