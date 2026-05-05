# Production wizard E2E (Playwright)

Specs:

| File | What it covers |
|------|----------------|
| [`01-wizard-new-user.spec.ts`](./01-wizard-new-user.spec.ts) | Wizard → auth gate → **sign in** (existing accounts) → resume |
| [`02-admin-vendor-public.spec.ts`](./02-admin-vendor-public.spec.ts) | Admin creates vendor; couple sees it |
| [`03-signup-gate-cleanup.spec.ts`](./03-signup-gate-cleanup.spec.ts) | **Sign up** new `wh-e2e-signup-*@example.com`, then **delete** that Auth user via Admin API |

Run against your deployed **client** URL (Vite app).

**Canonical production client:** `https://wedding-hall-gamma.vercel.app` — set `PLAYWRIGHT_BASE_URL` to this when testing **live Vercel** (see [wedding-hall-deploy](../../.claude/skills/wedding-hall-deploy/SKILL.md)). For local Docker, use [`wedding-hall-e2e-docker-flow`](../../.claude/skills/wedding-hall-e2e-docker-flow/SKILL.md) instead of pointing prod config at `localhost`.

## Prerequisites

0. **Smoke-check the client URL** — open `PLAYWRIGHT_BASE_URL` in a browser (or `curl -I`). If you get **404**, the deployment or branch (`master-client`) may be wrong; fix Vercel before running E2E.

1. **Environment variables** (export in your shell or use a local env file and `source` it — this repo does not load `.env` for Playwright automatically):

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `PLAYWRIGHT_BASE_URL` | Yes | Client origin, e.g. `https://wedding-hall-gamma.vercel.app` |
   | `E2E_USER1_EMAIL` | Yes | Account that **already exists** in Supabase Auth for this project (wizard test **signs in**, it does not register) |
   | `E2E_USER1_PASSWORD` | Yes | Password (min 6 characters per app rules) |
   | `E2E_USER2_EMAIL` | Yes | Second account — **must differ** from user 1, also **pre-existing** in Auth |
   | `E2E_USER2_PASSWORD` | Yes | Password for user 2 |

