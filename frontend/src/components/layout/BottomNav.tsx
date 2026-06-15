'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, ShoppingCart, Package, User } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { useAuth } from '@/lib/auth';

/**
 * Mobile-only bottom navigation bar (hidden at md and up). Large touch targets,
 * active-state tinting follows the live theme accent, and the cart tab shows a
 * live item-count badge.
 */
export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { count } = useCart();
  const { isAuthenticated } = useAuth();

  const items = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/cart', label: 'Cart', icon: ShoppingCart, badge: count },
    { href: '/orders', label: 'Orders', icon: Package },
    {
      href: isAuthenticated ? '/profile' : '/login',
      label: isAuthenticated ? 'Account' : 'Sign in',
      icon: User,
    },
  ];

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-md items-stretch justify-around">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href;
          return (
            <button
              key={label}
              type="button"
              onClick={() => router.push(href)}
              className="relative flex h-14 min-w-[64px] flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
              style={active ? { color: 'var(--accent)' } : { color: '#6b7280' }}
              aria-current={active ? 'page' : undefined}
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {typeof badge === 'number' && badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
