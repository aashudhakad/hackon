# Amazon Instant Engine — Project Documentation

> Intent-first quick-commerce. Instead of *"What are you looking for?"*, the app asks
> *"What are you trying to do?"* and turns an expressed outcome — typed, spoken,
> photographed, or one-tapped — into a complete, purchasable basket in seconds.

---

## 1. Problem Statement

Traditional e-commerce is **search-first**: the shopper must already know the exact
products they want, type each one, compare options, and manually assemble a cart. This
is slow and high-friction, especially for:

- **Quick-commerce users** who need things *now*.
- **Impulse buyers** acting on a situation ("movie night", "guests coming over").
- **Time-poor professionals** with a goal but no patience to build a cart item by item.

The real problem is that people think in **outcomes** ("make paneer bhurji", "restock the
fridge", "gym starter kit"), not in **SKUs**. Forcing them to translate an outcome into a
list of individual product searches is the friction we remove.

**Goal:** express an intent once → instantly receive a useful, trustworthy, editable
shopping bundle → check out in a couple of taps.

---

## 2. Approach

The core idea is to **separate AI understanding from deterministic selection logic**:

- The LLM (Google Gemini) is used *only* to understand the shopper — turn an intent or an
  image into **categories** and to **filter/rank** candidate products by relevance.
- All commercial logic — product selection, price tiers, ranking ties, confidence,
  cross-sell, cart math — is **deterministic backend code**. It is testable, cacheable,
  and never depends on LLM non-determinism.

Every input modality (text, voice, image, smart bundle) converges on the **same
downstream pipeline**, so we maintain one set of selection/ranking logic regardless of how
the intent was expressed.

```
            ┌──────────── Text ────────────┐
            │                              │
 Voice ─────┤                              ├──►  Intent  ──►  Categories  ──►  Candidate
            │   (all converge to text)     │                 (Gemini #1)       products
 Image ─────┤                              │                                   (MongoDB)
            │                              │                                       │
Smart Bundle┘ (pre-assembled, no LLM)      │                                       ▼
                                           │                      Relevance filter + rank
                                           │                            (Gemini #2)
                                           ▼                                       │
                              Quick rows + Flash tiers  ◄───────────────────────────┘
                                  (deterministic backend)
```

---

## 3. Architecture & Tech Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Frontend | Next.js (React) + Tailwind CSS | Mobile-first responsive UI, swipers, modes |
| Backend | Node.js + Express + TypeScript | Orchestrates intent → categories → products |
| Database | MongoDB Atlas | Product catalog, smart bundles, orders, users |
| Cache | Redis (optional) | Bundle/shop result caching; app degrades gracefully without it |
| AI | Google Gemini (text + vision) | Intent → categories, relevance ranking, image understanding |
| Auth | JWT + Google OAuth (passport) | Email/password and Google sign-in |

**Layering:**

- **Routes** (`backend/src/routes`, `controllers`): HTTP handling, input validation,
  multipart uploads, timeout/error shaping.
- **Services** (`backend/src/services`): the decision logic — category generation,
  relevance ranking, image understanding, tier building, cross-sell, confidence.
- **Repositories** (`backend/src/repositories`): MongoDB and Redis access behind
  interfaces.

A key design principle: **the LLM is injected behind a single seam**, so the deterministic
core can be tested with mocks and the system stays runnable even when the LLM is
unavailable (local keyword fallback).

---

## 4. Core Features

1. **Intent Hub** — the home page. Oversized intent bar with cycling placeholders, a snap
   (camera) icon, a mic button, and a grid of 4–6 Smart Bundles.
2. **Snap & Order (image → cart)** — upload a photo; the system understands *why* you
   uploaded it and builds the right basket. (See §7 — redesigned image pipeline.)
3. **Voice intent** — speak the intent; client-side speech recognition (or a server
   fallback) fills the editable intent bar; you review and submit.
4. **Goal-Oriented Category Grid (Quick mode)** — one row per required category, each with
   a horizontal swiper of ranked product alternatives and a pre-selected default.
5. **Super Quick / Flash Mode (3-tier baskets)** — Budget / Balanced / Premium
   pre-assembled baskets for one-tap checkout.
6. **Contextual Cross-Sell** — 3–4 thematically related add-ons pinned at the bottom.
7. **Smart Bundles** — pre-made baskets for frequent situations, loaded without invoking
   the LLM.
8. **Authentication** — email/password (JWT) and Google OAuth.
9. **Checkout & Orders** — single-action checkout, order history (protected routes).

---

## 5. The Intent → Products Pipeline (text & voice)

This is the shared downstream pipeline that all modalities feed into.

1. **Intent → Categories (Gemini #1).**
   `generateCategoriesForIntent(intent)` asks Gemini to decompose the intent into the
   **smallest practical set** of catalog categories (snake/space keys from a fixed
   `KNOWN_CATEGORIES` list). Precision over recall — no padding, no keyword-only matches.
   If Gemini is unavailable, a deterministic local keyword matcher is used so the app
   stays functional.

2. **Fetch candidate products (MongoDB).**
   `catalogRepository.getProductsByCategories(...)` does an **indexed, per-category** fetch
   (top products by rating) — no full collection scan, so it scales to 1M+ products. The
   index follows the ESR rule: `{ category, availability, ratings desc, noOfRatings desc }`.

3. **Relevance filter + ranking (Gemini #2).**
   `relevanceRanker.rankAndBundle(intent, candidatesByCategory)` sends Gemini a **slimmed**
   payload (`id, name, category, mainCategory, subCategory` — *no* price/ratings) and asks
   it to act as a **strict semantic filter**: drop mislabeled/irrelevant products and rank
   the rest by relevance. Returns only `{ quick: [{ category, productIds[] }] }`.
   Popularity never overrides relevance.

4. **Build Quick rows + Flash tiers (deterministic backend).**
   `smartShopService` turns the filtered products into:
   - **Quick rows**: per-category ranked alternatives with a default selection.
   - **Flash tiers** (built entirely in backend code from the filtered set):
     - **Budget** — cheapest acceptable product per category.
     - **Balanced** — best value per category: `ratings × log10(noOfRatings + 10) / price`.
     - **Premium** — highest quality per category (rating, then review count).

5. **Cross-sell + confidence + cache.** Cross-sell picks 3–4 theme-sharing products;
   the result is cached by normalized intent so repeats/refreshes are instant.

**Endpoint:** `POST /api/shop` returns `{ categories, rows, tiers, crossSell, unfulfilledComponents }`
in one call so the frontend can toggle Quick/Flash with no refetch.

---

## 6. Voice & Smart Bundle Flows (brief)

- **Voice:** records an audio clip (auto-stop at 60s, ≤10 MB). If the browser speech
  recognizer is available, transcription happens client-side with no backend call;
  otherwise the clip is POSTed to `/api/audio-intent`. Either way it produces editable
  text that flows through the same `/api/shop` pipeline on submit.
- **Smart Bundle:** tapping a card loads a pre-assembled 3-tier basket from MongoDB
  directly — no LLM generation — with the Balanced tier active by default.

---

## 7. Image Understanding Pipeline (redesigned)

The image flow is the most heavily iterated part of the project. It went through three
stages during development (see §8 for the problems each stage solved).

**Final design — classification-first understanding.** When an image is uploaded, the
system first decides **why** the shopper uploaded it, then responds appropriately instead
of forcing every image into a broad "goal" interpretation.

### Flow

```
Image upload (multipart) ─► temp disk storage (unique, timestamped)
        │
        ├─► Gemini Vision (classify + understand)
        │        │
        │        ▼
        │   { image_type, primary_intent, exact_product_signals, categories }
        │
        ├─► validate + sanitize (1 retry on malformed output)
        ├─► backfill categories via text pipeline if vision returned none
        └─► temp file deleted (always, even on failure) + periodic 5-min sweep
        │
        ▼
   { intent, categories, imageType, exactProductSignals }
        │
        └─► feeds the SAME /api/shop pipeline (Quick + Flash)
```

### Image classification

The model classifies each image into exactly one type and tailors the result:

| `image_type` | Example | Behavior |
| --- | --- | --- |
| `product` | popcorn packet, Coke bottle | Identify the product. "Buy popcorn" → `["popcorn"]`. **Do not** over-expand into "movie night". 1–5 categories. |
| `restock` | empty fridge, pantry shelf | Infer replenishment items. "Restock refrigerator" → `["milk","eggs","butter"]`. |
| `recipe` | recipe screenshot, dish photo | Core ingredients only. "Make paneer bhurji" → `["paneer","onion","tomato","green chilli"]`. |
| `goal` | gym setup, study desk | What's needed to achieve the outcome. 3–8 categories. |
| `event` | birthday party, movie night | Practical consumables only, no over-expansion. |
| `unknown` | low confidence | Conservative category set; never hallucinate brands. |

**Why this matters:** a photo of a popcorn packet should resolve to *buy popcorn*, not a
"movie night bundle" of snacks, drinks, and chocolates. The pipeline now balances **exact
product understanding** against **shopping-intent understanding** rather than always
prioritizing intent.

### Storage, validation & resilience

- **Temporary storage:** uploads are written to an OS temp dir under a unique
  timestamped filename, processed, then **deleted immediately** (in a `finally` block, so
  cleanup runs even on failure). A periodic **sweeper** deletes any file older than
  **5 minutes** as a safety net. No permanent image storage.
- **Validation:** intent must be non-empty and within the length cap; `image_type` is
  validated against the allowed set (defaults to `unknown`); categories are sanitized
  against `KNOWN_CATEGORIES` (trim, lowercase, de-dupe). **One retry** on malformed output;
  controlled error responses on failure — the request never crashes.
- **Limits:** JPEG/PNG only, **max 5 MB** (enforced client-side and server-side).
- **Backward compatible:** the endpoint still returns `intent` + `categories`, with
  `imageType` + `exactProductSignals` added for richer UX (e.g. "reorder this exact item").

**Endpoint:** `POST /api/image-intent` (multipart field `image`) →
`{ intent, categories, imageType, exactProductSignals }`.

---

## 8. Problems Encountered & How We Solved Them

This section documents the real issues fixed during development and the reasoning behind
each fix.

### 8.1 Server wouldn't start — missing auth dependencies & env

- **Symptom:** `Cannot find module 'express-session'`, then
  `JWT_SECRET environment variable is required`.
- **Cause:** auth code (sessions, passport, Google OAuth) was added without installing
  packages or setting required env vars.
- **Fix:** installed `express-session`, `passport`, `passport-google-oauth20` (+ types),
  and added the required auth vars to `.env` (`JWT_SECRET`, `JWT_EXPIRES_IN`,
  `BCRYPT_SALT_ROUNDS`, `SESSION_SECRET`, Google OAuth creds, `FRONTEND_URL`).

### 8.2 Gemini was doing too much (Flash tiers)

- **Problem:** Gemini was being asked to generate Flash bundle tiers — non-deterministic,
  hard to validate, and mixing pricing logic into the LLM.
- **Fix:** Gemini's role was narrowed to **strict relevance filtering + ranking** only
  (`relevanceRanker` returns just `{ quick }`). **Flash tiers (Budget/Balanced/Premium)
  are now built deterministically in backend code** from the filtered products, using
  cheapest / best-value / highest-quality selection per category. Removed all dead
  flash-from-LLM parsing/validation.

### 8.3 Image upload was "broken" — always the same useless result

- **Symptom:** every uploaded image produced the same intent
  `"kitchen essentials bundle (from image/jpeg, 5KB image)"` and an empty product grid.
- **Cause:** the frontend called the old `/api/vision` endpoint, which routed through a
  **stub LLM client** (used because `LLM_API_KEY` was unset). The stub fabricated a
  placeholder string and never looked at the image. Gemini (which *was* configured) was
  never used for vision.
- **Fix:** built a new Gemini-backed `POST /api/image-intent` service (temp storage,
  cleanup, validation, retry, logging) and pointed the frontend at it. The frontend now
  feeds the returned `{ intent, categories }` into the shared `/api/shop` pipeline.

### 8.4 Image errors showed a broken page instead of a clear message

- **Requirements:** allow up to **5 MB**; on an unreadable image show *"Picture not clear,
  try again"*; on oversize show *"File size greater than 5 MB"*; stay on home to retry —
  never show the broken category grid.
- **Fix:** lowered the limit to 5 MB (client + server), wired the frontend `handleVisionFile`
  to call `/api/image-intent` → `/api/shop`, and added precise error handling that keeps
  the user on the home screen with an actionable banner (`NO_INTENT` → "Picture not
  clear…", `FILE_TOO_LARGE` → size message, etc.). Navigation to `/shop` happens only on
  success.

### 8.5 Image pipeline biased toward "intent" over "product"

- **Problem:** a clear product photo (e.g. popcorn) was being expanded into a broad goal
  ("movie night") instead of being recognized as the product itself.
- **Fix:** the classification-first redesign in §7 — classify (`product/restock/recipe/
  goal/event/unknown`) before generating categories, with explicit product-priority rules
  and `exact_product_signals`.

### 8.6 Seeding data without losing existing data

- **Need:** import several product CSVs without deleting what's already in the DB.
- **Fix:** added `backend/seedAppendProduct.js` — an **append-only, idempotent** importer
  that **never deletes**, namespaces generated ids by source file (`<source-tag>-<slug>-<i>`)
  to avoid collisions, and **upserts** so re-runs are safe. Used to seed multiple datasets
  (`merged-All.csv`, `final_updated_categories.csv`, `resp_fixed.csv`,
  `ai_studio_code_big.csv`, etc.).

### 8.7 Recurring data loss between sessions (diagnosed)

- **Symptom:** the product count repeatedly dropped to 0 between seeding sessions even
  though seeding accumulated correctly *within* a session.
- **Diagnosis:** the destructive scripts are the cause —
  `npm run seed` (`src/seed/seed.ts`) runs `deleteMany({})` then inserts only a small
  sample set, and `npm run seed:csv` (`seedProduct.js`) also `deleteMany({})` first. The
  dev server (`npm run dev`) does **not** touch data. Recommendation: guard those scripts
  behind an explicit `--force` flag, or make the append seeder the default, to prevent
  accidental wipes.

---

## 9. API Endpoints (summary)

| Method | Path | Purpose |
| --- | --- | --- |
| POST | `/api/intent` | Parse typed intent → structured intent |
| POST | `/api/shop` | **Primary**: intent/categories → Quick rows + Flash tiers |
| POST | `/api/quick` | Quick mode category grid |
| POST | `/api/flash` | Flash 3-tier baskets |
| POST | `/api/vision` | (legacy) image → bundle via LLM client |
| POST | `/api/image-intent` | **Image → `{ intent, categories, imageType, exactProductSignals }`** |
| POST | `/api/audio-intent` | Audio clip → recognized text (server fallback) |
| GET | `/api/smart-bundles` / `/:id` | List / load pre-assembled bundles |
| POST | `/api/cross-sell` | Thematic recommendations |
| POST | `/api/checkout` | Submit active cart as order (auth) |
| GET | `/api/orders` / `/:id` | Order history (auth) |
| POST | `/api/auth/signup` · `/auth/login` · `GET /auth/me` | Email/password auth |
| GET | `/api/auth/google` · `/auth/google/callback` | Google OAuth |
| GET | `/api/homepage/full` | Personalized + trending + smart bundles |

---

## 10. Data Model & Seeding

**Product (catalog)** — mirrors the source CSV columns:
`name, mainCategory, subCategory, image, link, ratings, noOfRatings, discountPrice,
actualPrice, category` plus a generated `id` and `availability`. Derived engine fields
(`price`, `rank`, `brand`, `component`, `themes`) are computed on read by
`normalizeProduct`, so they aren't stored.

**Index:** `{ category: 1, availability: 1, ratings: -1, noOfRatings: -1 }` — answers
per-category, in-stock, best-rated-first queries directly from the index (no scan, no
in-memory sort), which keeps reads fast at scale.

**Seeding:**

- `node seedAppendProduct.js [path/to/file.csv]` — **append-only**, upserts, preserves
  existing data, namespaced ids. Handles camelCase or snake_case CSV headers and ignores
  extra columns. **Use this for adding data.**
- `npm run seed` / `npm run seed:csv` — **destructive** (clear-then-insert). Use only for a
  full reset.

---

## 11. Running the Project

**Backend** (`backend/`):

```bash
npm install
npm run dev        # ts-node-dev on src/index.ts → http://localhost:4000
```

Required env (`backend/.env`, gitignored): `MONGODB_URI`, `MONGODB_DB_NAME`,
`GEMINI_API_KEY`, `GEMINI_MODEL`, `JWT_SECRET`, plus optional Redis/Google OAuth vars.
`MAX_IMAGE_BYTES=5242880` (5 MB).

**Frontend** (`frontend/`):

```bash
npm install
npm run dev        # Next.js → http://localhost:3000
```

**Notes:**
- Redis is optional — the app logs a warning and runs without caching if it's not up.
- When `GEMINI_API_KEY` is set, the real Gemini path is used; otherwise category
  generation falls back to a local keyword matcher (image understanding requires Gemini).

---

## 12. Design Principles Recap

- **AI understands; backend decides.** LLM output is confined to categories and relevance;
  all pricing, ranking, tiers, and cart math are deterministic and testable.
- **One pipeline, many inputs.** Text, voice, image, and smart bundles converge on the same
  `/api/shop` selection logic.
- **Precision over recall.** Fewer, correct categories/products beat padded lists.
- **Graceful degradation.** Missing Redis, missing LLM key, malformed model output, and
  bad uploads all have controlled fallbacks — the request never crashes.
- **Resilient image handling.** Classify first, store temporarily, clean up always, validate
  strictly, retry once, fail with a clear message.

---

## 13. Future Work

- Guard destructive seed scripts behind `--force` (prevent accidental catalog wipes).
- Surface `imageType` / `exactProductSignals` in the UI (e.g. "reorder this exact item"
  vs. "shop the goal").
- Rotate the Gemini/Google credentials that were shared during development before
  production.
- Add automated tests for the deterministic tier/ranking logic and the image validation
  paths.
