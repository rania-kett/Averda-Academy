import { test, expect } from "@playwright/test";
import { loginEmployee } from "./helpers/auth";

test.describe("employee assessment", () => {
  test("home loads after login", async ({ page }) => {
    await loginEmployee(page);
    await expect(page).toHaveURL(/\/home/);
  });
});
