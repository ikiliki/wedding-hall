# SKILL: repo-skills-maintenance

How to **edit existing** skills under [`.claude/skills/`](../) based on real outcomes—failures, surprises in CI or prod, review feedback, and agreed best practices—without turning skills into a second `RULES.md`.

## When to update a skill

Open the relevant `SKILL.md` and patch it when:

- Someone followed the skill and still failed — missing step, wrong order, ambiguous prerequisite, or outdated command/path.
- The same correction or workaround keeps appearing in chat or PRs for one workflow.
- Tooling or infra changed (scripts, Docker compose service names, npm scripts, Supabase/Vercel dashboard labels, Playwright config).
- Review or pairing surfaced a **repeatable** procedure that belongs in a runbook, not only in a one-off comment.

Prefer updating the **narrowest** skill (for example only [`mobile-responsive-css`](../mobile-responsive-css/SKILL.md)) unless the learning applies repo-wide.

## When to change something else instead

- **Binding policy, scope, or security posture** — update [`RULES.md`](../../../RULES.md), [`PLAN.md`](../../../PLAN.md), or the right [`.cursor/rules/`](../../../.cursor/rules/) file per [`.cursor/rules/rules-maintenance.mdc`](../../../.cursor/rules/rules-maintenance.mdc). Link from the skill; do not copy full policy text into `SKILL.md`.
- **High-level orientation** — one sentence + link in [`AGENTS.md`](../../../AGENTS.md); keep the skill focused on **how to execute**.
- **New workflow with no skill yet** — add a new folder under `.claude/skills/<name>/SKILL.md`, then add one-line entries in [`AGENTS.md`](../../../AGENTS.md) and [`CLAUDE.md`](../../../CLAUDE.md) under **Skills** so discovery stays intact.

## How to edit well

- **Minimal diff:** fix the misleading bullet, add the missing verification step, or replace a stale command—avoid rewriting unrelated sections.
- **Actionable:** numbered steps, exact commands, and “done means X” checks beat prose essays.
- **Gotchas:** prefix with context (“Fails on Windows when…”, “Sandbox cannot run docker…”).
- **Single source:** if [`CLAUDE.md`](../../../CLAUDE.md) or [`AGENTS.md`](../../../AGENTS.md) duplicates a long procedure, trim the duplicate and point at the skill (skills are for procedural depth; AGENTS stays index-sized).

## After sessions that surface gaps

When work completes—or when an incident is understood—ask briefly: **did any skill we relied on need patching?** If yes, include `SKILL.md` updates in the same PR when reasonable, or a small follow-up PR that only updates skills.

## Checklist before merging skill edits

- [ ] No contradiction with `RULES.md` / `PLAN.md` / binding Cursor rules.
- [ ] [`AGENTS.md`](../../../AGENTS.md) **Skills** list updated if you added/renamed/removed a skill file.
- [ ] [`CLAUDE.md`](../../../CLAUDE.md) **Skills** list updated the same way (slash-command discoverability for Claude Code).
