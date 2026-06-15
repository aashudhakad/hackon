'use client';

import Link from 'next/link';
import { Zap } from 'lucide-react';
import { useCart } from '@/lib/cart';

/**
 * Global footer. Mobile-first: stacks into a single column, expands to a
 * multi-column layout on larger screens. Includes the About Us route so it is
 * always reachable.
 */
export function Footer() {
  const { mode } = useCart();
  const isFlash = mode === 'flash';
  const year = new Date().getFullYear();

  const columns: { title: string; links: { href: string; label: string }[] }[] = [
    {
      title: 'Shop',
      links: [
        { href: '/', label: 'Home' },
        { href: '/cart', label: 'Cart' },
        { href: '/orders', label: 'Orders' },
      ],
    },
    {
      title: 'Company',
      links: [
        { href: '/about', label: 'About Us' },
        { href: '/about', label: 'Our Team' },
      ],
    },
    {
      title: 'Modes',
      links: [
        { href: '/', label: 'Quick Mode' },
        { href: '/', label: 'Flash Mode' },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {/* Brand block */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2" aria-label="ClickOn home">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm"
                style={{ backgroundColor: isFlash ? '#dc2626' : 'var(--accent)' }}
              >
                <Zap className="h-5 w-5" fill="currentColor" />
              </span>
              <span className="text-lg font-extrabold tracking-tight text-gray-900">
                Click<span style={{ color: isFlash ? '#dc2626' : 'var(--accent)' }}>On</span>
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-gray-500">
              Intent-first quick commerce. Tell us what you are trying to do — get a ready
              basket in seconds.
            </p>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {col.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link, i) => (
                  <li key={`${link.href}-${i}`}>
                    <Link
                      href={link.href}
                      className="text-sm text-gray-600 transition-colors hover:text-gray-900"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs text-gray-400">© {year} ClickOn. Built for HackOn with Amazon.</p>
          <p className="text-xs text-gray-400">Express the outcome. Skip the search.</p>
        </div>
      </div>
    </footer>
  );
}
