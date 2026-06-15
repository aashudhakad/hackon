'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';

/** Reads the post-login destination from the query (callbackUrl, with legacy fallback). */
function useCallbackUrl(): string {
  const searchParams = useSearchParams();
  const cb = searchParams.get('callbackUrl');
  if (cb) return cb;
  // Legacy: ?redirect=checkout
  if (searchParams.get('redirect') === 'checkout') return '/checkout';
  return '/';
}

function LoginInner() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { mergeGuestCart } = useCart();
  const callbackUrl = useCallbackUrl();

  // Already signed in → go straight to the destination.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(callbackUrl);
    }
  }, [isAuthenticated, isLoading, router, callbackUrl]);

  const handleSuccess = useCallback(() => {
    // Merge the guest cart into the now-authenticated user's cart, then return
    // the user to exactly where they were headed.
    mergeGuestCart();
    router.replace(callbackUrl);
  }, [mergeGuestCart, router, callbackUrl]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-gray-600">Loading…</div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md">
        {callbackUrl === '/checkout' && (
          <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-center text-sm text-blue-700">
            Please log in to continue with your order — your cart is saved.
          </div>
        )}
        <LoginForm
          onSuccess={handleSuccess}
          onSwitchToSignup={() => router.push(`/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
          callbackUrl={callbackUrl}
        />
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-600">Loading…</div>
        </div>
      }
    >
      <LoginInner />
    </Suspense>
  );
}
