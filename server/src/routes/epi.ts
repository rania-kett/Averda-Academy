import { Prisma } from "@prisma/client";
import { Router, type RequestHandler } from "express";
import { body, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import { evaluateBadgesAfterEpiProfileUpdate, evaluateBadgesAfterEpiReceptionConfirm } from "../services/badgeService.js";
import { getEpiSummaryForUserId } from "../services/epiSummaryService.js";
import fs from "fs";
import path from "path";

const router = Router();
router.use(authMiddleware);

function isMissingTable(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021";
}

const epiRequestValidators = [
  body("issuanceId").optional().isString(),
  body("itemId").optional().isString().isLength({ min: 1, max: 80 }),
  body("itemCode").optional().isString().isLength({ min: 1, max: 80 }),
  body("requestedSize").optional().isString().isLength({ max: 32 }),
  body("reason").isString().isLength({ min: 2, max: 500 }),
  body("note").optional().isString().isLength({ max: 500 }),
];

const renewalRequestValidators = [
  body("itemType").optional().isString().isLength({ min: 1, max: 80 }),
  body("itemCode").optional().isString().isLength({ min: 1, max: 80 }),
  body("itemId").optional().isString().isLength({ min: 1, max: 80 }),
  body("itemLabel").optional().isString().isLength({ max: 120 }),
  body("reason").isString().isLength({ min: 2, max: 500 }),
  body("note").optional().isString().isLength({ max: 500 }),
];

const handleEpiRenewalRequestNew: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    const vr = validationResult(req);
    if (!vr.isEmpty()) throw new AppError(400, "Invalid request");

    const itemType = String(req.body.itemType ?? req.body.itemCode ?? req.body.itemId ?? "").trim();
    if (!itemType) throw new AppError(400, "itemType required");

    const itemLabel = req.body.itemLabel ? String(req.body.itemLabel).trim() : null;
    const reason = String(req.body.reason).trim();
    const note = req.body.note ? String(req.body.note).trim() : null;

    try {
      const renewal = await prisma.epiRenewalRequest.create({
        data: {
          userId,
          itemType,
          itemLabel,
          reason,
          note,
          status: "pending",
        },
      });

      const issuance = await prisma.epiIssuance.findFirst({
        where: { userId, itemCode: itemType },
        orderBy: { issuedAt: "desc" },
        select: { id: true },
      });
      if (issuance) {
        await prisma.epiIssuance.update({
          where: { id: issuance.id },
          data: { status: "pending_renewal" },
        });
      }

      res.json({ success: true, requestId: renewal.id });
    } catch (e) {
      if (isMissingTable(e)) throw new AppError(503, "DB_MIGRATION_REQUIRED");
      throw e;
    }
  } catch (e) {
    next(e);
  }
};

const handleEpiRenewalRequestLegacy: RequestHandler = async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    const vr = validationResult(req);
    if (!vr.isEmpty()) {
      console.error("[EPI renewal] validation errors:", vr.array());
      res.status(400).json({ error: "Invalid request", details: vr.array(), body: req.body });
      return;
    }
    if (!req.body.itemId && !req.body.itemCode) {
      res.status(400).json({ error: "itemId or itemCode required" });
      return;
    }

    try {
      const rawItemId = String(req.body.itemId ?? "").trim();
      let itemCode = String(req.body.itemCode ?? "").trim();
      let issuanceId = req.body.issuanceId ? String(req.body.issuanceId) : "";
      let issuance: { id: string; itemCode: string } | null = null;

      if (issuanceId) {
        issuance = await prisma.epiIssuance.findFirst({
          where: { id: issuanceId, userId },
          select: { id: true, itemCode: true },
        });
        if (!issuance) throw new AppError(404, "Not found");
        itemCode = itemCode || issuance.itemCode;
      } else if (rawItemId) {
        issuance = await prisma.epiIssuance.findFirst({
          where: { id: rawItemId, userId },
          select: { id: true, itemCode: true },
        });
        if (issuance) {
          issuanceId = issuance.id;
          itemCode = itemCode || issuance.itemCode;
        } else {
          itemCode = itemCode || rawItemId;
        }
      }

      if (!issuanceId && itemCode) {
        issuance = await prisma.epiIssuance.findFirst({
          where: { userId, itemCode },
          orderBy: { issuedAt: "desc" },
          select: { id: true, itemCode: true },
        });
        issuanceId = issuance?.id ?? "";
      }

      if (!itemCode) throw new AppError(400, "Invalid request");

      const note = String(req.body.note ?? "").trim();
      const reason = note ? `${req.body.reason}: ${note}` : req.body.reason;
      const renewal = await prisma.epiReplacementRequest.create({
        data: {
          userId,
          issuanceId: issuanceId || null,
          itemCode,
          requestedSize: req.body.requestedSize ?? null,
          reason,
        },
      });

      if (issuanceId) {
        await prisma.epiIssuance.update({
          where: { id: issuanceId },
          data: { status: "pending_renewal" },
        });
      }

      res.json({ success: true, renewal, request: renewal });
    } catch (e) {
      if (isMissingTable(e)) {
        console.error("[EPI renewal] FULL ERROR:", e);
        res.status(503).json({ error: "DB_MIGRATION_REQUIRED" });
        return;
      }
      console.error("[EPI renewal] FULL ERROR:", e);
      res.status(500).json({ error: String(e) });
      return;
    }
  } catch (e) {
    next(e);
  }
};

