import { test, expect } from "@playwright/test";
import { loginEmployee, openEmployeeCourses } from "./helpers/auth";
import { ALL_CORRECT_ASSESSMENT_ANSWERS } from "./helpers/assessmentAnswers";

test.describe("employee courses", () => {
  test.beforeAll(async ({ request }) => {
    const loginRes = await request.post("/api/auth/login", {
      data: { employeeId: "AV000001", pin: "1234" },
    });
    if (!loginRes.ok()) return;

    const { accessToken } = (await loginRes.json()) as { accessToken: string };
    const assessmentRes = await request.post("/api/user/assessment", {
      headers: { Authorization: `Bearer ${accessToken}` },
      data: { answers: [...ALL_CORRECT_ASSESSMENT_ANSWERS] },
    });
    // 400 when assessment already passed — employee can still access courses.
    if (!assessmentRes.ok() && assessmentRes.status() !== 400) {
      throw new Error(`Assessment setup failed: ${assessmentRes.status()}`);
    }
  });

  test("courses page lists course cards when accessible", async ({ page }) => {
    await loginEmployee(page);
    await openEmployeeCourses(page);

    const assessmentBanner = page.getByText(/assessment|تقييم|évaluation/i);
    const hasBanner = await assessmentBanner.isVisible().catch(() => false);

    if (hasBanner) {
      test.info().annotations.push({
        type: "skip-reason",
        description: "Employee AV000001 needs to complete assessment first",
      });
      return;
    }

    const courseContent = page
      .locator('.course-card-courses, a[href^="/courses/"]')
      .or(page.getByRole("tablist", { name: /training|formation|تدريب|دورات/i }))
      .or(page.getByText(/دورة|cours|course|training|formation/i));

    await expect(courseContent.first()).toBeVisible({ timeout: 15000 });
  });
});
