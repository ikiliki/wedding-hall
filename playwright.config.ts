import { defineConfig, devices } from "@playwright/test";

/**
 * Storybook smoke tests: starts `npm run storybook` unless CI or another server is already up.
 */
export default defineConfig({
  testDir: "./tests",
  /** Prod E2E lives in `e2e-prod/` and runs via `playwright.prod.config.ts`. */
  testIgnore: /[/\\]e2e-prod[/\\]/,
  timeout: 120_000,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:6006",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run storybook",
    url: "http://127.0.0.1:6006",
    // Reuse a dev Docker/local Storybook on :6006 so Playwright does not need a second listener.
    reuseExistingServer: true,
    timeout: 120_000,
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
