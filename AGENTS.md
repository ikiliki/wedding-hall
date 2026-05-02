# AGENTS.md

Read this first (human or agent). Cursor also loads [`.cursor/rules/`](./.cursor/rules/).

## What this is

**Wedding Hall** — Phase 1 wedding-budget MVP in a **monorepo**:

- **`client/`** — Vite + React + TypeScript + Tailwind. Supabase Auth and `wedding_budgets` / `profiles` access from the **browser** with the **anon** key and RLS.
- **`server/`** — Minimal **Next.js 15** app (`/api/health`). Add env + Supabase service role only when server code must bypass RLS.
- **`supabase/`** — SQL: `schema.sql`, `seed.sql` (idempotent).

## Docs order

1. [`PLAN.md`](./PLAN.md) — scope.
2. [`RULES.md`](./RULES.md) — binding rules.
3. [`README.md`](./README.md) — setup, env, Supabase URLs, deploy.

## Conventions

- **Client feature layout**: `client/src/features/<feature>/components/`, `.../pages/`, optional `.../lib/`. Shared: `client/src/shared/components/`, `client/src/shared/lib/`.
- **Colocate styles**: each component folder has `index.tsx` + `<Name>.styles.ts`. Storybook is planned — not required until it is added.
- **Imports**: `@/*` → `client/src/*` (see `client/vite.config.ts`).
- **Money**: `formatILS()` from `client/src/shared/lib/venue-pricing.ts`. Tier numbers only in that module.
- **Git / deploy**: integrate on `main`; ship client via **`master-client`**, server via **`master-server`** (see `.github/workflows/`).

## Skills (Cursor)

Repo skill: [`.cursor/skills/wedding-hall-deploy/SKILL.md`](./.cursor/skills/wedding-hall-deploy/SKILL.md) — branches, Vercel, Supabase redirect checklist.
