# Implementation Plan: Amazon Instant Engine

## Overview

This plan implements the Amazon Instant Engine MVP in TypeScript across a Node.js + Express backend and a Next.js + React + Tailwind frontend, with MongoDB Atlas and Redis for data and caching. The build order isolates the deterministic core (data models, intent parsing handoff, ranking, bundle generation, confidence, cross-sell, substitution, cart math) first so it can be property-tested in isolation, then layers the HTTP transport, frontend components, and the multi-modal input front-ends (image and voice), and finally wires everything together end-to-end.

Property-based tests (using `fast-check`, minimum 100 cases each) cover the 31 correctness properties from the design and are placed close to the code they validate. Unit, edge-case, integration, performance, and snapshot tests cover UI, timing, and external-integration concerns. All test sub-tasks are marked optional with `*`.

## Tasks

- [ ] 1. Set up project structure, shared types, and tooling
  - Create the monorepo/workspace layout with `backend/` (Node.js + Express) and `frontend/` (Next.js + React + Tailwind) packages
  - Define shared domain types in a shared module: `StructuredIntent`, `RequiredComponent`, `Product`, `TierName`, `BasketTier`, `CategoryRow`, `Bundle`, `SmartBundle`, `CartSummary`, `Order`, `Catalog`, `ImageInput`, `AudioClip`, `RecognizedIntent`
  - Define service interfaces: `IntentParser`, `VisionProcessor`, `AudioIntentProcessor`, `BundleGenerator`, `RankingEngine`, `CrossSellEngine`, `ConfidenceEngine`
  - Set up Vitest (or Jest) + `fast-check`, ESLint/Prettier, and TypeScript config across both packages
  - Define custom `fast-check` arbitraries for `Product`, `RequiredComponent`, `StructuredIntent`, `Catalog`, intent strings (empty, whitespace-only, boundary lengths 1/200/500/501, Unicode), `ImageInput` (mime/size around 10 MB), `AudioClip` (duration around 1s/60s, size around 10 MB, recognizer-availability flag), and recognized-text strings (empty, whitespace-only, 199/200/201, Unicode)
  - _Requirements: 7.1, 8.1, 8.4_

- [ ] 2. Implement intent validation and parsing handoff
  - [ ] 2.1 Implement intent input normalization helpers
    - Implement trim + 200-char cap logic for typed input and a length-validation guard that rejects intents over 500 characters while preserving the original text
    - _Requirements: 1.9, 1.10, 7.5_

  - [ ]* 2.2 Write property test for intent input capping and trimming
    - **Property 3: Intent input is capped and trimmed**
    - **Validates: Requirements 1.9, 1.10**

  - [ ]* 2.3 Write property test for over-length intent rejection
    - **Property 18: Over-length intents are rejected**
    - **Validates: Requirements 7.5**

  - [ ] 2.4 Implement `IntentParser` with injected LLM dependency
    - Orchestrate the LLM call to produce a `StructuredIntent` with `>= 1` component for 1–500 char input; throw `NoComponentsError` when none are found; enforce the 5s extraction budget
    - _Requirements: 7.1, 7.3, 7.4, 7.6_

  - [ ]* 2.5 Write property test for valid-length intent producing at least one component
    - **Property 17: Parsing a valid-length intent yields at least one component**
    - **Validates: Requirements 7.1**
    - Use a mocked LLM so the test exercises the handoff/contract, not model behavior

  - [ ]* 2.6 Write edge-case tests for parser failure paths
    - No-components handling returns to Intent_Bar and retains text (7.3); parser timeout >5s shows error and offers retry (7.6)
    - _Requirements: 7.3, 7.6_

- [ ] 3. Implement ranking and default selection
  - [ ] 3.1 Implement `RankingEngine`
    - Implement `rankAlternatives` (descending rank within a component) and `pickDefault` (highest-ranked in-stock product, else null)
    - _Requirements: 8.2, 4.5, 11.2_

  - [ ]* 3.2 Write property test for default selection being the highest-ranked in-stock alternative
    - **Property 20: Default selection is the highest-ranked in-stock alternative**
    - **Validates: Requirements 8.2, 4.5**

- [ ] 4. Implement confidence scoring
  - [ ] 4.1 Implement `ConfidenceEngine.score`
    - Produce an integer Confidence_Score in [0, 100] for a generated bundle
    - _Requirements: 8.4_

  - [ ]* 4.2 Write property test for bounded integer confidence score
    - **Property 21: Confidence score is a bounded integer**
    - **Validates: Requirements 8.4**

