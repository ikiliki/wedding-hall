# Project rules

Binding for every change in this repository.

## Product & scope

- Follow [`PLAN.md`](./PLAN.md). Phase 1 only unless the plan is updated deliberately.
- One Supabase project: Auth + Postgres + RLS. Schema changes touch `supabase/schema.sql`, `supabase/seed.sql`, and shared types (under `client/src/shared/lib/types.ts`).

## Architecture

- **Client** (`client/`): Vite + React. Feature-based structure under `client/src/features/<feature>/` (components, pages, feature `lib/`). Shared UI and helpers under `client/src/shared/`.
- **Server** (`server/`): Next.js for APIs and future backend work. Keep it small until there is a concrete need.
- **Do not** duplicate business rules (e.g. venue tier prices): single source in `client/src/shared/lib/venue-pricing.ts` for the MVP UI; if the server needs them later, import or share via a small package — don’t hardcode second copies.

## UX & quality

- Mobile-first, black/white minimal luxury (Tailwind tokens: `ink`, `bone`, `muted`, `line`, `tracking-luxe`).
- Strict TypeScript. Prefer `type`. Use the `@/` path alias inside each package.
- Run **`npm run lint`** and **`npm run build`** from the **repo root** before merging.

## Deploy & CI

- Production client deploy is tied to branch **`master-client`** (GitHub Action or Vercel production branch).
- Production server deploy is tied to branch **`master-server`**.
- Keep Supabase **redirect URLs** in sync with real client URLs (local + Vercel).

## Out of scope (still)

- Microservices split beyond this client/server layout.
- Marketplace, payments, admin panel, full wedding website — unless `PLAN.md` is updated.
