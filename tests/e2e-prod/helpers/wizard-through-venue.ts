import { expect, type Page } from "@playwright/test";

/** Couple → date → guests → type → venue; Next from venue opens auth gate at /start/food-upgrade. */
export async function fillWizardThroughVenue(
  page: Page,
  couple1: string,
  couple2: string,
): Promise<void> {
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
