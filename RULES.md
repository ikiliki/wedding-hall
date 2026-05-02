# Project rules

Binding for every change in this repository.

## Product & scope

- Follow [`PLAN.md`](./PLAN.md). Phase 1 only unless the plan is updated deliberately.
- One Supabase project: Auth + Postgres + RLS. Schema changes touch `supabase/schema.sql`, `supabase/seed.sql`, and shared types (under `packages/shared/src/types.ts`).

## Architecture

- **Client** (`client/`): Vite + React. Feature-based structure under `client/src/features/<feature>/` (components, pages, feature `lib/`). Shared UI and helpers under `client/src/shared/`. Auth runs in the browser (`supabase.auth.*`); **all data calls go through the server** via `client/src/shared/lib/api.ts`. Never call `supabase.from(...)` from the client.
- **Server** (`server/`): Next.js — the data gateway. Uses the Supabase **anon** key + the user's forwarded JWT, so RLS still enforces ownership. Endpoints documented in `server/src/lib/openapi.ts`. Never add the Supabase **service role** key without an explicit admin use case.
- **Shared** (`packages/shared/`): `@wedding-hall/shared` workspace package. Cross-package types and the venue tier prices. Both client and server import from here.

## UX & quality

- Mobile-first, black/white minimal luxury (Tailwind tokens: `ink`, `bone`, `muted`, `line`, `tracking-luxe`).
- Strict TypeScript. Prefer `type`. Use the `@/` path alias inside each package.
- Run **`npm run lint`** and **`npm run build`** from the **repo root** before merging.

## Env

- Bootstrap automation: `npm run env:local | env:cloud | env:push-vercel` (see `.cursor/skills/wedding-hall-env-bootstrap/SKILL.md`).
- Required env:
  - Client: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SERVER_URL`.
  - Server: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLIENT_ORIGIN`.

## Deploy & CI

- Production client deploy is tied to branch **`master-client`** (GitHub Action or Vercel production branch).
- Production server deploy is tied to branch **`master-server`**.
- Keep Supabase **redirect URLs** in sync with real client URLs (local + Vercel).
- After changing env on Vercel, trigger a redeploy on the affected project.

## Out of scope (still)

- Microservices split beyond `client/`, `server/`, `packages/shared/`.
- Marketplace, payments, admin panel, full wedding website — unless `PLAN.md` is updated.
- Server endpoints that bypass RLS (i.e. anything that needs the Supabase service role).
