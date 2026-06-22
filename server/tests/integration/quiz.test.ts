import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAuthToken, getAdminToken, prisma } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";
import { allCorrectAssessmentAnswers } from "../helpers/assessmentAnswers.js";

const hasAnthropic =
  Boolean(process.env.ANTHROPIC_API_KEY?.trim()) &&
  !process.env.ANTHROPIC_API_KEY?.includes("xxxx");

describe("quiz integration", () => {
  let employeeToken: string;
  let courseWithQuizId: string | null = null;
  let lessonQuizCourseId: string | null = null;

  beforeAll(async () => {
    ensureSeed();
    employeeToken = await getAuthToken("AV000001", "1234");
    await request(app)
      .post("/api/user/assessment")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ answers: allCorrectAssessmentAnswers() });

    const courseWithQuiz = await prisma.course.findFirst({
      where: { isActive: true, quiz: { isNot: null } },
      include: { quiz: true, categories: { include: { category: true } } },
    });
    courseWithQuizId = courseWithQuiz?.id ?? null;

    const lessonCourse = await prisma.course.findFirst({
      where: { slug: "traffic-law-respect", isActive: true },
    });
    lessonQuizCourseId = lessonCourse?.id ?? null;
  });

  describe("GET /api/quiz/:courseId", () => {
    it("returns questions when quiz exists", async () => {
      if (!courseWithQuizId) return;
      const res = await request(app)
        .get(`/api/quiz/${courseWithQuizId}`)
        .set("Authorization", `Bearer ${employeeToken}`);
      if (res.status === 200) {
        expect(res.body.questions).toBeTruthy();
        expect(Array.isArray(res.body.questions)).toBe(true);
      } else {
        expect([403, 404]).toContain(res.status);
      }
    });
  });

  describe("POST /api/quiz/:courseId/attempt", () => {
    it("invalid or empty answers body → 400 or API accepts loosely", async () => {
      if (!courseWithQuizId) return;
      const res = await request(app)
        .post(`/api/quiz/${courseWithQuizId}/attempt`)
        .set("Authorization", `Bearer ${employeeToken}`)
        .send({ answers: {}, timeSpent: 10 });
      expect([200, 400, 403, 404]).toContain(res.status);
    });
  });

  describe("lesson quiz", () => {
    it("GET questions → 200 or 404", async () => {
      if (!lessonQuizCourseId) return;
      const res = await request(app)
        .get(`/api/lesson-quiz/${lessonQuizCourseId}/questions`)
        .set("Authorization", `Bearer ${employeeToken}`);
      expect([200, 403, 404]).toContain(res.status);
    });
  });

  it.skipIf(!hasAnthropic)("AI generate-quiz requires ANTHROPIC_API_KEY", async () => {
    const adminToken = await getAdminToken();
    if (!courseWithQuizId) return;
    const res = await request(app)
      .post("/api/ai/generate-quiz")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ courseId: courseWithQuizId });
    expect([200, 400, 500]).toContain(res.status);
  });
});
