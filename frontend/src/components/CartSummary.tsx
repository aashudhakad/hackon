'use client';

import { CartLine } from '@/lib/types';
import { formatPrice } from '@/lib/format';

interface CartSummaryProps {
  lines: CartLine[];
  total: number;
  currency: string;
  onInc: (productId: string) => void;
  onDec: (productId: string) => void;
  onRemove: (productId: string) => void;
}

/**
 * Cart_Summary with quantity controls. Lists each line item, lets the user
 * increase/decrease quantity or remove it, and shows the running total.
 */
export function CartSummary({ lines, total, currency, onInc, onDec, onRemove }: CartSummaryProps) {
  return (
    <div id="cart" className="rounded-2xl border border-gray-200 bg-white p-4">
      <h3 className="mb-3 font-semibold text-gray-800">
        Your Cart {lines.length > 0 && <span className="text-gray-400">({lines.length})</span>}
      </h3>

      {lines.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-500">
          Your cart is empty. Add items from the baskets or categories above.
        </p>
      ) : (
        <ul className="space-y-3">
          {lines.map(({ product, quantity }) => (
            <li key={product.id} className="flex items-center gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gray-50">
                {product.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.image} alt={product.name} className="h-full w-full object-contain" />
                ) : (
                  <span className="text-[10px] text-gray-400">{product.brand}</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-800">{product.name}</p>
                <p className="text-xs text-gray-500">{formatPrice(product.price, product.currency)} each</p>
              </div>

              <div className="flex items-center gap-1 rounded-lg border border-gray-200">
                <button
                  type="button"
                  onClick={() => onDec(product.id)}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                  aria-label="Decrease quantity"
                >
                  −
                </button>
                <span className="w-6 text-center text-sm tabular-nums">{quantity}</span>
                <button
                  type="button"
                  onClick={() => onInc(product.id)}
                  className="px-2 py-1 text-gray-600 hover:bg-gray-100"
                  aria-label="Increase quantity"
                >
                  +
                </button>
              </div>

              <span className="w-20 shrink-0 text-right text-sm font-semibold text-gray-900">
                {formatPrice(product.price * quantity, product.currency)}
              </span>

              <button
                type="button"
                onClick={() => onRemove(product.id)}
                className="shrink-0 text-gray-400 hover:text-red-500"
                aria-label="Remove item"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
        <span className="font-semibold text-gray-800">Total</span>
        <span className="text-lg font-bold text-gray-900">{formatPrice(total, currency)}</span>
      </div>
    </div>
  );
}
