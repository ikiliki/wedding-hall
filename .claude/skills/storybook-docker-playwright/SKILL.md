---
name: storybook-docker-playwright
description: Fix Storybook in Docker (Vite/MSW preview errors, stale node_modules volumes), run Playwright smoke tests, and refresh the storybook service.
---

# Storybook in Docker + Playwright

Use when Storybook on **http://localhost:6006** (or `127.0.0.1:6006`) shows **"Failed to fetch dynamically imported module"** for `.storybook/preview.tsx`, **"Failed to resolve import msw-storybook-addon"**, or components never render. Also use when adding Storybook/MSW-related devDependencies and Docker still serves an old `node_modules` tree.

## Why it breaks

The `storybook` service uses **dedicated volumes** for `node_modules` (`wedding-hall_storybook_*`). If those volumes were created when the image omitted dev packages, or before `client/Dockerfile` ran a post-`COPY client` `npm install`, the container can miss **`msw-storybook-addon`** and preview cannot load.

## Fix: refresh Storybook image + volumes (repo root)

**Windows (PowerShell)** or any shell — from the repo root.

1. Stop and remove the Storybook container (adjust compose path if needed):

```powershell
docker compose stop storybook
docker rm -f wh-storybook
```

2. Remove only the Storybook `node_modules` volumes (does **not** wipe the DB):

```powershell
docker volume rm wedding-hall_storybook_repo_node_modules wedding-hall_storybook_client_workspace_node_modules
```

3. Rebuild and start (picks up current `client/Dockerfile` + `package-lock.json`):

```powershell
docker compose up -d --build storybook
```

4. Optional sanity check inside the container:

```text
docker exec wh-storybook sh -c "test -f /repo/node_modules/msw-storybook-addon/package.json && echo ok"
```

5. Open **http://127.0.0.1:6006** and hard-refresh.

## Still broken in the browser (but `npm run test:storybook` passes)

1. **Confirm the stack**: This repo uses **Storybook 8.6** (`@storybook/react-vite` in `client/package.json`). If the UI shows a different major version badge (e.g. from an extension), ignore it or disable extensions — extensions can inject scripts into Storybook and break the iframe.

2. **Pick one server on port 6006**: Either Docker **`storybook`** *or* host **`npm run storybook`** — not both. If two processes fight for the port, behavior is flaky (`docker compose ps`, Task Manager / `Get-NetTCPConnection -LocalPort 6006`).

3. **Hard refresh / cache**: Ctrl+Shift+R, or try an **InPrivate/Incognito** window for **http://127.0.0.1:6006**.

4. **Same-origin bookmark**: Stick to **either** `http://localhost:6006` **or** `http://127.0.0.1:6006` per session (different origins; avoids weird module/HMR edge cases).

5. **Prove the server**: From repo root after `npm ci`, run **`npm run test:storybook`** — if this passes, Storybook is serving stories correctly; focus on browser/extensions/cache next.

6. **Latest repo**: Ensure `main.ts`, `client/Dockerfile`, and root `package.json` match **main** (pull/rebase); partial upgrades leave broken Docker volumes.

## Local smoke tests (no Docker required)

From repo root, after `npm ci`:

```bash
npm run test:storybook
```

Playwright config starts **`npm run storybook`** if nothing is listening on port **6006**; if Docker Storybook is already up, it reuses that server.

CI runs the same after `build-storybook` (installs Chromium via Playwright).

## Code locations

- **Vite / aliases**: `client/.storybook/main.ts` — `@wedding-hall/shared` paths, `msw-storybook-addon`, `msw`, `server.fs.allow`, `server.fs.strict: false`, `resolve.dedupe` for React.
- **Image install**: `client/Dockerfile` — second `npm install` at `/repo` after full `client/` copy.
- **Root devDeps**: `package.json` — `msw`, `msw-storybook-addon` (hoisted for Docker/CI).
- **Tests**: `tests/storybook.spec.ts`, `playwright.config.ts`.

## Do not

- Do not run `docker compose down -v` unless the user intends to wipe **all** project volumes including **Postgres** (`db_data`).
