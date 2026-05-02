# AGENTS.md

Read this first (human or agent). Cursor also loads [`.cursor/rules/`](./.cursor/rules/).

## What this is

**Wedding Hall** — wedding-budget app in a **monorepo**:

- **`client/`** — Vite + React + TypeScript + Tailwind. Auth (`supabase.auth.*`) runs in the browser with the Supabase anon key. **All data calls go through the server** via `client/src/shared/lib/api.ts`.
- **`server/`** — **Next.js 15** data gateway: `/api/health`, `/api/openapi.json`, `/docs`, `/api/profiles`, `/api/budget`. Uses the Supabase **anon** key + the calling user's forwarded JWT — RLS still enforces ownership. Do not add the service role key here.
- **`packages/shared/`** — `@wedding-hall/shared`. Cross-package types, venue tier prices, **the budget catalog (every wizard category + tier)**, and the pricing function used by both client (preview) and server (recompute). Single source.
- **`supabase/`** — SQL: `schema.sql`, `seed.sql` (idempotent). Includes the `handle_new_auth_user` trigger that auto-provisions a `public.profiles` row on every signup.

## User-facing flow

1. `/` — Welcome screen ("Let's start").
2. `/login` — sign in / sign up. Duplicate-email error offers one-click recovery.
3. `/start` → `/start/couple` → `/start/date` → `/start/guests` → `/start/type` → 8 hall categories → `/start/continue-gate` → optional 7 extended categories → `/start/completion`. State lives in `WizardProvider` and persists to `localStorage`. Server save happens at the gate and on completion.
4. `/dashboard` — game-style home: progress bar, totals, tile menu (Home / Budget / Vendors / Purchase / Website).
5. `/budget` — split view: estimated (left, computed) vs actual (right, editable, autosaved).

## Docs order

1. [`PLAN.md`](./PLAN.md) — scope.
2. [`RULES.md`](./RULES.md) — binding rules.
3. [`README.md`](./README.md) — setup, env, Supabase URLs, deploy.

## Conventions

- **Client feature layout**: `client/src/features/<feature>/components/`, `.../pages/`, optional `.../lib/`. Shared: `client/src/shared/components/`, `client/src/shared/lib/`.
- **Colocate styles**: each component folder has `index.tsx` + `<Name>.styles.ts`. Storybook is planned — not required until it is added.
- **Imports**: `@/*` → `client/src/*` (client) or `server/src/*` (server). Cross-package types: `@wedding-hall/shared`.
- **Money**: `formatILS()` from `@wedding-hall/shared` (re-exported as `client/src/shared/lib/venue-pricing.ts`). Tier numbers only in `packages/shared/src/venue-pricing.ts`.
- **Data IO**: client uses `client/src/shared/lib/api.ts` (`fetchBudget`, `saveBudget`, `upsertProfile`). Never call `supabase.from(...)` in the client.
- **Server routes**: under `server/src/app/api/<name>/route.ts`. Always wrap responses with `withCors`, validate inputs, derive `user_id` from the JWT (never the body).
- **Git / deploy**: integrate on `main`; ship client via **`master-client`**, server via **`master-server`** (see `.github/workflows/`).

## Skills (Cursor)

- [`.cursor/skills/wedding-hall-deploy/SKILL.md`](./.cursor/skills/wedding-hall-deploy/SKILL.md) — branches, Vercel, Supabase redirect checklist.
- [`.cursor/skills/wedding-hall-env-bootstrap/SKILL.md`](./.cursor/skills/wedding-hall-env-bootstrap/SKILL.md) — `npm run env:local|cloud|push-vercel`.
- [`.cursor/skills/local-docker-stack/SKILL.md`](./.cursor/skills/local-docker-stack/SKILL.md) — full app on `docker compose`.
- [`.cursor/skills/wedding-hall-budget-flow/SKILL.md`](./.cursor/skills/wedding-hall-budget-flow/SKILL.md) — adding a new wizard category, changing prices, debugging totals.
- [`.cursor/skills/wedding-hall-signup-debug/SKILL.md`](./.cursor/skills/wedding-hall-signup-debug/SKILL.md) — runbook for "email already registered" / orphaned `auth.users` rows / signup-flow bugs.
