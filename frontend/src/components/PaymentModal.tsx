'use client';

import { useState } from 'react';
import { PaymentMethod } from '@/lib/types';
import { formatPrice } from '@/lib/format';

const METHODS: PaymentMethod[] = [
  { id: 'amazon-pay-wallet', label: 'Amazon Pay Wallet', hint: 'Pay using your wallet balance' },
  { id: 'amazon-pay-upi', label: 'Amazon Pay UPI', hint: 'Pay via UPI' },
  { id: 'card', label: 'Credit / Debit Card', hint: 'Visa, Mastercard, RuPay' },
  { id: 'cod', label: 'Cash on Delivery', hint: 'Pay when it arrives' },
];

interface PaymentModalProps {
  total: number;
  currency: string;
  submitting: boolean;
  onCancel: () => void;
  onConfirm: (method: PaymentMethod) => void;
}

/** Payment method selection shown before placing the order. */
export function PaymentModal({ total, currency, submitting, onCancel, onConfirm }: PaymentModalProps) {
  const [selected, setSelected] = useState<PaymentMethod>(METHODS[0]);

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center">
      <div className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Choose payment method</h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          {METHODS.map((m) => {
            const active = m.id === selected.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSelected(m)}
                className={`flex w-full items-center justify-between rounded-xl border p-3 text-left transition ${
                  active ? 'border-[var(--accent)] bg-[var(--accent-soft)]' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <span>
                  <span className="block font-medium text-gray-800">{m.label}</span>
                  <span className="block text-xs text-gray-500">{m.hint}</span>
                </span>
                <span
                  className={`flex h-5 w-5 items-center justify-center rounded-full border ${
                    active ? 'border-[var(--accent)] bg-[var(--accent)] text-[var(--accent-fg)]' : 'border-gray-300'
                  }`}
                >
                  {active && '✓'}
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          disabled={submitting}
          onClick={() => onConfirm(selected)}
          className="mt-5 w-full rounded-xl bg-[var(--accent)] px-6 py-4 text-lg font-semibold text-[var(--accent-fg)] transition hover:bg-[var(--accent-strong)] disabled:opacity-50"
        >
          {submitting ? 'Placing order…' : `Pay ${formatPrice(total, currency)} with ${selected.label}`}
        </button>
      </div>
    </div>
  );
}
