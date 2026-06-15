'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';

function AuthCallbackInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loginWithToken } = useAuth();
  const { mergeGuestCart } = useCart();
  const [error, setError] = useState('');
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    const fail = (msg: string) => {
      setError(msg);
      setTimeout(() => router.push('/login'), 2500);
    };

    if (errorParam) {
      fail('Authentication failed. Please try again.');
      return;
    }
    if (!token) {
      fail('No authentication token received.');
      return;
    }

    (async () => {
      try {
        // Establish the session + load the full profile (displayName, avatar).
        await loginWithToken(token);
        // Carry the guest cart into the authenticated account.
        mergeGuestCart();
        // Return the user to where they intended to go (set before OAuth start).
        const dest = localStorage.getItem('postLoginRedirect') || '/';
        localStorage.removeItem('postLoginRedirect');
        router.replace(dest);
      } catch {
        fail('Could not complete sign-in. Please try again.');
      }
    })();
  }, [searchParams, router, loginWithToken, mergeGuestCart]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mb-2 text-red-600">{error}</div>
          <div className="text-sm text-gray-600">Redirecting to login…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-accent" />
        <div className="text-gray-600">Completing sign-in…</div>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="text-gray-600">Loading…</div>
        </div>
      }
    >
      <AuthCallbackInner />
    </Suspense>
  );
}
