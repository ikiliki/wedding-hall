# Project rules

Binding for every change in this repository.

## Product & scope

- Follow [`PLAN.md`](./PLAN.md). Phase 1 only unless the plan is updated deliberately.
- One Supabase project: Auth + Postgres + RLS. Schema changes touch `supabase/schema.sql`, `supabase/seed.sql`, and shared types (under `packages/shared/src/types.ts`).

## Architecture

- **Client** (`client/`): Vite + React. Feature-based structure under `client/src/features/<feature>/` (components, pages, feature `lib/`). Shared UI and helpers under `client/src/shared/`. Auth runs in the browser (`supabase.auth.*`); **all data calls go through the server** via `client/src/shared/lib/api.ts`. Never call `supabase.from(...)` from the client. Supabase Storage uploads (`supabase.storage`) from the client are allowed for admin photo uploads.
- **Server** (`server/`): Next.js — the data gateway. Uses two trust levels:
  - **Anon key + user JWT** (`supabaseForRequest`) for user-owned data. RLS applies.
  - **Service role** (`supabaseServiceRole`) for admin endpoints only — `GET|POST /api/admin/categories`, `GET|POST|PUT|DELETE /api/admin/vendors/[id]`. Always verify the caller is in `admin_users` via `requireAdmin()` before using the service-role client.
- **Shared** (`packages/shared/`): `@wedding-hall/shared` workspace package. Cross-package types (including `Vendor`, `VendorCategory` and their payloads) and the venue tier prices. Both client and server import from here.

### Admin user management

Membership lives in `public.admin_users`. Add an admin by inserting a row:

```sql
insert into public.admin_users (user_id) values ('<uuid>');
```

The `POST /api/profiles` endpoint derives `is_admin` by reading the caller’s own row in `admin_users` with the forwarded JWT (RLS `admin_users_select_own`). Vendor admin routes still require `SUPABASE_SERVICE_ROLE_KEY` after `requireAdmin()` passes.

## UX & quality

- Mobile-first, black/white minimal luxury. Default rules describe the mobile layout; desktop is added with `@media (min-width: 640|768|1024|1280px)`. The wizard must work on iPhone SE (320 × 568) with no horizontal scroll. Full invariants and patterns are binding via [`.claude/skills/mobile-responsive-css/SKILL.md`](./.claude/skills/mobile-responsive-css/SKILL.md) — read it before touching CSS.
- Client styling is **global `wh-*` classes** declared in `client/src/styles/style.css` (base + tokens) or `client/src/styles/stitch-overrides.css` (active wizard/dashboard theme). Tokens: `--wh-ink`, `--wh-bone`, `--wh-muted`, `--wh-line`.
- **No utility-class soup.** Every component imports its class names from a co-located `<Name>.styles.ts` that exports `wh-*` strings. No inline `style=` for layout — only for genuinely dynamic values that can't be expressed in CSS (e.g. `style={{ width: \`${pct}%\` }}` for a progress fill). No `<style>` tags inside components. No third stylesheet — extend `style.css` or `stitch-overrides.css`.
- No new dependency on a CSS framework (Tailwind, etc.). Vanilla CSS only; PostCSS is autoprefixer-only.
- Strict TypeScript. Prefer `type`. Use the `@/` path alias inside each package.
- Run **`npm run lint`** and **`npm run build`** from the **repo root** before merging.

## Env

- Bootstrap automation: `npm run env:local | env:cloud | env:push-vercel` (see `.claude/skills/wedding-hall-env-bootstrap/SKILL.md`).
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
