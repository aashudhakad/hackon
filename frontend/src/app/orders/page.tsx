'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { OrderStatusBadge } from '@/components/OrderStatusBadge';
import { DeliveryTimer } from '@/components/DeliveryTimer';
import { Order } from '@/lib/types';

function OrdersPageContent() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await api.getOrders();
        setOrders(data.orders);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load orders');
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  // Check if order is within 5 minutes of creation
  const isRecentOrder = (order: Order) => {
    const orderTime = new Date(order.createdAt).getTime();
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;
    return (now - orderTime) < fiveMinutes;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <span className="text-sm text-gray-600">Loading orders...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto max-w-4xl px-3 sm:px-4 py-6 sm:py-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 sm:mb-8">My Orders</h1>

        {error && (
          <div className="mb-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">No orders yet</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6">When you place orders, they will appear here</p>
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center px-5 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white rounded-lg text-sm sm:text-base font-medium hover:bg-blue-700 transition"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition overflow-hidden"
              >
                {/* Order Header - Clickable */}
                <div
                  className="p-4 sm:p-6 cursor-pointer"
                  onClick={() => router.push(`/orders/${order.id}`)}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-3 sm:mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 mt-1">
                        {new Date(order.createdAt).toLocaleDateString()} at{' '}
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:text-right">
                      <p className="text-base sm:text-lg font-bold text-gray-900">
                        {order.currency || 'INR'} {order.total.toFixed(2)}
                      </p>
                      <div className="ml-3 sm:ml-0 sm:mt-1">
                        <OrderStatusBadge status={order.status as any} />
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs sm:text-sm text-gray-600">
                    {order.items?.length || 0} {(order.items?.length || 0) === 1 ? 'item' : 'items'}
                    {order.paymentMethod && <span className="hidden sm:inline"> • Payment: {order.paymentMethod}</span>}
                  </div>
                </div>

                {/* Delivery Timer - Only for recent orders */}
                {isRecentOrder(order) && (
                  <div className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <DeliveryTimer 
                      orderCreatedAt={order.createdAt} 
                      deliveryMinutes={5}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function OrdersPage() {
  return (
    <ProtectedRoute>
      <OrdersPageContent />
    </ProtectedRoute>
  );
}
