import { test, expect } from "./fixtures";
import { runId } from "./cleanup/run-id";

test.describe("admin adds vendor → couple sees it on dashboard", () => {
  test("fixture-seeded admin creates vendor; seeded couple sees vendor", async ({
    authedPage,
    admin,
    couple,
  }) => {
    const vendorName = `Playwright-E2E-${runId()}-admin-ui-${Date.now().toString(36)}`;
    const { page: adminPage, context: adminCtx } = await authedPage(admin);

    try {
      await adminPage.goto("/admin");

      await expect(
        adminPage.getByRole("heading", { name: /כלי ניהול Wedding Hall/ }),
      ).toBeVisible({ timeout: 60_000 });

      await adminPage.goto("/admin/vendors/new");
      await adminPage.locator("#vf-name").waitFor({ state: "visible", timeout: 30_000 });

      // Empty-categories diagnostic: if the data is missing, fail fast with a
      // pointer to the seed migration instead of timing out further down.
      const empty = adminPage.locator("#vf-empty-categories");
      if (await empty.isVisible().catch(() => false)) {
        throw new Error(
          "vendor_categories is empty in this project — apply supabase/migrations/20260505140000_reseed_vendor_categories.sql.",
        );
      }

      await adminPage.locator("#vf-name").fill(vendorName);
      const cat = adminPage.locator("#vf-category");
      const optCount = await cat.locator("option").count();
      expect(optCount).toBeGreaterThan(1);
      await cat.selectOption({ index: 1 });
      await adminPage.locator("#vf-city").fill("תל אביב");
      await adminPage.getByRole("button", { name: /צור ספק/ }).click();
      await expect(adminPage).toHaveURL(/\/admin\/vendors$/, { timeout: 60_000 });
      await expect(adminPage.getByText(vendorName)).toBeVisible();
    } finally {
      await adminCtx.close();
    }

    const { page, context: userCtx } = await authedPage(couple);

    try {
      await page.goto("/dashboard/vendors");
      await expect(page.getByRole("heading", { name: /^ספקים$/ })).toBeVisible({
        timeout: 30_000,
      });
      await expect(page.getByText(vendorName)).toBeVisible({ timeout: 30_000 });
    } finally {
      await userCtx.close();
    }
  });
});
