import { execFileSync } from "node:child_process";
import path from "node:path";
import { expect, test } from "@playwright/test";
import { fillWizardThroughVenue } from "./helpers/wizard-through-venue";

/** Avoid false positives when benign copy mentions “אימייל”. */
function looksLikeEmailConfirmationBlocker(text: string): boolean {
  return /לקבלת קישור אימות|Verify your email|confirm your email address|קישור לאימות החשבון/i.test(
    text,
  );
}

function shouldRunSignupCleanup(): boolean {
  return Boolean(
    process.env.PLAYWRIGHT_BASE_URL &&
      process.env.SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

function deleteAuthUserByEmail(email: string): void {
  execFileSync(
    process.execPath,
    [path.join(process.cwd(), "scripts/e2e-delete-auth-user.mjs"), email],
    { stdio: "inherit", env: process.env },
  );
}

test.describe("production sign-up at gate (cleanup after)", () => {
  test.beforeEach(({ }, testInfo) => {
    testInfo.skip(
      !shouldRunSignupCleanup(),
      "Set PLAYWRIGHT_BASE_URL, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (same Supabase project as the client; service_role from dashboard API)",
    );
  });

  test("sign up new wh-e2e-signup-* user, resume one wizard step, delete auth user", async ({
    page,
  }) => {
    const createdEmail = `wh-e2e-signup-${Date.now()}@example.com`;
    const password =
      process.env.E2E_SIGNUP_PASSWORD?.trim() || "WhSignup1!";

    try {
      await fillWizardThroughVenue(page, "E2E הרשמה", "ניקוי");

      await page
        .getByRole("link", { name: /המשיכו לכניסה והרשמה/ })
        .click();
      await expect(page).toHaveURL(/\/login\?/);

      await page.getByRole("tab", { name: /הרשמה חדשה/ }).click();
      await page.locator("#email").fill(createdEmail);
      await page.locator("#password").fill(password);

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
      expect(raw).toContain("E2E הרשמה");

      await page.getByRole("radio", { name: /לא, נשארים בסטנדרט/ }).click();
      await page.getByRole("button", { name: /המשך/ }).click();
      await expect(page).toHaveURL(/\/start\/bar/);
    } finally {
      deleteAuthUserByEmail(createdEmail);
    }
  });
});
