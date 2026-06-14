'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="flex items-center gap-3">
      {/* Cart Button */}
      <button
        onClick={() => router.push('/cart')}
        className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
        title="View Cart"
      >
        <svg
          className="w-6 h-6 text-gray-700"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
            {count}
          </span>
        )}
      </button>

      {!isAuthenticated || !user ? (
        <div className="flex gap-2">
          <button
            onClick={() => router.push('/login')}
            className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
          >
            Sign Up
          </button>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
              {user.email[0].toUpperCase()}
            </div>
            <span className="text-sm text-gray-700">{user.email}</span>
          </button>

          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-20">
                <div className="py-1">
                  <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                    Signed in as
                    <div className="font-medium text-gray-900 truncate">{user.email}</div>
                  </div>
                  <button
                    onClick={() => {
                      router.push('/orders');
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    My Orders
                  </button>
                  <button
                    onClick={() => {
                      logout();
                      setIsOpen(false);
                      router.push('/login');
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
