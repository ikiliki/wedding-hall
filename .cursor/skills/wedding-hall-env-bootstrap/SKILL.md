---
name: wedding-hall-env-bootstrap
description: Populate Wedding Hall env vars (Supabase URL + anon key, server origin) for local dev, Supabase Cloud, or Vercel — all via `npm run env:*`. Lists what still needs manual clicks in the Supabase / Vercel dashboards.
---

# Wedding Hall — env bootstrap

Use when the user says "set up env", "fetch supabase keys", "push env to vercel", or is wiring a fresh clone.

## Mode files vs local files

Vite reads env in this order (later wins):

1. `client/.env.development` (committed) — dev-mode default for `vite dev`.
2. `client/.env.production` (committed) — prod-mode default for `vite build` (Vercel).
3. `client/.env.local` (gitignored) — your local override, applied in any mode.
4. `client/.env.{mode}.local` (gitignored) — local override scoped to one mode.

The committed mode files only carry **non-secret** defaults (today: `VITE_SERVER_URL`). Real Supabase credentials always live in `.env.local` (locally) or Vercel project env (in prod).

The server has no mode files — only `server/.env.local` and Vercel project env.

## 1. Local docker / native dev

```bash
npm run env:local
```

Writes well-known dev values to:

- `client/.env.local` — `VITE_SUPABASE_URL=http://localhost:54321`, `VITE_SUPABASE_ANON_KEY=<dev jwt>`.
  (`VITE_SERVER_URL` comes from `client/.env.development`.)
- `server/.env.local` — `SUPABASE_URL=http://localhost:54321`, `SUPABASE_ANON_KEY=<dev jwt>`, `CLIENT_ORIGIN=http://localhost:5173`.

Then either `docker compose up -d --build` or `npm run dev:client` + `npm run dev:server`.

## 2. Supabase Cloud project

```bash
npm run env:cloud -- --ref <project-ref> \
  [--server-url https://<your-server>.vercel.app] \
  [--client-origin https://<your-client>.vercel.app]
```

Prereqs:

- `npm i -g supabase` and `supabase login` (one-time) — or set `SUPABASE_ACCESS_TOKEN` in the env, which the CLI auto-reads.
- `<project-ref>` is the random ID in the dashboard URL.

The script shells out to `supabase projects api-keys --project-ref <ref> --output json`, finds the `anon` row, and writes both `.env.local` files. It does NOT fetch `service_role` (we don't need it).

**Manual steps the script can NOT do** (Supabase has no public API for them on the free tier — script prints this checklist too):

1. Auth → URL configuration → **Site URL** = your production client URL.
2. Auth → URL configuration → **Redirect URLs** include:
   - `http://localhost:5173/auth/callback`
   - `https://<your-client-prod>/auth/callback`
3. Auth → Providers → Email → **Confirm email** OFF (only if you want the seed demo user `test@gmail.com` / `test1234` to log in without an inbox).
4. SQL Editor → run `supabase/seed.sql` once (idempotent).

## 3. Push env to Vercel

```bash
npm run env:push-vercel -- \
  --client-project wedding-hall-client \
  --server-project wedding-hall-server \
  [--env production|preview|development]
```

Prereqs:

- `npm i -g vercel` and `vercel login` (one-time) — or set `VERCEL_TOKEN`.
- `client/.env.local` and `server/.env.local` already populated (use mode 1 or 2 first, or hand-edit).

What it pushes per project:

- **client**: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and (if present) `VITE_SERVER_URL`. Skip `VITE_SERVER_URL` here unless you need to override the default in `client/.env.production` for this specific environment.
- **server**: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `CLIENT_ORIGIN`.

Idempotent: removes-then-adds each variable so re-runs don't duplicate.

**Manual step**: trigger a redeploy on each Vercel project after pushing — Vercel does not auto-rebuild on env changes.

## When NOT to use this skill

- Schema changes — that's `.cursor/rules/supabase.mdc` + `supabase/schema.sql`.
- Production cutover — also follow `.cursor/skills/wedding-hall-deploy/SKILL.md` for branch / Vercel project setup.

## Don't

- Don't put `SUPABASE_SERVICE_ROLE_KEY` in `server/.env.local`. The server runs as the calling user via the anon key + the user's JWT (RLS still applies).
- Don't reuse the local dev anon key in production.
- Don't put real anon keys in `client/.env.development` / `client/.env.production` — those files are committed.
