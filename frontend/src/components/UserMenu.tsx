'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count, clearUserCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  // Priority: displayName (Google) > username (local signup) > email prefix
  const displayName = user?.displayName || user?.username || user?.email?.split('@')[0] || 'User';
  const avatarLetter = (user?.displayName?.[0] || user?.username?.[0] || user?.email?.[0] || 'U').toUpperCase();

  const handleLogout = () => {
    clearUserCart(); // Clear cart on logout
    logout();
    setIsOpen(false);
    router.push('/');
  };

  return (
    <>
      {!isAuthenticated || !user ? (
        <div className="flex items-center gap-2">
          {/* No cart button when not logged in */}

          <div className="flex gap-2">
            <button
              onClick={() => router.push('/login')}
              className="px-3 py-2 text-sm text-gray-700 hover:text-gray-900 font-medium hidden sm:block"
            >
              Login
            </button>
            <button
              onClick={() => router.push('/signup')}
              className="px-3 sm:px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
            >
              Sign Up
            </button>
          </div>
        </div>
      ) : (
        /* Logged in - Different layout for mobile vs desktop */
        <>
          {/* Mobile Layout: Stack cart below avatar */}
          <div className="flex md:hidden flex-col items-center gap-2">
            {/* Avatar on top */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="User menu"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {avatarLetter}
                </div>
              </button>
            </div>

            {/* Cart below avatar */}
            <button
              onClick={() => router.push('/cart')}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              title="View Cart"
              aria-label={`Cart (${count} items)`}
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
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>
          </div>

          {/* Desktop Layout: Side by side */}
          <div className="hidden md:flex items-center gap-3">
            {/* Cart Button */}
            <button
              onClick={() => router.push('/cart')}
              className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
              title="View Cart"
              aria-label={`Cart (${count} items)`}
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
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </button>

            {/* User Avatar + Username */}
            <div className="relative">
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
                aria-label="User menu"
              >
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                  {avatarLetter}
                </div>
                <span className="text-sm font-medium text-gray-700">{displayName}</span>
                <svg className="w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Dropdown Menu (shared for both mobile and desktop) */}
          {isOpen && (
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setIsOpen(false)}
              />
              
              {/* Menu */}
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20 overflow-hidden">
                {/* User Info Header */}
                <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white font-bold shadow-md">
                      {avatarLetter}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                      <p className="text-xs text-gray-600 truncate">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      router.push('/orders');
                      setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                    </svg>
                    My Orders
                  </button>
                  
                  <div className="border-t border-gray-100 my-1"></div>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                  </button>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </>
  );
}
