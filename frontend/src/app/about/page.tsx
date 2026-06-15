'use client';

import Link from 'next/link';
import { useCart } from '@/lib/cart';

const CORE_FEATURES = [
  {
    number: '01',
    title: 'Smart Discovery Engine',
    subtitle: 'Personalized bundle generation',
    description:
      'The homepage continuously generates intelligent shopping bundles using purchase history, browsing patterns, weather, time of day, location signals, seasonal trends, and what similar users nearby are currently buying.',
    points: [
      'User history',
      'Weather aware',
      'Location signals',
      'Area trends',
    ],
  },

  {
    number: '02',
    title: 'Snap & Order',
    subtitle: 'Vision-to-cart workflow',
    description:
      'Users can upload an image and our vision pipeline identifies intent, extracts required products, and instantly creates a purchasable shopping bundle.',
    points: [
      'Image understanding',
      'Intent extraction',
      'Bundle creation',
      'One-tap cart',
    ],
  },

  {
    number: '03',
    title: 'Quick Mode',
    subtitle: 'Guided fast shopping',
    description:
      'Quick Mode provides a highly optimized shopping experience through horizontal and vertical product selections. Categories and recommendations are dynamically filtered and ranked by our smart backend to reduce decision time.',
    points: [
      'Smart filtering',
      'Horizontal selection',
      'Vertical categories',
      'Fast discovery',
    ],
  },

  {
    number: '04',
    title: 'Flash Mode',
    subtitle: 'AI-generated basket builder',
    description:
      'Flash Mode automatically creates Budget, Balanced, and Premium baskets for a given intent. Users can compare, customize, swap products, and finalize the basket that best matches their requirements.',
    points: [
      'Budget basket',
      'Balanced basket',
      'Premium basket',
      'Full customization',
    ],
  },
];

const DEV_TEAM = [
  {
    initials: 'AD',
    name: 'Aayush Dhakad',
    role: 'Backend & AI/ML Developer',
    bio: 'Works on the intent pipeline, backend logic, and performance layer that keeps the shopping flow fast and reliable.',
  },
  {
    initials: 'SG',
    name: 'Shreshtha Garg',
    role: 'Backend & AI/ML Developer',
    bio: 'Focuses on product intelligence, service design, and clean data flows for structured bundle generation.',
  },
  {
    initials: 'YR',
    name: 'Yash Rathore',
    role: 'Frontend Developer & Data Analyst',
    bio: 'Builds the responsive UI, visual clarity, and interaction design across the app experience.',
  },
];

const ARCHITECTURE_LAYERS = [
  {
    title: 'Intent Understanding',
    description:
      'Accepts typed text, voice-derived text, or image-derived intent and converts it into structured components for downstream processing.',
  },
  {
    title: 'Bundle Generation',
    description:
      'Ranks product alternatives, picks defaults, computes confidence, and constructs complete baskets from the catalog.',
  },
  {
    title: 'Performance & Cache',
    description:
      'Uses Redis-backed reuse for previously generated bundles and keeps the experience responsive under tight latency targets.',
  },
  {
    title: 'Commerce Orchestration',
    description:
      'Handles basket updates, contextual cross-sell, substitutions, checkout submission, and graceful recovery on failures.',
  },
];

const EXECUTION_FLOW = [
  {
    step: '01',
    title: 'Capture intent',
    description:
      'Users enter a short goal, speak it, upload an image, or choose a quick-mode path.',
  },
  {
    step: '02',
    title: 'Parse structure',
    description:
      'The intent parser extracts required components and turns the goal into a dependency map.',
  },
  {
    step: '03',
    title: 'Generate basket',
    description:
      'The bundle generator ranks products, fills tiers, and computes the confidence score.',
  },
  {
    step: '04',
    title: 'Refine and checkout',
    description:
      'The user can swap products, compare alternatives, inspect explanations, and complete checkout in a few taps.',
  },
];

const TECH_STACK = [
  'Next.js',
  'React',
  'Tailwind CSS',
  'Node.js',
  'Express',
  'MongoDB Atlas',
  'Redis',
  'Multi-modal LLM',
];

