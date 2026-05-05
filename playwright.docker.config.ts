import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Playwright E2E against the **local Docker** stack (`docker compose`).
 * Reuses `tests/e2e-prod/*` but points at the Vite client in the `client` container.
 *
 * Default `PLAYWRIGHT_BASE_URL` is `http://localhost:5173` (override if you map ports differently).
 *
 * See `.claude/skills/wedding-hall-e2e-docker-flow/SKILL.md`.
 */
const baseURL =
  process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:5173";

export default defineConfig({
  testDir: "./tests/e2e-prod",
  timeout: 180_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  globalSetup: "./tests/e2e-prod/global-setup.ts",
  globalTeardown: "./tests/e2e-prod/global-teardown.ts",
  outputDir: path.join("test-results", "e2e-docker-output"),
  use: {
    ...devices["Desktop Chrome"],
    baseURL,
    locale: "he-IL",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  projects: [
    { name: "setup", testMatch: /fixtures\/auth\.setup\.ts/ },
    {
      name: "chromium-docker",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /fixtures\/auth\.setup\.ts/,
    },
  ],
});