- [ ] 5. Implement the Bundle_Generator core
  - [ ] 5.1 Implement bundle assembly from structured intent and catalog
    - Build one `CategoryRow` per required component in intent sequence; select exactly one default Selected_Item per component with an in-stock product; omit defaults and list unfulfilled components for those without in-stock products; populate the three `BasketTier`s ensuring Budget ≤ Balanced ≤ Premium totals; attach the confidence score
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

  - [ ]* 5.2 Write property test for bundle completeness (one default per fulfillable component)
    - **Property 19: Bundle completeness — one default per fulfillable component**
    - **Validates: Requirements 8.1, 8.3**

  - [ ]* 5.3 Write property test for monotonically non-decreasing tier totals
    - **Property 22: Tier totals are monotonically non-decreasing**
    - **Validates: Requirements 8.5**

  - [ ] 5.4 Implement category-row mapping and brand-swiper clamping
    - Render exactly one row per component in sequence with its component name; clamp alternatives to 50 per swiper; render empty-state rows with no Selected_Item when a component has no available alternatives
    - _Requirements: 4.1, 4.2, 4.3, 10.3_

  - [ ]* 5.5 Write property test for one-to-one component-to-row mapping in order
    - **Property 9: Category rows map one-to-one to required components in order**
    - **Validates: Requirements 4.1, 10.3**

  - [ ]* 5.6 Write property test for brand swiper alternatives clamped to fifty
    - **Property 10: Brand swiper shows all alternatives clamped to fifty**
    - **Validates: Requirements 4.2**

  - [ ]* 5.7 Write property test for empty-state components having no selection
    - **Property 11: Components without alternatives render an empty state with no selection**
    - **Validates: Requirements 4.3**

  - [ ] 5.8 Implement unavailable-item substitution
    - When a Selected_Item becomes unavailable, replace it with the highest-ranked available alternative in the same component; mark the row unavailable when none exists
    - _Requirements: 11.2, 11.5_

  - [ ]* 5.9 Write property test for substitution picking the highest-ranked available alternative
    - **Property 26: Substitution picks the highest-ranked available alternative**
    - **Validates: Requirements 11.2, 11.5**

- [ ] 6. Checkpoint - Ensure all core domain tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement cross-sell selection and cart math
  - [ ] 7.1 Implement `CrossSellEngine.select`
    - Return [] when no catalog product shares a theme with the bundle; otherwise return 3–4 products each sharing at least one category/theme attribute with the bundle
    - _Requirements: 6.2, 6.3, 6.4_

  - [ ]* 7.2 Write property test for theme-relevant, size-bounded cross-sell selection
    - **Property 15: Cross-sell selection is theme-relevant and size-bounded**
    - **Validates: Requirements 6.2, 6.3, 6.4**

  - [ ] 7.3 Implement cart total computation and mutation helpers
    - Compute Cart_Summary total as the sum of currently selected available item prices (excluding unavailable components), always ≥ 0; implement add-product (cross-sell) that increases total by the product's price; implement tier-selection that sets item list/total to the chosen tier
    - _Requirements: 4.7, 5.3, 5.4, 6.6, 11.5, 12.2_

  - [ ]* 7.4 Write property test for cart total integrity
    - **Property 13: Cart total integrity**
    - **Validates: Requirements 4.7, 5.3, 11.5, 12.2**

  - [ ]* 7.5 Write property test for basket tier selection reflecting the chosen tier
    - **Property 14: Basket tier selection reflects the chosen tier**
    - **Validates: Requirements 5.4**

  - [ ]* 7.6 Write property test for adding a cross-sell product increasing the cart total
    - **Property 16: Adding a cross-sell product increases the cart total by its price**
    - **Validates: Requirements 6.6**

- [ ] 8. Implement explanation generation and confidence-driven UI state
  - [ ] 8.1 Implement bundle explanation builder and notice gating
    - Produce an explanation naming every fulfilled required component when confidence ≥ 1, and omit it when confidence == 0; compute the low-confidence notice flag (shown for 0–49, suppressed for 50–100)
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

  - [ ]* 8.2 Write property test for explanation gated by confidence
    - **Property 24: Explanation is gated by confidence**
    - **Validates: Requirements 10.1, 10.2**

  - [ ]* 8.3 Write property test for the low-confidence notice threshold
    - **Property 25: Low-confidence notice threshold**
    - **Validates: Requirements 10.4, 10.5**

