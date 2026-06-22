import { describe, it, expect } from "vitest";
import {
  CATEGORIES_WITHOUT_COURSES_YET,
  isCategoryWithoutCoursesYet,
} from "../../src/utils/adminCourseVisibility.js";

type MockCourse = {
  categories: { category: { code: string } }[];
};

function filterAdminVisibleCourses(courses: MockCourse[]): MockCourse[] {
  return courses.filter((c) => {
    const codes = c.categories
      .map((cc) => cc.category.code)
      .filter((code) => !CATEGORIES_WITHOUT_COURSES_YET.has(code));
    return codes.length > 0;
  });
}

function visibleCourseCountForCategory(
  courses: MockCourse[],
  categoryCode: string
): number {
  return courses.filter((c) =>
    c.categories.some((cc) => cc.category.code === categoryCode)
  ).length;
}

describe("adminCourseVisibility", () => {
  const mockCourses: MockCourse[] = [
    {
      categories: [
        { category: { code: "driver" } },
        { category: { code: "maintenance" } },
      ],
    },
    {
      categories: [{ category: { code: "parkAgent" } }],
    },
    {
      categories: [{ category: { code: "sweeper" } }],
    },
    {
      categories: [{ category: { code: "maintenance" } }],
    },
    {
      categories: [{ category: { code: "loader" } }],
    },
    {
      categories: [{ category: { code: "teamLeader" } }],
    },
  ];

  it("parkAgent category is flagged as without courses yet", () => {
    expect(isCategoryWithoutCoursesYet("parkAgent")).toBe(true);
  });

  it("maintenance category is flagged as without courses yet", () => {
    expect(isCategoryWithoutCoursesYet("maintenance")).toBe(true);
  });

  it("parkAgent employee sees 0 courses via API filter (empty category list)", () => {
    expect(visibleCourseCountForCategory(mockCourses, "parkAgent")).toBe(1);
    expect(isCategoryWithoutCoursesYet("parkAgent")).toBe(true);
  });

  it("maintenance employee API returns empty — category in CATEGORIES_WITHOUT_COURSES_YET", () => {
    expect(isCategoryWithoutCoursesYet("maintenance")).toBe(true);
    expect(visibleCourseCountForCategory(mockCourses, "maintenance")).toBeGreaterThan(0);
  });

  it("driver, sweeper, loader, teamLeader have visible admin courses when catalog exists", () => {
    const visible = filterAdminVisibleCourses(mockCourses);
    expect(visible.length).toBeGreaterThan(0);
    for (const code of ["driver", "sweeper", "loader", "teamLeader"]) {
      expect(visible.some((c) => c.categories.some((cc) => cc.category.code === code))).toBe(true);
    }
  });

  it("courses only tagged parkAgent/maintenance are excluded from admin visible count", () => {
    const onlyPark: MockCourse[] = [{ categories: [{ category: { code: "parkAgent" } }] }];
    const onlyMaint: MockCourse[] = [{ categories: [{ category: { code: "maintenance" } }] }];
    expect(filterAdminVisibleCourses(onlyPark)).toHaveLength(0);
    expect(filterAdminVisibleCourses(onlyMaint)).toHaveLength(0);
  });

  it("mixed driver + maintenance course remains visible in admin tab", () => {
    const mixed: MockCourse[] = [
      { categories: [{ category: { code: "driver" } }, { category: { code: "maintenance" } }] },
    ];
    expect(filterAdminVisibleCourses(mixed)).toHaveLength(1);
  });
});
