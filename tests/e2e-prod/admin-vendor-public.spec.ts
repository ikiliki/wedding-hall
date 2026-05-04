import { execSync } from "node:child_process";
import { expect, test } from "@playwright/test";

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing ${name}`);
  return v;
}

function shouldRun(): boolean {
  return Boolean(
    process.env.PLAYWRIGHT_BASE_URL &&
      process.env.E2E_ADMIN_EMAIL &&
      process.env.E2E_ADMIN_PASSWORD &&
      process.env.E2E_USER1_EMAIL &&
      process.env.E2E_USER1_PASSWORD,
  );
}

test.describe("admin adds vendor → couple sees it on dashboard", () => {
  test.beforeAll(() => {
    if (!shouldRun()) return;
    if (process.env.E2E_AUTO_GRANT_ADMIN !== "1") return;
    execSync("node scripts/e2e-grant-admin.mjs", {
      stdio: "inherit",
      env: process.env,
      cwd: process.cwd(),
    });
  });

  test.beforeEach(({ }, testInfo) => {
    testInfo.skip(
      !shouldRun(),
      "Set PLAYWRIGHT_BASE_URL, E2E_ADMIN_EMAIL, E2E_ADMIN_PASSWORD, E2E_USER1_EMAIL, E2E_USER1_PASSWORD",
    );
  });

  test("grant optional via E2E_AUTO_GRANT_ADMIN; admin creates vendor; user1 sees vendor", async ({
    browser,
  }) => {
    const vendorName = `Playwright-E2E-${Date.now()}`;

    const adminCtx = await browser.newContext({
      locale: "he-IL",
      viewport: { width: 1280, height: 720 },
    });
    const adminPage = await adminCtx.newPage();

    try {
      await adminPage.goto("/admin");
      await adminPage.locator("#email").fill(requireEnv("E2E_ADMIN_EMAIL"));
      await adminPage.locator("#password").fill(requireEnv("E2E_ADMIN_PASSWORD"));
      await adminPage.getByRole("button", { name: /התחברות/ }).click();

      await expect(
        adminPage.getByRole("heading", { name: /כלי ניהול Wedding Hall/ }),
      ).toBeVisible({ timeout: 60_000 });

      await adminPage.goto("/admin/vendors/new");
      await adminPage.locator("#vf-name").waitFor({ state: "visible", timeout: 30_000 });
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

    const userCtx = await browser.newContext({
      locale: "he-IL",
      viewport: { width: 1280, height: 720 },
    });
    const page = await userCtx.newPage();

    try {
      await page.goto("/login");
      await page.locator("#email").fill(requireEnv("E2E_USER1_EMAIL"));
      await page.locator("#password").fill(requireEnv("E2E_USER1_PASSWORD"));
      await page.getByRole("button", { name: /התחברות/ }).click();
      await expect(page).not.toHaveURL(/\/login/, { timeout: 90_000 });

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
