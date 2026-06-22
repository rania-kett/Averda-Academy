import { describe, it, expect } from "vitest";
import {
  computeEmployeeCourseMetrics,
  assessmentPassedForProgress,
  type CourseProgressRow,
} from "../../src/utils/employeeCourseProgress.js";

/** Mirrors POST /api/courses/:id/progress completionPct calculation. */
function calcReadingProgressPct(pagesRead: number, totalPages: number): number {
  if (totalPages <= 0) return 0;
  return Math.min(100, (pagesRead / totalPages) * 100);
}

describe("employeeCourseProgress", () => {
  const courses: CourseProgressRow[] = [
    { id: "c1", slug: "a", title: { ar: "A" } },
    { id: "c2", slug: "b", title: { ar: "B" } },
  ];

  it("progress % = 0 when no pages read", () => {
    expect(calcReadingProgressPct(0, 20)).toBe(0);
  });

  it("progress % = 100 when pagesRead >= totalPages", () => {
    expect(calcReadingProgressPct(20, 20)).toBe(100);
    expect(calcReadingProgressPct(25, 20)).toBe(100);
  });

  it("partial progress rounds correctly", () => {
    expect(calcReadingProgressPct(5, 20)).toBe(25);
    expect(calcReadingProgressPct(1, 3)).toBeCloseTo(33.333, 2);
  });

  it("assessment not passed → coursesDone 0, status not_started", () => {
    const m = computeEmployeeCourseMetrics(courses, [], [], [], false, null);
    expect(m.coursesDone).toBe(0);
    expect(m.status).toBe("not_started");
    expect(m.hasStarted).toBe(false);
  });

  it("assessment passed with completed progress → completed status", () => {
    const progress = [
      { courseId: "c1", isCompleted: true, completionPct: 100 },
      { courseId: "c2", isCompleted: true, completionPct: 100 },
    ];
    const m = computeEmployeeCourseMetrics(courses, progress, [], [], true, 80);
    expect(m.coursesDone).toBe(2);
    expect(m.status).toBe("completed");
  });

  it("assessmentPassedForProgress boundary at 70", () => {
    expect(assessmentPassedForProgress(true, 70)).toBe(true);
    expect(assessmentPassedForProgress(true, 69)).toBe(false);
  });
});