router.get("/summary", async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    const summary = await getEpiSummaryForUserId(userId);
    res.json(summary);
  } catch (e) {
    next(e);
  }
});

router.get("/profile", async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    try {
      const profile = await prisma.epiProfile.findUnique({ where: { userId } });
      res.json({ profile });
    } catch (e) {
      if (isMissingTable(e)) {
        res.json({ profile: null });
        return;
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

router.put(
  "/profile",
  body("shirtSize").optional().isString().isLength({ max: 32 }),
  body("shoeSize").optional().isString().isLength({ max: 32 }),
  body("gloveSize").optional().isString().isLength({ max: 32 }),
  body("vestSize").optional().isString().isLength({ max: 32 }),
  body("pantsSize").optional().isString().isLength({ max: 32 }),
  body("notes").optional().isString().isLength({ max: 500 }),
  async (req, res, next) => {
    try {
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const vr = validationResult(req);
      if (!vr.isEmpty()) throw new AppError(400, "Invalid request");

      try {
        const profile = await prisma.epiProfile.upsert({
          where: { userId },
          create: {
            userId,
            shirtSize: req.body.shirtSize ?? null,
            shoeSize: req.body.shoeSize ?? null,
            gloveSize: req.body.gloveSize ?? null,
            vestSize: req.body.vestSize ?? null,
            pantsSize: req.body.pantsSize ?? null,
            notes: req.body.notes ?? null,
          },
          update: {
            shirtSize: req.body.shirtSize ?? null,
            shoeSize: req.body.shoeSize ?? null,
            gloveSize: req.body.gloveSize ?? null,
            vestSize: req.body.vestSize ?? null,
            pantsSize: req.body.pantsSize ?? null,
            notes: req.body.notes ?? null,
          },
        });
        try {
          await evaluateBadgesAfterEpiProfileUpdate(userId);
        } catch {
          /* ignore */
        }
        res.json({ profile });
      } catch (e) {
        if (isMissingTable(e)) {
          throw new AppError(503, "DB_MIGRATION_REQUIRED");
        }
        throw e;
      }
    } catch (e) {
      next(e);
    }
  }
);

router.get("/passport", async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
    try {
      const issuances = await prisma.epiIssuance.findMany({
        where: { userId },
        orderBy: { issuedAt: "desc" },
        take: 100,
      });
      res.json({ issuances });
    } catch (e) {
      if (isMissingTable(e)) {
        res.json({ issuances: [] });
        return;
      }
      throw e;
    }
  } catch (e) {
    next(e);
  }
});

router.post(
  "/reception/confirm",
  body("issuanceId").isString().isLength({ min: 1 }),
  body("signatureName").optional().isString().isLength({ max: 80 }),
  body("notes").optional().isString().isLength({ max: 500 }),
  async (req, res, next) => {
    try {
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const vr = validationResult(req);
      if (!vr.isEmpty()) throw new AppError(400, "Invalid request");

      try {
        const issuance = await prisma.epiIssuance.findFirst({
          where: { id: req.body.issuanceId, userId },
        });
        if (!issuance) throw new AppError(404, "Not found");

        const confirmation = await prisma.epiReceptionConfirmation.create({
          data: {
            issuanceId: issuance.id,
            signatureName: req.body.signatureName ?? null,
            notes: req.body.notes ?? null,
          },
        });

        await prisma.epiIssuance.update({
          where: { id: issuance.id },
          data: { status: "received" },
        });

        try {
          await evaluateBadgesAfterEpiReceptionConfirm({ userId, issuanceId: issuance.id });
        } catch {
          /* ignore */
        }

        // Notify admins/supervisors (UI workflow: employee confirms reception + fit).
        try {
          const employee = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true, employeeId: true },
          });
          const admins = await prisma.user.findMany({
            where: { role: "ADMIN" },
            select: { id: true },
          });
          const fitOk = String(req.body.notes ?? "").includes("FIT_OK");
          const wantsNotify = !String(req.body.notes ?? "").includes("NO_NOTIFY");
          if (wantsNotify && employee && admins.length) {
            const itemCode = issuance.itemCode;
            const title = {
              ar: "تأكيد استلام معدات الوقاية",
              fr: "Réception EPI confirmée",
              en: "PPE reception confirmed",
            };
            const message = {
              ar: `قام الموظف ${employee.name} (${employee.employeeId}) بتأكيد استلام EPI (${itemCode}). المقاس: ${
                fitOk ? "مناسب" : "غير مناسب"
              }.`,
              fr: `${employee.name} (${employee.employeeId}) a confirmé la réception d’un EPI (${itemCode}). Taille: ${
                fitOk ? "OK" : "à échanger"
              }.`,
              en: `${employee.name} (${employee.employeeId}) confirmed reception of PPE (${itemCode}). Fit: ${
                fitOk ? "OK" : "needs change"
              }.`,
            };
            await prisma.notification.createMany({
              data: admins.map((a) => ({ userId: a.id, title, message })),
            });
          }
        } catch {
          /* non-blocking */
        }

        res.json({ confirmation });
      } catch (e) {
        if (isMissingTable(e)) throw new AppError(503, "DB_MIGRATION_REQUIRED");
        throw e;
      }
    } catch (e) {
      next(e);
    }
  }
);

