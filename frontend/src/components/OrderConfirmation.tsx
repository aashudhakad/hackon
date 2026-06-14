'use client';

import { useState } from 'react';
import { Order, Product } from '@/lib/types';
import { formatPrice } from '@/lib/format';
import { OrderStatusBadge } from './OrderStatusBadge';
import { DeliveryTimer } from './DeliveryTimer';
import { useRouter } from 'next/navigation';

interface OrderConfirmationProps {
  order: Order;
  onDone: () => void;
}

/** Order confirmation: shows ordered items, quantities, payment method, total. */
export function OrderConfirmation({ order, onDone }: OrderConfirmationProps) {
  const router = useRouter();
  const currency = order.items[0]?.currency ?? 'INR';
  const [isDelivered, setIsDelivered] = useState(order.status === 'delivered');

  return (
    <div className="mx-auto max-w-md py-16">
      <div className="text-center mb-6">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </div>
        <h2 className="text-2xl font-semibold">Order confirmed</h2>
        <p className="mt-1 text-sm text-gray-500">Order #{order.id.slice(0, 8)}</p>
      </div>

      {/* Delivery Timer */}
      <div className="mb-6">
        <DeliveryTimer 
          orderCreatedAt={order.createdAt} 
          deliveryMinutes={5}
          onDelivered={() => setIsDelivered(true)}
        />
      </div>
      
      {/* Order Details */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        {order.paymentMethod && (
          <p className="mb-4 text-sm text-gray-600 text-center">
            Paid with <span className="font-medium text-gray-900">{order.paymentMethod}</span>
          </p>
        )}

        <ul className="space-y-3 text-left">
          {order.items.map((p, i) => {
            const qty = (p as Product & { quantity?: number }).quantity ?? 1;
            return (
              <li key={`${p.id}-${i}`} className="flex justify-between items-center text-sm border-b border-gray-100 pb-3 last:border-0">
                <div className="flex items-center gap-3">
                  {p.image && (
                    <img src={p.image} alt={p.name} className="w-12 h-12 object-cover rounded-lg" />
                  )}
                  <div>
                    <span className="text-gray-900 font-medium block">{p.name}</span>
                    {qty > 1 && <span className="text-gray-500 text-xs">Quantity: {qty}</span>}
                  </div>
                </div>
                <span className="font-semibold text-gray-900">{formatPrice(p.price * qty, p.currency)}</span>
              </li>
            );
          })}
        </ul>

        <div className="mt-4 flex justify-between border-t-2 border-gray-200 pt-4 font-bold text-lg">
          <span>Total</span>
          <span>{formatPrice(order.total, currency)}</span>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <button
          type="button"
          onClick={() => router.push('/orders')}
          className="rounded-xl bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
        >
          View All Orders
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-xl bg-gray-900 px-6 py-3 font-medium text-white hover:bg-gray-800 transition shadow-lg hover:shadow-xl"
        >
          Start a New Search
        </button>
      </div>
    </div>
  );
}
