import type { PrismaClient } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { EPI_PRESEED_REPLACEMENT_REQUESTS, EPI_SEED_EMPLOYEES } from "../data/epiEmployeeSeed.js";

type SeedDb = Pick<PrismaClient, "user" | "epiProfile" | "epiIssuance" | "epiReceptionConfirmation" | "epiReplacementRequest">;

/** Seed one employee's EPI from canonical EPI_SEED_EMPLOYEES (same as prisma/seed.ts). */
export async function ensureEpiSeedForEmployee(
  userId: string,
  employeeId: string,
  db: SeedDb = prisma
): Promise<boolean> {
  const existing = await db.epiIssuance.count({ where: { userId } });
  if (existing > 0) return false;

  const emp = EPI_SEED_EMPLOYEES.find((e) => e.employee_id === employeeId);
  if (!emp) return false;

  await db.epiProfile.upsert({
    where: { userId },
    create: {
      userId,
      shirtSize: "M",
      shoeSize: "42",
      gloveSize: "M",
      vestSize: "M",
      pantsSize: "M",
      notes: null,
    },
    update: {
      shirtSize: "M",
      shoeSize: "42",
      gloveSize: "M",
      vestSize: "M",
      pantsSize: "M",
    },
  });

  for (const eq of emp.equipements) {
    const itemCode = eq.code;
    if (!itemCode) continue;

    let status: string;
    let addReception: boolean;
    if (eq.statut === "Reçu") {
      status = "received";
      addReception = true;
    } else if (eq.statut === "En cours") {
      status = "issued";
      addReception = false;
    } else if (eq.statut === "À remplacer") {
      status = "expired";
      addReception = true;
    } else {
      status = "issued";
      addReception = false;
    }

    const issuedAt = eq.issuedAt ? new Date(eq.issuedAt) : new Date();
    const nextReplacementAt = eq.nextReplacementAt ? new Date(eq.nextReplacementAt) : null;

    const issuance = await db.epiIssuance.create({
      data: {
        userId,
        itemCode,
        status,
        issuedAt,
        nextReplacementAt,
        size: eq.taille,
      },
    });

    if (addReception) {
      await db.epiReceptionConfirmation.create({
        data: {
          issuanceId: issuance.id,
          signatureName: "Seed",
          notes: "SEED_DATA",
        },
      });
    }
  }

  return true;
}

/** Ensure every active employee with canonical seed data has issuances + profile in DB. */
export async function ensureEpiDataForAllActiveEmployees(db: SeedDb = prisma): Promise<void> {
  const users = await db.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: { id: true, employeeId: true },
  });
  for (const u of users) {
    try {
      await ensureEpiSeedForEmployee(u.id, u.employeeId, db);
    } catch {
      /* non-blocking per employee */
    }
  }
}

/** When DB has no issuances at all, seed canonical demo data for all known employees. */
export async function syncEpiCanonicalSeedIfEmpty(db: SeedDb = prisma): Promise<void> {
  const total = await db.epiIssuance.count();
  if (total > 0) return;

  const users = await db.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: { id: true, employeeId: true },
  });

  for (const u of users) {
    await ensureEpiSeedForEmployee(u.id, u.employeeId, db);
  }

  const userIdByEid = new Map(users.map((u) => [u.employeeId, u.id]));
  for (const req of EPI_PRESEED_REPLACEMENT_REQUESTS) {
    const uid = userIdByEid.get(req.employeeId);
    if (!uid) continue;
    const exists = await db.epiReplacementRequest.findFirst({
      where: { userId: uid, itemCode: req.itemCode, status: "pending" },
    });
    if (exists) continue;
    const issuance = await db.epiIssuance.findFirst({
      where: { userId: uid, itemCode: req.itemCode },
      orderBy: { issuedAt: "desc" },
    });
    await db.epiReplacementRequest.create({
      data: {
        userId: uid,
        issuanceId: issuance?.id ?? null,
        itemCode: req.itemCode,
        requestedSize: req.requestedSize ?? null,
        reason: req.reason,
        status: "pending",
      },
    });
  }
}
