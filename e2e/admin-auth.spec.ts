import { test, expect } from "@playwright/test";
import { loginAdmin } from "./helpers/auth";

test.describe("admin auth", () => {
  test("admin login redirects to dashboard", async ({ page }) => {
    await loginAdmin(page);
  });

  test("wrong password shows error", async ({ page }) => {
    await page.goto("/admin/login");
    await page.locator('input[type="email"]').fill("admin@averda.ma");
    await page.locator('input[autocomplete="current-password"]').fill("wrong-password");
    await page.getByRole("button", { name: /login|connexion|دخول|sign in/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
  });

  test("unauthenticated /admin redirects to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/, { timeout: 10000 });
  });
});
