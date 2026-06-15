import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';
import { AppShell } from '@/components/layout/AppShell';

export const metadata: Metadata = {
  title: 'ClickOn — Intent-first quick commerce',
  description: 'Tell us what you are trying to do. Get a ready-to-checkout basket in seconds.',
};

// Mobile-first responsive baseline (Requirement 1.7).
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <CartProvider>
            <AppShell>{children}</AppShell>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
