-- 2026-05-03 — add `is_admin` to public.profiles.
--
-- Run once in the Supabase SQL Editor (S1 in
-- .claude-rules/skills/manual-vercel-supabase-runbook). Idempotent: safe
-- to re-run. New signups default to `is_admin = false`. To grant access:
--   update public.profiles
--   set is_admin = true
--   where id = (select id from auth.users where email = '<friend@example.com>');
--
-- The `/admin` route in the client is gated on this column. RLS still
-- only lets each authenticated user read their own row, so admins
-- discover their own flag — cross-user reads are deferred until we
-- agree on a service-role exception (see PLAN.md and RULES.md).

alter table public.profiles
  add column if not exists is_admin boolean not null default false;

-- No new RLS policies. The existing `profiles_select_own` policy is
-- enough for the client to read its own `is_admin` flag through the
-- server's anon-key + forwarded-JWT path.
