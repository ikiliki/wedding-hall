---
name: wedding-hall-e2e-admin-vendor-flow
description: Grant admin_users for E2E_ADMIN_EMAIL via Supabase CLI, run Playwright 02-admin-vendor-public against production, optional cleanup.
---

# E2E — admin creates vendor, couple sees it

**Production client URL (Phase 1 deploy):** [`https://wedding-hall-gamma.vercel.app`](https://wedding-hall-gamma.vercel.app/) — set `PLAYWRIGHT_BASE_URL` to this origin when running **`npm run test:e2e:prod`** against live Vercel (not `http://localhost:5173`; use [wedding-hall-e2e-docker-flow](../wedding-hall-e2e-docker-flow/SKILL.md) for Docker).

End-to-end coverage lives in [`tests/e2e-prod/02-admin-vendor-public.spec.ts`](../../../tests/e2e-prod/02-admin-vendor-public.spec.ts) and now uses per-test fixtures that seed/cleanup admin + couple accounts automatically.

Dedicated **sign-up** coverage with Auth cleanup: [`03-signup-gate-cleanup.spec.ts`](../../../tests/e2e-prod/03-signup-gate-cleanup.spec.ts).

## Prerequisites

1. **Client URL** — `PLAYWRIGHT_BASE_URL` = **`https://wedding-hall-gamma.vercel.app`** (canonical production client; trailing slash optional).
2. **Supabase service role env** for fixture seeding/cleanup:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
3. **Server** — production Next.js must have service role configured for admin routes (already required for manual admin).

## Run

```powershell
$env:PLAYWRIGHT_BASE_URL="https://wedding-hall-gamma.vercel.app"
$env:SUPABASE_URL="https://siutibzdbnngrvwlnfok.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="..."
$env:E2E_RUN_ID="prod-smoke"
npm run test:e2e:prod
```
Auto-file-on-failure still works with `E2E_OPEN_ISSUE_ON_FAIL=1` and the GitHub reporter.

## Product behavior under test

- Admin: **`/admin`** → **`/admin/vendors/new`** → create vendor → listed under **`/admin/vendors`**.
- Couple: **`/dashboard/vendors`** calls **`GET /api/vendors`** (new gateway route); vendor name appears in the directory.

## Same flow on Docker (no prod deploy)

If Vercel/production is not ready, run the **same spec** against **`docker compose`** with `SUPABASE_*` env set — see [wedding-hall-e2e-docker-flow](../wedding-hall-e2e-docker-flow/SKILL.md).

## Exploratory UI on production (Playwright MCP)

Microsoft’s **[Playwright MCP](https://playwright.dev/mcp/installation)** exposes **`browser_navigate`**, **`browser_snapshot`**, **`browser_click`**, **`browser_take_screenshot`**, etc., so the agent can drive a real browser against **`https://wedding-hall-gamma.vercel.app`** without running `npm run test:e2e:prod`.

This repo ships **project MCP config** at [`.cursor/mcp.json`](../../../.cursor/mcp.json) (`npx -y @playwright/mcp@latest`). After adding or editing it:

1. **Cursor:** **Settings → MCP** — confirm the **playwright** server appears (reload Cursor if needed).
2. Ask the agent: *Navigate to https://wedding-hall-gamma.vercel.app, snapshot the welcome screen, then open /login.*

That complements scripted E2E (`npm run test:e2e:prod`): MCP is best for **manual exploration**; Playwright tests remain the regression suite per [`tests/e2e-prod/README.md`](../../../tests/e2e-prod/README.md).

## Cleanup

Remove Playwright-created Auth rows with [supabase-e2e-test-data-cleanup](../supabase-e2e-test-data-cleanup/SKILL.md). Admin-created vendors remain until deleted in admin UI or SQL.