- [ ] 9. Implement data layer and bundle caching
  - [ ] 9.1 Implement MongoDB repositories for Catalog, Smart Bundles, and Orders
    - Repository interfaces and implementations for catalog/product lookup, smart bundle list and by-id retrieval, and order persistence; seed sample catalog and 4–6 smart bundles
    - _Requirements: 2.1, 2.2, 12.1_

  - [ ] 9.2 Implement Redis bundle cache with silent fallback
    - Key by normalized intent text; serialize/deserialize `Bundle`; on cache retrieval failure, fall back to regeneration without surfacing an error
    - _Requirements: 8.6, 8.7_

  - [ ]* 9.3 Write property test for cached bundle retrieval round-trip
    - **Property 23: Cached bundle retrieval round-trip**
    - **Validates: Requirements 8.6**

  - [ ]* 9.4 Write edge-case test for cache retrieval fallback
    - Cache failure silently regenerates via Bundle_Generator with no user-facing error (8.7)
    - _Requirements: 8.7_

- [ ] 10. Implement the Vision_Processor and image acceptance
  - [ ] 10.1 Implement image acceptance validation
    - Accept a file for vision processing if and only if it is JPEG/PNG and ≤ 10 MB; otherwise produce a format/size error and stay on the Intent_Hub
    - _Requirements: 3.7_

  - [ ]* 10.2 Write property test for image acceptance format and size rules
    - **Property 8: Image acceptance follows format and size rules**
    - **Validates: Requirements 3.7**

  - [ ] 10.3 Implement `VisionProcessor.analyze` with injected LLM dependency
    - Convert image → text intent (1–500 chars) via the multi-modal LLM, then feed the text into the same `IntentParser`; throw `NoIntentError` when no intent is derived; enforce the 30s analysis budget
    - _Requirements: 3.3, 7.2, 3.8, 3.9_

  - [ ] 10.4 Implement routing decision for vision outcomes
    - Route to the Category_Grid if and only if a valid structured intent was produced; otherwise remain on the current screen
    - _Requirements: 3.4, 3.5_

  - [ ]* 10.5 Write property test for routing only with a valid structured intent
    - **Property 7: Routing occurs only with a valid structured intent**
    - **Validates: Requirements 3.5**

  - [ ]* 10.6 Write edge-case tests for vision failure paths
    - No-intent fallback offers text entry (3.8); vision timeout >30s shows error and retry (3.9); pre-population retry capped at 3 (3.6)
    - _Requirements: 3.6, 3.8, 3.9_

- [ ] 11. Implement voice intent processing (deterministic core + server fallback)
  - [ ] 11.1 Implement audio clip acceptance bounds
    - Accept an Audio_Clip if and only if its duration > 1s and size ≤ 10 MB; otherwise discard it and produce the corresponding message (no-audio for too-short/empty, oversize for >10 MB) with a record-again option
    - _Requirements: 13.7, 13.18, 13.20_

  - [ ]* 11.2 Write property test for audio clip acceptance bounds
    - **Property 28: Audio clip acceptance follows duration and size bounds**
    - **Validates: Requirements 13.7, 13.18, 13.20**

  - [ ] 11.3 Implement recognition path selection
    - Use the Client_Speech_Recognizer (no backend call) when available; send the Audio_Clip to `/api/audio-intent` exactly when the recognizer is unavailable
    - _Requirements: 13.8, 13.9_

  - [ ]* 11.4 Write property test for recognition path selection
    - **Property 29: Recognition path selection follows recognizer availability**
    - **Validates: Requirements 13.8, 13.9**

  - [ ] 11.5 Implement `prepareRecognizedText` normalization helper
    - Trim whitespace, return null when empty (gating the "no speech recognized" path), otherwise cap at the first 200 characters
    - _Requirements: 13.11, 13.12, 13.15_

  - [ ]* 11.6 Write property test for recognized text normalization and empty gating
    - **Property 30: Recognized text is trimmed, capped, and gates on empty**
    - **Validates: Requirements 13.11, 13.12, 13.15**

  - [ ] 11.7 Implement `AudioIntentProcessor.recognize` (server fallback)
    - Forward the Audio_Clip to the multi-modal LLM and return non-empty trimmed `Recognized_Intent_Text`; reject clips > 10 MB; throw `AudioTimeoutError` after 30s; throw `NoSpeechError` for empty/whitespace results
    - _Requirements: 13.9, 13.10, 13.15, 13.17_

  - [ ] 11.8 Implement voice→typed-parser convergence
    - Ensure submitted `Recognized_Intent_Text` is processed through the same `IntentParser` flow, producing the same `StructuredIntent` that identical typed text would
    - _Requirements: 13.14_

  - [ ]* 11.9 Write property test for voice intent converging on the typed parser flow
    - **Property 31: Voice intent converges on the typed parser flow**
    - **Validates: Requirements 13.14**

  - [ ]* 11.10 Write edge-case test for Audio_Intent_Processor timeout
    - >30s with no result terminates processing, shows error, offers retry (13.17)
    - _Requirements: 13.17_

