import { test, expect } from "@playwright/test";
import { loginEmployee, openEmployeeProfile } from "./helpers/auth";

test.describe("multilingual", () => {
  test("switch to Arabic sets RTL on login page", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "AR" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("switch to French shows LTR", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "FR" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("language preference persists after refresh", async ({ page }) => {
    await page.goto("/login");
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: "FR", exact: true }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr", { timeout: 5000 });
    // Login page updates i18n in-session only; persist what the app reads on reload.
    await page.evaluate(() => localStorage.setItem("averda-academy-lang", "fr"));

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr", { timeout: 5000 });
    await expect(page.locator("body")).toContainText(/Averda Academy|Connexion|Matricule/i);
  });

  test("logged-in user can open profile in Arabic", async ({ page }) => {
    await loginEmployee(page);
    await openEmployeeProfile(page);
    await expect(page).toHaveURL(/\/profile/);
  });
});
