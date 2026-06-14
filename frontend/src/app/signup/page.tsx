'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { SignupForm } from '@/components/SignupForm';
import { useAuth } from '@/lib/auth';

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect to home page after successful signup
      router.push('/');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md">
        {redirect === 'checkout' && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 text-center">
            Create an account to continue with your order
          </div>
        )}
        <SignupForm
          onSuccess={() => router.push('/')}
          onSwitchToLogin={() => router.push('/login?redirect=' + (redirect || ''))}
        />
      </div>
    </div>
  );
}
