'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api, ApiError } from '@/lib/api';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { OrderConfirmation } from '@/components/OrderConfirmation';
import { Order } from '@/lib/types';

function OrderDetailsPageContent() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadOrder() {
      try {
        const data = await api.getOrder(orderId);
        setOrder(data.order);
      } catch (err) {
        setError(err instanceof ApiError ? err.message : 'Failed to load order');
        // Redirect to orders page after a delay if order not found
        setTimeout(() => router.push('/orders'), 2000);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-200 border-t-blue-600" />
          <span className="text-sm text-gray-600">Loading order...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error || 'Order not found'}</p>
          <button
            onClick={() => router.push('/orders')}
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Back Button */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="mx-auto max-w-2xl px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => router.push('/orders')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Back to Orders</span>
          </button>
        </div>
      </header>

      <OrderConfirmation order={order} onDone={() => router.push('/')} />
    </div>
  );
}

export default function OrderDetailsPage() {
  return (
    <ProtectedRoute>
      <OrderDetailsPageContent />
    </ProtectedRoute>
  );
}
