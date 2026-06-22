import { expect, type Locator, type Page } from "@playwright/test";

function isAdminDashboardPath(pathname: string): boolean {
  return pathname === "/admin" || pathname === "/admin/settings";
}

export async function waitForAdminDashboard(page: Page): Promise<void> {
  await page.waitForURL((url) => isAdminDashboardPath(new URL(url).pathname), {
    timeout: 15000,
  });
}

export async function waitForEmployeeHome(page: Page): Promise<void> {
  await page.waitForURL((url) => new URL(url).pathname === "/home", { timeout: 15000 });
}

export async function dismissEmployeeOnboarding(page: Page): Promise<void> {
  const skip = page.getByRole("button", { name: /skip|passer|تخطي/i });
  try {
    await skip.waitFor({ state: "visible", timeout: 15000 });
    await skip.click();
    await skip.waitFor({ state: "hidden", timeout: 10000 });
  } catch {
    // Overlay not shown for this user/session.
  }
}

async function clickOrTap(locator: Locator): Promise<void> {
  try {
    await locator.tap();
  } catch (error) {
    if (error instanceof Error && error.message.includes("does not support tap")) {
      await locator.click();
    } else {
      throw error;
    }
  }
}

export async function loginEmployee(
  page: Page,
  employeeId = "AV000001",
  pin = "1234"
): Promise<void> {
  await page.goto("/login");
  await page.waitForLoadState("domcontentloaded");

  const idInput = page
    .getByRole("textbox", { name: /matricule|employee|رقم|موظف/i })
    .or(page.getByPlaceholder("AV000000"))
    .or(page.locator('input[placeholder="AV000000"]'))
    .first();
  await idInput.waitFor({ state: "visible", timeout: 10000 });
  await idInput.fill(employeeId);

  const pinInput = page
    .locator('input[type="password"], input[inputmode="numeric"], input[name="pin"]')
    .first();
  const pinInputVisible = await pinInput.isVisible().catch(() => false);

  if (pinInputVisible) {
    await pinInput.fill(pin);
  } else {
    for (const digit of pin.split("")) {
      const btn = page.getByRole("button", { name: digit, exact: true });
      await btn.waitFor({ state: "visible", timeout: 5000 });
      await clickOrTap(btn);
    }
  }

  await page.screenshot({ path: "test-results/debug-login-before-submit.png" });

  const submitBtn = page
    .getByRole("button", { name: /login|connexion|دخول|sign in|تسجيل/i })
    .or(page.locator('button[type="submit"]'))
    .first();
  await submitBtn.waitFor({ state: "visible", timeout: 5000 });

  await clickOrTap(submitBtn);

  await page.waitForTimeout(1000);
  await page.screenshot({ path: "test-results/debug-login-after-submit.png" });

  await Promise.race([
    page.waitForURL((url) => new URL(url).pathname === "/home", { timeout: 20000 }),
    page
      .waitForSelector('[role="alert"], .error, [class*="error"]', { timeout: 20000 })
      .then(async (el) => {
        const text = await el.textContent();
        throw new Error(`Login failed with error: ${text}`);
      }),
  ]);

  await page.waitForLoadState("networkidle");
}

export async function loginAdmin(
  page: Page,
  email = "admin@averda.ma",
  password = "Admin@2026"
): Promise<void> {
  await page.goto("/admin/login");
  await page.waitForLoadState("networkidle");

  await page.locator('input[type="email"], input[name="email"]').fill(email);
  await page.locator('input[type="password"], input[autocomplete="current-password"]').fill(password);
  await page.getByRole("button", { name: /login|connexion|دخول|sign in|تسجيل/i }).click();

  await waitForAdminDashboard(page);
  await page.waitForLoadState("networkidle");
}

export async function clickAdminTab(page: Page, tab: "courses" | "employees"): Promise<void> {
  const label =
    tab === "courses" ? /Courses|Cours|الدورات/i : /Employees|Employés|الموظفون/i;
  const tabBtn = page.locator("aside nav button").filter({ hasText: label });
  await expect(tabBtn).toBeVisible({ timeout: 15000 });
  await tabBtn.click();
}

/** SPA client-side navigation — avoids auth hydration race on full page load. */
export async function openEmployeeProfile(page: Page): Promise<void> {
  await dismissEmployeeOnboarding(page);

  const profileNav = page
    .locator('nav[aria-label] a[href="/profile"]')
    .or(page.getByRole("link", { name: /^(Profile|Profil|ملفي)$/i }));
  await expect(profileNav.first()).toBeVisible({ timeout: 10000 });
  await profileNav.first().click();
  await page.waitForURL((url) => new URL(url).pathname === "/profile", { timeout: 15000 });
}

/** Direct /courses hits the API proxy in dev — use in-app navigation instead. */
export async function openEmployeeCourses(page: Page): Promise<void> {
  await dismissEmployeeOnboarding(page);

  const coursesLink = page.locator('nav[aria-label] a[href="/courses"]').first();
  await expect(coursesLink).toBeVisible({ timeout: 10000 });
  await coursesLink.click();
  await page.waitForURL((url) => new URL(url).pathname === "/courses", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
}
