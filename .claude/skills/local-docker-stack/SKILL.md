---
name: local-docker-stack
description: Bring up the full Wedding Hall stack on your machine with docker compose — db, auth, rest, gateway, client, server (data gateway), plus the demo seed user.
---

# Local docker stack

Use when the user wants to run the app locally without touching cloud Supabase, or when reproducing a production bug in a clean environment.

## Prerequisites

- Docker Desktop running (Compose v2 ships with it).
- Ports free locally: **5173** (client), **6006** (Storybook), **3001** (server), **54321** (gateway), **54322** (postgres), **54323** (Supabase Studio).

## Bring it up

From the repo root:

```bash
docker compose up -d --build
```

Watch the seed once-only container finish:

```bash
docker compose logs -f seed
```

Then open:

- Client → <http://localhost:5173>
- Storybook → <http://localhost:6006> — `docker compose up -d --build storybook` (UI-only; MSW + mock Supabase; no DB/server required). To run the full stack **and** Storybook, use `docker compose up -d --build` (all services).
- Server health → <http://localhost:3001/api/health>
- Server docs → <http://localhost:3001/docs>
- Server budget endpoint (will 401 without a JWT — expected) → <http://localhost:3001/api/budget>
- Supabase API → <http://localhost:54321/rest/v1/wedding_budgets?select=id> (anon should get `[]`)
- **Supabase Studio** → <http://localhost:54323> — browse tables, run SQL, inspect auth users

The `seed` service runs **`supabase/schema.sql` first** (Phase 2 vendor tables + `admin_users`), then `seed.sql`, then `fix-prod-and-seed-demo-user.sql`.

## How requests flow

1. Browser → `http://localhost:54321/auth/v1/*` for sign-in (Supabase Auth via `gateway`).
2. Browser → `http://localhost:3001/api/profiles` and `/api/budget` with `Authorization: Bearer <jwt>`.
3. Server → `http://gateway:8000/auth/v1/user` (verify JWT) and `/rest/v1/...` (read/write with RLS as that user).

## Demo logins (all seeded by `supabase/seed.sql`)

| Email | Password | is_admin |
|---|---|---|
| `test@gmail.com` | `test1234` | — |
| `admin@weddinghall.app` | `Admin!2026` | ✓ |
| `admin@test.com` | `123123` | ✓ |
| `test1@test.com` | `123123` | — |
| `test2@test.com` | `123123` | — |
| `test3@test.com` | `123123` | — |

## Common operations

| Goal | Command |
|------|---------|
| Tail every service | `docker compose logs -f` |
| Tail one service | `docker compose logs -f auth` |
| Tail server data calls | `docker compose logs -f server` |
| Tail Storybook | `docker compose logs -f storybook` |
| Reset DB completely | `docker compose down -v && docker compose up -d --build` |
| Run a psql shell | `docker compose exec db psql -U postgres` |
| Re-run seed only | `docker compose run --rm seed` |
| Stop everything | `docker compose down` |
| Stop and wipe volumes | `docker compose down -v` |

## Troubleshooting

- **`auth` won't start**: usually `db` healthcheck not satisfied yet. `docker compose ps` and re-up.
- **Server returns 500 "Server is not configured"**: `SUPABASE_URL` / `SUPABASE_ANON_KEY` not in the `server` container env. Check the `server.environment` block in `docker-compose.yml`.
- **CORS error in the browser**: add the calling client origin to `CLIENT_ORIGIN` on the `server` container (comma-sep) and `docker compose up -d server` to recreate it.
- **Supabase JS errors with 401**: anon key in env must match the JWT secret. Don't edit one without the other.
- **`PUT /api/budget` returns 500 with empty error `{}`**: PostgREST's schema cache is stale because it started before the seed created the tables. The `seed` container now sends `NOTIFY pgrst, 'reload schema'` after each run, but if you bring services up in an unusual order, force a refresh with `docker compose restart rest` (or `psql -h localhost -p 54322 -U postgres -c "NOTIFY pgrst, 'reload schema';"`).
- **Hot reload slow on Windows**: this is Docker Desktop file-mount overhead. Either accept the lag or run `npm run dev:client` / `dev:server` outside Docker against the same DB stack (just keep `db`, `auth`, `rest`, `gateway` running).
- **Storybook missing `VITE_SUPABASE_*` in Docker**: give the `storybook` service the same `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_SERVER_URL` as `client` in `docker-compose.yml` so Vite exposes them in the container.
the Storybook service uses its own volumes (`storybook_*_node_modules`); sharing `client_node_modules` with an older install can omit the CLI. Fresh volumes populate from the image on first attach; recreate with `--build` after adding Storybook to `client/package.json` if stuck.
- **`spawn xdg-open ENOENT`** in Storybook logs: the compose command includes `--no-open` so Alpine does not try to open a browser inside the container. If you still see this, recreate the `storybook` container from the current `docker-compose.yml`.

## Don't

- Don't reuse the dev-only `JWT_SECRET` / anon key in production.
- Don't add long-lived data only to a docker volume — `down -v` will wipe it.
- Don't change `gateway` paths without updating `client/src/shared/lib/supabase.ts` if it ever sets a custom base URL.
- Don't bypass the server from the client to call `supabase.from(...)` — the architecture requires data calls to go through `/api/*`.
