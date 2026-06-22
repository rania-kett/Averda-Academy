import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAdminToken } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";

describe("admin stats integration", () => {
  let adminToken: string;

  beforeAll(async () => {
    ensureSeed();
    adminToken = await getAdminToken();
  });

  it("GET /api/admin/stats → 200 with stats object", async () => {
    const res = await request(app)
      .get("/api/admin/stats")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.stats).toBeTruthy();
    expect(typeof res.body.stats.activeEmployees).toBe("number");
    expect(res.body.stats).toHaveProperty("avgQuizScore");
    expect(res.body.stats).toHaveProperty("atRiskCount");
  });

  it("GET /api/admin/activity?limit=5 → max 5 events", async () => {
    const res = await request(app)
      .get("/api/admin/activity")
      .query({ limit: 5 })
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.events)).toBe(true);
    expect(res.body.events.length).toBeLessThanOrEqual(5);
  });

  it("GET /api/admin/categories → includes all 6 role codes", async () => {
    const res = await request(app)
      .get("/api/admin/categories")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const codes = (res.body.categories ?? res.body).map((c: { code: string }) => c.code);
    for (const code of ["driver", "sweeper", "loader", "teamLeader", "parkAgent", "maintenance"]) {
      expect(codes).toContain(code);
    }
  });
});
