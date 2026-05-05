import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { test, expect, type TestInfo } from "./fixtures";
import type { Page } from "@playwright/test";
import { fillWizardThroughVenue } from "./helpers/wizard-through-venue";
import { attachResponseLogger } from "./helpers/response-logger";

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "e2e-prod-screenshots",
);

function attachBrowserErrorListeners(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") {
      errors.push(`[console.error] ${msg.text()}`);
    }
  });
  page.on("pageerror", (err) => {
    errors.push(`[pageerror] ${String(err)}`);
  });
  return errors;
}

async function attachErrorsIfAny(testInfo: TestInfo, errors: string[]) {
  if (errors.length === 0) return;
  await testInfo.attach("browser-errors.txt", {
    body: errors.join("\n"),
    contentType: "text/plain",
  });
}

async function screenshotChrome(
  page: Page,
  baseName: string,
  title: string,
): Promise<void> {
  mkdirSync(SCREENSHOT_DIR, { recursive: true });
  const desktop = path.join(SCREENSHOT_DIR, `${baseName}-desktop.png`);
  await page.screenshot({ path: desktop, fullPage: true });

  await page.setViewportSize({ width: 360, height: 640 });
  const w360 = path.join(SCREENSHOT_DIR, `${baseName}-360x640.png`);
  await page.screenshot({ path: w360, fullPage: true });

  await page.setViewportSize({ width: 320, height: 568 });
  const w320 = path.join(SCREENSHOT_DIR, `${baseName}-320x568.png`);
  await page.screenshot({ path: w320, fullPage: true });

  await page.setViewportSize({ width: 1280, height: 720 });

  const note = path.join(SCREENSHOT_DIR, `${baseName}-README.txt`);
  writeFileSync(
    note,
    `${title}\n\nReview wh-wizard-stitch-header / wh-wizard-stitch-footer spacing (desktop, 360×640, 320×568).\n\nSuggestions (fill after review):\n- Header padding:\n- Footer / legal bar:\n`,
    "utf8",
  );
}

test.describe("production wizard (auth gate — existing users sign in)", () => {
  test("user 1: draft through venue → gate → sign in → resume questionnaire", async ({
    page,
    couple,
    loginAs,
  }, testInfo) => {
    const browserErrors = attachBrowserErrorListeners(page);
    const flushNetworkErrors = attachResponseLogger(page, testInfo);
    try {
      await fillWizardThroughVenue(page, "E2E אחד", "משתמש");

      await screenshotChrome(
        page,
        "user1-gate",
        "Auth gate before login (user 1)",
      );

      await page
        .getByRole("link", { name: /המשיכו לכניסה והרשמה/ })
        .click();
      await expect(page).toHaveURL(/\/login\?/);

      await screenshotChrome(
        page,
        "user1-login",
        "Login page with returnTo (user 1)",
      );

      await loginAs(page, couple);

      await expect(page).toHaveURL(/\/start\/food-upgrade/, { timeout: 120_000 });

      await screenshotChrome(
        page,
        "user1-food-upgrade",
        "Food upgrade step after sign-in (user 1)",
      );

      await page.getByRole("radio", { name: /לא, נשארים בסטנדרט/ }).click();
      await page.getByRole("button", { name: /המשך/ }).click();
      await expect(page).toHaveURL(/\/start\/bar/);
    } finally {
      await attachErrorsIfAny(testInfo, browserErrors);
      await flushNetworkErrors();
    }
  });

  test("user 2: isolated context — same flow, second account", async ({
    browser,
    couple,
    loginAs,
  }, testInfo) => {
    const context = await browser.newContext({
      locale: "he-IL",
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    const browserErrors = attachBrowserErrorListeners(page);
    const flushNetworkErrors = attachResponseLogger(page, testInfo);

    try {
      await fillWizardThroughVenue(page, "E2E שני", "חדש");

      await screenshotChrome(page, "user2-gate", "Auth gate (user 2)");

      await page
        .getByRole("link", { name: /המשיכו לכניסה והרשמה/ })
        .click();
      await expect(page).toHaveURL(/\/login\?/);

      await screenshotChrome(page, "user2-login", "Login page (user 2)");
      await loginAs(page, couple);

      await expect(page).toHaveURL(/\/start\/food-upgrade/, { timeout: 120_000 });

      await screenshotChrome(
        page,
        "user2-food-upgrade",
        "Food upgrade step after sign-in (user 2)",
      );

      await page.getByRole("radio", { name: /לא, נשארים בסטנדרט/ }).click();
      await page.getByRole("button", { name: /המשך/ }).click();
      await expect(page).toHaveURL(/\/start\/bar/);
    } finally {
      await attachErrorsIfAny(testInfo, browserErrors);
      await flushNetworkErrors();
      try {
        await context.close();
      } catch {
        /* Context may already be closed after timeout/shutdown. */
      }
    }
  });
});
