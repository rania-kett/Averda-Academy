import { test, expect } from "@playwright/test";
import { loginEmployee, openEmployeeProfile } from "./helpers/auth";

test.describe("epi flow", () => {
  test("employee profile loads", async ({ page }) => {
    await loginEmployee(page);
    await openEmployeeProfile(page);
    await expect(page.getByText(/profile|ملفي|profil/i)).toBeVisible({ timeout: 10000 });
  });
});
