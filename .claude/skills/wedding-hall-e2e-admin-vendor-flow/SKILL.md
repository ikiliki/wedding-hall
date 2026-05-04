---
name: wedding-hall-e2e-admin-vendor-flow
description: Grant admin_users for E2E_ADMIN_EMAIL via Supabase CLI, run Playwright admin-vendor-public against production, optional cleanup.
---

# E2E — admin creates vendor, couple sees it

End-to-end coverage lives in [`tests/e2e-prod/admin-vendor-public.spec.ts`](../../../tests/e2e-prod/admin-vendor-public.spec.ts).

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

4. **Client URL** — `PLAYWRIGHT_BASE_URL` (e.g. `https://wedding-hall-gamma.vercel.app`).

5. **Server** — production Next.js must have **service role** configured for admin POST `/api/admin/vendors` (already required for manual admin).

## Run

```powershell
$env:PLAYWRIGHT_BASE_URL="https://wedding-hall-gamma.vercel.app"
$env:E2E_ADMIN_EMAIL="..."
$env:E2E_ADMIN_PASSWORD="..."
$env:E2E_USER1_EMAIL="..."
$env:E2E_USER1_PASSWORD="..."
# optional:
$env:E2E_AUTO_GRANT_ADMIN="1"
npm run test:e2e:prod
```

## Product behavior under test

- Admin: **`/admin`** → **`/admin/vendors/new`** → create vendor → listed under **`/admin/vendors`**.
- Couple: **`/dashboard/vendors`** calls **`GET /api/vendors`** (new gateway route); vendor name appears in the directory.

## Same flow on Docker (no prod deploy)

If Vercel/production is not ready, run the **same spec** against **`docker compose`** — seeded admin `admin@weddinghall.app` / `Admin!2026`, no Supabase CLI grant — see [wedding-hall-e2e-docker-flow](../wedding-hall-e2e-docker-flow/SKILL.md).

## Cleanup

Remove Playwright-created Auth rows with [supabase-e2e-test-data-cleanup](../supabase-e2e-test-data-cleanup/SKILL.md). Admin-created vendors remain until deleted in admin UI or SQL.
