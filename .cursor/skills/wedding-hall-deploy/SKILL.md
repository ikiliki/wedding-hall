---
name: wedding-hall-deploy
description: Deploy Wedding Hall monorepo — Vercel (client + server), Supabase redirects, Git branches master-client and master-server.
---

# Wedding Hall — deploy skill

Use when cutting a production release or fixing “works locally, broken in prod” for this repo.

## Preconditions

- One **Supabase** project; `seed.sql` has been run at least once for the target project.
- Two **Vercel** projects: **Root Directory** `client` and `server`.

## Supabase → client URL alignment

In **Authentication → URL configuration**:

- **Site URL** = production client URL (e.g. `https://wedding-hall-client.vercel.app`).
- **Redirect URLs** must include:
  - `http://localhost:5173/auth/callback`
  - `https://<production-client-host>/auth/callback`

Email provider: **Confirm email** off for the seeded demo user flow (see `README.md`).

## Environment variables

**Client (Vite — only `VITE_` prefix is bundled):**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

Set these on the **client** Vercel project and in `client/.env.local` locally.

**Server:** no Supabase vars required until server code calls Supabase with a **service role** key. Never put the service role in the client.

## Git branches & CI

- **`master-client`** — push triggers Vercel auto-deploy of `wedding-hall-client` (Production Branch).
- **`master-server`** — push triggers Vercel auto-deploy of `wedding-hall-server`.
- **`main`** / **`master`** — `.github/workflows/ci.yml` runs lint + build (no deploy).

## Post-deploy smoke test

1. Open client `/login`, sign in with demo user (after `seed.sql`).
2. Complete onboarding; confirm `/dashboard` shows totals.
3. Open server `/api/health` — JSON `{ "ok": true, ... }`.

## Common failures

- **Auth redirect mismatch** — add exact callback URL to Supabase Redirect URLs.
- **Blank client after deploy** — missing `VITE_*` on Vercel client project; rebuild.
- **CI build fails** — run `npm run lint` and `npm run build` from repo root.
