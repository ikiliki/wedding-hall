---
name: local-docker-stack
description: Bring up the full Wedding Hall stack on your machine with docker compose — db, auth, rest, gateway, client, server, plus the demo seed user.
---

# Local docker stack

Use when the user wants to run the app locally without touching cloud Supabase, or when reproducing a production bug in a clean environment.

## Prerequisites

- Docker Desktop running (Compose v2 ships with it).
- Ports free locally: **5173** (client), **3001** (server), **54321** (gateway), **54322** (postgres).

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
- Server health → <http://localhost:3001/api/health>
- Supabase API → <http://localhost:54321/rest/v1/wedding_budgets?select=id> (anon should get `[]`)

## Demo login

Email `test@gmail.com`, password `test1234` — created by `supabase/seed.sql`.

## Common operations

| Goal | Command |
|------|---------|
| Tail every service | `docker compose logs -f` |
| Tail one service | `docker compose logs -f auth` |
| Reset DB completely | `docker compose down -v && docker compose up -d --build` |
| Run a psql shell | `docker compose exec db psql -U postgres` |
| Re-run seed only | `docker compose run --rm seed` |
| Stop everything | `docker compose down` |
| Stop and wipe volumes | `docker compose down -v` |

## Troubleshooting

- **`auth` won't start**: usually `db` healthcheck not satisfied yet. `docker compose ps` and re-up.
- **Supabase JS errors with 401**: anon key in `.env.docker` must match the JWT secret. Don't edit one without the other.
- **Hot reload slow on Windows**: this is Docker Desktop file-mount overhead. Either accept the lag or run `npm run dev:client` / `dev:server` outside Docker against the same DB stack (just keep `db`, `auth`, `rest`, `gateway` running).

## Don't

- Don't reuse the dev-only `JWT_SECRET` / anon key in production.
- Don't add long-lived data only to a docker volume — `down -v` will wipe it.
- Don't change `gateway` paths without updating `client/src/shared/lib/supabase.ts` if it ever sets a custom base URL.
