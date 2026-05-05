---
name: wedding-hall-e2e-docker-flow
description: Run the same prod Playwright specs (`tests/e2e-prod`) against the local Docker stack — no Vercel or cloud Supabase required.
---

# E2E on Docker (same specs as production)

Use this when **production is not deployed** or you want a **repeatable full stack** before shipping.

**Vercel production** (live client): **`https://wedding-hall-gamma.vercel.app`** — use **`npm run test:e2e:prod`** + `PLAYWRIGHT_BASE_URL` there; see [wedding-hall-e2e-admin-vendor-flow](../wedding-hall-e2e-admin-vendor-flow/SKILL.md). This Docker skill is **only** for **`http://localhost:5173`**.

It pairs with:

- [`local-docker-stack`](../local-docker-stack/SKILL.md) — bring services up.
- [`wedding-hall-e2e-admin-vendor-flow`](../wedding-hall-e2e-admin-vendor-flow/SKILL.md) — the **same tests** against **production URLs** + Supabase CLI `grant-admin`.

## What runs

- Config: [`playwright.docker.config.ts`](../../../playwright.docker.config.ts) — defaults **`PLAYWRIGHT_BASE_URL=http://localhost:5173`**.
- Tests: [`tests/e2e-prod/`](../../../tests/e2e-prod/) — order **`01`** → **`02`** → **`03`**. All specs seed disposable users/vendors per test and clean them in teardown.
- Playwright runs **on the host** (your machine) and drives the browser against **`http://localhost:5173`** — the **`client`** container. Nothing runs Playwright *inside* a container.

## One-time: stack up

From repo root:

```bash
docker compose up -d --build
docker compose logs -f seed
```

Wait until the seed container prints success (schema + `seed.sql`). Then smoke-check:

- Client → `http://localhost:5173`
- Server → `http://localhost:3001/api/health`

If you changed `docker-compose.yml` (e.g. added `SUPABASE_SERVICE_ROLE_KEY` for admin APIs), recreate the server:

```bash
docker compose up -d --build server
```

## Environment variables

Set these in your shell **before** `npm run test:e2e:docker` (Playwright does not auto-load `.env`).

| Variable | Docker recommendation |
|----------|------------------------|
| `PLAYWRIGHT_BASE_URL` | Omit to use default `http://localhost:5173`, or set explicitly |
| `SUPABASE_URL` | Required — `http://localhost:54321` (host → gateway) |
| `SUPABASE_SERVICE_ROLE_KEY` | Required — same service JWT as `studio` / `server` in [`docker-compose.yml`](../../../docker-compose.yml) |
| `E2E_RUN_ID` | Optional — stable run id for easier teardown log correlation |

The **`server`** container must include **`SUPABASE_SERVICE_ROLE_KEY`** (well-known local JWT, matching `docker-compose.yml`) so admin routes and cleanup primitives can work.

## Command

```powershell
$env:PLAYWRIGHT_BASE_URL="http://localhost:5173"
$env:SUPABASE_URL="http://localhost:54321"
$env:SUPABASE_SERVICE_ROLE_KEY="<paste service_role JWT from docker-compose.yml server/studio>"
$env:E2E_RUN_ID="local-docker"
npm run test:e2e:docker
```

Headed / debug (same flags as prod):

- `npm run test:e2e:docker:headed`
- `npm run test:e2e:docker:debug`

Install browsers once: `npx playwright install chromium`.

## Email confirmation

Local Auth uses **`GOTRUE_MAILER_AUTOCONFIRM=true`** in [`docker-compose.yml`](../../../docker-compose.yml), so signup gets a session immediately — suitable for unattended wizard tests.

## Reset between runs

Wizard tests **register new users**. Either:

- Use **fresh emails** each run (timestamp / counter), or  
- **`docker compose down -v`** and **`docker compose up -d --build`** to wipe Auth + DB (slow but clean).

## Troubleshooting

| Symptom | Check |
|--------|--------|
| Connection refused on `:5173` | `docker compose ps` — `client` up? |
| Browser console CORS preflight error to `http://localhost:3001/api/*` (missing `Access-Control-Allow-Origin`) | Containers are often stale after env/code changes; run `docker compose up -d --build server client` before re-running Playwright |
| `/api/budget` or admin **500** “not configured” | Server env; **`docker compose up -d server`** after compose edits |
| Admin vendor **403/500** | **`SUPABASE_SERVICE_ROLE_KEY`** on `server` service; recreate container |
| Duplicate email on signup | Pick new `E2E_USER*_EMAIL` values |

## Cleanup

Local Docker data is yours — **no** cloud `supabase:cleanup-e2e-users`. To remove test Auth users: Studio (`http://localhost:54323`) or `docker compose exec db psql -U postgres` against `auth.users`.
