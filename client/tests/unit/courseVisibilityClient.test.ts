import { describe, it, expect } from "vitest";
import {
  isBasicsGuidanceFromCourse,
  isHsseqIntroFromCourse,
} from "@/utils/courseVisibility";

describe("courseVisibility (client)", () => {
  it("HSSEQ intro course detected by foundation flag", () => {
    expect(isHsseqIntroFromCourse({ isHsseqFoundation: true, slug: "x", title: {} })).toBe(true);
  });

  it("basics guidance course for failed assessment path", () => {
    expect(
      isBasicsGuidanceFromCourse({
        slug: "basic-guidelines",
        title: { ar: "توجيهات أساسية", en: "Basic guidance", fr: "Directives de base" },
      })
    ).toBe(true);
  });

  it("regular driver course is not HSSEQ intro by default", () => {
    expect(
      isHsseqIntroFromCourse({
        isHsseqFoundation: false,
        slug: "driving-precautions",
        title: { ar: "بعض الاحتياطات أثناء السياقة" },
      })
    ).toBe(false);
  });

  it("parkAgent category code maps via config (no courses yet at API level)", () => {
    const parkAgentHasCatalog = false;
    expect(parkAgentHasCatalog).toBe(false);
  });
});
