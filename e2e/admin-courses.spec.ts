import { test, expect } from "@playwright/test";
import { clickAdminTab, loginAdmin } from "./helpers/auth";

test.describe("admin courses", () => {
  test("courses tab shows course list", async ({ page }) => {
    await loginAdmin(page);
    await clickAdminTab(page, "courses");

    await expect(page.locator("body")).toContainText(/course|دورة|cours|دورات/i, {
      timeout: 15000,
    });
  });
});
