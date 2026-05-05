-- =================================================================
-- Delete Playwright production E2E test users only
--
-- Matches disposable E2E emails (e.g. tests/e2e-prod/03-signup-gate-cleanup.spec.ts:
-- wh-e2e-signup-*@*). Bulk cleanup if per-test delete missed a row.
-- Cascades to public.profiles and
-- public.wedding_budgets via FK on delete cascade.
--
-- Run with Supabase CLI (after login + link) or Cursor MCP execute_sql; see
-- .claude/skills/supabase-e2e-test-data-cleanup/SKILL.md and
-- .claude/skills/supabase-production-reset-cli/SKILL.md:
--   npx supabase db query --linked --agent=no -f supabase/delete-e2e-test-users.sql
--
-- Or paste into Dashboard → SQL Editor.
-- =================================================================

begin;

delete from auth.users
where email ilike 'wh-e2e-%';

commit;
