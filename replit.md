# SkyReserve

A production-grade flight booking management platform: customers search/book flights with seat selection and boarding passes, admins manage airlines/flights/customers/bookings and inspect the underlying database (triggers, stored procedures, views, query explorer).

## Run & Operate

- `pnpm --filter @workspace/flight-booking run dev` — run the web frontend (artifact `flight-booking`, previewPath `/`)
- `pnpm --filter @workspace/api-server run dev` — run the API server (artifact `api-server`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks (`lib/api-client-react`) and Zod schemas (`lib/api-zod`) from `lib/api-spec/openapi.yaml` after any endpoint change
- `pnpm --filter @workspace/db run push` — push Drizzle schema changes (dev only)
- `psql "$DATABASE_URL" -f lib/db/sql/triggers.sql` (and `procedures.sql`, `views.sql`) — (re)apply the raw Postgres triggers/procedures/views; these are NOT managed by Drizzle push
- `node artifacts/api-server/dist/seed.cjs` after building a CJS bundle of `src/scripts/seed.ts` with esbuild (external: pino*) — seeds airlines/flights/seats/customers/bookings; idempotent (skips if flights already exist); promotes the first seeded customer to `role=admin`
- Required env: `DATABASE_URL`, `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5 (`artifacts/api-server`), Zod-validated (Zod v4) via generated schemas
- Frontend: React + Vite (`artifacts/flight-booking`), wouter routing, framer-motion, shadcn/ui, Tailwind v4
- Auth: Clerk (`@clerk/express`, `@clerk/react`), role (`customer`/`admin`) stored on `customers.role`, JIT-provisioned from the Clerk user on first authenticated request
- DB: PostgreSQL + Drizzle ORM; 3 real Postgres triggers, 3 plpgsql stored procedures, 3 SQL views (raw `.sql`, not Drizzle-managed)
- API codegen: Orval (OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS/ESM bundles per artifact)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for every API endpoint/schema; run codegen after editing
- `lib/db/src/schema/*` — Drizzle table defs (airlines, customers, flights, seats, bookings, savedPassengers, paymentMethods, wishlist, notifications, dbFeatures)
- `lib/db/sql/{triggers,procedures,views}.sql` — real Postgres objects backing the "Database Features" admin UI
- `artifacts/api-server/src/lib/{auth,serializers,procedures,queryDefinitions}.ts` — Clerk auth/JIT provisioning, DB-row→API-response serializers, procedure execution wrappers, curated Query Explorer definitions
- `artifacts/api-server/src/routes/*` — one router per resource, mounted under `/api` in `src/app.ts`
- `artifacts/flight-booking/src/pages/{app,admin}/*` — customer vs. admin page trees; `App.tsx` has the full route table

## Architecture decisions

- The source SQL schema (Airlines/Flights/Customers/Bookings + 3 triggers/3 procedures/3 views) targets Oracle PL/SQL; since the DB is Postgres/Drizzle, triggers/procedures/views were re-implemented as real Postgres plpgsql functions/triggers and SQL views (applied via psql), not app-level logic — keeps them genuinely inspectable in the admin "Database Features" UI.
- Query Explorer exposes only a curated, server-defined list of parametrized/read-only SQL queries (`queryDefinitions.ts`) — no free-form user SQL, for safety.
- Extended the core 4-table schema with production tables (seats, saved_passengers, payment_methods, wishlist, notifications, trigger_logs, procedure_executions) under FKs to customers/flights/bookings.
- First admin account comes from the seed script promoting one seeded customer to `role=admin`; further promotions happen via `PATCH /api/customers/:id` by an existing admin.

## Product

- Customers: browse/search flights, view seat maps, book with passenger + payment details, manage bookings (view/cancel/download boarding pass with QR), saved passengers, saved payment methods, wishlist, notifications, profile.
- Admins: dashboard analytics (revenue, occupancy, top customers/flights, airline comparison, activity feed), CRUD over airlines/flights/customers/bookings, and a Database Features control room (trigger logs, stored-procedure runner, view dashboards, query explorer with export).

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- `artifacts/api-server` bundles with esbuild + `esbuild-plugin-pino`; running one-off scripts (like the seed script) with `tsx`/`node --import tsx` fails because `tsx` isn't a devDependency — bundle the script to CJS with esbuild first (externalize `pino`/`pino-http`/`pino-pretty` to dodge the pino worker/`__dirname`-in-ESM issue).
- All `/api/*` routes are mounted under the `/api` prefix in `app.ts` — always call `${BASE_URL}api/...` from the frontend, never a root-relative path.
- `/api/health` does not exist; the health check route is `/api/healthz`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
