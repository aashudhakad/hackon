'use client';

import { Order, Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';

interface OrderConfirmationProps {
  order: Order;
  onDone: () => void;
}

/** Order confirmation: shows ordered items, quantities, payment method, total. */
export function OrderConfirmation({ order, onDone }: OrderConfirmationProps) {
  const currency = order.items[0]?.currency ?? 'INR';

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
          <path d="M20 6 9 17l-5-5" />
        </svg>
      </div>
      <h2 className="text-2xl font-semibold">Order confirmed</h2>
      <p className="mt-1 text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
      {order.paymentMethod && (
        <p className="mt-1 text-sm text-gray-500">
          Paid with <span className="font-medium text-gray-700">{order.paymentMethod}</span>
        </p>
      )}

      <ul className="mt-6 space-y-2 text-left">
        {order.items.map((p, i) => {
          const qty = (p as Product & { quantity?: number }).quantity ?? 1;
          return (
            <li key={`${p.id}-${i}`} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {p.name}
                {qty > 1 && <span className="ml-1 text-gray-400">× {qty}</span>}
              </span>
              <span className="font-medium">{formatPrice(p.price * qty, p.currency)}</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-3 flex justify-between border-t border-gray-100 pt-3 font-semibold">
        <span>Total charged</span>
        <span>{formatPrice(order.total, currency)}</span>
      </div>

      <button
        type="button"
        onClick={onDone}
        className="mt-8 rounded-xl bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800"
      >
        Start a new intent
      </button>
    </div>
  );
}
