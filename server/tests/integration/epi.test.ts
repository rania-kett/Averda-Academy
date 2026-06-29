import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAuthToken, getAdminToken, prisma } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";

describe("epi integration", () => {
  let employeeToken: string;
  let adminToken: string;

  beforeAll(async () => {
    ensureSeed();
    employeeToken = await getAuthToken("AV000001", "1234");
    adminToken = await getAdminToken();
  });

  it("GET /api/epi/summary → 200", async () => {
    const res = await request(app)
      .get("/api/epi/summary")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
  });

  it("GET /api/epi/profile → 200", async () => {
    const res = await request(app)
      .get("/api/epi/profile")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(res.body.profile).toBeTruthy();
  });

  it("PUT /api/epi/profile with shirtSize → 200", async () => {
    const res = await request(app)
      .put("/api/epi/profile")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({ shirtSize: "L" });
    expect(res.status).toBe(200);
    expect(res.body.profile.shirtSize).toBe("L");
  });

  it("GET /api/epi/passport → 200 with issuances array", async () => {
    const res = await request(app)
      .get("/api/epi/passport")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.issuances)).toBe(true);
  });

  it("POST /api/epi/request-renewal missing body → 400", async () => {
    const res = await request(app)
      .post("/api/epi/request-renewal")
      .set("Authorization", `Bearer ${employeeToken}`)
      .send({});
    expect(res.status).toBe(400);
  });

  describe("admin EPI", () => {
    it("GET /api/admin/epi/overview → 200", async () => {
      const res = await request(app)
        .get("/api/admin/epi/overview")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("GET /api/admin/epi/requests → 200", async () => {
      const res = await request(app)
        .get("/api/admin/epi/requests")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });

    it("GET /api/admin/epi/catalog → 200", async () => {
      const res = await request(app)
        .get("/api/admin/epi/catalog")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
    });
  });

  describe("DELETE /api/admin/epi/catalog/:code", () => {
    const TEST_CODE = "TEST-ITEM-DELETE";

    it("delete unused catalog item → 200", async () => {
      await prisma.epiItemCatalog.upsert({
        where: { code: TEST_CODE },
        create: {
          code: TEST_CODE,
          labelAr: "اختبار",
          labelFr: "Test Item",
          labelEn: "Test Item",
          emoji: "🧪",
          defaultLifetimeDays: 365,
          sortOrder: 9999,
          active: true,
        },
        update: { active: true },
      });

      const res = await request(app)
        .delete(`/api/admin/epi/catalog/${TEST_CODE}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = await prisma.epiItemCatalog.findUnique({ where: { code: TEST_CODE } });
      expect(check).toBeNull();
    });

    it("no token → 401", async () => {
      const res = await request(app).delete("/api/admin/epi/catalog/FAKE-CODE");
      expect(res.status).toBe(401);
    });

    it("non-existent code → 404", async () => {
      const res = await request(app)
        .delete("/api/admin/epi/catalog/DOES-NOT-EXIST-XYZ")
        .set("Authorization", `Bearer ${adminToken}`);
      expect(res.status).toBe(404);
    });
  });
});
