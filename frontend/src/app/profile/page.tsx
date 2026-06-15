'use client';

import { useRouter } from 'next/navigation';
import { Mail, Package, LogOut, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useCart } from '@/lib/cart';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';

function ProfileContent() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { clearUserCart } = useCart();

  const displayName = user?.displayName || user?.username || user?.email?.split('@')[0] || 'User';

  const handleLogout = () => {
    clearUserCart();
    logout();
    router.push('/');
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      {/* Profile header card */}
      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-card">
        <div
          className="h-24 sm:h-28"
          style={{ background: 'linear-gradient(120deg, var(--accent-soft), var(--accent) 140%)' }}
        />
        <div className="px-6 pb-6 sm:px-8 sm:pb-8">
          <div className="-mt-12 flex flex-col items-center text-center sm:-mt-14 sm:flex-row sm:items-end sm:text-left">
            <Avatar src={user?.profilePicture} name={displayName} size={96} className="!ring-4 !ring-white" />
            <div className="mt-3 sm:mb-1 sm:ml-5 sm:mt-0">
              <h1 className="text-2xl font-bold text-gray-900">{displayName}</h1>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <Mail className="h-5 w-5 text-accent" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Email</p>
                <p className="truncate text-sm font-medium text-gray-900">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <div className="min-w-0">
                <p className="text-xs text-gray-500">Signed in with</p>
                <p className="truncate text-sm font-medium capitalize text-gray-900">
                  {user?.authProvider === 'google' ? 'Google' : 'Email & Password'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          onClick={() => router.push('/orders')}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-card transition hover:shadow-card-hover"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-accent">
            <Package className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-gray-900">My Orders</span>
            <span className="block text-sm text-gray-500">Track and review past orders</span>
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-left shadow-card transition hover:shadow-card-hover"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-600">
            <LogOut className="h-5 w-5" />
          </span>
          <span>
            <span className="block font-semibold text-gray-900">Logout</span>
            <span className="block text-sm text-gray-500">Sign out of your account</span>
          </span>
        </button>
      </div>

      <div className="mt-8 text-center">
        <Button variant="outline" onClick={() => router.push('/')}>
          Continue shopping
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <ProtectedRoute redirectTo="/login?callbackUrl=/profile">
      <ProfileContent />
    </ProtectedRoute>
  );
}
