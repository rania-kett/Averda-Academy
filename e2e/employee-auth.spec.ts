import { test, expect } from "@playwright/test";
import { loginEmployee } from "./helpers/auth";

test.describe("employee auth", () => {
  test("login page shows Averda branding", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByAltText("Averda").first()).toBeVisible();
    await expect(page.getByText("Averda Academy")).toBeVisible();
  });

  test("valid credentials redirect to /home", async ({ page }) => {
    await loginEmployee(page);
  });

  test("wrong PIN shows error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/employee|matricule|رقم|موظف/i).fill("AV000001");
    for (const d of ["9", "9", "9", "9"]) {
      await page.locator(".grid").getByRole("button", { name: d, exact: true }).click();
    }
    await page.getByRole("button", { name: /login|connexion|دخول/i }).click();
    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
  });
});
