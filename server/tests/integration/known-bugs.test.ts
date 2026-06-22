import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAdminToken } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";

/**
 * Known broken endpoints — documented until routes are mounted.
 */
describe("known-bugs integration", () => {
  let adminToken: string;

  beforeAll(async () => {
    ensureSeed();
    adminToken = await getAdminToken();
  });

  it.fails("GET /api/admin/quiz-results/assessment → 404 (route not mounted)", async () => {
    const res = await request(app)
      .get("/api/admin/quiz-results/assessment")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).not.toBe(404);
  });

  it.fails("GET /api/admin/quiz-results/lessons → 404 (route not mounted)", async () => {
    const res = await request(app)
      .get("/api/admin/quiz-results/lessons")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).not.toBe(404);
  });

  it.fails("POST /api/custom-course-quiz/submit → 404 (no server route)", async () => {
    const res = await request(app)
      .post("/api/custom-course-quiz/submit")
      .send({ courseId: "x", answers: {} });
    expect(res.status).not.toBe(404);
  });
});