**Sign-up + cleanup** ([`03-signup-gate-cleanup.spec.ts`](./03-signup-gate-cleanup.spec.ts)) — runs only if all of these are set (in addition to `PLAYWRIGHT_BASE_URL`):

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Same project the client uses (e.g. `https://YOUR_REF.supabase.co`; Docker: `http://localhost:54321`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Dashboard → API → **service_role** (never commit). Used only by `scripts/e2e-delete-auth-user.mjs` after the test. |
| `E2E_SIGNUP_PASSWORD` | Optional — password for the disposable signup user (default `WhSignup1!`) |

Manual delete helper: `npm run e2e:delete-auth-user -- user@example.com` with the same `SUPABASE_*` env vars.

**Admin + vendor directory test** ([`02-admin-vendor-public.spec.ts`](./02-admin-vendor-public.spec.ts)) additionally needs:

| Variable | Required | Description |
|----------|----------|-------------|
| `E2E_ADMIN_EMAIL` | For that spec | Existing Auth user you will grant `admin_users` |
| `E2E_ADMIN_PASSWORD` | For that spec | Password for that admin |
| `E2E_AUTO_GRANT_ADMIN` | Optional | Set to `1` to run `npm run e2e:grant-admin` from Playwright `beforeAll` (needs `supabase link`) |

Before first run, grant admin: `$env:E2E_ADMIN_EMAIL="..."; npm run e2e:grant-admin` — see [`.claude/skills/wedding-hall-e2e-admin-vendor-flow/SKILL.md`](../../.claude/skills/wedding-hall-e2e-admin-vendor-flow/SKILL.md).

2. **Email confirmation (critical for [`03-signup-gate-cleanup.spec.ts`](./03-signup-gate-cleanup.spec.ts) only)**  
   In Supabase Dashboard → Authentication → Providers → Email: if **Confirm email** is enabled, `signUp` often returns **no session** until the user clicks the magic link — **`03` will fail**. For unattended runs: disable confirmation on the target project (staging) or use a project with **`GOTRUE_MAILER_AUTOCONFIRM=true`** (local Docker).

3. **Two distinct users (`01`)**  
   `E2E_USER1_EMAIL` and `E2E_USER2_EMAIL` must be different accounts that already exist (create manually once, or use seeded Docker users — see [local-docker-stack](../../.claude/skills/local-docker-stack/SKILL.md)).

## Docker (local full stack)

When production is not deployed, run the **same specs** against **`docker compose`** with a separate Playwright config:

1. Bring the stack up (see [`.claude/skills/local-docker-stack/SKILL.md`](../../.claude/skills/local-docker-stack/SKILL.md)).
2. Set env vars — for **`01`**, use seeded accounts such as **`test@gmail.com` / `test1234`** (see [local-docker-stack](../../.claude/skills/local-docker-stack/SKILL.md)). For **`03`**, add **`SUPABASE_URL`** + **`SUPABASE_SERVICE_ROLE_KEY`** (same JWT family as in `docker-compose.yml` for the `server` service). Admin defaults: **`admin@weddinghall.app` / `Admin!2026`**.
3. **`npm run test:e2e:docker`** (not `test:e2e:prod`).

Full steps: [`.claude/skills/wedding-hall-e2e-docker-flow/SKILL.md`](../../.claude/skills/wedding-hall-e2e-docker-flow/SKILL.md).

## Command (production URL)

From the repository root:

```bash
set PLAYWRIGHT_BASE_URL=https://wedding-hall-gamma.vercel.app
set E2E_USER1_EMAIL=test+pw1@yourdomain.com
set E2E_USER1_PASSWORD=yourSecurePass1
set E2E_USER2_EMAIL=test+pw2@yourdomain.com
set E2E_USER2_PASSWORD=yourSecurePass2
npm run test:e2e:prod
```

PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://wedding-hall-gamma.vercel.app"
$env:E2E_USER1_EMAIL="test+pw1@yourdomain.com"
# ...
npm run test:e2e:prod
```

Install browsers once: `npx playwright install chromium`.

## See the browser while testing

By default Playwright runs **headless** (no window). To **watch the real production UI** as the test runs (same `PLAYWRIGHT_BASE_URL` and `E2E_*` env vars as above):

- **Visible browser** — `npm run test:e2e:prod:headed` (adds Playwright’s `--headed` flag).
- **Step through / pause** — `npm run test:e2e:prod:debug` (opens the Playwright Inspector; you can run the next action, inspect the page, and see the client at each step).

On Windows you can also set `set PWDEBUG=1` before `npm run test:e2e:prod` for a similar debug experience (see [Playwright debugging](https://playwright.dev/docs/debug)).

## Clean up E2E data in Supabase

After prod E2E, remove accounts matching `wh-e2e-%` via [`.claude/skills/supabase-e2e-test-data-cleanup/SKILL.md`](../../.claude/skills/supabase-e2e-test-data-cleanup/SKILL.md) (MCP **`execute_sql`** or **`npm run supabase:cleanup-e2e-users`** after `supabase link`).

## Screenshots

On success, PNGs are written under `test-results/e2e-prod-screenshots/` (desktop full-page, 360×640, 320×568 for header/footer review per mobile-first checklist). They are gitignored via `test-results/`.

## Logs checklist (debugging failures)

| Layer | Where | What to look for |
|-------|--------|------------------|
| Browser | Playwright trace (`trace: on-first-retry`), test stdout | `page.on('console')` errors (network/CORS) |
| Client → gateway | Browser DevTools Network | `PUT /api/budget`, `GET /api/budget`, `POST /api/profiles` — status 401/403/500 |
| Server | Vercel → project → Logs (Next.js server package) | Handler errors for `/api/budget`, `/api/profiles` |
| Auth | Supabase Dashboard → Authentication → Users / Logs | Signup rate limits, duplicate email, confirmation pending |

Ensure production client **`VITE_SERVER_URL`** points at the deployed gateway so API calls are not misconfigured.