- [ ] 12. Checkpoint - Ensure all backend service tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 13. Implement backend API routes
  - [ ] 13.1 Implement `/api/intent` and `/api/bundle` routes
    - Wire intent parsing, cache-first bundle retrieval/generation, validation (size/format), timeout enforcement, and error shaping
    - _Requirements: 7.1, 7.3, 7.5, 7.6, 8.1, 8.6, 8.7_

  - [ ] 13.2 Implement `/api/vision` and `/api/audio-intent` routes
    - Vision route: processing state, image validation, vision→parser, 12s/30s budgets; audio-intent route: clip upload, AudioIntentProcessor, 30s budget
    - _Requirements: 3.1, 3.2, 3.9, 13.9, 13.10, 13.17, 13.18_

  - [ ] 13.3 Implement `/api/smart-bundles`, `/api/smart-bundles/:id`, `/api/cross-sell`, and `/api/checkout` routes
    - Smart bundle list (4–6) and pre-assembled by-id basket; cross-sell recommendations; order submission returning confirmation with items and total
    - _Requirements: 2.1, 2.2, 6.2, 6.3, 6.4, 12.1, 12.2_

  - [ ] 13.4 Implement LLM retry policy and timeout handling middleware
    - Cap LLM retries at 3, return current selections unchanged on failure, surface terminal error after the third retry; enforce 10s LLM response budget
    - _Requirements: 11.1, 11.6_

  - [ ]* 13.5 Write integration tests for external-service routes
    - Vision_Processor end-to-end (3.3, 7.2), Audio_Intent_Processor end-to-end (13.10), Redis cache hit/miss (8.6), Catalog/Smart Bundle retrieval, order persistence (12.1, 12.2)
    - _Requirements: 3.3, 7.2, 8.6, 12.1, 12.2, 13.10_

  - [ ]* 13.6 Write edge-case tests for LLM retry exhaustion
    - All 3 retries failing shows terminal error and retains selections (11.1, 11.6)
    - _Requirements: 11.1, 11.6_

- [ ] 14. Implement Intent Hub frontend (Intent Bar, Snap, Smart Bundles)
  - [ ] 14.1 Implement `IntentBar` component
    - Oversized input with "What are you trying to do?" prompt, cycling placeholders (≥3, every 3s), 200-char cap, trim on submit, submit disabled for whitespace-only text; accepts pre-populated editable Recognized_Intent_Text
    - _Requirements: 1.1, 1.2, 1.8, 1.9, 1.10, 1.11, 1.12_

  - [ ]* 14.2 Write property test for empty intent submission being disabled
    - **Property 2: Empty intent submission is disabled**
    - **Validates: Requirements 1.8**

  - [ ]* 14.3 Write unit tests for Intent_Bar static behavior
    - Prompt text and cycling placeholders with mocked timers (1.1, 1.2), Snap_Icon presence (1.3), routing-failure text retention (1.12)
    - _Requirements: 1.1, 1.2, 1.3, 1.12_

  - [ ] 14.4 Implement `SmartBundlesGrid` and `SmartBundle` card components
    - Render min(N, 6) cards from available bundles; labels 1–60 chars; tap loads pre-assembled basket bypassing free-text generation with a concurrency guard
    - _Requirements: 1.4, 1.5, 1.6, 2.1, 2.2, 2.3_

  - [ ]* 14.5 Write property test for the Smart Bundle grid clamp to six
    - **Property 1: Smart Bundle grid display is clamped to six**
    - **Validates: Requirements 1.4, 1.5, 1.6**

  - [ ]* 14.6 Write property test for bounded non-empty Smart Bundle labels
    - **Property 4: Smart Bundle labels are bounded non-empty text**
    - **Validates: Requirements 2.1**

  - [ ]* 14.7 Write property test for Smart Bundle tap bypassing free-text generation
    - **Property 5: Smart Bundle tap bypasses free-text generation**
    - **Validates: Requirements 2.2**

  - [ ]* 14.8 Write edge-case/snapshot tests for the Intent Hub
    - Smart bundle load failure stays on hub with retry (2.6); single-column mobile layout at ≤480px (1.7)
    - _Requirements: 1.7, 2.6_

