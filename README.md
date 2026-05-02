# Wedding Hall

Monorepo for a minimal black-and-white wedding-budget **MVP**: a **React (Vite)** client and a small **Next.js** server, with **Supabase** (Auth + Postgres) and deploys on **Vercel**.

> Scope: [`PLAN.md`](./PLAN.md). Rules: [`RULES.md`](./RULES.md). Agent context: [`AGENTS.md`](./AGENTS.md).

## Repository layout

| Path | Role |
|------|------|
| [`client/`](./client/) | Vite + React + TypeScript + Tailwind. Feature-based folders under `client/src/features/`. Auth and budget CRUD talk to Supabase from the browser (anon key + RLS). |
| [`server/`](./server/) | Minimal Next.js 15 app (`/api/health` today). Expand with APIs or webhooks when needed. |
| [`supabase/`](./supabase/) | `schema.sql`, `seed.sql` — single Supabase project for DB + Auth. |

## Local development

```bash
git clone https://github.com/ikiliki/wedding-hall.git
cd wedding-hall
npm install
```

### Client (port 5173)

```bash
cp client/.env.example client/.env.local
# VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
npm run dev:client
```

Open <http://localhost:5173>.

### Server (port 3001)

```bash
npm run dev:server
```

Open <http://localhost:3001> and <http://localhost:3001/api/health>.

### All checks (from repo root)

```bash
npm run lint
npm run build
```

---

## Supabase (one project)

1. Create a project at <https://supabase.com>.
2. **Project Settings → API**: `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (same values as the old `NEXT_PUBLIC_*` vars).
3. **Authentication → Providers → Email**: for the demo user `test@gmail.com` / `test1234`, turn **Confirm email** **OFF** (see [`supabase/seed.sql`](./supabase/seed.sql)).
4. **Authentication → URL configuration**
   - **Site URL**: your production client URL (e.g. `https://your-client.vercel.app`).
   - **Redirect URLs** (add every environment you use):

     ```
     http://localhost:5173/auth/callback
     https://<your-client-prod-domain>/auth/callback
     ```

5. **SQL Editor**: run [`supabase/seed.sql`](./supabase/seed.sql) once (idempotent). It creates tables, RLS, and the pre-confirmed demo user.

The **server** deploy does not need Supabase env vars until you add server-side Supabase calls. Then add `SUPABASE_SERVICE_ROLE_KEY` only in the **server** Vercel project (never expose it to the client).

---

## Deploy (Vercel + GitHub Actions)

Use **two Vercel projects** on the **same repo**:

| Vercel project | Root directory | Production branch (recommended) | Env vars |
|----------------|----------------|----------------------------------|----------|
| Wedding Hall **client** | `client` | `master-client` | `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |
| Wedding Hall **server** | `server` | `master-server` | (none required for health only) |

### Option A — Vercel dashboard only

1. Import the repo twice; set **Root Directory** to `client` and `server` respectively.
2. Set each project’s **Production Branch** to `master-client` or `master-server` (or use one `main` branch and [Ignore Build Step](https://vercel.com/docs/concepts/projects/overview#ignored-build-step) — see workflows for path-based ideas).
3. Add env vars on the **client** project. Redeploy after changing Supabase URLs.

### CI

[`.github/workflows/ci.yml`](./.github/workflows/ci.yml) runs on push/PR to **`main`** / **`master`** — lint + build both packages, no deploy.

### Git branching

- Day-to-day: `main`. CI keeps both packages healthy.
- **Release client**: fast-forward or merge `main` → `master-client`. Vercel auto-deploys the **client** project.
- **Release server**: fast-forward or merge `main` → `master-server`. Vercel auto-deploys the **server** project.

---

## Phase scope

Phase 1 only — see [`PLAN.md`](./PLAN.md). No marketplace, payments, or admin in this repo yet.