router.post("/replacement-request", epiRequestValidators, handleEpiRenewalRequestLegacy);
router.post("/request-renewal", renewalRequestValidators, handleEpiRenewalRequestNew);

router.post(
  "/confirm-receipt",
  body("itemType").optional().isString().isLength({ min: 1, max: 80 }),
  body("itemCode").optional().isString().isLength({ min: 1, max: 80 }),
  body("itemId").optional().isString().isLength({ min: 1, max: 80 }),
  body("employeeId").optional().isString().isLength({ min: 1, max: 80 }),
  body("issuanceId").optional().isString().isLength({ min: 1 }),
  body("signatureName").optional().isString().isLength({ max: 80 }),
  body("notes").optional().isString().isLength({ max: 500 }),
  body("photo").optional().isString().isLength({ min: 10 }),
  async (req, res, next) => {
    try {
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const vr = validationResult(req);
      if (!vr.isEmpty()) throw new AppError(400, "Invalid request");

      const itemType = String(req.body.itemType ?? req.body.itemCode ?? "").trim();
      const issuanceId = req.body.issuanceId ? String(req.body.issuanceId) : "";
      const photoRaw = req.body.photo ? String(req.body.photo) : "";

      let issuance: { id: string; itemCode: string } | null = null;
      if (issuanceId) {
        issuance = await prisma.epiIssuance.findFirst({
          where: { id: issuanceId, userId },
          select: { id: true, itemCode: true },
        });
      } else if (itemType) {
        issuance = await prisma.epiIssuance.findFirst({
          where: { userId, itemCode: itemType },
          orderBy: { issuedAt: "desc" },
          select: { id: true, itemCode: true },
        });
      }
      if (!issuance) throw new AppError(404, "Not found");

      const today = new Date();
      const catalog = await prisma.epiItemCatalog.findUnique({
        where: { code: issuance.itemCode },
        select: { defaultLifetimeDays: true },
      });
      let lifespanDays = catalog?.defaultLifetimeDays ?? 365;
      const employee = await prisma.user.findUnique({
        where: { id: userId },
        select: { categoryId: true },
      });
      if (employee?.categoryId) {
        const catDefault = await prisma.epiCategoryDefaultItem.findUnique({
          where: {
            categoryId_itemCode: {
              categoryId: employee.categoryId,
              itemCode: issuance.itemCode,
            },
          },
          select: { lifetimeDaysOverride: true },
        });
        if (catDefault?.lifetimeDaysOverride != null) {
          lifespanDays = catDefault.lifetimeDaysOverride;
        }
      }
      const nextReplacementAt = new Date();
      nextReplacementAt.setDate(nextReplacementAt.getDate() + lifespanDays);

      let photoProofPath: string | null = null;
      if (photoRaw) {
        try {
          const uploadDir = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
          const proofsDir = path.join(uploadDir, "epi-proofs");
          await fs.promises.mkdir(proofsDir, { recursive: true });

          const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { employeeId: true },
          });
          const employeeId = String(req.body.employeeId ?? user?.employeeId ?? "employee");
          const itemId = String(req.body.itemId ?? itemType ?? issuance.itemCode ?? "item");
          const safeEmployeeId = employeeId.replace(/[^A-Za-z0-9_-]/g, "_");
          const safeItemId = itemId.replace(/[^A-Za-z0-9_-]/g, "_");
          const ts = Date.now();
          const filename = `${safeEmployeeId}-${safeItemId}-${ts}.jpg`;

          const base64 = photoRaw.includes("base64,") ? photoRaw.split("base64,")[1] : photoRaw;
          const buf = Buffer.from(base64, "base64");
          const abs = path.join(proofsDir, filename);
          await fs.promises.writeFile(abs, buf);
          photoProofPath = `/uploads/epi-proofs/${filename}`;
        } catch {
          // non-blocking: if saving fails, still confirm receipt
          photoProofPath = null;
        }
      }

      await prisma.$transaction(async (tx) => {
        await tx.epiReceptionConfirmation.create({
          data: {
            issuanceId: issuance!.id,
            signatureName: req.body.signatureName ?? null,
            notes: req.body.notes ?? null,
          },
        });
        await tx.epiIssuance.update({
          where: { id: issuance!.id },
          data: {
            status: "received",
            issuedAt: today,
            nextReplacementAt,
            ...(photoProofPath ? { photoProofPath } : {}),
          },
        });
      });

      try {
        await evaluateBadgesAfterEpiReceptionConfirm({ userId, issuanceId: issuance.id });
      } catch {
        /* ignore */
      }

      res.json({ success: true, photoProofPath });
    } catch (e) {
      if (isMissingTable(e)) throw new AppError(503, "DB_MIGRATION_REQUIRED");
      next(e);
    }
  }
);

