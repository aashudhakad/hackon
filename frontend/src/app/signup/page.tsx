'use client';

import { Suspense, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignupForm } from '@/components/SignupForm';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';

function useCallbackUrl(): string {
  const searchParams = useSearchParams();
  const cb = searchParams.get('callbackUrl');
  if (cb) return cb;
  if (searchParams.get('redirect') === 'checkout') return '/checkout';
  return '/';
}

function SignupInner() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();
  const { mergeGuestCart } = useCart();
  const callbackUrl = useCallbackUrl();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace(callbackUrl);
    }
  }, [isAuthenticated, isLoading, router, callbackUrl]);

  const handleSuccess = useCallback(() => {
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
            Create an account to continue with your order — your cart is saved.
          </div>
        )}
        <SignupForm
          onSuccess={handleSuccess}
          onSwitchToLogin={() => router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`)}
          callbackUrl={callbackUrl}
        />
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-gray-600">Loading…</div>
        </div>
      }
    >
      <SignupInner />
    </Suspense>
  );
}
