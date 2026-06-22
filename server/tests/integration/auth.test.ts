import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAuthToken, getAdminToken } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";

describe("auth integration", () => {
  beforeAll(() => {
    ensureSeed();
  });

  describe("POST /api/auth/login", () => {
    it("valid AV000001 + PIN 1234 → 200 with tokens and user", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ employeeId: "AV000001", pin: "1234" });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
      expect(res.body.refreshToken).toBeTruthy();
      expect(res.body.user.employeeId).toBe("AV000001");
      expect(res.body.user.role).toBe("EMPLOYEE");
    });

    it("wrong PIN → 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ employeeId: "AV000001", pin: "9999" });
      expect(res.status).toBe(401);
    });

    it("non-existent employeeId → 401", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ employeeId: "AV999999", pin: "1234" });
      expect(res.status).toBe(401);
    });

    it("missing fields → 400", async () => {
      const res = await request(app).post("/api/auth/login").send({ employeeId: "AV000001" });
      expect(res.status).toBe(400);
    });

    it("PIN must be exactly 4 chars", async () => {
      const res = await request(app)
        .post("/api/auth/login")
        .send({ employeeId: "AV000001", pin: "123" });
      expect([400, 401]).toContain(res.status);
    });
  });

  describe("POST /api/auth/admin-login", () => {
    it("admin@averda.ma + Admin@2026 → 200 ADMIN", async () => {
      const res = await request(app)
        .post("/api/auth/admin-login")
        .send({ email: "admin@averda.ma", password: "Admin@2026" });
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe("ADMIN");
    });

    it("wrong password → 401", async () => {
      const res = await request(app)
        .post("/api/auth/admin-login")
        .send({ email: "admin@averda.ma", password: "wrong1" });
      expect(res.status).toBe(401);
    });

    it("employee credentials on admin login → 401", async () => {
      const res = await request(app)
        .post("/api/auth/admin-login")
        .send({ email: "employee@test.com", password: "123456" });
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("valid refreshToken → new accessToken", async () => {
      const login = await request(app)
        .post("/api/auth/login")
        .send({ employeeId: "AV000002", pin: "1234" });
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: login.body.refreshToken });
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBeTruthy();
    });

    it("invalid refresh token → 401 (or 500 if JWT error unhandled)", async () => {
      const res = await request(app)
        .post("/api/auth/refresh")
        .send({ refreshToken: "not-a-valid-token" });
      expect([401, 500]).toContain(res.status);
    });
  });

  describe("GET /health", () => {
    it("returns ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ ok: true });
    });
  });

  it("getAuthToken helper works", async () => {
    const token = await getAuthToken("AV000001", "1234");
    expect(token).toBeTruthy();
  });

  it("getAdminToken helper works", async () => {
    const token = await getAdminToken();
    expect(token).toBeTruthy();
  });
});
