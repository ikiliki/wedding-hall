# AGENTS.md

Read this first (human or agent). Cursor also loads [`.cursor/rules/`](./.cursor/rules/).

## What this is

**Wedding Hall** — wedding-budget app in a **monorepo**:

- **`client/`** — Vite + React + TypeScript + global CSS (`client/src/styles/style.css`, `wh-*` classes). Auth (`supabase.auth.*`) runs in the browser with the Supabase anon key. **All data calls go through the server** via `client/src/shared/lib/api.ts`.
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
4. [`.cursor/rules/rules-maintenance.mdc`](./.cursor/rules/rules-maintenance.mdc) — when and how to update, create, or delete rules.

## Conventions

- **Client feature layout**: `client/src/features/<feature>/components/`, `.../pages/`, optional `.../lib/`. Shared: `client/src/shared/components/`, `client/src/shared/lib/`.
- **Colocate styles**: each component folder has `index.tsx` + `<Name>.styles.ts`. The `.styles.ts` file exports `wh-*` class-name string constants only; the actual CSS lives in `client/src/styles/style.css` (base + tokens) or `client/src/styles/stitch-overrides.css` (active wizard/dashboard theme). No inline `style=` for layout, no `<style>` tags inside components, no Tailwind / no utility-class soup. **Storybook**: co-located `<Name>.stories.tsx`; run `npm run storybook -w wedding-hall-client` (or `npm run storybook` from repo root). The Storybook vite config aliases `@/shared/lib/supabase` to `src/storybook/mocks/supabase-client.ts`; MSW serves `/api/budget` and `/api/profiles` against `http://localhost:3001` — no gateway or real Supabase project required for UI work.
- **Mobile-first invariants** (binding — see [`.claude/skills/mobile-responsive-css/SKILL.md`](./.claude/skills/mobile-responsive-css/SKILL.md) for the full skill):
  - Test every wizard step at **320 × 568** (iPhone SE) and **360 × 640**. No horizontal scroll, ever.
  - Containers use `width: 100%; max-inline-size: min(<n>rem, 100%)`, never a bare `max-width: <n>rem`.
  - Flex/grid children that hold text or inputs need `min-width: 0`. Pair with `overflow-wrap: anywhere` for long unbreakable strings (Hebrew runs, URLs).
  - Fullscreen containers use `100dvh` with `100vh` as fallback (iOS Safari address-bar fix).
  - Popovers / tooltips / dropdowns clamp width to `min(<cap>, calc(100vw - 2rem))`.
  - Default rules are mobile; add desktop with `@media (min-width: 640|768|1024|1280px)`. Avoid `@media (max-width: 639px)` patches that paper over a desktop-first rule.
  - `box-sizing: border-box` and the media-element reset are global in `style.css` — don't redeclare them locally.
- **Imports**: `@/*` → `client/src/*` (client) or `server/src/*` (server). Cross-package types: `@wedding-hall/shared`.
- **Money**: `formatILS()` from `@wedding-hall/shared` (re-exported as `client/src/shared/lib/venue-pricing.ts`). Tier numbers only in `packages/shared/src/venue-pricing.ts`.
- **Data IO**: client uses `client/src/shared/lib/api.ts` (`fetchBudget`, `saveBudget`, `upsertProfile`). Never call `supabase.from(...)` in the client.
- **Server routes**: under `server/src/app/api/<name>/route.ts`. Always wrap responses with `withCors`, validate inputs, derive `user_id` from the JWT (never the body).
- **Git / deploy**: integrate on `main`; ship client via **`master-client`**, server via **`master-server`** (see `.github/workflows/`).

## Skills

All skills live under [`.claude/skills/`](./.claude/skills/):

- [`.claude/skills/wedding-hall-deploy/SKILL.md`](./.claude/skills/wedding-hall-deploy/SKILL.md) — branches, Vercel, Supabase redirect checklist.
- [`.claude/skills/wedding-hall-env-bootstrap/SKILL.md`](./.claude/skills/wedding-hall-env-bootstrap/SKILL.md) — `npm run env:local|cloud|push-vercel`.
- [`.claude/skills/local-docker-stack/SKILL.md`](./.claude/skills/local-docker-stack/SKILL.md) — full app on `docker compose`.
- [`.claude/skills/wedding-hall-budget-flow/SKILL.md`](./.claude/skills/wedding-hall-budget-flow/SKILL.md) — adding a new wizard category, changing prices, debugging totals.
- [`.claude/skills/wedding-hall-signup-debug/SKILL.md`](./.claude/skills/wedding-hall-signup-debug/SKILL.md) — runbook for "email already registered" / orphaned `auth.users` rows / signup-flow bugs.
- [`.claude/skills/mobile-responsive-css/SKILL.md`](./.claude/skills/mobile-responsive-css/SKILL.md) — mobile-first invariants, per-component checklist.
- [`.claude/skills/manual-vercel-supabase-runbook/SKILL.md`](./.claude/skills/manual-vercel-supabase-runbook/SKILL.md) — exact steps for Vercel/Supabase dashboard actions.
- [`.claude/skills/wedding-hall-pr-workflow/SKILL.md`](./.claude/skills/wedding-hall-pr-workflow/SKILL.md) — branch naming, commit format, PR template.
- [`.claude/skills/admin-vendor-management/SKILL.md`](./.claude/skills/admin-vendor-management/SKILL.md) — admin_users table, vendor catalog, service-role setup, photo upload, category-wizard linking.
