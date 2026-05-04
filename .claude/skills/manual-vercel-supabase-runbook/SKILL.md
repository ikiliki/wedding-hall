# SKILL: manual-vercel-supabase-runbook

When Claude can't reach Vercel or Supabase directly (no MCP connector, no CLI auth in the sandbox), Claude tells the user the exact steps to do in the dashboards. **Never** leave the user with "go change it in Vercel" without the steps.

This skill is the canonical source for those steps. When Claude proposes a change that requires manual work, Claude links to the relevant section here and pastes the steps inline so the user doesn't have to context-switch.

---

## Vercel — common manual steps

### V1. Add or change an env var

1. Go to <https://vercel.com/dashboard>.
2. Open the right project: `wedding-hall-client` for `VITE_*` vars, `wedding-hall-server` for server vars.
3. **Settings → Environment Variables**.
4. Add/edit the var. Pick the right environment (**Production**, **Preview**, **Development** — usually all three).
5. Save.
6. **Redeploy** (Vercel does NOT auto-rebuild on env changes):
   - **Deployments → ⋯ on the latest deploy → Redeploy** (uncheck "Use existing build cache" to be safe).

When the user is changing a lot at once, prefer `npm run env:push-vercel -- --client-project wedding-hall-client --server-project wedding-hall-server --env production` from the repo (see `.cursor/skills/wedding-hall-env-bootstrap/SKILL.md`).

### V2. Wire production branches

The repo uses two production branches.

1. Vercel **client** project → **Settings → Git → Production Branch** → `master-client`. Root Directory `client`.
2. Vercel **server** project → **Settings → Git → Production Branch** → `master-server`. Root Directory `server`.

### V3. Trigger a redeploy after a Supabase change

After running SQL or rotating a Supabase key, env vars on Vercel may now be wrong (e.g. anon key rotated) or right but the running deploy doesn't see them. Always **redeploy** (V1 step 6) after a Supabase env change.

### V4. Add a custom domain

1. Project → **Settings → Domains** → Add.
2. Update DNS at the registrar with the records Vercel shows.
3. Add the new origin to:
   - Server env `CLIENT_ORIGIN` (comma-sep list).
   - Supabase **Authentication → URL Configuration → Site URL** + Redirect URLs (S2 below).

---

## Supabase — common manual steps

### S0. Which SQL files are safe for production (and which are not)

| File | Production |
|------|------------|
| `supabase/schema.sql` | **Yes** — idempotent structure, RLS, triggers, and reference inserts for `vendor_categories` (`on conflict … do nothing`). Does **not** wipe user tables. |
| `supabase/seed.sql` | **Local/docker only** — demo user (`test@gmail.com`) + staff admin (`admin@weddinghall.app`); **do not** run on production as part of every deploy. |

Schema changes belong in **`schema.sql`** (and matching TS/OpenAPI). Ad-hoc destructive wipes are **not** checked in — see **S7**.

The wizard questionnaire (hall steps, prices, copy) lives in `packages/shared/src/budget-catalog.ts`, not in Postgres — resetting the DB does not remove it.

### S1. Run a SQL migration

1. <https://supabase.com/dashboard> → project → **SQL Editor → New query**.
2. Paste the SQL Claude provides (always idempotent — `create table if not exists`, `create policy if not exists`, etc.).
3. **Run**.
4. Verify the change in **Table Editor** or by re-running the query.

**Automation (optional, not configured in this repo today):** CI does **not** push migrations. Options when you outgrow manual paste: (1) GitHub Action on `main` with `supabase db push` or `psql` and the DB URL in **repository secrets**; (2) Supabase Dashboard linked migrations / branching if your org uses that workflow; (3) keep manual **S1** until you need automation. Prefer versioned files under `supabase/migrations/` once you adopt the Supabase CLI.

When SQL changes, all of these stay in sync (per `.cursor/rules/finishing-checklist.mdc`):

- `supabase/schema.sql`
- `supabase/seed.sql` (for **local/docker parity** — not something you re-run on production every time; see **S0**)
- `packages/shared/src/types.ts`
- `server/src/lib/openapi.ts` (if a route field changed)
- `server/src/lib/budget.ts` validators (if a budget field changed)

