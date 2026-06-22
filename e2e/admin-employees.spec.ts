import { test, expect } from "@playwright/test";
import { clickAdminTab, loginAdmin } from "./helpers/auth";

test.describe("admin employees", () => {
  test("employees tab shows seeded staff", async ({ page }) => {
    await loginAdmin(page);
    await clickAdminTab(page, "employees");

    await expect(page.getByText("AV000001").first()).toBeVisible({
      timeout: 15000,
    });
  });
});
