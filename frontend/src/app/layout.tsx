import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth';
import { CartProvider } from '@/lib/cart';

export const metadata: Metadata = {
  title: 'Amazon Instant Engine',
  description: 'Intent-first shopping. Express what you are trying to do.',
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
          <CartProvider>{children}</CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
