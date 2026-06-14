# Amazon Instant Engine — Backend

Node.js + Express + TypeScript backend implementing intent-first shopping:
typed/voice/image/Smart-Bundle inputs all converge on a single `StructuredIntent`
that drives deterministic bundle generation, ranking, cross-sell, and checkout.

## Requirements

- Node.js 18+ (tested on 23)
- MongoDB (optional — falls back to an in-memory catalog if not connected)
- Redis (optional — bundle cache silently falls back to regeneration)

## Setup

```bash
cd backend
npm install
cp .env.example .env   # adjust values as needed
```

By default `LLM_API_KEY` is empty, so the backend uses a deterministic local
stub for intent parsing, vision, and audio — meaning it runs fully offline with
no external credentials. Set `LLM_API_KEY` to wire in a real multi-modal LLM.

## Run

```bash
npm run dev      # watch mode (ts-node-dev)
npm run build    # compile to dist/
npm start        # run compiled server
npm run seed     # seed MongoDB with sample catalog + smart bundles
npm test         # property/unit tests (added with the test tasks)
```

The server listens on `PORT` (default `4000`). Health check: `GET /health`.

## API

| Method | Path                     | Purpose                                            |
| ------ | ------------------------ | -------------------------------------------------- |
| POST   | `/api/intent`            | Parse typed intent → `StructuredIntent`            |
| POST   | `/api/bundle`            | Cache-first generate/retrieve bundle + cross-sell  |
| POST   | `/api/vision`            | Image (multipart `image`) → intent → bundle        |
| POST   | `/api/audio-intent`      | Audio (multipart `audio` + `durationMs`) → text    |
| GET    | `/api/smart-bundles`     | List up to 6 Smart Bundle cards                    |
| GET    | `/api/smart-bundles/:id` | Pre-assembled 3-tier basket                        |
| POST   | `/api/cross-sell`        | Thematic recommendations for an intent             |
| POST   | `/api/checkout`          | Submit the active cart as an order                 |

## Structure

```
src/
  config/        env, logger, mongo, redis
  types/         shared domain types (the StructuredIntent contract)
  errors/        domain error types with HTTP/code mapping
  services/      deterministic core + LLM-backed services (interfaces.ts)
  repositories/  catalog, smart bundles, orders, redis bundle cache
  models/        Mongoose schemas
  controllers/   request handlers + zod schemas
  middlewares/   async wrapper, error handler, uploads, validation
  routes/        /api router
  seed/          sample data + seed script
  app.ts         Express app factory
  index.ts       server bootstrap
```

## Security note

The API is currently **unauthenticated**. Before any public deployment, add
authentication/authorization and rate limiting in front of the mutating routes
(`/api/checkout` in particular).
