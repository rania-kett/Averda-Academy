import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAuthToken, prisma } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";
import {
  allCorrectAssessmentAnswers,
  assessmentAnswersWithCorrectCount,
} from "../helpers/assessmentAnswers.js";

describe("assessment integration", () => {
  beforeAll(() => {
    ensureSeed();
  });

  async function resetEmployeeAssessment(employeeId: string) {
    await prisma.user.updateMany({
      where: { employeeId },
      data: {
        assessmentCompleted: false,
        assessmentScore: null,
        assessmentTakenAt: null,
        hsseqCourseRequired: true,
      },
    });
  }

  it("no token → 401", async () => {
    const res = await request(app)
      .post("/api/user/assessment")
      .send({ answers: allCorrectAssessmentAnswers() });
    expect(res.status).toBe(401);
  });

  it("10 correct answers → score 100, passed", async () => {
    await resetEmployeeAssessment("AV000002");
    const token = await getAuthToken("AV000002", "1234");
    const res = await request(app)
      .post("/api/user/assessment")
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: allCorrectAssessmentAnswers() });
    expect(res.status).toBe(200);
    expect(res.body.scorePercent).toBe(100);
    expect(res.body.scorePercent).toBeGreaterThanOrEqual(70);
  });

  it("7 correct → score 70, passed", async () => {
    await resetEmployeeAssessment("AV000002");
    const token = await getAuthToken("AV000002", "1234");
    const res = await request(app)
      .post("/api/user/assessment")
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: assessmentAnswersWithCorrectCount(7) });
    expect(res.status).toBe(200);
    expect(res.body.scorePercent).toBe(70);
  });

  it("6 correct → score 60, not passed", async () => {
    await resetEmployeeAssessment("AV000002");
    const token = await getAuthToken("AV000002", "1234");
    const res = await request(app)
      .post("/api/user/assessment")
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: assessmentAnswersWithCorrectCount(6) });
    expect(res.status).toBe(200);
    expect(res.body.scorePercent).toBe(60);
    expect(res.body.scorePercent).toBeLessThan(70);
  });

  it("answers length 9 → 400", async () => {
    const token = await getAuthToken("AV000001", "1234");
    const res = await request(app)
      .post("/api/user/assessment")
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: Array(9).fill(0) });
    expect(res.status).toBe(400);
  });

  it("answers length 11 → 400", async () => {
    const token = await getAuthToken("AV000001", "1234");
    const res = await request(app)
      .post("/api/user/assessment")
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: Array(11).fill(0) });
    expect(res.status).toBe(400);
  });

  it("non-numeric answers → 400", async () => {
    const token = await getAuthToken("AV000001", "1234");
    const bad = allCorrectAssessmentAnswers();
    (bad as unknown[])[0] = "x";
    const res = await request(app)
      .post("/api/user/assessment")
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: bad });
    expect(res.status).toBe(400);
  });

  it("after passing, GET /api/user/me shows assessmentCompleted", async () => {
    await resetEmployeeAssessment("AV000005");
    const token = await getAuthToken("AV000005", "1234");
    await request(app)
      .post("/api/user/assessment")
      .set("Authorization", `Bearer ${token}`)
      .send({ answers: allCorrectAssessmentAnswers() });
    const me = await request(app)
      .get("/api/user/me")
      .set("Authorization", `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.user.assessmentCompleted).toBe(true);
    expect(me.body.user.assessmentScore).toBeGreaterThanOrEqual(70);
  });
});
