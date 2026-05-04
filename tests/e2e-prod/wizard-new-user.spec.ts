import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

const SCREENSHOT_DIR = path.join(
  process.cwd(),
  "test-results",
  "e2e-prod-screenshots",
);

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`Missing required env ${name}`);
  }
  return v;
}

function shouldRun(): boolean {
  return Boolean(
    process.env.PLAYWRIGHT_BASE_URL &&
      process.env.E2E_USER1_EMAIL &&
      process.env.E2E_USER1_PASSWORD &&
      process.env.E2E_USER2_EMAIL &&
      process.env.E2E_USER2_PASSWORD,
  );
}

/** Avoid false positives when benign copy mentions “אימייל”. */
function looksLikeEmailConfirmationBlocker(text: string): boolean {
  return /לקבלת קישור אימות|Verify your email|confirm your email address|קישור לאימות החשבון/i.test(
    text,
  );
}

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

/** Couple → date → guests → type → venue; Next from venue opens auth gate at /start/food-upgrade. */
async function fillWizardThroughVenue(
  page: Page,
  couple1: string,
  couple2: string,
): Promise<void> {
  // Avoid relying on `/start` → couple redirect (hydrate can stick if a chunk 404s).
  await page.goto("/start/couple", { waitUntil: "domcontentloaded" });
  await page.locator("#name1").waitFor({ state: "visible", timeout: 60_000 });

  await page.locator("#name1").fill(couple1);
  await page.locator("#name2").fill(couple2);
  await page.getByRole("button", { name: /המשך/ }).click();
  await expect(page).toHaveURL(/\/start\/date/);

  await page.getByRole("radio", { name: /ראשון עד שלישי/ }).click();
  await page.locator("#celebration-date").fill("2030-07-15");
  await page.getByRole("button", { name: /המשך/ }).click();
  await expect(page).toHaveURL(/\/start\/guests/);

  await page.getByRole("button", { name: /המשך/ }).click();
  await expect(page).toHaveURL(/\/start\/type/);

  await page.getByRole("button", { name: /המשך/ }).click();
  await expect(page).toHaveURL(/\/start\/venue/);

  await page.getByRole("radio", { name: /ממוצע/ }).click();
  await page.getByRole("button", { name: /המשך/ }).click();
  await expect(page).toHaveURL(/\/start\/food-upgrade/);

  await expect(
    page.getByRole("heading", { name: /הגיע הזמן לשמור את ההתקדמות/ }),
  ).toBeVisible();
}

test.describe("production new-user wizard (auth gate at food-upgrade)", () => {
  test.beforeEach(({ }, testInfo) => {
    testInfo.skip(
      !shouldRun(),
      "Set PLAYWRIGHT_BASE_URL, E2E_USER1_EMAIL, E2E_USER1_PASSWORD, E2E_USER2_EMAIL, E2E_USER2_PASSWORD",
    );
  });

  test("user 1: draft through venue → gate → sign up → resume questionnaire", async ({
    page,
  }, testInfo) => {
    const browserErrors = attachBrowserErrorListeners(page);
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

      await page.getByRole("tab", { name: /הרשמה חדשה/ }).click();
      await page.locator("#email").fill(requireEnv("E2E_USER1_EMAIL"));
      await page.locator("#password").fill(requireEnv("E2E_USER1_PASSWORD"));

      const putBudget = page.waitForResponse(
        (r) =>
          r.request().method() === "PUT" &&
          r.url().includes("/api/budget") &&
          r.ok(),
        { timeout: 120_000 },
      );

      await page.getByRole("button", { name: /פתיחת חשבון/ }).click();

      await expect(page).toHaveURL(/\/start\/food-upgrade/, { timeout: 120_000 });

      const infoMaybe = page.locator('[role="status"]');
      if ((await infoMaybe.count()) > 0) {
        const txt = await infoMaybe.first().innerText().catch(() => "");
        if (looksLikeEmailConfirmationBlocker(txt)) {
          throw new Error(
            `Signup did not return an immediate session (email confirmation?). Message: ${txt.trim()}`,
          );
        }
      }

      await putBudget;

      const raw = await page.evaluate(() =>
        localStorage.getItem("wh.wizard.v1"),
      );
      expect(raw).toBeTruthy();
      expect(raw).toContain("E2E אחד");

      await screenshotChrome(
        page,
        "user1-food-upgrade",
        "Food upgrade step after signup (user 1)",
      );

      await page.getByRole("radio", { name: /לא, נשארים בסטנדרט/ }).click();
      await page.getByRole("button", { name: /המשך/ }).click();
      await expect(page).toHaveURL(/\/start\/bar/);
    } finally {
      await attachErrorsIfAny(testInfo, browserErrors);
    }
  });

  test("user 2: isolated context — same flow, second account", async ({
    browser,
  }, testInfo) => {
    const context = await browser.newContext({
      locale: "he-IL",
      viewport: { width: 1280, height: 720 },
    });
    const page = await context.newPage();
    const browserErrors = attachBrowserErrorListeners(page);

    try {
      await fillWizardThroughVenue(page, "E2E שני", "חדש");

      await screenshotChrome(page, "user2-gate", "Auth gate (user 2)");

      await page
        .getByRole("link", { name: /המשיכו לכניסה והרשמה/ })
        .click();
      await expect(page).toHaveURL(/\/login\?/);

      await screenshotChrome(page, "user2-login", "Login page (user 2)");

      await page.getByRole("tab", { name: /הרשמה חדשה/ }).click();
      await page.locator("#email").fill(requireEnv("E2E_USER2_EMAIL"));
      await page.locator("#password").fill(requireEnv("E2E_USER2_PASSWORD"));

      const putBudget = page.waitForResponse(
        (r) =>
          r.request().method() === "PUT" &&
          r.url().includes("/api/budget") &&
          r.ok(),
        { timeout: 120_000 },
      );

      await page.getByRole("button", { name: /פתיחת חשבון/ }).click();

      await expect(page).toHaveURL(/\/start\/food-upgrade/, { timeout: 120_000 });

      const infoMaybe2 = page.locator('[role="status"]');
      if ((await infoMaybe2.count()) > 0) {
        const txt = await infoMaybe2.first().innerText().catch(() => "");
        if (looksLikeEmailConfirmationBlocker(txt)) {
          throw new Error(
            `Signup did not return an immediate session (email confirmation?). Message: ${txt.trim()}`,
          );
        }
      }

      await putBudget;

      const raw = await page.evaluate(() =>
        localStorage.getItem("wh.wizard.v1"),
      );
      expect(raw).toContain("E2E שני");

      await screenshotChrome(
        page,
        "user2-food-upgrade",
        "Food upgrade step after signup (user 2)",
      );

      await page.getByRole("radio", { name: /לא, נשארים בסטנדרט/ }).click();
      await page.getByRole("button", { name: /המשך/ }).click();
      await expect(page).toHaveURL(/\/start\/bar/);
    } finally {
      await attachErrorsIfAny(testInfo, browserErrors);
      try {
        await context.close();
      } catch {
        /* Context may already be closed after timeout/shutdown. */
      }
    }
  });
});
