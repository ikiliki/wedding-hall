# SKILL: wedding-hall-pr-workflow

How Claude proposes changes in this repo. Treat this as the contract Claude follows when the user asks "create a PR".

## Branch naming

- `feat/<short-slug>` — new feature.
- `fix/<short-slug>` — bug fix.
- `chore/<short-slug>` — refactor, deps, docs-only.
- One topic per branch. Don't mix UI fixes and an unrelated migration.

Branch off `main`. Never commit to `main`, `master-client`, or `master-server` directly.

## Commit format

Conventional Commits with package scope:

```
feat(client): debounce /budget autosave
fix(server): allow Hebrew characters in profile names
chore(supabase): sync schema.sql with prod migration
```

Subject under ~72 chars. Body optional but useful for non-obvious changes — explain *why*, not *what*.

Group related edits into one commit. A typical PR for this repo is 3–6 commits, not 30.

## Finishing checklist (before opening PR)

Run from the **repo root**:

```bash
npm run lint
npm run build
```

Both must pass. If you touched SQL, also run the migration locally (`docker compose down -v && up --build`) and confirm seed completes.

Per `.cursor/rules/finishing-checklist.mdc`:

1. Matches `PLAN.md` (Phase 1) — or `PLAN.md` is updated in this same PR with explicit reasoning.
2. Lint + build green from repo root.
3. SQL changes: `schema.sql` + `seed.sql` + `packages/shared/src/types.ts` together.
4. New `/api/*` routes: `server/src/lib/openapi.ts` + validators in `server/src/lib/budget.ts` (or sibling) + matching `client/src/shared/lib/api.ts` helper.
5. Auth URL changes: README + Supabase redirect list (S2 in `manual-vercel-supabase-runbook`).
6. Env var changes: `.env.example`, `client/.env.example`, `server/.env.example`, `docker-compose.yml`, `scripts/setup-env.mjs`, env-bootstrap skill — all in sync.
7. No new `supabase.from(...)` in the client.

## PR description template

````markdown
## What

One paragraph. Why this PR exists, what it does at a product level.

## Changes

- `path/to/file.tsx:LL` — short reason
- `path/to/other.ts:LL` — short reason
- `supabase/schema.sql` — added X column

## Manual steps

(If any. List by id from `manual-vercel-supabase-runbook` and inline the steps.)

1. **S1 — run migration**: paste the idempotent SQL from `supabase/schema.sql` (or the PR snippet) into Supabase SQL Editor → Run.
2. **V1 — Vercel env**: add `ADMIN_EMAILS` on `wedding-hall-server` project → redeploy.

## Risk / rollback

- What breaks if this is wrong, and the one-line rollback (`git revert <sha>` or "drop column").

## Out of scope

- Anything that came up but isn't in this PR — link to a follow-up issue or task.

## Test plan

- [ ] Local: `docker compose up -d --build`, demo login, walk wizard end-to-end
- [ ] Lint + build green from repo root
- [ ] Specific to this PR: …
````

## Push + open PR (user runs these on Windows)

The Cowork sandbox cannot push to GitHub for the user. Claude prepares the branch + commits locally, then hands the user these commands:

```bash
# from repo root, branch already created by Claude
git push -u origin <branch-name>

# Either open in browser:
gh pr create --base main --head <branch-name> --fill --web
# Or, without gh, paste this URL:
# https://github.com/ikiliki/wedding-hall/compare/main...<branch-name>?expand=1
```

After merging into `main` and CI is green, ship per `.cursor/skills/wedding-hall-deploy/SKILL.md`:

```bash
git checkout master-client && git merge --ff-only main && git push   # client deploy
git checkout master-server && git merge --ff-only main && git push   # server deploy
```

## What NOT to do

- Don't squash unrelated changes into one giant commit.
- Don't push to `main` directly.
- Don't merge a PR that doesn't have a Manual steps section when SQL or env changed.
- Don't open a PR without `npm run lint && npm run build` passing.
