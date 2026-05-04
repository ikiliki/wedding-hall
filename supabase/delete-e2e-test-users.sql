-- =================================================================
-- Delete Playwright production E2E test users only
--
-- Matches emails produced by tests/e2e-prod/wizard-new-user.spec.ts
-- (wh-e2e-u1-*@*, wh-e2e-u2-*@*, etc.). Cascades to public.profiles and
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
