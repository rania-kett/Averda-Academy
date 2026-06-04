import { prisma } from "../lib/prisma.js";

/** Matches client `CATEGORIES_WITHOUT_COURSES_YET` in DashboardPage.tsx */
const CATEGORIES_WITHOUT_COURSES_YET = new Set(["parkAgent", "maintenance"]);

/**
 * Active courses shown in admin «الدورات» tab (excludes roles with no catalog yet).
 */
export async function countAdminVisibleCourses(): Promise<number> {
  const courses = await prisma.course.findMany({
    where: { isActive: true },
    select: {
      categories: { select: { category: { select: { code: true } } } },
    },
  });

  return courses.filter((c) => {
    const codes = c.categories
      .map((cc) => cc.category.code)
      .filter((code) => !CATEGORIES_WITHOUT_COURSES_YET.has(code));
    return codes.length > 0;
  }).length;
}
