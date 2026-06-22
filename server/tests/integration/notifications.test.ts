import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAuthToken, getAdminToken } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";

describe("notifications integration", () => {
  let employeeToken: string;
  let adminToken: string;

  beforeAll(async () => {
    ensureSeed();
    employeeToken = await getAuthToken("AV000001", "1234");
    adminToken = await getAdminToken();
  });

  it("POST /api/admin/notify/:employeeId → 201 or 429 cooldown", async () => {
    const res = await request(app)
      .post("/api/admin/notify/AV000001")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ type: "assessment" });
    expect([201, 429]).toContain(res.status);
  });

  it("GET /api/user/notifications → 200 array", async () => {
    const res = await request(app)
      .get("/api/user/notifications")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.notifications ?? res.body)).toBe(true);
  });

  it("PUT read-all notifications → 200", async () => {
    const res = await request(app)
      .put("/api/user/notifications/read-all")
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
  });

  it("PUT single notification read when one exists", async () => {
    const list = await request(app)
      .get("/api/user/notifications")
      .set("Authorization", `Bearer ${employeeToken}`);
    const notifications = list.body.notifications ?? list.body;
    if (!Array.isArray(notifications) || notifications.length === 0) return;
    const id = notifications[0].id;
    const res = await request(app)
      .put(`/api/user/notifications/${id}/read`)
      .set("Authorization", `Bearer ${employeeToken}`);
    expect(res.status).toBe(200);
  });
});
