# CLAUDE.md

Working notes for Claude (Cowork mode / Claude Code) on this repo. **Read [`AGENTS.md`](./AGENTS.md) first** — it's still the agent orientation doc and is shared with Cursor.

## Source of truth

The Cursor rules in [`.cursor/rules/`](./.cursor/rules/) are **binding for Claude too**. No duplication. When a Cursor rule and this file disagree, the Cursor rule wins.

Read these in order at session start (or when picking up unfamiliar work):

1. [`PLAN.md`](./PLAN.md) — scope (Phase 1 only).
2. [`RULES.md`](./RULES.md) — binding rules.
3. [`AGENTS.md`](./AGENTS.md) — orientation, conventions, skills index.
4. [`.cursor/rules/project-overview.mdc`](./.cursor/rules/project-overview.mdc) — package map + scripts.
5. The remaining `.cursor/rules/*.mdc` files as relevant to the task (they have `globs:` frontmatter — match them to the files you're touching).

## Claude-specific working agreements

These extend (not replace) the Cursor rules.

### Before doing real work

- Use the **TodoList** tool for any multi-step task. Mark tasks `in_progress` before starting and `completed` only when fully done (lint + build pass for code work).
- Use **AskUserQuestion** when a request is underspecified — don't guess scope. Especially: scope-stretch beyond `PLAN.md`, anything that touches the service-role key, anything that creates new server endpoints.
- Spawn a **Plan** subagent for non-trivial design or audit passes; spawn an **Explore** subagent for "where is X" lookups across the repo. Don't burn the main thread on file-fishing.

### Editing

- One feature per branch: `feat/<short-slug>` or `fix/<short-slug>`. Never commit on `main` directly.
- Conventional Commits (`feat(client): …`, `fix(server): …`, `chore(supabase): …`). Match the style of the existing log.
- Touch the **minimum** number of files. Cite file paths + line numbers in the PR description.
- Don't introduce a third source of truth — extend `@wedding-hall/shared`, `client/src/shared/lib/api.ts`, or `server/src/lib/openapi.ts` instead of inventing siblings.

### Running things

- I cannot run `docker compose`, `git push`, `vercel`, or `supabase` commands in a way that touches the user's machine or accounts. I run **lint + build** in the sandbox; the user runs deploy/push/dashboard work.
- When something needs to be done **manually** in Vercel or Supabase, **always** call out the exact steps using [`.claude/skills/manual-vercel-supabase-runbook/SKILL.md`](./.claude/skills/manual-vercel-supabase-runbook/SKILL.md). Don't leave the user to figure it out.
- After every meaningful code change, run `npm run lint && npm run build` from the **repo root** before committing (per `.cursor/rules/finishing-checklist.mdc`).

### Cross-OS gotcha (Windows host + Linux sandbox)

- The host is Windows; the sandbox is Linux. Without `core.autocrlf=input` in the sandbox's git config, every file shows as modified due to CRLF. The fix is local to the sandbox clone (`git -c core.autocrlf=input ...` or `git config core.autocrlf input` once).
- Recommended one-time on the user's Windows side: add a `.gitattributes` with `* text=auto eol=lf` so this doesn't recur on fresh clones.

### Deferring out-of-scope work

If a request would expand `PLAN.md` (vendors, marketplace, admin cross-user reads, service-role server endpoints, new wedding types), **stop and ask**. Don't quietly grow the scope. If the user OKs it, update `PLAN.md` and `RULES.md` in the same PR.

## Skills

All skills live under [`.claude/skills/`](./.claude/skills/) and are available as slash commands:

- [`manual-vercel-supabase-runbook`](./.claude/skills/manual-vercel-supabase-runbook/SKILL.md) — exact steps for things only the user can do (Vercel env vars, redeploys, redirect URLs, RLS sanity checks, schema migrations).
- [`supabase-production-reset-cli`](./.claude/skills/supabase-production-reset-cli/SKILL.md) — Supabase CLI `db query` + MCP to export URL/keys; account token + DB password for `link` (not anon key).
- [`supabase-e2e-test-data-cleanup`](./.claude/skills/supabase-e2e-test-data-cleanup/SKILL.md) — delete Playwright prod E2E users (`wh-e2e-%`); MCP `execute_sql` or `npm run supabase:cleanup-e2e-users`.
- [`wedding-hall-e2e-admin-vendor-flow`](./.claude/skills/wedding-hall-e2e-admin-vendor-flow/SKILL.md) — grant admin + Playwright admin/vendor/couple flow on production.
- [`wedding-hall-e2e-docker-flow`](./.claude/skills/wedding-hall-e2e-docker-flow/SKILL.md) — same prod E2E specs against local **`docker compose`** (`test:e2e:docker`).
- [`wedding-hall-pr-workflow`](./.claude/skills/wedding-hall-pr-workflow/SKILL.md) — branch naming, commit conventions, PR body template, finishing checklist.
- [`mobile-responsive-css`](./.claude/skills/mobile-responsive-css/SKILL.md) — mobile-first invariants, breakpoint set, popover/stack/long-text patterns, per-component checklist. Read before adding any new `wh-*` class or fixing a "looks weird on my phone" report.
- [`local-docker-stack`](./.claude/skills/local-docker-stack/SKILL.md) — full app on `docker compose`.
- [`storybook-docker-playwright`](./.claude/skills/storybook-docker-playwright/SKILL.md) — Storybook in Docker (preview/MSW failures, volume refresh), Playwright smoke tests.
- [`wedding-hall-deploy`](./.claude/skills/wedding-hall-deploy/SKILL.md) — branches, Vercel, Supabase redirect checklist.
- [`wedding-hall-env-bootstrap`](./.claude/skills/wedding-hall-env-bootstrap/SKILL.md) — `npm run env:local|cloud|push-vercel`.
- [`wedding-hall-budget-flow`](./.claude/skills/wedding-hall-budget-flow/SKILL.md) — adding a new wizard category, changing prices, debugging totals.
- [`wedding-hall-signup-debug`](./.claude/skills/wedding-hall-signup-debug/SKILL.md) — runbook for "email already registered" / orphaned `auth.users` rows / signup-flow bugs.

## When the rules feel wrong

Push back, but document it. If a rule blocks the task, propose an explicit exception in the PR (with a `RULES.md` and `PLAN.md` update) — don't silently violate it. Examples that have come up:

- Service-role-keyed admin endpoints — vendor catalog admin routes use the service role after `requireAdmin()` checks `public.admin_users`. Cross-user reads beyond that are deferred until we agree on an exception.