### S2. Update redirect URLs

Whenever a new client origin appears (new Vercel domain, custom domain, new env), add it.

1. **Authentication → URL Configuration**.
2. **Site URL** = production client URL (one entry).
3. **Redirect URLs** — add every origin + `/auth/callback`. At minimum:

   ```
   http://localhost:5173/auth/callback
   https://wedding-hall-gamma.vercel.app/auth/callback
   https://<custom-domain>/auth/callback
   ```

4. **Save**.

### S3. Confirm-email setting (demo flow)

For the seeded demo user (`test@gmail.com` / `test1234`) to sign in without a magic link:

1. **Authentication → Providers → Email**.
2. Toggle **Confirm email** **OFF**.
3. **Save**.

Note: this lowers signup security. The README documents this as an MVP-only choice. Re-enable before Phase 2.

### S4. Pull project keys into local env

Use the script — don't copy/paste the keys by hand:

```bash
npm run env:cloud -- --ref <project-ref>
```

This reads the URL + anon key from Supabase Cloud and writes both `client/.env.local` and `server/.env.local`. Prereq: `npm i -g supabase && supabase login` once.

### S5. Reset / rebuild local Supabase data

The local docker stack is fully throwaway:

```bash
docker compose down -v
docker compose up -d --build
docker compose logs -f seed   # wait for "Seed complete"
```

That re-runs `supabase/seed.sql` from scratch.

### S7. Production full reset (keep `vendor_categories` only)

Use when you need a **clean slate** in production: remove **all** vendors, budgets, profiles, admin rows, and **all** Auth users, while **preserving** `public.vendor_categories` (and the questionnaire in `budget-catalog.ts`, which is not stored in the DB).

In Cursor, use **Supabase CLI** per [`.claude/skills/supabase-production-reset-cli/SKILL.md`](../supabase-production-reset-cli/SKILL.md) (MCP fetches ref/URL/keys; `supabase db query --linked` runs the SQL), or paste into **SQL Editor** below.

1. **Back up** anything you might need (exports, screenshots). This is irreversible.

2. **SQL Editor** (or MCP) → **Part 1** — application data only (does **not** delete Auth yet):

   ```sql
   begin;

   delete from public.vendors;

   delete from public.admin_users;

   truncate table public.wedding_budgets;

   commit;
   ```

3. **Part 2** — remove Auth users only when ready (cascades profiles, sessions, etc.). Either **Authentication → Users** bulk delete, or:

   ```sql
   begin;
   delete from auth.users;
   commit;
   ```

   If `delete from auth.users` fails (permissions / pooler), use the dashboard.

4. **Storage** → bucket `vendor-photos`: delete leftover objects (optional cleanup after vendors are gone).

5. Recreate admin access per **Phase 2** in `PLAN.md` (`admin_users` / signup), not by re-running `seed.sql` on production unless you explicitly want demo accounts again.

6. **V3** — redeploy client/server if needed so env and builds match expectations.

### S6. Mark a user as admin

1. **Authentication → Users**: copy the user’s UUID, or resolve by email in SQL:

   ```sql
   insert into public.admin_users (user_id)
   values ((select id from auth.users where email = 'friend@example.com'))
   on conflict (user_id) do nothing;
   ```

2. **Run**. Verify in **Table Editor → admin_users** (or query `select * from public.admin_users`).

The user may need to trigger `POST /api/profiles` again (e.g. revisit `/admin`) so the client picks up `is_admin: true`.

---

## Calling out manual work in PRs / chat

When Claude opens a PR or proposes a change that requires manual work, Claude includes a `## Manual steps` section listing the relevant items by short id (V1, S2, etc.) AND inlines the steps. Example:

> ## Manual steps
>
> 1. **S1 — run migration**: paste the **idempotent** update from `supabase/schema.sql` (or the PR’s migration snippet) into the Supabase SQL Editor and Run.
> 2. **S6 — mark admin**: replace `friend@example.com` with the actual email and run.
> 3. **V3 — redeploy** the client project after the schema change so the cached build is refreshed.

If the user has installed a Vercel or Supabase MCP connector, prefer the connector and skip this skill.
