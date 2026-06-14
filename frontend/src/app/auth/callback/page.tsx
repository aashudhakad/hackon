'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    const errorParam = searchParams.get('error');

    if (errorParam) {
      setError('Authentication failed. Please try again.');
      setTimeout(() => router.push('/login'), 3000);
      return;
    }

    if (token) {
      // Store token and redirect
      localStorage.setItem('auth_token', token);
      
      // Decode token to get user info (basic JWT decode)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // You could fetch full user profile here if needed
        localStorage.setItem('user', JSON.stringify({
          id: payload.userId,
          email: payload.email,
        }));
        
        router.push('/');
      } catch (err) {
        setError('Invalid token received');
        setTimeout(() => router.push('/login'), 3000);
      }
    } else {
      setError('No token received');
      setTimeout(() => router.push('/login'), 3000);
    }
  }, [searchParams, router]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-600 mb-2">{error}</div>
          <div className="text-gray-600 text-sm">Redirecting to login...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <div className="text-gray-600">Completing authentication...</div>
      </div>
    </div>
  );
}
