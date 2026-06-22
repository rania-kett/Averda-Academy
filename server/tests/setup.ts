import { beforeAll, afterAll } from "vitest";
import { PrismaClient } from "@prisma/client";
import request from "supertest";
import { app } from "./helpers/testApp.js";

export const prisma = new PrismaClient();

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

export async function getAuthToken(employeeId: string, pin: string): Promise<string> {
  const res = await request(app).post("/api/auth/login").send({ employeeId, pin });
  if (res.status !== 200) {
    throw new Error(`Login failed for ${employeeId}: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken as string;
}

export async function getAdminToken(): Promise<string> {
  const res = await request(app)
    .post("/api/auth/admin-login")
    .send({ email: "admin@averda.ma", password: "Admin@2026" });
  if (res.status !== 200) {
    throw new Error(`Admin login failed: ${res.status} ${JSON.stringify(res.body)}`);
  }
  return res.body.accessToken as string;
}

export { app };
