import { describe, it, expect, beforeAll } from "vitest";
import request from "supertest";
import { app, getAuthToken } from "../setup.js";
import { ensureSeed } from "../helpers/ensureSeed.js";

describe("POST /api/user/me/change-pin", () => {
  beforeAll(() => {
    ensureSeed();
  });

  it("valid current PIN + new PIN → 200", async () => {
    const token = await getAuthToken("AV000001", "1234");
    const res = await request(app)
      .post("/api/user/me/change-pin")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPin: "1234", newPin: "5678" });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);

    // Restore original PIN so other tests still work
    await request(app)
      .post("/api/user/me/change-pin")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPin: "5678", newPin: "1234" });
  });

  it("wrong current PIN → 401", async () => {
    const token = await getAuthToken("AV000001", "1234");
    const res = await request(app)
      .post("/api/user/me/change-pin")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPin: "0000", newPin: "5678" });
    expect(res.status).toBe(401);
  });

  it("new PIN too short (3 digits) → 400", async () => {
    const token = await getAuthToken("AV000001", "1234");
    const res = await request(app)
      .post("/api/user/me/change-pin")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPin: "1234", newPin: "123" });
    expect(res.status).toBe(400);
  });

  it("no token → 401", async () => {
    const res = await request(app)
      .post("/api/user/me/change-pin")
      .send({ currentPin: "1234", newPin: "5678" });
    expect(res.status).toBe(401);
  });

  it("same PIN as current → 400 (no point changing to same value)", async () => {
    const token = await getAuthToken("AV000001", "1234");
    const res = await request(app)
      .post("/api/user/me/change-pin")
      .set("Authorization", `Bearer ${token}`)
      .send({ currentPin: "1234", newPin: "1234" });
    expect(res.status).toBe(400);
  });
});
