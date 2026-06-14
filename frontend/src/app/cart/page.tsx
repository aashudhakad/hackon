'use client';

import { useRouter } from 'next/navigation';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';
import { CartSummary } from '@/components/CartSummary';
import { UserMenu } from '@/components/UserMenu';

export default function CartPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const {
    cart,
    total,
    count,
    currency,
    incrementItem,
    decrementItem,
    removeItem,
    resetCart,
  } = useCart();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      // Save context and redirect to login
      router.push('/login?redirect=checkout');
      return;
    }
    router.push('/checkout');
  };

  const handleContinueShopping = () => {
    if (cart.length > 0) {
      router.push('/shop');
    } else {
      router.push('/');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="mx-auto max-w-4xl px-3 sm:px-4 py-3 sm:py-4 flex items-center justify-between gap-2">
          <button
            onClick={() => router.push('/')}
            className="text-base sm:text-xl font-bold text-gray-900 hover:text-gray-700 transition truncate"
          >
            Amazon Instant Engine
          </button>
          <UserMenu />
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8">
        <div className="mb-4 sm:mb-6">
          <button
            onClick={handleContinueShopping}
            className="text-xs sm:text-sm text-gray-500 hover:text-gray-800 flex items-center gap-1"
          >
            ← Continue Shopping
          </button>
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">Shopping Cart</h1>

        {cart.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
            <div className="mb-4">
              <svg
                className="mx-auto h-16 w-16 sm:h-24 sm:w-24 text-gray-300"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">Add items to your cart to get started</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                <CartSummary
                  lines={cart}
                  total={total}
                  currency={currency}
                  onInc={incrementItem}
                  onDec={decrementItem}
                  onRemove={removeItem}
                />
              </div>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 sticky top-20 sm:top-24">
                <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>
                
                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Subtotal ({count} items)</span>
                    <span className="font-medium text-gray-900">{currency} {total.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-green-600">FREE</span>
                  </div>
                  <div className="border-t border-gray-200 pt-3 flex justify-between">
                    <span className="text-sm sm:text-base font-semibold text-gray-900">Total</span>
                    <span className="text-base sm:text-lg font-bold text-gray-900">{currency} {total.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white rounded-lg py-2.5 sm:py-3 text-sm sm:text-base font-medium hover:bg-blue-700 transition mb-3"
                >
                  Proceed to Checkout
                </button>

                <button
                  onClick={handleContinueShopping}
                  className="w-full bg-gray-100 text-gray-700 rounded-lg py-2.5 sm:py-3 text-sm sm:text-base font-medium hover:bg-gray-200 transition"
                >
                  Continue Shopping
                </button>

                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm('Are you sure you want to clear your cart?')) {
                        resetCart();
                      }
                    }}
                    className="w-full mt-3 text-xs sm:text-sm text-red-600 hover:text-red-700 transition"
                  >
                    Clear Cart
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
