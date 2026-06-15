'use client';

import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useCart } from '@/lib/cart';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomNav } from './BottomNav';

/**
 * Global layout shell. Reads the active shopping `mode` and applies the
 * matching theme class (`theme-quick` / `theme-flash`) + background to the whole
 * app, then frames every page with the responsive Navbar, Footer, and a
 * mobile BottomNav.
 *
 * Auth pages (login/signup/oauth callback/logout) are rendered bare so they can
 * present their own full-screen layouts. Routes that own a sticky bottom CTA
 * (shop, cart, checkout) suppress the mobile BottomNav to avoid overlap.
 */
const BARE_ROUTES = ['/login', '/signup', '/logout', '/auth/callback'];
const NO_BOTTOM_NAV = ['/shop', '/cart', '/checkout'];

export function AppShell({ children }: { children: ReactNode }) {
  const { mode } = useCart();
  const pathname = usePathname();

  const themeClass = mode === 'flash' ? 'theme-flash' : 'theme-quick';
  const isBare = BARE_ROUTES.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  if (isBare) {
    return <div className={`${themeClass} min-h-screen`}>{children}</div>;
  }

  const showBottomNav = !NO_BOTTOM_NAV.some((r) => pathname === r || pathname.startsWith(`${r}/`));

  return (
    <div className={`${themeClass} flex min-h-screen flex-col`}>
      <Navbar />
      <main className={`flex-1 ${showBottomNav ? 'pb-16 md:pb-0' : ''}`}>{children}</main>
      <Footer />
      {showBottomNav && <BottomNav />}
    </div>
  );
}
