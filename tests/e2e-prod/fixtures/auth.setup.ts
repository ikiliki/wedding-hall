import { mkdirSync } from "node:fs";
import path from "node:path";
import { test as setup } from "@playwright/test";
import { createSeededUser, deleteSeededUser, grantAdmin } from "../cleanup/supabase-admin";
import { runId } from "../cleanup/run-id";

function authPath(role: "couple" | "admin"): string {
  return path.join(process.cwd(), "playwright", ".auth", `${role}-${runId()}.json`);
}

setup("authenticate seeded couple", async ({ page }) => {
  mkdirSync(path.join(process.cwd(), "playwright", ".auth"), { recursive: true });
  const user = await createSeededUser({
    slug: "storagestate-couple",
    password: "WhE2eCouple1!",
  });
  try {
    await page.goto("/login");
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.getByRole("button", { name: /התחברות/ }).click();
    await page.context().storageState({ path: authPath("couple") });
  } finally {
    await deleteSeededUser(user);
  }
});

setup("authenticate seeded admin", async ({ page }) => {
  mkdirSync(path.join(process.cwd(), "playwright", ".auth"), { recursive: true });
  const user = await createSeededUser({
    slug: "storagestate-admin",
    password: "WhE2eAdmin1!",
  });
  await grantAdmin(user);
  try {
    await page.goto("/login");
    await page.locator("#email").fill(user.email);
    await page.locator("#password").fill(user.password);
    await page.getByRole("button", { name: /התחברות/ }).click();
    await page.context().storageState({ path: authPath("admin") });
  } finally {
    await deleteSeededUser(user);
  }
});
