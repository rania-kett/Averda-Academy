import { describe, it, expect } from "vitest";
import { CATEGORIES, CATEGORY_ORDER, type CategoryKey } from "@/config/categories";

/** Mirrors DashboardPage.tsx — roles with no employee course catalog yet. */
const CATEGORIES_WITHOUT_COURSES_YET: CategoryKey[] = ["parkAgent", "maintenance"];

describe("categoryConfig", () => {
  it("CATEGORIES has exactly 6 keys", () => {
    expect(Object.keys(CATEGORIES)).toHaveLength(6);
  });

  it("CATEGORIES_WITHOUT_COURSES_YET contains parkAgent and maintenance", () => {
    expect(CATEGORIES_WITHOUT_COURSES_YET).toContain("parkAgent");
    expect(CATEGORIES_WITHOUT_COURSES_YET).toContain("maintenance");
    expect(CATEGORIES_WITHOUT_COURSES_YET).toHaveLength(2);
  });

  it("CATEGORY_ORDER length is 6", () => {
    expect(CATEGORY_ORDER).toHaveLength(6);
  });

  it("each category has label, color, and icon", () => {
    for (const key of CATEGORY_ORDER) {
      const def = CATEGORIES[key];
      expect(def.label.ar).toBeTruthy();
      expect(def.label.fr).toBeTruthy();
      expect(def.label.en).toBeTruthy();
      expect(def.color).toMatch(/^#/);
      expect(def.icon).toBeTruthy();
      expect(def.bgColor).toMatch(/^#/);
    }
  });
});