- [ ] 15. Implement Snap & Order and Voice Capture frontend
  - [ ] 15.1 Implement `SnapCapture` component
    - Camera/file picker restricted to JPEG/PNG ≤10 MB, processing state within 1s, format/size errors, timeout handling, route on valid intent
    - _Requirements: 3.1, 3.2, 3.4, 3.5, 3.7, 3.8, 3.9_

  - [ ] 15.2 Implement `MicButton` and `VoiceCapture` components
    - Mic permission request before recording, record/stop toggle with elapsed-time indicator, auto-stop at 60s, ≤10 MB and >1s bounds, route to client recognizer or `/api/audio-intent`, processing indicator, populate Intent_Bar with normalized Recognized_Intent_Text
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.7, 13.8, 13.9, 13.11, 13.12, 13.13, 13.16_

  - [ ]* 15.3 Write unit/edge-case tests for voice capture UI
    - Mic presence (13.1), permission request before recording (13.2), permission denial stays on hub with typing available (13.3), recording start/elapsed indicator (13.4), second-tap stop (13.5), auto-stop at 60s (13.6), editable text requiring explicit submit (13.13), processing indicator (13.16), recognizer error/timeout (13.19), no-speech message (13.15) — with mocked permission/media APIs and timers
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 13.5, 13.6, 13.13, 13.15, 13.16, 13.19_

- [ ] 16. Implement Category Grid and Super Quick Mode frontend
  - [ ] 16.1 Implement `CategoryGrid`, `CategoryRow`, and `BrandSwiper` components
    - Render one row per component in sequence with component-name labels; horizontal swiper of ≤50 alternatives scrolling independently of vertical scroll; default the first product in each non-empty swiper as Selected_Item; empty-state rows; substitution indicator on affected rows
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 10.3, 11.3_

  - [ ]* 16.2 Write property test for tapping a product making it the unique selection
    - **Property 12: Tapping a product makes it the unique selection in its row**
    - **Validates: Requirements 4.6**

  - [ ]* 16.3 Write edge-case test for substitution indicator guard
    - When the substitution indicator cannot be displayed, the Checkout_Button is disabled until it appears (11.4)
    - _Requirements: 11.4_

  - [ ] 16.4 Implement `SuperQuickMode`, `CartSummary`, and tier tabs
    - Three tabs (Budget/Balanced/Premium) with Balanced active by default and visually distinct; Cart_Summary with items and total in store currency; tier switch updates within budget; processing indicator on slow updates; retain prior tier on load failure
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 2.5_

  - [ ]* 16.5 Write property test for Balanced tier being the default active tier
    - **Property 6: Balanced tier is the default active tier**
    - **Validates: Requirements 2.5, 5.2**

  - [ ]* 16.6 Write edge-case test for tier load failure
    - Failed tier update retains the previously active tier's Cart_Summary and shows an error (5.6)
    - _Requirements: 5.6_