router.post(
  "/compliance-proof",
  body("type").isString().isLength({ min: 1, max: 32 }),
  body("fileUrl").isString().isLength({ min: 1, max: 2000 }),
  async (req, res, next) => {
    try {
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const vr = validationResult(req);
      if (!vr.isEmpty()) throw new AppError(400, "Invalid request");

      try {
        const proof = await prisma.epiComplianceProof.create({
          data: {
            userId,
            type: req.body.type,
            fileUrl: req.body.fileUrl,
          },
        });
        res.json({ proof });
      } catch (e) {
        if (isMissingTable(e)) throw new AppError(503, "DB_MIGRATION_REQUIRED");
        throw e;
      }
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/feedback",
  body("rating").optional().isInt({ min: 1, max: 5 }),
  body("message").optional().isString().isLength({ max: 1000 }),
  async (req, res, next) => {
    try {
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const vr = validationResult(req);
      if (!vr.isEmpty()) throw new AppError(400, "Invalid request");

      try {
        const feedback = await prisma.epiFeedback.create({
          data: {
            userId,
            rating: req.body.rating ?? null,
            message: req.body.message ?? null,
          },
        });
        res.json({ feedback });
      } catch (e) {
        if (isMissingTable(e)) throw new AppError(503, "DB_MIGRATION_REQUIRED");
        throw e;
      }
    } catch (e) {
      next(e);
    }
  }
);

export default router;

