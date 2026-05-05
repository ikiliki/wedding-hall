import { defineConfig, devices } from "@playwright/test";
import path from "node:path";

/**
 * Production (or staging) E2E against the deployed Vite client.
 *
 * Required env:
 * - PLAYWRIGHT_BASE_URL — client origin (production: https://wedding-hall-gamma.vercel.app)
 *
 * Optional:
 * - CI — when set, forbids test.only and enables retries
 *
 * Credentials are read inside tests from E2E_USER{1,2}_EMAIL / E2E_USER{1,2}_PASSWORD
 * (see tests/e2e-prod/README.md). Do not commit secrets.
 */
/** Must match deployed client origin when running prod E2E (tests skip if unset). */
const baseURL = process.env.PLAYWRIGHT_BASE_URL ?? "";

export default defineConfig({
  testDir: "./tests/e2e-prod",
  timeout: 180_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["./tests/e2e-prod/reporters/github-issue-reporter.ts"],
  ],
  globalSetup: "./tests/e2e-prod/global-setup.ts",
  globalTeardown: "./tests/e2e-prod/global-teardown.ts",
  outputDir: path.join("test-results", "e2e-prod-output"),
  use: {
    ...devices["Desktop Chrome"],
    baseURL: baseURL || undefined,
    locale: "he-IL",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "off",
  },
  // Never auto-start a dev server for prod runs.
  projects: [
    { name: "setup", testMatch: /fixtures\/auth\.setup\.ts/ },
    {
      name: "chromium-prod",
      dependencies: ["setup"],
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /fixtures\/auth\.setup\.ts/,
    },
  ],
});
