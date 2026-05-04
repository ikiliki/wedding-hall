import { expect, test } from "@playwright/test";

test.describe("Storybook", () => {
  test("iframe story renders without Vite module load error", async ({ page }) => {
    const res = await page.goto(
      "/iframe.html?id=common-button--primary-md&viewMode=story",
      { waitUntil: "domcontentloaded", timeout: 120_000 },
    );
    expect(res?.ok()).toBeTruthy();

    await page.locator("#storybook-root").waitFor({ state: "attached", timeout: 90_000 });

    await expect(
      page.getByRole("heading", { name: /Failed to fetch dynamically imported module/i }),
    ).toHaveCount(0);
    await expect(
      page.getByText(/Failed to resolve import "msw-storybook-addon"/i),
    ).toHaveCount(0);

    const configureGuidelines = page.getByText(/Configure your project|Unable to index files/i);
    await expect(configureGuidelines).toHaveCount(0);

    await expect(page.getByRole("button", { name: /Continue/i })).toBeVisible({ timeout: 90_000 });
  });

  test("story depending on @wedding-hall/shared still renders", async ({ page }) => {
    const res = await page.goto(
      "/iframe.html?id=features-dashboard-budgetsummary--with-countdown&viewMode=story",
      { waitUntil: "domcontentloaded", timeout: 120_000 },
    );
    expect(res?.ok()).toBeTruthy();

    await page.locator("#storybook-root").waitFor({ state: "attached", timeout: 90_000 });

    await expect(
      page.getByRole("heading", { name: /Failed to fetch dynamically imported module/i }),
    ).toHaveCount(0);

    const configureGuidelines = page.getByText(/Configure your project|Unable to index files/i);
    await expect(configureGuidelines).toHaveCount(0);

    await expect(page.locator("#storybook-root")).not.toBeEmpty({ timeout: 90_000 });
  });
});
