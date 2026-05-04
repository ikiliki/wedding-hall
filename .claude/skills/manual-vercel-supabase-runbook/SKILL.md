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

### S1. Run a SQL migration

1. <https://supabase.com/dashboard> → project → **SQL Editor → New query**.
2. Paste the SQL Claude provides (always idempotent — `create table if not exists`, `create policy if not exists`, etc.).
3. **Run**.
4. Verify the change in **Table Editor** or by re-running the query.

When SQL changes, all of these stay in sync (per `.cursor/rules/finishing-checklist.mdc`):

- `supabase/schema.sql`
- `supabase/seed.sql`
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
   https://wedding-hall-client.vercel.app/auth/callback
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

### S6. Mark a user as admin (Phase 1+)

Once `profiles.is_admin` exists:

1. **SQL Editor → New query**:

   ```sql
   update public.profiles
   set is_admin = true
   where id = (select id from auth.users where email = 'friend@example.com');
   ```

2. **Run**. Verify in **Table Editor → profiles**.

The user must sign out and back in if their JWT was issued before the flip and the app caches the profile (Phase 1 reads it on each `/admin` enter).

---

## Calling out manual work in PRs / chat

When Claude opens a PR or proposes a change that requires manual work, Claude includes a `## Manual steps` section listing the relevant items by short id (V1, S2, etc.) AND inlines the steps. Example:

> ## Manual steps
>
> 1. **S1 — run migration**: paste `supabase/2026-05-03_is_admin.sql` into the Supabase SQL Editor and Run.
> 2. **S6 — mark admin**: replace `friend@example.com` with the actual email and run.
> 3. **V3 — redeploy** the client project after the schema change so the cached build is refreshed.

If the user has installed a Vercel or Supabase MCP connector, prefer the connector and skip this skill.
