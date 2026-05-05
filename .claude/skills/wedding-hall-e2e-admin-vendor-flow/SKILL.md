---
name: wedding-hall-e2e-admin-vendor-flow
description: Grant admin_users for E2E_ADMIN_EMAIL via Supabase CLI, run Playwright 02-admin-vendor-public against production, optional cleanup.
---

# E2E — admin creates vendor, couple sees it

**Production client URL (Phase 1 deploy):** [`https://wedding-hall-gamma.vercel.app`](https://wedding-hall-gamma.vercel.app/) — set `PLAYWRIGHT_BASE_URL` to this origin when running **`npm run test:e2e:prod`** against live Vercel (not `http://localhost:5173`; use [wedding-hall-e2e-docker-flow](../wedding-hall-e2e-docker-flow/SKILL.md) for Docker).

End-to-end coverage lives in [`tests/e2e-prod/02-admin-vendor-public.spec.ts`](../../../tests/e2e-prod/02-admin-vendor-public.spec.ts) (runs **after** [`01-wizard-new-user.spec.ts`](../../../tests/e2e-prod/01-wizard-new-user.spec.ts), which uses **sign-in** with **existing** `E2E_USER1_*` — not registration).

Dedicated **sign-up** coverage with Auth cleanup: [`03-signup-gate-cleanup.spec.ts`](../../../tests/e2e-prod/03-signup-gate-cleanup.spec.ts).

## Prerequisites

1. **Admin Auth user** — `E2E_ADMIN_EMAIL` / password must exist in **Supabase Auth** (sign up once in prod/staging or SQL-invite).
2. **`admin_users` row** — authenticated inserts are blocked; grant via SQL:

   ```powershell
   $env:E2E_ADMIN_EMAIL="your-admin@domain.com"
   npm run e2e:grant-admin
   ```

   Requires **`npx supabase login`** and **`npx supabase link`** (see [supabase-production-reset-cli](../supabase-production-reset-cli/SKILL.md)).

   Or set **`E2E_AUTO_GRANT_ADMIN=1`** when running Playwright so **`beforeAll`** runs `e2e-grant-admin.mjs` automatically (still needs linked CLI).

3. **Couple user** — `E2E_USER1_EMAIL` / `E2E_USER1_PASSWORD` (any authenticated user; **no budget required** for `/dashboard/vendors`).

4. **Client URL** — `PLAYWRIGHT_BASE_URL` = **`https://wedding-hall-gamma.vercel.app`** (canonical production client; trailing slash optional).

5. **Server** — production Next.js must have **service role** configured for admin POST `/api/admin/vendors` (already required for manual admin).

## Run

```powershell
$env:PLAYWRIGHT_BASE_URL="https://wedding-hall-gamma.vercel.app"
$env:E2E_ADMIN_EMAIL="..."
$env:E2E_ADMIN_PASSWORD="..."
$env:E2E_USER1_EMAIL="..."
$env:E2E_USER1_PASSWORD="..."
$env:E2E_USER2_EMAIL="..."
$env:E2E_USER2_PASSWORD="..."
# optional:
$env:E2E_AUTO_GRANT_ADMIN="1"
npm run test:e2e:prod
```

## Flawless-prod-run mode (issue #6 fix)

The two recurring flake modes — wizard **422 on signin** and admin **dashboard heading missing** — both trace back to drift between Playwright env vars and Supabase Auth state. To make every prod run pass:

1. **Self-heal env via service role** (one-shot per run). Set:
   - `SUPABASE_URL` (same project as `VITE_SUPABASE_URL` on Vercel client)
   - `SUPABASE_SERVICE_ROLE_KEY` (Supabase dashboard → API → service_role; never commit)
   - `E2E_AUTOPROVISION=1`

   `tests/e2e-prod/global-setup.ts` will then idempotently:
   - Create `E2E_USER1_EMAIL`, `E2E_USER2_EMAIL`, `E2E_ADMIN_EMAIL` in `auth.users` with `email_confirm=true` if missing.
   - **Refresh** their passwords to match the env values (kills `invalid_credentials`).
   - Upsert `public.admin_users` for the admin (replaces the manual `npm run e2e:grant-admin` step for CI).

2. **See real error bodies, not Playwright timeouts.** Spec 01 attaches `helpers/response-logger.ts`, which writes every 4xx/5xx body (including the Supabase auth error code — `email_exists`, `weak_password`, `invalid_credentials`) into `network-errors.txt` on the test report.

3. **Auto-file a GitHub issue on failure.** Set `E2E_OPEN_ISSUE_ON_FAIL=1` to let `tests/e2e-prod/reporters/github-issue-reporter.ts` open / comment on a `gh` issue against `ikiliki/wedding-hall` (override repo with `E2E_ISSUE_REPO=owner/repo`). It dedupes against existing open issues whose title starts with `E2E prod failure`. Requires `gh auth status` ok on the machine that runs the tests; without `gh` it logs and continues.

End-to-end CI command:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://wedding-hall-gamma.vercel.app"
$env:SUPABASE_URL="https://siutibzdbnngrvwlnfok.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="..."
$env:E2E_USER1_EMAIL="wh-e2e-user1@example.com"; $env:E2E_USER1_PASSWORD="WhE2eUser1!"
$env:E2E_USER2_EMAIL="wh-e2e-user2@example.com"; $env:E2E_USER2_PASSWORD="WhE2eUser2!"
$env:E2E_ADMIN_EMAIL="wh-e2e-admin@example.com"; $env:E2E_ADMIN_PASSWORD="WhE2eAdmin!"
$env:E2E_AUTOPROVISION="1"
$env:E2E_OPEN_ISSUE_ON_FAIL="1"
npm run test:e2e:prod
```

After the run, optionally clean up with [supabase-e2e-test-data-cleanup](../supabase-e2e-test-data-cleanup/SKILL.md) (`wh-e2e-%` matches all three accounts).

## Product behavior under test

- Admin: **`/admin`** → **`/admin/vendors/new`** → create vendor → listed under **`/admin/vendors`**.
- Couple: **`/dashboard/vendors`** calls **`GET /api/vendors`** (new gateway route); vendor name appears in the directory.

## Same flow on Docker (no prod deploy)

If Vercel/production is not ready, run the **same spec** against **`docker compose`** — seeded admin `admin@weddinghall.app` / `Admin!2026`, no Supabase CLI grant — see [wedding-hall-e2e-docker-flow](../wedding-hall-e2e-docker-flow/SKILL.md).

## Exploratory UI on production (Playwright MCP)

Microsoft’s **[Playwright MCP](https://playwright.dev/mcp/installation)** exposes **`browser_navigate`**, **`browser_snapshot`**, **`browser_click`**, **`browser_take_screenshot`**, etc., so the agent can drive a real browser against **`https://wedding-hall-gamma.vercel.app`** without running `npm run test:e2e:prod`.

This repo ships **project MCP config** at [`.cursor/mcp.json`](../../../.cursor/mcp.json) (`npx -y @playwright/mcp@latest`). After adding or editing it:

1. **Cursor:** **Settings → MCP** — confirm the **playwright** server appears (reload Cursor if needed).
2. Ask the agent: *Navigate to https://wedding-hall-gamma.vercel.app, snapshot the welcome screen, then open /login.*

That complements scripted E2E (`npm run test:e2e:prod`): MCP is best for **manual exploration**; Playwright tests remain the regression suite per [`tests/e2e-prod/README.md`](../../../tests/e2e-prod/README.md).

## Cleanup

Remove Playwright-created Auth rows with [supabase-e2e-test-data-cleanup](../supabase-e2e-test-data-cleanup/SKILL.md). Admin-created vendors remain until deleted in admin UI or SQL.
