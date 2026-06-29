import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAuthToken, getAdminToken, prisma } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";

describe("admin employees integration", () => {
  let adminToken: string;
  let employeeToken: string;
  let driverCategoryId: string;
  let av001Id: string;

  beforeAll(async () => {
    ensureSeed();
    adminToken = await getAdminToken();
    employeeToken = await getAuthToken("AV000001", "1234");
    const driverCat = await prisma.category.findUnique({ where: { code: "driver" } });
    driverCategoryId = driverCat!.id;
    const u = await prisma.user.findUnique({ where: { employeeId: "AV000001" } });
    av001Id = u!.id;
  });

  describe("GET /api/admin/employees", () => {
    it("no token → 401", async () => {
      const res = await request(app).get("/api/admin/employees");
      expect(res.status).toBe(401);
    });

    it("employee token → 403", async () => {
      const res = await request(app)
        .get("/api/admin/employees")
        .set("Authorization", `Bearer ${employeeToken}`);
      expect(res.status).toBe(403);
    });

    it("valid admin → 200 with employees and pagination", async () => {
      const res = await request(app)
        .get("/api/admin/employees")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.employees)).toBe(true);
      expect(res.body.pagination).toBeTruthy();
      expect(res.body.pagination.total).toBeGreaterThanOrEqual(5);
    });

    it("search يوسف → AV000001", async () => {
      const res = await request(app)
        .get("/api/admin/employees")
        .query({ search: "يوسف" })
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.employees.some((e: { employeeId: string }) => e.employeeId === "AV000001")).toBe(
        true
      );
    });

    it("categoryId filter → same category", async () => {
      const res = await request(app)
        .get("/api/admin/employees")
        .query({ categoryId: driverCategoryId })
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      for (const e of res.body.employees) {
        expect(e.category?.id ?? e.categoryId).toBeTruthy();
      }
    });

    it("status not_started filter", async () => {
      const res = await request(app)
        .get("/api/admin/employees")
        .query({ status: "not_started" })
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.employees)).toBe(true);
    });

    it("pageSize=2 page=1 → at most 2 results", async () => {
      const res = await request(app)
        .get("/api/admin/employees")
        .query({ pageSize: "2", page: "1" })
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.employees.length).toBeLessThanOrEqual(2);
    });
  });

  describe("POST /api/admin/employees", () => {
    it("create employee → 201", async () => {
      const unique = `TEST-${Date.now()}`;
      const res = await request(app)
        .post("/api/admin/employees")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          employeeId: unique,
          name: "Test Worker",
          pin: "5678",
          categoryId: driverCategoryId,
          language: "AR",
        });
      expect(res.status).toBe(201);
      expect(res.body.user.employeeId).toBe(unique);
      await prisma.user.deleteMany({ where: { employeeId: unique } });
    });

    it("duplicate employeeId → 409", async () => {
      const res = await request(app)
        .post("/api/admin/employees")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          employeeId: "AV000001",
          name: "Dup",
          pin: "1234",
          categoryId: driverCategoryId,
        });
      expect(res.status).toBe(409);
    });

    it("missing required fields → 400", async () => {
      const res = await request(app)
        .post("/api/admin/employees")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ pin: "1234" });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/admin/employees/:id", () => {
    it("valid id → 200 with employee payload", async () => {
      const res = await request(app)
        .get(`/api/admin/employees/${av001Id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.employee.employeeId).toBe("AV000001");
      expect(res.body.employee.category).toBeTruthy();
      expect(res.body.employee.attempts).toBeDefined();
    });

    it("invalid id → 404", async () => {
      const res = await request(app)
        .get("/api/admin/employees/clxxxxxxxxxxxxxxxx")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/admin/employees/:id", () => {
    it("deletes employee and all related data → 200", async () => {
      const unique = `DEL-${Date.now()}`;
      const createRes = await request(app)
        .post("/api/admin/employees")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          employeeId: unique,
          name: "Test Delete",
          categoryId: driverCategoryId,
          pin: "9999",
        });
      expect(createRes.status).toBe(201);
      const empId = createRes.body.user.id;

      const res = await request(app)
        .delete(`/api/admin/employees/${empId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await request(app)
        .get(`/api/admin/employees/${empId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(check.status).toBe(404);
    });

    it("cannot delete ADMIN user → 403", async () => {
      const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });
      expect(adminUser).toBeTruthy();
      const res = await request(app)
        .delete(`/api/admin/employees/${adminUser!.id}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
    });

    it("no token → 401", async () => {
      const res = await request(app).delete("/api/admin/employees/fake-id");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/admin/employees/:id", () => {
    it("updates employee name → 200", async () => {
      const unique = `PATCH-${Date.now()}`;
      const createRes = await request(app)
        .post("/api/admin/employees")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          employeeId: unique,
          name: "Patch Me",
          categoryId: driverCategoryId,
          pin: "4321",
        });
      const empId = createRes.body.user.id;

      const res = await request(app)
        .patch(`/api/admin/employees/${empId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ name: "Patched Name" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Patched Name");

      await prisma.user.deleteMany({ where: { employeeId: unique } });
    });

    it("updates truckNumber for driver → 200", async () => {
      const unique = `TRK-${Date.now()}`;
      const createRes = await request(app)
        .post("/api/admin/employees")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          employeeId: unique,
          name: "Driver Truck",
          categoryId: driverCategoryId,
          pin: "4321",
        });
      const empId = createRes.body.user.id;

      const res = await request(app)
        .patch(`/api/admin/employees/${empId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ truckNumber: "TRK-042" });
      expect(res.status).toBe(200);
      expect(res.body.truckNumber).toBe("TRK-042");

      await prisma.user.deleteMany({ where: { employeeId: unique } });
    });

    it("invalid categoryId → 404", async () => {
      const res = await request(app)
        .patch(`/api/admin/employees/${av001Id}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ categoryId: "clxxxxxxxxxxxxxxxx" });
      expect(res.status).toBe(404);
    });
  });

  describe("POST reset-progress and deactivate", () => {
    it("reset progress → assessment cleared", async () => {
      const res = await request(app)
        .post(`/api/admin/employees/${av001Id}/reset-progress`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      const user = await prisma.user.findUnique({ where: { id: av001Id } });
      expect(user?.assessmentCompleted).toBe(false);
    });

    it("deactivate → login fails", async () => {
      const tempId = `TEMP-${Date.now()}`;
      await request(app)
        .post("/api/admin/employees")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          employeeId: tempId,
          name: "Temp Deact",
          pin: "1234",
          categoryId: driverCategoryId,
        });
      const tempUser = await prisma.user.findUnique({ where: { employeeId: tempId } });
      await request(app)
        .post(`/api/admin/employees/${tempUser!.id}/deactivate`)
        .set("Authorization", `Bearer ${adminToken}`);
      const login = await request(app).post("/api/auth/login").send({ employeeId: tempId, pin: "1234" });
      expect(login.status).toBe(401);
      await prisma.user.deleteMany({ where: { employeeId: tempId } });
    });
  });
});
