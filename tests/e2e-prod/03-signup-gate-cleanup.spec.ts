import { test, expect } from "./fixtures";
import { fillWizardThroughVenue } from "./helpers/wizard-through-venue";

/** Avoid false positives when benign copy mentions “אימייל”. */
function looksLikeEmailConfirmationBlocker(text: string): boolean {
  return /לקבלת קישור אימות|Verify your email|confirm your email address|קישור לאימות החשבון/i.test(
    text,
  );
}

test.describe("production sign-up at gate (cleanup after)", () => {
  test("sign up seeded fixture user and resume one wizard step", async ({
    page,
    couple,
  }) => {
    await fillWizardThroughVenue(page, "E2E הרשמה", "ניקוי");

    await page
      .getByRole("link", { name: /המשיכו לכניסה והרשמה/ })
      .click();
    await expect(page).toHaveURL(/\/login\?/);

    await page.getByRole("tab", { name: /כניסה למערכת/ }).click();
    await page.locator("#email").fill(couple.email);
    await page.locator("#password").fill(couple.password);

    await page.getByRole("button", { name: /התחברות/ }).click();

    await expect(page).toHaveURL(/\/start\/food-upgrade/, { timeout: 120_000 });

    const infoMaybe = page.locator('[role="status"]');
    if ((await infoMaybe.count()) > 0) {
      const txt = await infoMaybe.first().innerText().catch(() => "");
      if (looksLikeEmailConfirmationBlocker(txt)) {
        throw new Error(
          `Signin unexpectedly blocked by confirmation message: ${txt.trim()}`,
        );
      }
    }

    await page.getByRole("radio", { name: /לא, נשארים בסטנדרט/ }).click();
    await page.getByRole("button", { name: /המשך/ }).click();
    await expect(page).toHaveURL(/\/start\/bar/);
  });
});
