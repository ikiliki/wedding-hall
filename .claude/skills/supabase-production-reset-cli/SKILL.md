---
name: supabase-production-reset-cli
description: Run SQL with Supabase CLI only. Use Cursor Supabase MCP to read project ref, API URL, and publishable keys—export them to the shell—then supabase login, link, and db query. Repo has schema.sql + seed.sql; destructive snippets in manual runbook § S7.
---

# Wedding Hall — Supabase CLI + MCP keys (no `psql`, no MCP `execute_sql`)

Use this skill when the agent should run **raw SQL against the remote database using only the official Supabase CLI** (`npx supabase`).

The repo keeps [`supabase/schema.sql`](../../../supabase/schema.sql) and [`supabase/seed.sql`](../../../supabase/seed.sql). Maintenance / wipe SQL is **not** stored as extra `.sql` files — copy from [`.claude/skills/manual-vercel-supabase-runbook/SKILL.md`](../manual-vercel-supabase-runbook/SKILL.md) **§ S7**.

**Cross-reference:** manual runbook § S0, S7.

## What MCP gives you (read-only)

Before any CLI command, call the **Cursor Supabase MCP** tools and **write the values into the shell session** (PowerShell examples):

| MCP tool | Arguments | Put into env / variable |
|----------|-----------|-------------------------|
| **`list_projects`** | — | Pick **`ref`** → `PROJECT_REF` (same as project id string). |
| **`get_project`** | `id` = `PROJECT_REF` | Confirm region / status if needed. |
| **`get_project_url`** | `project_id` = `PROJECT_REF` | `$env:SUPABASE_URL = "<url>"` |
| **`get_publishable_keys`** | `project_id` = `PROJECT_REF` | Use the **legacy anon** JWT (or active publishable key) → `$env:SUPABASE_ANON_KEY = "<key>"` |

These keys are the **same** keys shown under Project Settings → **API**. They power **`supabase-js` / PostgREST** — **they do not authenticate `supabase db query --linked`.**

## Hard requirement — CLI auth for database SQL

`supabase db query --linked` talks to your project **through the Supabase CLI login**, not through the anon API key.

You **still** need **both** of the following (neither is returned by `get_publishable_keys`):

1. **Supabase account access token** — one of:
   - Run **`npx supabase login`** once on the machine (interactive), **or**
   - Set **`$env:SUPABASE_ACCESS_TOKEN`** to a **personal access token** from [Supabase Dashboard → Account → Access Tokens](https://supabase.com/dashboard/account/tokens) (the user may paste it; MCP does not expose this token today).

2. **Database password** (Postgres role `postgres`) — from Project Settings → **Database** — for **`supabase link`**:
   ```powershell
   npx supabase link --project-ref $env:PROJECT_REF --password "<DATABASE_PASSWORD>"
   ```

**Never** paste the anon/service_role **project** API key into place of `SUPABASE_ACCESS_TOKEN` or the database password — they are different secrets.

## Canonical agent workflow (CLI only)

1. **`mcp_auth`** on the Supabase MCP server if needed.
2. **`list_projects`** → set `$env:PROJECT_REF = '<ref>'`.
3. **`get_project_url`** → set `$env:SUPABASE_URL`.
4. **`get_publishable_keys`** → set `$env:SUPABASE_ANON_KEY` (documents parity with cloud; optional for `supabase projects api-keys` checks).
5. Ensure **`SUPABASE_ACCESS_TOKEN`** is available (`supabase login` or export PAT).
6. **`npx supabase link --project-ref $env:PROJECT_REF --password '<DB_PASSWORD>'`** (from Dashboard → Database).
7. Run SQL:
   ```powershell
   npx supabase db query --linked --agent=no -c "select current_database();"
   ```
   Or from file:
   ```powershell
   npx supabase db query --linked --agent=no -f supabase/schema.sql
   ```

Use **`--agent=no`** when you want human-readable table output instead of the JSON agent envelope.

### Alternative: `--db-url` (still CLI-only)

If you have the **full Postgres URI** (includes database password), you can skip `link`:

```powershell
npx supabase db query --db-url $env:DATABASE_URL --agent=no -c "select 1"
```

Build `DATABASE_URL` from Dashboard → **Database** → **Connection string** → URI (percent-encode special characters in the password). The anon key from MCP **cannot** build this URI.

## Verify

After destructive snippets (§ S7), confirm row counts with **`supabase db query --linked`** `-c "select ..."` or use the dashboard **Table Editor**.

For **only** Playwright prod E2E accounts (`wh-e2e-%`), use [supabase-e2e-test-data-cleanup](../supabase-e2e-test-data-cleanup/SKILL.md) — not a full reset.

## Troubleshooting

| Symptom | What to try |
|--------|-------------|
| `Access token not provided` | `npx supabase login` or set **`SUPABASE_ACCESS_TOKEN`** (account PAT — **not** anon key from MCP). |
| `Cannot find project ref` | Run **`supabase link`** with **`PROJECT_REF`** from MCP `list_projects`. |
| Assumed anon key runs SQL | Wrong — use **account token** + **`link`** + **`db query --linked`**, or **`--db-url`** with Postgres URI. |
| Want keys in env | MCP **`get_publishable_keys`** + **`get_project_url`** — good for app parity; **not** sufficient alone for `db query`. |
