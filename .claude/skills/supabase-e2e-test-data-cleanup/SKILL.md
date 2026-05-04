---
name: supabase-e2e-test-data-cleanup
description: Remove Playwright production E2E accounts from Supabase (auth.users where email matches wh-e2e-%) — MCP execute_sql or supabase db query. Does not run full production reset.
---

# Wedding Hall — clean up Playwright E2E test data

Use after **`npm run test:e2e:prod`** against a shared Supabase project (e.g. production). Removes **only** accounts created by [`tests/e2e-prod/wizard-new-user.spec.ts`](../../../tests/e2e-prod/wizard-new-user.spec.ts), which register emails matching:

- `wh-e2e-%` (e.g. `wh-e2e-u1-123456789@test.example`)

Deleting those **`auth.users`** rows cascades to **`public.profiles`** and **`public.wedding_budgets`** (`ON DELETE CASCADE`).

## What this is not

- **Not** the full production wipe from [manual-vercel-supabase-runbook § S7](../manual-vercel-supabase-runbook/SKILL.md) / [`supabase/production-reset-keep-categories.sql`](../../../supabase/production-reset-keep-categories.sql).
- **Not** guaranteed if another table references the user **without** cascade (rare for E2E-only users). If `delete` fails, check **`public.vendors.created_by`** or fix FKs in SQL Editor.

## SQL (source of truth)

[`supabase/delete-e2e-test-users.sql`](../../../supabase/delete-e2e-test-users.sql):

```sql
delete from auth.users
where email ilike 'wh-e2e-%';
```

(Wrapped in `begin`/`commit` in the file.)

## Option A — Cursor Supabase MCP (no local CLI)

1. Resolve **`project_id`**: Cloud project ref from [`AGENTS.md`](../../../AGENTS.md) / `.env.example` (`SUPABASE_PROJECT_REF`), or MCP **`list_projects`**.
2. Call **`execute_sql`** with that `project_id` and the `delete` statement above (or run the file contents as one query).

## Option B — Supabase CLI (matches [supabase-production-reset-cli](../supabase-production-reset-cli/SKILL.md))

Requires **`supabase login`** + **`supabase link`** (database password), **not** the anon key.

From repo root:

```powershell
npm run supabase:cleanup-e2e-users
```

Or:

```powershell
npx supabase db query --linked --agent=no -f supabase/delete-e2e-test-users.sql
```

## Verify

```sql
select id, email from auth.users where email ilike 'wh-e2e-%';
```

Expect **no rows**.
