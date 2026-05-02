---
name: wedding-hall-deploy
description: Deploy Wedding Hall monorepo — Vercel (client + server), Supabase redirects, Git branches master-client and master-server.
---

# Wedding Hall — deploy skill

Use when cutting a production release or fixing "works locally, broken in prod" for this repo.

## Preconditions

- One **Supabase** project; `seed.sql` has been run at least once for the target project.
- Two **Vercel** projects: **Root Directory** `client` and `server`.
- Env populated via `.cursor/skills/wedding-hall-env-bootstrap/SKILL.md` (or by hand).

## Supabase → client URL alignment

In **Authentication → URL configuration**:

- **Site URL** = production client URL (e.g. `https://wedding-hall-client.vercel.app`).
- **Redirect URLs** must include:
  - `http://localhost:5173/auth/callback`
  - `https://<production-client-host>/auth/callback`

Email provider: **Confirm email** off for the seeded demo user flow (see `README.md`).

## Environment variables

**Client** (Vite — only `VITE_` prefix is bundled):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SERVER_URL` — the production server Vercel URL (e.g. `https://wedding-hall-server.vercel.app`).

Set on the **client** Vercel project and in `client/.env.local` locally.

**Server**:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY` (anon only — never service role)
- `CLIENT_ORIGIN` — comma-separated list of allowed browser origins. Include the production client URL and any preview domains you expect to call from. Local Vite (`http://localhost:5173`) is always allowed.

Set on the **server** Vercel project and in `server/.env.local` locally.

Bootstrap automation: `npm run env:cloud -- --ref <project-ref>` then `npm run env:push-vercel -- --client-project ... --server-project ...`. See env-bootstrap skill.

## Git branches & CI

- **`master-client`** — push triggers Vercel auto-deploy of `wedding-hall-client` (Production Branch).
- **`master-server`** — push triggers Vercel auto-deploy of `wedding-hall-server`.
- **`main`** / **`master`** — `.github/workflows/ci.yml` runs lint + build (no deploy).

## Post-deploy smoke test

1. Open server `/api/health` — JSON `{ "ok": true, ... }`.
2. Open server `/docs` — Swagger UI lists `/api/profiles`, `/api/budget`, etc.
3. Open client `/` — confirms the welcome screen renders (black bg, white text, the "Let's start" CTA).
4. Open client `/login`, sign in with demo user (after `seed.sql`).
5. Watch the network tab: signin uses Supabase directly; profile upsert + budget fetch hit the **server** with `Authorization: Bearer ...`.
6. Walk through `/start` → `/start/couple` → `/start/date` → ... → `/start/continue-gate`. Save & go to dashboard. Confirm `/dashboard` and `/budget` both render the totals + line items.

If the wizard's catalog or pricing was changed, also re-run `supabase/schema.sql` so the `auth.users` trigger and any new columns (`selections`, `guest_count_min/max`) exist.

## Common failures

- **Auth redirect mismatch** — add exact callback URL to Supabase Redirect URLs.
- **Blank client after deploy** — missing `VITE_*` on Vercel client project; rebuild.
- **CORS error in browser** — `CLIENT_ORIGIN` on the server project doesn't include the calling client origin. Add it (comma-sep) and redeploy the server.
- **`fetch ${VITE_SERVER_URL}/api/budget` fails / 404** — `VITE_SERVER_URL` on the client points somewhere wrong. Update + redeploy client.
- **401 from `/api/budget` immediately after sign-in** — server is rejecting the JWT. Verify `SUPABASE_URL` / `SUPABASE_ANON_KEY` on the server match the same Supabase project the client signed in against.
- **CI build fails** — run `npm run lint` and `npm run build` from repo root.

## After changing env on Vercel

Vercel does **not** auto-rebuild on env changes. Trigger a redeploy on the affected project after pushing new variables.
