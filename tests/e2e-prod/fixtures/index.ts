import { test as base, expect, type BrowserContext, type Page } from "@playwright/test";
import {
  createSeededUser,
  createSeededVendor,
  deleteSeededUser,
  deleteSeededVendor,
  firstCategoryId,
  grantAdmin,
  type SeededUser,
  type SeededVendor,
} from "../cleanup/supabase-admin";

type Fixtures = {
  couple: SeededUser;
  admin: SeededUser;
  vendor: (overrides?: { slug?: string; categoryId?: string }) => Promise<SeededVendor>;
  loginAs: (page: Page, user: SeededUser) => Promise<void>;
  authedPage: (user: SeededUser) => Promise<{ page: Page; context: BrowserContext }>;
};

function titleSlug(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

export const test = base.extend<Fixtures>({
  couple: async ({}, use, testInfo) => {
    const user = await createSeededUser({
      slug: `couple-${testInfo.workerIndex}-${titleSlug(testInfo.title)}`,
      password: "WhE2eCouple1!",
    });
    try {
      await use(user);
    } finally {
      try {
        await deleteSeededUser(user);
      } catch (err) {
        console.error("[e2e-fixture] couple cleanup failed", err);
      }
    }
  },
  admin: async ({}, use, testInfo) => {
    const user = await createSeededUser({
      slug: `admin-${testInfo.workerIndex}-${titleSlug(testInfo.title)}`,
      password: "WhE2eAdmin1!",
    });
    await grantAdmin(user);
    try {
      await use(user);
    } finally {
      try {
        await deleteSeededUser(user);
      } catch (err) {
        console.error("[e2e-fixture] admin cleanup failed", err);
      }
    }
  },
  vendor: async ({}, use, testInfo) => {
    const created: SeededVendor[] = [];
    const defaultCategoryId = await firstCategoryId();
    await use(async (overrides) => {
      const v = await createSeededVendor({
        slug:
          overrides?.slug ??
          `vendor-${testInfo.workerIndex}-${created.length}-${titleSlug(testInfo.title)}`,
        categoryId: overrides?.categoryId ?? defaultCategoryId,
      });
      created.push(v);
      return v;
    });
    for (const v of created) {
      try {
        await deleteSeededVendor(v);
      } catch (err) {
        console.error("[e2e-fixture] vendor cleanup failed", err);
      }
    }
  },
  loginAs: async ({}, use) => {
    await use(async (page, user) => {
      if (!/\/login(?:\?|$)/.test(page.url())) {
        await page.goto("/login");
      }
      await page.locator("#email").fill(user.email);
      await page.locator("#password").fill(user.password);
      await page.getByRole("button", { name: /התחברות/ }).click();
      await expect(page).not.toHaveURL(/\/login/, { timeout: 90_000 });
    });
  },
  authedPage: async ({ browser, loginAs }, use) => {
    await use(async (user) => {
      const context = await browser.newContext({
        locale: "he-IL",
        viewport: { width: 1280, height: 720 },
      });
      const page = await context.newPage();
      await loginAs(page, user);
      return { page, context };
    });
  },
});

export { expect } from "@playwright/test";
