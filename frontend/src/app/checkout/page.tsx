'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { PaymentModal } from '@/components/PaymentModal';
import { UserMenu } from '@/components/UserMenu';
import { toCheckoutItems } from '@/lib/bundle';
import { PaymentMethod } from '@/lib/types';

function CheckoutPageContent() {
  const router = useRouter();
  const { user } = useAuth();
  const { cart, total, count, currency, resetCart } = useCart();
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(true);

  const confirmPayment = useCallback(
    async (method: PaymentMethod) => {
      if (cart.length === 0) {
        setError('Your cart is empty');
        return;
      }
      
      setSubmitting(true);
      setError(null);
      
      try {
        const { order } = await api.checkout(toCheckoutItems(cart), method.label);
        resetCart();
        router.push(`/orders/${order.id}`);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Order was not placed.');
      } finally {
        setSubmitting(false);
      }
    },
    [cart, resetCart, router],
  );

  // Redirect if cart is empty
  if (cart.length === 0) {
    router.push('/cart');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="mx-auto max-w-4xl px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/')}
            className="text-xl font-bold text-gray-900 hover:text-gray-700 transition"
          >
            Amazon Instant Engine
          </button>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <button
            onClick={() => router.push('/cart')}
            className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
          >
            ← Back to Cart
          </button>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Order Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <p className="text-gray-900">{user?.email}</p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
              <div className="space-y-4">
                {cart.map((line) => (
                  <div key={line.product.id} className="flex gap-4">
                    {line.product.image && (
                      <img
                        src={line.product.image}
                        alt={line.product.name}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{line.product.name}</h3>
                      <p className="text-sm text-gray-600">Quantity: {line.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {line.product.currency} {(line.product.price * line.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal ({count} items)</span>
                  <span className="font-medium text-gray-900">{currency} {total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">FREE</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-medium text-gray-900">{currency} 0.00</span>
                </div>
                <div className="border-t border-gray-200 pt-3 flex justify-between">
                  <span className="text-base font-semibold text-gray-900">Total</span>
                  <span className="text-lg font-bold text-gray-900">{currency} {total.toFixed(2)}</span>
                </div>
              </div>

              <div className="text-xs text-gray-500 mb-4">
                By placing your order, you agree to our terms and conditions.
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Payment Modal */}
      {showPaymentModal && (
        <PaymentModal
          total={total}
          currency={currency}
          submitting={submitting}
          onCancel={() => router.push('/cart')}
          onConfirm={confirmPayment}
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <ProtectedRoute redirectTo="/login?redirect=checkout">
      <CheckoutPageContent />
    </ProtectedRoute>
  );
}
