# Production wizard E2E (Playwright)

Tests live in [`wizard-new-user.spec.ts`](./wizard-new-user.spec.ts). Run against your deployed **client** URL (Vite app).

## Prerequisites

0. **Smoke-check the client URL** — open `PLAYWRIGHT_BASE_URL` in a browser (or `curl -I`). If you get **404**, the deployment or branch (`master-client`) may be wrong; fix Vercel before running E2E.

1. **Environment variables** (export in your shell or use a local env file and `source` it — this repo does not load `.env` for Playwright automatically):

   | Variable | Required | Description |
   |----------|----------|-------------|
   | `PLAYWRIGHT_BASE_URL` | Yes | Client origin, e.g. `https://wedding-hall-gamma.vercel.app` |
   | `E2E_USER1_EMAIL` | Yes | First test account email (must not already exist in prod Auth, or use a fresh alias) |
   | `E2E_USER1_PASSWORD` | Yes | Password (min 6 characters per app rules) |
   | `E2E_USER2_EMAIL` | Yes | Second account — **must differ** from user 1 |
   | `E2E_USER2_PASSWORD` | Yes | Password for user 2 |

2. **Email confirmation (critical)**  
   In Supabase Dashboard → Authentication → Providers → Email: if **Confirm email** is enabled, `signUp` often returns **no session** until the user clicks the magic link. The app then shows “check your email” and **does not** return to the wizard automatically. For this flow to pass unattended, either:

   - Disable email confirmation on the project you test against (staging recommended), or  
   - Complete verification manually / use an inbox automation (slow, flaky).

3. **Two distinct users**  
   You cannot register the same email twice. Use plus-addressing if your provider supports it (e.g. `test+pw1@example.com`, `test+pw2@example.com`).

## Command

From the repository root:

```bash
set PLAYWRIGHT_BASE_URL=https://your-client.vercel.app
set E2E_USER1_EMAIL=test+pw1@yourdomain.com
set E2E_USER1_PASSWORD=yourSecurePass1
set E2E_USER2_EMAIL=test+pw2@yourdomain.com
set E2E_USER2_PASSWORD=yourSecurePass2
npm run test:e2e:prod
```

PowerShell:

```powershell
$env:PLAYWRIGHT_BASE_URL="https://your-client.vercel.app"
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