- [ ] 17. Implement Cross-Sell, Bundle Explanation, and Checkout frontend
  - [ ] 17.1 Implement `CrossSellStrip` component
    - Pinned to bottom while content scrolls; show 3–4 thematic products or hide when none share a theme; tap shows loading ≥50ms then adds to cart updating total
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  - [ ] 17.2 Implement `BundleExplanation` component
    - Show explanation naming fulfilled components when confidence ≥ 1; omit when 0; show low-confidence notice for 0–49, suppress for 50–100
    - _Requirements: 10.1, 10.2, 10.4, 10.5_

  - [ ] 17.3 Implement `CheckoutButton` component
    - Sticky bottom control; single-action submit within 2s; disabled for empty cart with empty-cart message; disabled while submitting; re-enable and preserve cart on failure/timeout
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

  - [ ]* 17.4 Write property test for checkout being disabled for an empty cart
    - **Property 27: Checkout is disabled for an empty cart**
    - **Validates: Requirements 12.3**

  - [ ]* 17.5 Write unit/edge-case tests for cross-sell and checkout
    - Cross-sell add failure retains prior total with error (6.7); checkout submission and duplicate-prevention disabling (12.1, 12.4); checkout failure/timeout preserves cart and re-enables button (12.5)
    - _Requirements: 6.7, 12.1, 12.4, 12.5_

- [ ] 18. Wire the full application together
  - [ ] 18.1 Connect frontend flows to backend endpoints
    - Wire Intent Hub → `/api/intent` + `/api/bundle` → Category_Grid; Snap → `/api/vision`; Voice server path → `/api/audio-intent`; Smart Bundle → `/api/smart-bundles/:id`; Cross-Sell → `/api/cross-sell`; Checkout → `/api/checkout`; ensure all four input modalities converge on the shared bundle rendering
    - _Requirements: 1.11, 2.2, 3.4, 8.1, 12.1, 13.14_

  - [ ] 18.2 Implement global processing-indicator and timeout/error orchestration
    - Show a processing indicator within 200ms for operations >1s; enforce typed-intent 8s and image 12s end-to-end budgets with state-preserving timeout errors
    - _Requirements: 9.1, 9.2, 9.4, 9.5, 9.6_

  - [ ]* 18.3 Write performance tests for latency budgets
    - Typed intent → grid ≤8s (9.1), image → grid ≤12s (9.2), tier switch ≤300ms (9.3), processing indicator ≤200ms (9.4), smart bundle render ≤1s (2.4) with stubbed dependencies
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 2.4_

  - [ ]* 18.4 Write responsive/snapshot tests
    - Single-column mobile layout at ≤480px (1.7), sticky Checkout_Button (5.7), pinned Cross_Sell_Strip (6.1), independent swiper scrolling (4.4)
    - _Requirements: 1.7, 4.4, 5.7, 6.1_

- [ ] 19. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional test sub-tasks and can be skipped for a faster MVP, though they validate the design's correctness properties and failure paths.
- Each task references specific requirements (granular clause numbers) for traceability.
- All 31 correctness properties from the design are each implemented by a single dedicated property-based test using `fast-check` (minimum 100 cases), placed close to the code they validate.
- The LLM, Client_Speech_Recognizer, and browser media/permission APIs are mocked in property/unit tests so they exercise our handoff, routing, and normalization logic rather than external behavior.
- Checkpoints ensure incremental validation at natural boundaries (core domain, backend services, full suite).

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "3.1", "4.1", "7.1", "10.1", "11.1", "11.3", "11.5"] },
    { "id": 2, "tasks": ["2.2", "2.3", "2.4", "3.2", "4.2", "7.2", "10.2", "11.2", "11.4", "11.6"] },
    { "id": 3, "tasks": ["2.5", "2.6", "5.1", "5.4", "5.8", "7.3", "8.1", "10.3", "11.7", "11.8"] },
    { "id": 4, "tasks": ["5.2", "5.3", "5.5", "5.6", "5.7", "5.9", "7.4", "7.5", "7.6", "8.2", "8.3", "10.4", "10.5", "10.6", "11.9", "11.10"] },
    { "id": 5, "tasks": ["9.1", "9.2"] },
    { "id": 6, "tasks": ["9.3", "9.4"] },
    { "id": 7, "tasks": ["13.1", "13.2", "13.3", "13.4"] },
    { "id": 8, "tasks": ["13.5", "13.6"] },
    { "id": 9, "tasks": ["14.1", "14.4", "15.1", "15.2", "16.1", "16.4", "17.1", "17.2", "17.3"] },
    { "id": 10, "tasks": ["14.2", "14.3", "14.5", "14.6", "14.7", "14.8", "15.3", "16.2", "16.3", "16.5", "16.6", "17.4", "17.5"] },
    { "id": 11, "tasks": ["18.1", "18.2"] },
    { "id": 12, "tasks": ["18.3", "18.4"] }
  ]
}
```
