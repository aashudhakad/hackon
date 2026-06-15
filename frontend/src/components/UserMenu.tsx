'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { Avatar } from './ui/Avatar';
import { LogOut, Package, User, ShoppingCart, LogIn, UserPlus, ChevronDown } from 'lucide-react';

export function UserMenu() {
  const { user, isAuthenticated, logout } = useAuth();
  const { count, clearUserCart } = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const menuRef = useRef<HTMLDivElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const displayName = useMemo(
    () => user?.displayName || user?.username || user?.email?.split('@')[0] || 'User',
    [user]
  );

  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('mousedown', onDocumentClick);
    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.removeEventListener('mousedown', onDocumentClick);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const handleLogout = () => {
    clearUserCart();
    logout();
    setIsOpen(false);
    router.push('/');
  };

  const goTo = (path: string) => {
    setIsOpen(false);
    router.push(path);
  };

  return (
    <div ref={menuRef} className="relative shrink-0">
      {!isAuthenticated || !user ? (
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push('/login')}
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 sm:inline-flex"
          >
            Login
          </button>
          <button
            onClick={() => router.push('/signup')}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 sm:px-4"
          >
            <UserPlus className="h-4 w-4" />
            <span className="hidden sm:inline">Sign Up</span>
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => goTo('/cart')}
            className="relative inline-flex items-center justify-center rounded-lg p-2 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
            title="View Cart"
            aria-label={`Cart (${count} items)`}
          >
            <ShoppingCart className="h-6 w-6" />
            {count > 0 && (
              <span className="absolute right-0 top-0 flex h-5 min-w-5 translate-x-1/3 -translate-y-1/3 items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
                {count > 9 ? '9+' : count}
              </span>
            )}
          </button>

          <button
  ref={buttonRef}
  onClick={() => setIsOpen((v) => !v)}
  className="flex max-w-[320px] items-center gap-2 rounded-lg px-2 py-2 transition-colors hover:bg-gray-100 sm:px-3"
>
            <Avatar src={user.profilePicture} name={displayName} size={36} />
            <span className="hidden max-w-[240px] truncate text-sm font-medium text-gray-700 lg:block">
  {displayName}
</span>
            <ChevronDown className={`hidden h-4 w-4 text-gray-500 transition-transform sm:block ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}

      {isAuthenticated && user && isOpen && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 max-w-[calc(100vw-1rem)] overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <Avatar src={user.profilePicture} name={displayName} size={40} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-gray-900">{displayName}</p>
                <p className="truncate text-xs text-gray-600">{user.email}</p>
              </div>
            </div>
          </div>

          <div className="py-1">
            <button
              onClick={() => goTo('/profile')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <User className="h-5 w-5 text-gray-500" />
              My Profile
            </button>

            <button
              onClick={() => goTo('/orders')}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <Package className="h-5 w-5 text-gray-500" />
              My Orders
            </button>

            <div className="my-1 border-t border-gray-100" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}