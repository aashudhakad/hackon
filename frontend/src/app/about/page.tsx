'use client';

import { User } from 'lucide-react';

/**
 * About Us — styled placeholder. Hero + a responsive grid of blank profile
 * cards to be filled with real team data later. Theme accent follows the
 * active mode via the global AppShell.
 */
const TEAM_SLOTS = Array.from({ length: 6 }, (_, i) => i);

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-card sm:p-14">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-48 opacity-50 blur-3xl"
          style={{
            background:
              'radial-gradient(closest-side, var(--accent-soft), transparent)',
          }}
        />
        <span
          className="relative inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider"
          style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent-strong)' }}
        >
          ClickOn
        </span>
        <h1 className="relative mt-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
          Meet the ClickOn Team
        </h1>
        <p className="relative mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-500 sm:text-lg">
          We are reimagining shopping around what you are trying to do — not what you have
          to search for. Built for HackOn with Amazon.
        </p>
      </section>

      {/* Team grid (blank placeholders) */}
      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between">
          <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">The people behind it</h2>
          <span className="text-sm text-gray-400">Coming soon</span>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {TEAM_SLOTS.map((i) => (
            <article
              key={i}
              className="group flex flex-col items-center rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-card transition-shadow hover:shadow-card-hover"
            >
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gray-100 ring-4 ring-gray-50">
                <User className="h-10 w-10 text-gray-300" />
              </div>
              <div className="mt-4 h-4 w-28 rounded-full bg-gray-100" />
              <div className="mt-2 h-3 w-20 rounded-full bg-gray-50" />
              <p className="mt-4 text-sm text-gray-400">Team member {i + 1}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
