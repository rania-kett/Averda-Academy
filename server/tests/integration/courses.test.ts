import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAuthToken, prisma } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";
import { allCorrectAssessmentAnswers } from "../helpers/assessmentAnswers.js";

describe("courses integration", () => {
  let driverToken: string;
  let maintenanceToken: string;
  let sweeperToken: string;
  let driverCourseId: string | null = null;

  beforeAll(async () => {
    ensureSeed();
    driverToken = await getAuthToken("AV000001", "1234");
    maintenanceToken = await getAuthToken("AV000003", "1234");
    sweeperToken = await getAuthToken("AV000004", "1234");

    await request(app)
      .post("/api/user/assessment")
      .set("Authorization", `Bearer ${driverToken}`)
      .send({ answers: allCorrectAssessmentAnswers() });

    const driver = await prisma.user.findUnique({
      where: { employeeId: "AV000001" },
      include: { category: true },
    });
    if (driver?.categoryId) {
      const course = await prisma.course.findFirst({
        where: {
          isActive: true,
          categories: { some: { categoryId: driver.categoryId } },
        },
      });
      driverCourseId = course?.id ?? null;
    }
  });

  describe("GET /api/courses", () => {
    it("no token → 401", async () => {
      const res = await request(app).get("/api/courses");
      expect(res.status).toBe(401);
    });

    it("AV000001 driver → courses array length > 0", async () => {
      const res = await request(app)
        .get("/api/courses")
        .set("Authorization", `Bearer ${driverToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.courses)).toBe(true);
      expect(res.body.courses.length).toBeGreaterThan(0);
      expect(res.body.courses[0]).toHaveProperty("id");
      expect(res.body.courses[0]).toHaveProperty("title");
    });

    it("AV000003 maintenance → empty courses", async () => {
      const res = await request(app)
        .get("/api/courses")
        .set("Authorization", `Bearer ${maintenanceToken}`);
      expect(res.status).toBe(200);
      expect(res.body.courses).toEqual([]);
    });

    it("AV000004 sweeper → courses length > 0", async () => {
      const res = await request(app)
        .get("/api/courses")
        .set("Authorization", `Bearer ${sweeperToken}`);
      expect(res.status).toBe(200);
      expect(res.body.courses.length).toBeGreaterThan(0);
    });

    it("AV000006 parkAgent if exists → empty courses", async () => {
      const park = await prisma.user.findUnique({ where: { employeeId: "AV000006" } });
      if (!park) return;
      const token = await getAuthToken("AV000006", "1234");
      const res = await request(app)
        .get("/api/courses")
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.courses).toEqual([]);
    });
  });

  describe("POST /api/courses/:id/progress", () => {
    it("valid courseId, pagesRead 5 → 200", async () => {
      if (!driverCourseId) return;
      const res = await request(app)
        .post(`/api/courses/${driverCourseId}/progress`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ pagesRead: 5, timeSpentSecs: 30 });
      expect(res.status).toBe(200);
    });

    it("invalid courseId → 404", async () => {
      const res = await request(app)
        .post("/api/courses/nonexistent-id/progress")
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ pagesRead: 1 });
      expect(res.status).toBe(404);
    });

    it("negative pagesRead → 400", async () => {
      if (!driverCourseId) return;
      const res = await request(app)
        .post(`/api/courses/${driverCourseId}/progress`)
        .set("Authorization", `Bearer ${driverToken}`)
        .send({ pagesRead: -1 });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/courses/:id", () => {
    it("valid id for driver may require assessment → 200 or 403", async () => {
      if (!driverCourseId) return;
      const res = await request(app)
        .get(`/api/courses/${driverCourseId}`)
        .set("Authorization", `Bearer ${driverToken}`);
      expect([200, 403]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.course ?? res.body).toBeTruthy();
      }
    });

    it("invalid id → 404", async () => {
      const res = await request(app)
        .get("/api/courses/invalid-course-id")
        .set("Authorization", `Bearer ${driverToken}`);
      expect(res.status).toBe(404);
    });
  });
});