export default function AboutPage() {
  const { mode } = useCart();
  const isFlash = mode === 'flash';

  const accentText = isFlash ? 'text-red-600' : 'text-emerald-600';
  const accentBg = isFlash ? 'bg-red-50' : 'bg-emerald-50';
  const accentBorder = isFlash ? 'border-red-100' : 'border-emerald-100';
  const accentSoft = isFlash ? 'bg-red-100/70' : 'bg-emerald-100/70';
  const accentSolid = isFlash ? 'bg-red-600' : 'bg-emerald-600';
  const accentSolidHover = isFlash ? 'hover:bg-red-700' : 'hover:bg-emerald-700';

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 pb-24 sm:px-6 sm:py-14 lg:px-8">
      <section className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 text-center shadow-sm sm:p-14">
        <div
          className="pointer-events-none absolute inset-x-0 -top-24 h-52 opacity-60 blur-3xl"
          style={{
            background: isFlash
              ? 'radial-gradient(closest-side, rgba(248,113,113,0.22), transparent)'
              : 'radial-gradient(closest-side, rgba(52,211,153,0.22), transparent)',
          }}
        />
        <div className="relative mx-auto flex max-w-3xl flex-col items-center">
          <span
            className={`inline-flex items-center rounded-full border px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] ${accentBg} ${accentBorder} ${accentText}`}
          >
            ClickOn / Amazon Instant Engine
          </span>

          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            Intent-first commerce built for speed.
          </h1>

          <p className="mt-6 max-w-3xl text-base leading-relaxed text-gray-500 sm:text-lg">
            Amazon Instant Engine turns natural language, voice, images, and quick-mode basket
            paths into a complete shopping outcome. The system is built around structured intent
            understanding, basket generation, and fast checkout rather than search-first browsing.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${accentBg} ${accentText}`}>
              Multi-modal input
            </span>
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${accentBg} ${accentText}`}>
              Confidence-scored bundles
            </span>
            <span className={`rounded-full px-4 py-2 text-sm font-semibold ${accentBg} ${accentText}`}>
              Fast cart orchestration
            </span>
          </div>
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Core Product Features
            </h2>
            <p className="mt-2 text-sm text-gray-500">
                Four AI-powered systems working together to transform intent into a complete shopping experience.
            </p>
          </div>

          <span
            className={`hidden rounded-full px-3 py-1 text-xs font-semibold sm:inline-flex ${accentBg} ${accentText}`}
          >
            {isFlash ? 'Flash Theme' : 'Quick Theme'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {CORE_FEATURES.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className={`text-sm font-semibold ${accentText}`}>{feature.subtitle}</p>
                  <h3 className="mt-2 text-xl font-bold text-gray-900">{feature.title}</h3>
                </div>

                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${accentSoft} ${accentText}`}
                  aria-hidden="true"
                >
                  <span className="text-sm font-bold">{feature.number}</span>
                </div>
              </div>

              <p className="mt-4 text-sm leading-relaxed text-gray-500">
                {feature.description}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {feature.points.map((point) => (
                  <span
                    key={point}
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${accentBorder} ${accentText}`}
                  >
                    {point}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
            About the Developers
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            The people building the engine behind the product.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {DEV_TEAM.map((member) => (
            <article
              key={member.name}
              className="group rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
            >
              <div
                className={`flex h-24 w-24 items-center justify-center rounded-full text-white ring-4 ${
                  isFlash ? 'bg-red-600 ring-red-50' : 'bg-emerald-600 ring-emerald-50'
                }`}
              >
                <span className="text-2xl font-bold">{member.initials}</span>
              </div>

              <h3 className="mt-5 text-xl font-bold text-gray-900">{member.name}</h3>

              <p className={`mt-1 text-sm font-semibold ${accentText}`}>{member.role}</p>

              <p className="mt-4 text-sm leading-relaxed text-gray-500">{member.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-16 rounded-3xl bg-gray-900 p-8 text-white sm:p-12">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-bold sm:text-4xl">System Architecture</h2>
          <p className="mt-4 text-base leading-relaxed text-gray-300 sm:text-lg">
            The product is organized as a layered engine: intent understanding, bundle generation,
            cache-backed performance, and commerce orchestration. That structure keeps the MVP fast
            while still leaving room to scale into a real product.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
          {ARCHITECTURE_LAYERS.map((layer, index) => (
            <div
              key={layer.title}
              className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h3 className="text-lg font-semibold text-white">{layer.title}</h3>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-gray-300">
                {layer.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">Execution Flow</h2>
          <p className="mt-2 text-sm text-gray-500">
            The path from intent capture to checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
          {EXECUTION_FLOW.map((item) => (
            <div
              key={item.step}
              className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg"
            >
              <div className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${accentBg} ${accentText}`}>
                {item.step}
              </div>
              <h3 className="mt-4 text-lg font-bold text-gray-900">{item.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">{item.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-16 overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm sm:p-10">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold text-gray-900 sm:text-3xl">
              Technical guarantees
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-gray-500 sm:text-base">
              The requirements emphasize response-time limits, confidence scoring, fallback
              handling, substitutions, and a frictionless checkout path. Those constraints shape
              the entire architecture of the product.
            </p>
          </div>

          <Link
            href="/shop"
            className={`inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-bold text-white transition-transform hover:scale-105 ${accentSolid} ${accentSolidHover}`}
          >
            Explore the shop
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl bg-gray-50 p-5">
            <div className={`text-sm font-semibold ${accentText}`}>Speed</div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Designed to keep intent routing, basket switching, and checkout interactions fast.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <div className={`text-sm font-semibold ${accentText}`}>Trust</div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Bundle confidence, explanations, substitutions, and empty-state handling keep the
              system understandable.
            </p>
          </div>

          <div className="rounded-2xl bg-gray-50 p-5">
            <div className={`text-sm font-semibold ${accentText}`}>Flexibility</div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Supports text, voice, image, and quick-mode entry paths without changing the
              underlying shopping model.
            </p>
          </div>
        </div>
      </section>

      <section className="mt-16">
        <h2 className="text-center text-2xl font-bold text-gray-900 sm:text-3xl">
          Technology Stack
        </h2>
        <p className="mt-2 text-center text-sm text-gray-500">
          Built with a frontend, backend, cache, database, and multi-modal AI layer.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {TECH_STACK.map((tech) => (
            <span
              key={tech}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${accentBg} ${accentText}`}
            >
              {tech}
            </span>
          ))}
        </div>
      </section>

      <div className="mt-12 flex items-center justify-center gap-2 pb-8 text-sm text-gray-400">
        Built for HackOn with Amazon
      </div>
    </div>
  );
}