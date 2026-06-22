import { describe, it, expect } from "vitest";
import {
  isRoadTrafficSafetyCourse,
  isSweepingSafetyCourse,
  isTrafficLawCourse,
  isLessonQuizCourse,
} from "../../src/data/courseVisibility.js";
import { ROAD_TRAFFIC_SAFETY_SLUG } from "../../src/data/roadSafetyLessonQuiz.js";
import { SWEEPING_SAFETY_SLUG } from "../../src/data/sweepingLessonQuiz.js";

describe("courseVisibility (server)", () => {
  it("exact road safety slug match", () => {
    expect(isRoadTrafficSafetyCourse(ROAD_TRAFFIC_SAFETY_SLUG, {}, null)).toBe(true);
    expect(isLessonQuizCourse(ROAD_TRAFFIC_SAFETY_SLUG, {}, null)).toBe(true);
  });

  it("Arabic title substring match for road safety", () => {
    expect(
      isRoadTrafficSafetyCourse("other-slug", { ar: "السلامة أولاً في الطريق" }, null)
    ).toBe(true);
  });

  it("PDF path substring match for sweeping safety", () => {
    expect(
      isSweepingSafetyCourse("x", {}, "/courses/Sweepers/securite_du_balayage.pdf")
    ).toBe(true);
  });

  it("exact sweeping slug match", () => {
    expect(isSweepingSafetyCourse(SWEEPING_SAFETY_SLUG, {}, null)).toBe(true);
  });

  it("traffic law via Arabic title", () => {
    expect(
      isTrafficLawCourse("unknown", { ar: "احترام قانون السير على الطريق" }, null)
    ).toBe(true);
    expect(isLessonQuizCourse("unknown", { ar: "احترام قانون السير" }, null)).toBe(true);
  });

  it("unknown course returns false for lesson quiz", () => {
    expect(isLessonQuizCourse("totally-unknown-slug", { ar: "عنوان عشوائي" }, "/foo.pdf")).toBe(
      false
    );
  });
});
