'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginForm } from '@/components/LoginForm';
import { useAuth } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useAuth();
  const redirect = searchParams.get('redirect');

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      // Redirect to home page after successful login
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
            Please log in to continue with your order
          </div>
        )}
        <LoginForm
          onSuccess={() => router.push('/')}
          onSwitchToSignup={() => router.push('/signup?redirect=' + (redirect || ''))}
        />
      </div>
    </div>
  );
}
