# Wedding Hall

Monorepo for a minimal black-and-white wedding-budget **MVP**: a **React (Vite)** client, a **Next.js** data-gateway server, **Supabase** (Auth + Postgres) and deploys on **Vercel**.

> Scope: [`PLAN.md`](./PLAN.md). Rules: [`RULES.md`](./RULES.md). Agent context: [`AGENTS.md`](./AGENTS.md).

## Architecture at a glance

```
[ Browser (React) ] ──auth (signin/signup/exchangeCodeForSession)──► [ Supabase Auth ]
        │
        └──data calls + Authorization: Bearer <jwt>──► [ Wedding Hall server (Next.js) ]
                                                                │
                                                                └──forwards JWT──► [ Supabase Postgres + RLS ]
```

- Browser keeps the Supabase Auth session (anon key in the bundle).
- Every read/write of `profiles` and `wedding_budgets` goes through the server's `/api/profiles` and `/api/budget` endpoints.
- Server uses Supabase **anon key only** + the user's JWT, so RLS still enforces row ownership. No service-role key.

## Repository layout

| Path | Role |
|------|------|
| [`client/`](./client/) | Vite + React + TypeScript + Tailwind. Feature folders under `client/src/features/`. Auth in the browser; data through `client/src/shared/lib/api.ts`. |
| [`server/`](./server/) | Next.js 15 data gateway. `/api/health`, `/api/openapi.json`, `/docs`, `/api/profiles`, `/api/budget`. |
| [`packages/shared/`](./packages/shared/) | `@wedding-hall/shared` — cross-package types and venue tier prices. |
| [`supabase/`](./supabase/) | `schema.sql`, `seed.sql` — single Supabase project for DB + Auth. |
| [`scripts/setup-env.mjs`](./scripts/setup-env.mjs) | Env bootstrapper (`npm run env:local | env:cloud | env:push-vercel`). |

## Local development

Two ways to run the stack — pick one. Both clone the repo first:

```bash
git clone https://github.com/ikiliki/wedding-hall.git
cd wedding-hall
```

### Option A — One command, fully containerised (recommended)

Brings up Postgres, gotrue (Supabase Auth), postgrest, an nginx Supabase gateway, the React client, and the Next.js server. No Supabase Cloud account needed.

```bash
docker compose up -d --build
```

URLs:

| Service | URL |
|---------|-----|
| Client (Vite) | <http://localhost:5173> |
| Server | <http://localhost:3001> (`/api/health`, `/docs`, `/api/budget`, …) |
| Supabase API gateway | <http://localhost:54321> |
| Postgres | `localhost:54322` (user `postgres` / password `postgres`) |

A one-shot `seed` container loads `supabase/seed.sql` automatically (creates the demo user `test@gmail.com` / `test1234`). Watch it finish with:

```bash
docker compose logs -f seed
```

To wipe and start fresh: `docker compose down -v && docker compose up -d --build`.

See [`.cursor/skills/local-docker-stack/SKILL.md`](./.cursor/skills/local-docker-stack/SKILL.md).

### Option B — Native Node (no Docker)

```bash
npm install

# Bootstrap env files for local docker / native dev with the well-known dev keys:
npm run env:local
# (writes client/.env.local + server/.env.local)

npm run dev:client     # → http://localhost:5173
npm run dev:server     # → http://localhost:3001
```

If you'd rather point at Supabase Cloud, use `npm run env:cloud -- --ref <project-ref>` instead — see the env-bootstrap skill below.

### All checks (from repo root)

```bash
npm run lint
npm run build
```

---

## Env bootstrapping

`scripts/setup-env.mjs` writes both `.env.local` files for you and can push them to Vercel.

| Goal | Command |
|------|---------|
| Local docker / native dev | `npm run env:local` |
| Pull keys from Supabase Cloud | `npm run env:cloud -- --ref <project-ref> [--server-url URL] [--client-origin URL]` |
| Push current env to Vercel | `npm run env:push-vercel -- --client-project <name> --server-project <name> [--env production]` |

Prereqs the script needs (one-time):

- `npm i -g supabase` + `supabase login` for `--from-supabase`.
- `npm i -g vercel` + `vercel login` for `--push-vercel`.

Full guide: [`.cursor/skills/wedding-hall-env-bootstrap/SKILL.md`](./.cursor/skills/wedding-hall-env-bootstrap/SKILL.md).

### Required variables

**Client (`client/.env.local` and Vercel client project):**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SERVER_URL` — base URL of the Wedding Hall server (`http://localhost:3001` locally, your server Vercel URL in prod).

**Server (`server/.env.local` and Vercel server project):**

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `CLIENT_ORIGIN` — comma-separated list of allowed browser origins (e.g. `https://wedding-hall-client.vercel.app`). Local Vite (`http://localhost:5173`) is always allowed.

---

## Supabase (one project)

1. Create a project at <https://supabase.com>.
2. **Project Settings → API**: this is where `npm run env:cloud -- --ref <ref>` reads the URL + anon key from. (You can also copy them by hand.)
3. **Authentication → Providers → Email**: for the demo user `test@gmail.com` / `test1234`, turn **Confirm email** **OFF** (see [`supabase/seed.sql`](./supabase/seed.sql)).
4. **Authentication → URL configuration**:
   - **Site URL**: your production client URL (e.g. `https://your-client.vercel.app`).
   - **Redirect URLs** (add every environment you use):

     ```
     http://localhost:5173/auth/callback
     https://<your-client-prod-domain>/auth/callback
     ```

5. **SQL Editor**: run [`supabase/seed.sql`](./supabase/seed.sql) once (idempotent). It creates tables, RLS, and the pre-confirmed demo user.

The **server** does NOT need `SUPABASE_SERVICE_ROLE_KEY` — it uses the anon key + the user's forwarded JWT so RLS stays in charge. Don't add the service-role key unless a future endpoint genuinely needs to bypass RLS.

---

## Deploy (Vercel + GitHub Actions)

Use **two Vercel projects** on the **same repo**:

| Vercel project | Root directory | Production branch (recommended) | Env vars |
|----------------|----------------|----------------------------------|----------|
| Wedding Hall **client** | `client` | `master-client` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SERVER_URL` |
| Wedding Hall **server** | `server` | `master-server` | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLIENT_ORIGIN` |

### Option A — Vercel dashboard only

1. Import the repo twice; set **Root Directory** to `client` and `server` respectively.
2. Set each project's **Production Branch** to `master-client` or `master-server`.
3. Add env vars on each Vercel project (or run `npm run env:push-vercel`). Redeploy after changes — Vercel does not auto-rebuild on env updates.

### CI

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on push/PR to **`main`** / **`master`** — lint + build both packages, no deploy.

### Git branching

- Day-to-day: `main`. CI keeps both packages healthy.
- **Release client**: fast-forward or merge `main` → `master-client`. Vercel auto-deploys the **client** project.
- **Release server**: fast-forward or merge `main` → `master-server`. Vercel auto-deploys the **server** project.

---

## Phase scope

Phase 1 only — see [`PLAN.md`](./PLAN.md). No marketplace, payments, or admin in this repo yet.
