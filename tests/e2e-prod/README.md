# Production wizard E2E (Playwright)

Specs:

| File | What it covers |
|------|----------------|
| [`01-wizard-new-user.spec.ts`](./01-wizard-new-user.spec.ts) | Wizard → auth gate → fixture-seeded couple sign-in → resume |
| [`02-admin-vendor-public.spec.ts`](./02-admin-vendor-public.spec.ts) | Fixture-seeded admin creates vendor; fixture-seeded couple sees it |
| [`03-signup-gate-cleanup.spec.ts`](./03-signup-gate-cleanup.spec.ts) | Auth-gate sign-in flow using fixture-seeded disposable couple account |

Run against your deployed **client** URL (Vite app).

**Canonical production client:** `https://wedding-hall-gamma.vercel.app` — set `PLAYWRIGHT_BASE_URL` to this when testing **live Vercel** (see [wedding-hall-deploy](../../.claude/skills/wedding-hall-deploy/SKILL.md)). For local Docker, use [`wedding-hall-e2e-docker-flow`](../../.claude/skills/wedding-hall-e2e-docker-flow/SKILL.md) instead of pointing prod config at `localhost`.

## Prerequisites

0. **Smoke-check the client URL** — open `PLAYWRIGHT_BASE_URL` in a browser (or `curl -I`). If you get **404**, the deployment or branch (`master-client`) may be wrong; fix Vercel before running E2E.

1. **Environment variables** (export in your shell or use a local env file and `source` it — this repo does not load `.env` for Playwright automatically):

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `PLAYWRIGHT_BASE_URL` | Yes | Client origin, e.g. `https://wedding-hall-gamma.vercel.app` |
   | `SUPABASE_URL` | Yes | Same project the client uses (Docker: `http://localhost:54321`) |
   | `SUPABASE_SERVICE_ROLE_KEY` | Yes | Dashboard → API → **service_role** (never commit) |
   | `E2E_RUN_ID` | No | Optional stable run id; auto-derived if missing |

All test users and vendors are now created per-test and cleaned in teardown with strict allowlist guards.

2. **Cleanup unit tests (recommended gate)**  
   Run `npm run test:e2e:cleanup` before E2E to verify email/vendor allowlist guards.

## Docker (local full stack)

When production is not deployed, run the **same specs** against **`docker compose`** with a separate Playwright config:

1. Bring the stack up (see [`.claude/skills/local-docker-stack/SKILL.md`](../../.claude/skills/local-docker-stack/SKILL.md)).
2. Set env vars — `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` are required for fixture seeding/cleanup (same JWT family as in `docker-compose.yml` for the `server` service).
3. **`npm run test:e2e:docker`** (not `test:e2e:prod`).

Full steps: [`.claude/skills/wedding-hall-e2e-docker-flow/SKILL.md`](../../.claude/skills/wedding-hall-e2e-docker-flow/SKILL.md).

## Command (production URL)

From the repository root:

```bash
set PLAYWRIGHT_BASE_URL=https://wedding-hall-gamma.vercel.app
set SUPABASE_URL=https://YOUR_REF.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
npm run test:e2e:prod
```

PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://wedding-hall-gamma.vercel.app"
$env:SUPABASE_URL="https://YOUR_REF.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY="..."
npm run test:e2e:prod
```

Install browsers once: `npx playwright install chromium`.

## See the browser while testing

By default Playwright runs **headless** (no window). To **watch the real production UI** as the test runs (same `PLAYWRIGHT_BASE_URL` and `E2E_*` env vars as above):

- **Visible browser** — `npm run test:e2e:prod:headed` (adds Playwright’s `--headed` flag).
- **Step through / pause** — `npm run test:e2e:prod:debug` (opens the Playwright Inspector; you can run the next action, inspect the page, and see the client at each step).

On Windows you can also set `set PWDEBUG=1` before `npm run test:e2e:prod` for a similar debug experience (see [Playwright debugging](https://playwright.dev/docs/debug)).

## Clean up E2E data in Supabase

Per-test cleanup and global teardown sweep remove `wh-e2e-*` users and `Playwright-E2E-*` vendors automatically.

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
