'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Zap, Info, Package } from 'lucide-react';
import { useCart } from '@/lib/cart';
import { ModeToggle } from '@/components/ModeToggle';
import { UserMenu } from '@/components/UserMenu';

/**
 * Global, responsive top navigation.
 *
 * - Brand mark is mode-aware (Flash = red, Quick = accent).
 * - Desktop shows primary links + the Quick/Flash mode toggle (the toggle is
 *   hidden on `/` and `/shop`, which render their own mode controls with
 *   page-specific side effects).
 * - The user/cart cluster reuses the existing UserMenu.
 */
export function Navbar() {
  const pathname = usePathname();
  const { mode, setMode } = useCart();

  const ownsModeToggle = pathname === '/' || pathname === '/shop';
  const isFlash = mode === 'flash';

  const navLinks = [
    { href: '/', label: 'Home', icon: Zap },
    { href: '/orders', label: 'Orders', icon: Package },
    { href: '/about', label: 'About', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/85 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="ClickOn home">
          <span
            className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition-colors"
            style={{ backgroundColor: isFlash ? '#dc2626' : 'var(--accent)' }}
          >
            <Zap className={`h-5 w-5 ${isFlash ? 'flash-bolt' : ''}`} fill="currentColor" />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-gray-900">
            Click<span style={{ color: isFlash ? '#dc2626' : 'var(--accent)' }}>On</span>
          </span>
        </Link>

        {/* Desktop nav links */}
        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map(({ href, label }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  active ? 'text-gray-900' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-2 sm:gap-3">
          {!ownsModeToggle && (
            <div className="hidden sm:block">
              <ModeToggle mode={mode} onChange={setMode} />
            </div>
          )}
          <UserMenu />
        </div>
      </nav>
    </header>
  );
}
