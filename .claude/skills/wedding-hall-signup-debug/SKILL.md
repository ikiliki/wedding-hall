---
name: wedding-hall-signup-debug
description: Diagnose "email already registered" / "user not in DB" / signup-flow bugs in production. Use when a user reports they cannot sign up, the duplicate-email flow looks broken, or profiles aren't being created.
---

# Signup debugging runbook

Wedding Hall has **no custom signup endpoint** — the browser calls
`supabase.auth.signUp` directly. Profile rows are then created two ways:

1. **`auth.users` trigger** (`handle_new_auth_user`) — fires
   `after insert on auth.users` and inserts a matching `public.profiles`
   row. **This is the primary path** and runs even before the user has a
   session.
2. **`POST /api/profiles`** — the client calls this after sign-in /
   sign-up succeeds. Idempotent upsert; mostly redundant given (1), but
   cheap insurance.

The schema for both lives in `supabase/schema.sql`. Re-running the file
is safe (everything is `if not exists` / `or replace`).

## Symptom: "email already registered" but user invisible in DB

People usually look at `public.profiles` only. Check **`auth.users`**:

1. Open the Supabase project that matches `VITE_SUPABASE_URL` (this is
   the one the client signs into — confirm before anything else).
2. Authentication → Users (or `select id, email, email_confirmed_at, created_at from auth.users where email = ...`).
3. If the row exists in `auth.users` but not `public.profiles`:
   - You're on a project that pre-dates the `handle_new_auth_user`
     trigger. **Re-run `supabase/schema.sql`** in the SQL editor — the
     trigger is created idempotently. Future signups self-heal; for
     historical rows, run:
     ```sql
     insert into public.profiles (id, email, full_name)
     select u.id, u.email, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name')
     from auth.users u
     left join public.profiles p on p.id = u.id
     where p.id is null;
     ```
4. If the row exists in `auth.users` with `email_confirmed_at IS NULL`,
   the duplicate-email error happens because Supabase counts unconfirmed
   accounts as "taken". Either the user confirms their email, or you
   delete the stale row from the dashboard.

## Symptom: signup succeeds but no session returned

`data.session` is `null` after `supabase.auth.signUp`. This is normal
behaviour when **Authentication → Providers → Email → Confirm email** is
ON. The UI shows a "check your inbox" message. To make local / demo flows
instant, turn that toggle off and re-run `supabase/seed.sql`.

## Symptom: signup gives "already registered" for a brand-new email

A few possible causes:

- The client's `VITE_SUPABASE_URL` and the server's `SUPABASE_URL` point
  at **different** Supabase projects. The client tries to write to
  Project A; the user actually exists in Project B from a previous
  experiment. Align them and redeploy.
- Supabase returns a "fake" user object with `identities: []` when the
  email is taken (an anti-enumeration measure). The form code in
  `client/src/features/auth/components/EmailLoginForm/index.tsx` already
  detects this and offers "Switch to sign in" + "Email me a reset link".

## Sanity script (paste into Supabase SQL Editor)

```sql
select
  (select count(*) from auth.users)        as auth_users,
  (select count(*) from public.profiles)   as profiles,
  (select count(*) from auth.users u
     left join public.profiles p on p.id = u.id where p.id is null) as orphans;
```

`orphans = 0` is the healthy state once the trigger is in place.

## What the UI does today

`EmailLoginForm` (`client/src/features/auth/components/EmailLoginForm/index.tsx`):

- Catches the duplicate-email error and offers two recovery actions
  (switch tab, email reset link).
- Pre-fills the seeded demo creds **only in dev** (`import.meta.env.DEV`).
  In production the form ships empty.

`AuthCallbackPage` (`client/src/features/auth/pages/AuthCallbackPage.tsx`):

- Exchanges the PKCE code, calls `upsertProfile` (best-effort), then
  routes through `getPostAuthPath`.

## Symptom: "Signed up, but could not reach the Wedding Hall server"

This message comes from `EmailLoginForm` when the post-auth
`POST /api/profiles` call fails. As of the latest build it is treated
as **non-fatal** (the DB trigger has already created the profile row,
so we let the user in and just log a warning) — but if the user *is*
still seeing it, the underlying call genuinely failed and three things
are worth checking, in order:

1. **`VITE_SERVER_URL` on the Vercel client project** — must point at
   the production server URL (e.g. `https://wedding-hall-server.vercel.app`),
   no trailing slash. Vercel does not auto-rebuild on env changes; trigger
   a redeploy after editing.
2. **`CLIENT_ORIGIN` on the Vercel server project** — must include the
   production client origin (e.g. `https://wedding-hall-client.vercel.app`),
   comma-separated if you have preview domains too. If this is missing
   or misspelled the browser blocks the call as a CORS error and the
   client sees it as a network failure.
3. **Same Supabase project on both sides** — `VITE_SUPABASE_URL` /
   `VITE_SUPABASE_ANON_KEY` (client) must match `SUPABASE_URL` /
   `SUPABASE_ANON_KEY` (server). Mismatch produces a 401 on every
   server call; the form now surfaces that with a specific message
   instead of the generic "could not reach" line.

`server/api/health` is a great smoke test from the browser:
`https://<server>/api/health` should return `{ "ok": true, ... }`.

## Don't

- Don't add the Supabase **service role** key to fix this. The trigger +
  RLS-friendly upsert covers every case; service-role would silently
  bypass row policies and create a real security risk.
