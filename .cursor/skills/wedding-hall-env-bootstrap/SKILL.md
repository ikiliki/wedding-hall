---
name: wedding-hall-env-bootstrap
description: Populate Wedding Hall env vars (Supabase URL + anon key, server origin) for local dev, Supabase Cloud, or Vercel — all via `npm run env:*`. Lists what still needs manual clicks in the Supabase / Vercel dashboards.
---

# Wedding Hall — env bootstrap

Use when the user says "set up env", "fetch supabase keys", "push env to vercel", or is wiring a fresh clone.

The single source of truth is `scripts/setup-env.mjs`. It has three modes; each maps to a root npm script.

## 1. Local docker / native dev

```bash
npm run env:local
```

Writes well-known dev values to:

- `client/.env.local` — `VITE_SUPABASE_URL=http://localhost:54321`, `VITE_SUPABASE_ANON_KEY=<dev jwt>`, `VITE_SERVER_URL=http://localhost:3001`
- `server/.env.local` — `SUPABASE_URL=http://localhost:54321`, `SUPABASE_ANON_KEY=<dev jwt>`, `CLIENT_ORIGIN=http://localhost:5173`

Then either `docker compose up -d --build` or `npm run dev:client` + `npm run dev:server`.

## 2. Supabase Cloud project

```bash
npm run env:cloud -- --ref <project-ref> \
  [--server-url https://<your-server>.vercel.app] \
  [--client-origin https://<your-client>.vercel.app]
```

Prereqs:

- `npm i -g supabase` and `supabase login` (one-time).
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

- `npm i -g vercel` and `vercel login` (one-time).
- `client/.env.local` and `server/.env.local` already populated (use mode 1 or 2 first, or hand-edit).

Idempotent: removes-then-adds each variable so re-runs don't duplicate.

**Manual step**: trigger a redeploy on each Vercel project after pushing — Vercel does not auto-rebuild on env changes.

## When NOT to use this skill

- Schema changes — that's `.cursor/rules/supabase.mdc` + `supabase/schema.sql`.
- Production cutover — also follow `.cursor/skills/wedding-hall-deploy/SKILL.md` for branch / Vercel project setup.

## Don't

- Don't put `SUPABASE_SERVICE_ROLE_KEY` in `server/.env.local`. The server runs as the calling user via the anon key + the user's JWT (RLS still applies).
- Don't reuse the local dev anon key in production.
