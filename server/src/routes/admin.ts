import { Router } from "express";
import fs from "fs";
import path from "path";
import { body, param, query, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";

type UserWhereInput = NonNullable<
  NonNullable<Parameters<typeof prisma.user.findMany>[0]>["where"]
>;
type PrismaTransaction = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

type EmployeeIdDb = Pick<typeof prisma, "user">;
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { AppError } from "../middleware/errorHandler.js";
import { hashPin } from "../utils/hash.js";
import {
  computeEmployeeCourseMetrics,
  visibleCoursesForEmployee,
} from "../utils/employeeCourseProgress.js";
import { issueEmployeeCertificate, sendCertificatePdf, buildCertificateDownloadName } from "../services/certificateService.js";
import { parseQuizQuestions } from "../services/badgeService.js";
import type { QuizQuestionJson } from "../services/claudeQuiz.js";
import {
  createEmployeeNotification,
  epiIssuanceNotificationContent,
  findEmployeeUser,
  sendAdminNotify,
  sendEpiReminder,
} from "../services/notificationService.js";
// import { ensureEpiDataForAllActiveEmployees, syncEpiCanonicalSeedIfEmpty } from "../services/epiCanonicalSeed.js";
import { getEpiSummaryForUserId } from "../services/epiSummaryService.js";
import { isCategoryWithoutCoursesYet } from "../utils/adminCourseVisibility.js";
import {
  ALLOWED_SETTING_KEYS,
  type AllowedSettingKey,
  getKeyMeta,
  saveIntegrationKey,
  testIntegrationKey,
} from "../services/integrationKeys.js";
import { countAdminVisibleCourses } from "../utils/adminCourseVisibility.js";

const router = Router();

/** Orphan quiz rows (deleted users) break required `include: { user }` — filter without deleting data. */
async function existingUserIds(): Promise<string[]> {
  const rows = await prisma.user.findMany({ select: { id: true } });
  return rows.map((r) => r.id);
}

function userIdInFilter(ids: string[]) {
  return ids.length > 0 ? { userId: { in: ids } } : { userId: { in: ["__none__"] } };
}
router.use(authMiddleware);
router.use(adminOnly);

function isPrismaKnownRequestError(e: unknown): e is { code: string } {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    typeof (e as { code: unknown }).code === "string"
  );
}

function isMissingTable(e: unknown): boolean {
  return isPrismaKnownRequestError(e) && e.code === "P2021";
}

function isEpiSchemaNotReady(e: unknown): boolean {
  if (isPrismaKnownRequestError(e) && (e.code === "P2021" || e.code === "P2022")) {
    return true;
  }
  const msg = e instanceof Error ? e.message : String(e ?? "");
  return (
    msg.includes("does not exist") ||
    msg.includes("no such table") ||
    msg.includes("unknown column") ||
    msg.includes("P2021") ||
    msg.includes("P2022")
  );
}

function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

/** Next unique employee id: `AV` + zero-padded auto-increment (global across all employees). */
async function nextGlobalEmployeeId(db: EmployeeIdDb = prisma): Promise<string> {
  const rows = await db.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { employeeId: true },
  });
  let max = 0;
  for (const r of rows) {
    const id = r.employeeId.trim();
    const m = /^AV(\d+)$/i.exec(id);
    if (m) max = Math.max(max, parseInt(m[1]!, 10));
  }
  const next = max + 1;
  return `AV${String(next).padStart(6, "0")}`;
}

function categoryCodeFromEmployeeRole(role?: string): string | null {
  const raw = (role ?? "").trim();
  const key = raw.toLowerCase().replace(/-/g, "_");
  switch (key) {
    case "driver":
      return "driver";
    case "sweeper":
    case "worker":
      return "sweeper";
    case "team_leader":
    case "teamleader":
      return "teamLeader";
    case "loader":
      return "loader";
    case "maintenance":
      return "maintenance";
    case "park_agent":
    case "parkagent":
    case "parc":
      return "parkAgent";
    case "DRIVER":
      return "driver";
    case "WORKER":
      return "sweeper";
    default:
      break;
  }
  if (raw.includes("سائق")) return "driver";
  if (raw.includes("شاحن")) return "loader";
  if (raw.includes("كناس") || raw.includes("عامل كنس")) return "sweeper";
  if (raw.includes("رئيس فريق")) return "teamLeader";
  if (raw.includes("عون الحظيرة") || raw.includes("الحظيرة")) return "parkAgent";
  if (raw.includes("عون الصيانة") || raw.includes("الصيانة")) return "maintenance";
  return null;
}

router.get("/categories", async (_req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { createdAt: "asc" },
    });
    res.json({ categories });
  } catch (e) {
    next(e);
  }
});

router.get("/course-pdfs", async (_req, res, next) => {
  try {
    const root = path.join(process.cwd(), "client", "public", "courses");
    const out: string[] = [];
    const walk = (dir: string) => {
      if (!fs.existsSync(dir)) return;
      const ents = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of ents) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) {
          walk(abs);
          continue;
        }
        if (!e.isFile()) continue;
        if (!e.name.toLowerCase().endsWith(".pdf")) continue;
        const rel = abs.replace(root, "").split(path.sep).join("/");
        out.push(`/courses${rel.startsWith("/") ? "" : "/"}${rel}`);
      }
    };
    walk(root);
    out.sort((a, b) => a.localeCompare(b, "ar"));
    res.json({ pdfs: out });
  } catch (e) {
    next(e);
  }
});

router.get("/stats", async (_req, res, next) => {
  try {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const activeEmployees = await prisma.user.count({
      where: { role: "EMPLOYEE", isActive: true },
    });
    const newThisMonth = await prisma.user.count({
      where: {
        role: "EMPLOYEE",
        isActive: true,
        createdAt: { gte: startMonth },
      },
    });

    const completionsWeekQuiz = await prisma.lessonQuizAttempt.groupBy({
      by: ["userId", "courseId"],
      where: {
        takenAt: { gte: weekAgo },
        percentage: { gte: 70 },
      },
    });
    const completionsWeekSet = new Set<string>();
    const weekProgressRows = await prisma.lessonProgress.findMany({
      where: { isCompleted: true, completedAt: { gte: weekAgo } },
      select: { userId: true, courseId: true },
    });
    for (const row of weekProgressRows) {
      completionsWeekSet.add(`${row.userId}:${row.courseId}`);
    }
    for (const row of completionsWeekQuiz) {
      completionsWeekSet.add(`${row.userId}:${row.courseId}`);
    }
    const completionsWeek = completionsWeekSet.size;

    const knownUserIds = await existingUserIds();
    const knownUsers = userIdInFilter(knownUserIds);

    const quizScores = await prisma.quizAttempt.findMany({
      where: knownUsers,
      select: { score: true },
    });
    const lessonQuizScores = await prisma.lessonQuizAttempt.findMany({
      where: knownUsers,
      select: { percentage: true },
    });
    const allScores = [
      ...quizScores.map((a) => a.score),
      ...lessonQuizScores.map((a) => a.percentage),
    ];
    const avgScore =
      allScores.length > 0
        ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
        : 0;

    const failGroups = await prisma.quizAttempt.groupBy({
      by: ["userId", "quizId"],
      where: { passed: false, ...knownUsers },
      _count: { _all: true },
    });
    const atRiskCount = new Set(
      failGroups.filter((g) => g._count._all >= 2).map((g) => g.userId)
    ).size;

    const recentAttempts = await prisma.quizAttempt.findMany({
      where: knownUsers,
      take: 10,
      orderBy: { attemptedAt: "desc" },
      include: {
        user: { select: { name: true, employeeId: true } },
        quiz: {
          include: { course: { select: { title: true } } },
        },
      },
    });

    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: {
        progress: { where: { isCompleted: true } },
      },
    });
    const totalEmps = await prisma.user.count({
      where: { role: "EMPLOYEE", isActive: true },
    });
    const completionByCourse = courses.map((c) => ({
      courseId: c.id,
      title: c.title,
      completed: c.progress.length,
      total: totalEmps,
      rate:
        totalEmps > 0 ? Math.round((c.progress.length / totalEmps) * 100) : 0,
    }));

    const topScores = await prisma.quizAttempt.findMany({
      where: { attemptedAt: { gte: startMonth }, ...knownUsers },
      orderBy: { score: "desc" },
      take: 5,
      include: {
        user: { select: { name: true, employeeId: true } },
        quiz: { include: { course: { select: { title: true } } } },
      },
    });

    res.json({
      stats: {
        activeEmployees,
        newThisMonth,
        completionsWeek,
        avgQuizScore: avgScore,
        atRiskCount,
      },
      recentActivity: recentAttempts.map((a) => ({
        id: a.id,
        employeeName: a.user.name,
        employeeId: a.user.employeeId,
        courseTitle: a.quiz.course.title,
        score: a.score,
        attemptedAt: a.attemptedAt,
      })),
      completionByCourse,
      topScores: topScores.map((a) => ({
        score: a.score,
        name: a.user.name,
        employeeId: a.user.employeeId,
        course: a.quiz.course.title,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/activity", async (req, res, next) => {
  try {
    const limit = Math.min(50, Math.max(10, Number(req.query.limit) || 30));

    const knownUserIds = await existingUserIds();
    const knownUsers = userIdInFilter(knownUserIds);

    const attemptsPromise = prisma.quizAttempt.findMany({
      where: knownUsers,
      take: limit,
      orderBy: { attemptedAt: "desc" },
      include: {
        user: { select: { id: true, name: true, employeeId: true } },
        quiz: { include: { course: { select: { id: true, title: true } } } },
      },
    });

    const lessonQuizAttemptsPromise = prisma.lessonQuizAttempt.findMany({
      where: knownUsers,
      take: limit,
      orderBy: { takenAt: "desc" },
      include: {
        user: { select: { id: true, name: true, employeeId: true } },
        course: { select: { id: true, title: true } },
      },
    });

    const receptionsPromise = (async () => {
      try {
        return await prisma.epiReceptionConfirmation.findMany({
          take: limit,
          orderBy: { confirmedAt: "desc" },
          include: {
            issuance: {
              include: {
                user: { select: { id: true, name: true, employeeId: true } },
                item: { select: { code: true, labelFr: true, labelEn: true, labelAr: true } },
              },
            },
          },
        });
      } catch (e) {
        if (isEpiSchemaNotReady(e)) return [];
        throw e;
      }
    })();

    const replPromise = (async () => {
      try {
        return await prisma.epiReplacementRequest.findMany({
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            user: { select: { id: true, name: true, employeeId: true } },
            item: { select: { code: true, labelFr: true, labelEn: true, labelAr: true } },
          },
        });
      } catch (e) {
        if (isEpiSchemaNotReady(e)) return [];
        throw e;
      }
    })();

    const [attempts, lessonQuizAttempts, receptions, repl] = await Promise.all([
      attemptsPromise,
      lessonQuizAttemptsPromise,
      receptionsPromise,
      replPromise,
    ]);

    const events = [
      ...attempts.map((a) => ({
        type: "quiz_attempt" as const,
        at: a.attemptedAt,
        user: { id: a.user.id, name: a.user.name, employeeId: a.user.employeeId },
        meta: {
          courseId: a.quiz.course.id,
          courseTitle: a.quiz.course.title,
          score: a.score,
          passed: a.passed,
        },
      })),
      ...lessonQuizAttempts.map((a) => ({
        type: "lesson_quiz_attempt" as const,
        at: a.takenAt,
        user: { id: a.user.id, name: a.user.name, employeeId: a.user.employeeId },
        meta: {
          courseId: a.course.id,
          courseTitle: a.course.title,
          score: a.percentage,
          passed: a.percentage >= 70,
        },
      })),
      ...receptions.map((r) => ({
        type: "epi_reception" as const,
        at: r.confirmedAt,
        user: {
          id: r.issuance.user.id,
          name: r.issuance.user.name,
          employeeId: r.issuance.user.employeeId,
        },
        meta: {
          itemCode: r.issuance.item.code,
          itemTitle: { fr: r.issuance.item.labelFr, en: r.issuance.item.labelEn, ar: r.issuance.item.labelAr },
          signatureName: r.signatureName ?? null,
          notes: r.notes ?? null,
        },
      })),
      ...repl.map((x) => ({
        type: "epi_replacement_request" as const,
        at: x.createdAt,
        user: { id: x.user.id, name: x.user.name, employeeId: x.user.employeeId },
        meta: {
          itemCode: x.item.code,
          itemTitle: { fr: x.item.labelFr, en: x.item.labelEn, ar: x.item.labelAr },
          status: x.status,
          reason: x.reason,
        },
      })),
    ]
      .sort((a, b) => b.at.getTime() - a.at.getTime())
      .slice(0, limit);

    res.json({ events });
  } catch (e) {
    next(e);
  }
});

function employeeGroupFromCategoryCode(code: string | null | undefined): "DRIVER" | "WORKER" {
  return code === "driver" ? "DRIVER" : "WORKER";
}

function applyEmployeeGroupRoleFilter(
  where: UserWhereInput,
  groupOrRole: string | undefined
): void {
  const raw = (groupOrRole ?? "").trim();
  if (!raw || raw.toUpperCase() === "ALL") return;

  const upper = raw.toUpperCase();
  if (upper === "DRIVER") {
    where.category = { code: "driver" };
    return;
  }
  if (upper === "WORKER") {
    where.category = { code: { not: "driver" } };
    return;
  }

  const categoryCode = categoryCodeFromEmployeeRole(raw);
  if (categoryCode) {
    where.category = { code: categoryCode };
  }
}

router.get(
  "/employees",
  query("page").optional().isInt({ min: 1 }),
  query("search").optional(),
  query("categoryId").optional(),
  query("group").optional(),
  query("role").optional(),
  query("status")
    .optional()
    .isIn(["all", "not_started", "in_progress", "completed"]),
  query("pageSize").optional().isInt({ min: 1, max: 500 }),
  async (req, res, next) => {
    try {
      const q = req.query ?? {};
      const page = Math.max(1, Number(q.page) || 1);
      const take = Math.min(500, Math.max(1, Number(q.pageSize) || 20));
      const skip = (page - 1) * take;
      const search = (q.search as string | undefined)?.trim();
      const categoryId = (q.categoryId as string | undefined)?.trim();
      const groupFilter = (q.group as string | undefined)?.trim();
      const roleFilter = (q.role as string | undefined)?.trim();
      const status = (q.status as string) || "all";

      const where: UserWhereInput = {
        role: "EMPLOYEE",
      };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
        ];
      }
      if (categoryId) {
        where.categoryId = categoryId;
      } else {
        applyEmployeeGroupRoleFilter(where, groupFilter || roleFilter);
      }

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          progress: true,
          attempts: {
            where: { passed: true },
            include: { quiz: { select: { courseId: true } } },
          },
          lessonQuizAttempts: true,
          category: true,
        },
      });

      const coursesForCategory = async (cid: string | null, categoryCode?: string | null) => {
        if (!cid || isCategoryWithoutCoursesYet(categoryCode)) return [];
        return prisma.course.findMany({
          where: { isActive: true, categories: { some: { categoryId: cid } } },
          select: {
            id: true,
            slug: true,
            title: true,
            isHsseqFoundation: true,
            pdfUrl: true,
          },
        });
      };

      const enriched = [];
      for (const u of users) {
        const assigned = await coursesForCategory(u.categoryId ?? null, u.category?.code);
        const visibleForProgress = visibleCoursesForEmployee(
          assigned,
          u.assessmentCompleted,
          u.assessmentScore,
          u.hsseqCourseRequired
        );
        const metrics = computeEmployeeCourseMetrics(
          visibleForProgress,
          u.progress,
          u.lessonQuizAttempts ?? [],
          u.attempts ?? [],
          u.assessmentCompleted,
          u.assessmentScore
        );
        const avg =
          (() => {
            const scores: number[] = [];
            for (const a of u.attempts ?? []) scores.push(a.score);
            for (const a of u.lessonQuizAttempts ?? []) scores.push(a.percentage);
            if (!scores.length) return 0;
            return Math.round(scores.reduce((acc, s) => acc + s, 0) / scores.length);
          })();
        const lastActive = await prisma.lessonProgress.findFirst({
          where: { userId: u.id },
          orderBy: { lastAccessedAt: "desc" },
        });
        const lastQuiz = await prisma.lessonQuizAttempt.findFirst({
          where: { userId: u.id },
          orderBy: { takenAt: "desc" },
        });
        const lastActiveAt =
          lastActive && lastQuiz
            ? lastActive.lastAccessedAt > lastQuiz.takenAt
              ? lastActive.lastAccessedAt
              : lastQuiz.takenAt
            : lastActive?.lastAccessedAt ?? lastQuiz?.takenAt ?? u.createdAt;
        enriched.push({
          id: u.id,
          employeeId: u.employeeId,
          name: u.name,
          category: u.category,
          group: employeeGroupFromCategoryCode(u.category?.code),
          language: u.language,
          avatarColor: u.avatarColor,
          isActive: u.isActive,
          createdAt: u.createdAt,
          assessmentCompleted: u.assessmentCompleted,
          assessmentScore: u.assessmentScore,
          assessmentTakenAt: u.assessmentTakenAt,
          coursesDone: metrics.coursesDone,
          coursesTotal: metrics.coursesTotal,
          avgScore: avg,
          lastActiveAt,
          status: metrics.status,
        });
      }

      let filtered = enriched;
      if (status === "completed") {
        filtered = enriched.filter((e) => e.status === "completed");
      } else if (status === "in_progress") {
        filtered = enriched.filter((e) => e.status === "in_progress");
      } else if (status === "not_started") {
        filtered = enriched.filter((e) => e.status === "not_started");
      }

      const total = filtered.length;
      const paged = filtered.slice(skip, skip + take);
      res.json({
        employees: paged,
        pagination: { page, pageSize: take, total },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/employees",
  body("employeeId").optional().trim().isLength({ min: 3, max: 32 }),
  body("name").trim().notEmpty(),
  body("pin").isLength({ min: 4, max: 4 }).isNumeric(),
  body("categoryId").optional().isString().notEmpty(),
  body("role").optional().isString().notEmpty(),
  body("group").optional().isString().notEmpty(),
  body("language").optional().isIn(["AR", "FR", "EN", "ar", "fr", "en"]),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { employeeId: requestedEmployeeId, name, pin, categoryId, role, group, language } = req.body as {
        employeeId?: string;
        name: string;
        pin: string;
        categoryId?: string;
        role?: string;
        group?: string;
        language?: string;
      };
      const colors = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#14B8A6"];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)]!;
      const hashed = await hashPin(pin);
      const user = await prisma.$transaction(async (tx: PrismaTransaction) => {
        const categoryCode = categoryCodeFromEmployeeRole(role ?? group);
        const cat = categoryId
          ? await tx.category.findUnique({ where: { id: categoryId } })
          : categoryCode
            ? await tx.category.findUnique({ where: { code: categoryCode } })
            : null;
        if (!cat) throw new AppError(404, "Category not found");
        const employeeId = requestedEmployeeId?.trim() || (await nextGlobalEmployeeId(tx));
        const existing = await tx.user.findUnique({ where: { employeeId } });
        if (existing) throw new AppError(409, "Employee ID already exists");
        return tx.user.create({
          data: {
            employeeId,
            name: name.trim(),
            pin: hashed,
            categoryId: cat.id,
            language: ((language ?? "AR").toUpperCase() as "AR" | "FR" | "EN"),
            avatarColor,
            role: "EMPLOYEE",
          },
        });
      });
      res.status(201).json({
        user: {
          id: user.id,
          employeeId: user.employeeId,
          name: user.name,
          categoryId: user.categoryId,
          language: user.language,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/employees/next-id",
  query("categoryId").isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const q = req.query ?? {};
      const categoryId = q.categoryId as string;
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) throw new AppError(404, "Category not found");
      const employeeId = await nextGlobalEmployeeId();
      res.json({ employeeId });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/employees/:id", param("id").notEmpty(), async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params!.id!, role: "EMPLOYEE" },
      include: {
        progress: { include: { course: true } },
        attempts: {
          orderBy: { attemptedAt: "desc" },
          include: { quiz: { include: { course: true } } },
        },
        lessonQuizAttempts: {
          orderBy: { takenAt: "desc" },
          include: { course: { select: { id: true, slug: true, title: true } } },
        },
        badges: { include: { badge: true } },
        category: true,
      },
    });
    if (!user) throw new AppError(404, "Employee not found");
    res.json({ employee: user });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/employees/:id/deactivate",
  param("id").notEmpty(),
  async (req, res, next) => {
    try {
      await prisma.user.update({
        where: { id: req.params!.id! },
        data: { isActive: false },
      });
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/employees/:id/reset-progress",
  param("id").notEmpty(),
  async (req, res, next) => {
    try {
      const uid = req.params!.id!;
      await prisma.$transaction([
        prisma.lessonProgress.deleteMany({ where: { userId: uid } }),
        prisma.quizAttempt.deleteMany({ where: { userId: uid } }),
        prisma.userBadge.deleteMany({ where: { userId: uid } }),
        prisma.certificate.deleteMany({ where: { userId: uid } }),
      ]);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/employees/:id", param("id").notEmpty(), async (req, res, next) => {
  try {
    const uid = req.params!.id!;
    const user = await prisma.user.findUnique({
      where: { id: uid },
      select: { id: true, role: true },
    });
    if (!user || user.role !== "EMPLOYEE") throw new AppError(404, "Employee not found");

    await prisma.$transaction(async (tx) => {
      await tx.epiReplacementRequest.deleteMany({ where: { userId: uid } });
      await tx.epiIssuance.deleteMany({ where: { userId: uid } });
      await tx.epiRenewalRequest.deleteMany({ where: { userId: uid } });
      await tx.epiComplianceProof.deleteMany({ where: { userId: uid } });
      await tx.epiFeedback.deleteMany({ where: { userId: uid } });
      await tx.epiProfile.deleteMany({ where: { userId: uid } });
      await tx.lessonQuizAttempt.deleteMany({ where: { userId: uid } });
      await tx.quizAttempt.deleteMany({ where: { userId: uid } });
      await tx.lessonProgress.deleteMany({ where: { userId: uid } });
      await tx.userBadge.deleteMany({ where: { userId: uid } });
      await tx.certificate.deleteMany({ where: { userId: uid } });
      await tx.notification.deleteMany({ where: { userId: uid } });
      await tx.user.delete({ where: { id: uid } });
    });

    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/employees/:id/certificate",
  param("id").notEmpty(),
  async (req, res, next) => {
    try {
      const uid = req.params!.id!;
      const pdfUrl = await issueEmployeeCertificate(uid);
      const user = await prisma.user.findUnique({ where: { id: uid }, select: { name: true } });
      sendCertificatePdf(res, pdfUrl, buildCertificateDownloadName(user?.name ?? "employee"));
    } catch (e) {
      next(e);
    }
  }
);

router.get("/analytics/questions", async (_req, res, next) => {
  try {
    const quizzes = await prisma.quiz.findMany({
      include: { course: true, attempts: true },
    });
    const result: {
      courseId: string;
      courseTitle: unknown;
      questionId: number;
      wrongRate: number;
      questionPreview: string;
    }[] = [];
    for (const q of quizzes) {
      const questions = parseQuizQuestions(q.questions);
      for (const qq of questions) {
        let wrong = 0;
        let total = 0;
        for (const att of q.attempts) {
          const ans = att.answers as Record<string, string>;
          const sel = ans[String(qq.id)];
          total++;
          if (sel !== qq.correct) wrong++;
        }
        const wrongRate = total > 0 ? Math.round((wrong / total) * 100) : 0;
        result.push({
          courseId: q.courseId,
          courseTitle: q.course.title,
          questionId: qq.id,
          wrongRate,
          questionPreview:
            (qq.question as QuizQuestionJson["question"]).en?.slice(0, 120) ||
            (qq.question as QuizQuestionJson["question"]).ar?.slice(0, 120) ||
            "",
        });
      }
    }
    result.sort((a, b) => b.wrongRate - a.wrongRate);
    res.json({ questions: result.slice(0, 50) });
  } catch (e) {
    next(e);
  }
});

router.get("/analytics/atrisk", async (_req, res, next) => {
  try {
    const raw = await prisma.quizAttempt.groupBy({
      by: ["userId", "quizId"],
      where: { passed: false },
      _count: { _all: true },
    });
    const filtered = raw.filter((r) => r._count._all >= 2);
    const users = await prisma.user.findMany({
      where: { id: { in: [...new Set(filtered.map((r) => r.userId))] } },
    });
    res.json({
      atRisk: filtered.map((r) => ({
        userId: r.userId,
        quizId: r.quizId,
        failCount: r._count._all,
        user: users.find((u) => u.id === r.userId),
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get("/analytics/weekly", async (_req, res, next) => {
  try {
    const weeks: { week: string; rate: number }[] = [];
    const now = new Date();
    for (let i = 7; i >= 0; i--) {
      const end = new Date(now);
      end.setDate(end.getDate() - i * 7);
      const start = new Date(end);
      start.setDate(start.getDate() - 7);
      const completed = await prisma.lessonProgress.count({
        where: {
          isCompleted: true,
          completedAt: { gte: start, lt: end },
        },
      });
      const emps = await prisma.user.count({ where: { role: "EMPLOYEE" } });
      weeks.push({
        week: start.toISOString().slice(0, 10),
        rate: emps > 0 ? Math.round((completed / emps) * 100) : 0,
      });
    }
    res.json({ weekly: weeks });
  } catch (e) {
    next(e);
  }
});

router.get("/analytics/course-scores", async (_req, res, next) => {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      include: { quiz: { include: { attempts: true } } },
    });
    const rows: {
      courseId: string;
      title: unknown;
      avgScore: number;
      attemptCount: number;
    }[] = [];
    for (const c of courses) {
      const attempts = c.quiz?.attempts ?? [];
      if (!c.quiz) continue;
      const raw =
        attempts.length > 0 ? attempts.reduce((a, b) => a + b.score, 0) / attempts.length : 0;
      const avgScore = Math.round(raw * 10) / 10;
      rows.push({
        courseId: c.id,
        title: c.title,
        avgScore,
        attemptCount: attempts.length,
      });
    }
    res.json({ courses: rows });
  } catch (e) {
    next(e);
  }
});

router.get("/analytics/heatmap", async (_req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      orderBy: { employeeId: "asc" },
    });
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
      include: { categories: true },
    });
    const cells: {
      userId: string;
      courseId: string;
      completionPct: number;
    }[] = [];
    for (const u of users) {
      for (const c of courses) {
        if (!u.categoryId) continue;
        if (!c.categories.some((cc) => cc.categoryId === u.categoryId)) continue;
        const p = await prisma.lessonProgress.findUnique({
          where: { userId_courseId: { userId: u.id, courseId: c.id } },
        });
        cells.push({
          userId: u.id,
          courseId: c.id,
          completionPct: p?.completionPct ?? 0,
        });
      }
    }
    res.json({
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        employeeId: u.employeeId,
      })),
      courses: courses.map((c) => ({ id: c.id, title: c.title })),
      cells,
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/notifications/send",
  body("userId").notEmpty(),
  body("title").notEmpty(),
  body("message").notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { userId, title, message } = req.body as {
        userId: string;
        title: { ar: string; fr: string; en: string };
        message: { ar: string; fr: string; en: string };
      };
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, "User not found");
      const n = await createEmployeeNotification(userId, title, message);
      res.status(201).json({ notification: n });
    } catch (e) {
      next(e);
    }
  }
);

/** Admin reminder → in-app notification for employee (assessment, EPI, or custom). */
router.post(
  "/notify/:employeeId",
  param("employeeId").notEmpty().trim(),
  body("type").optional().isIn(["assessment", "epi", "custom"]),
  body("title").optional(),
  body("message").optional(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const employeeId = String(req.params?.employeeId ?? "");
      const type = (req.body?.type as "assessment" | "epi" | "custom" | undefined) ?? "assessment";
      const custom =
        type === "custom"
          ? {
              title: req.body.title as { ar: string; fr: string; en: string },
              message: req.body.message as { ar: string; fr: string; en: string },
            }
          : undefined;
      const notification = await sendAdminNotify(employeeId, type, custom);
      res.status(201).json({ ok: true, notification });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/epi/:employeeId/remind",
  param("employeeId").notEmpty().trim(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const user = await findEmployeeUser(String(req.params?.employeeId ?? ""));
      if (!user) throw new AppError(404, "Employee not found");
      const notification = await sendEpiReminder(user.id);
      res.status(201).json({ ok: true, notification });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/epi/overview",
  query("page").optional().isInt({ min: 1 }),
  query("search").optional(),
  async (req, res, next) => {
    try {
      // Auto-fill example EPI data on first use if DB has no issuances yet.
      // This gives admins immediately useful, realistic screens in fresh installs.
      // DISABLED: auto-seed removed, admin issues EPI manually
      // try {
      //   await syncEpiCanonicalSeedIfEmpty();
      // } catch {
      //   /* ignore auto-fill errors; continue with empty state */
      // }

      const q = req.query ?? {};
      const page = Math.max(1, Number(q.page) || 1);
      const take = 20;
      const skip = (page - 1) * take;
      const search = (q.search as string | undefined)?.trim();

      const where: UserWhereInput = {
        role: "EMPLOYEE",
        isActive: true,
      };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
        ];
      }

      try {
        const [total, users, pendingRequestsCount, profilesMissingCount] = await Promise.all([
          prisma.user.count({ where }),
          prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
              id: true,
              employeeId: true,
              name: true,
              avatarColor: true,
              category: { select: { code: true } },
              epiProfile: {
                select: {
                  shirtSize: true,
                  shoeSize: true,
                  gloveSize: true,
                  vestSize: true,
                  pantsSize: true,
                  updatedAt: true,
                },
              },
              epiIssuances: {
                orderBy: { issuedAt: "desc" },
                take: 25,
                select: {
                  id: true,
                  itemCode: true,
                  status: true,
                  issuedAt: true,
                  nextReplacementAt: true,
                },
              },
              epiReplacementRequests: {
                orderBy: { createdAt: "desc" },
                take: 25,
                select: {
                  id: true,
                  status: true,
                  itemCode: true,
                  createdAt: true,
                },
              },
            },
          }),
          prisma.epiReplacementRequest.count({ where: { status: "pending" } }),
          prisma.user.count({ where: { role: "EMPLOYEE", isActive: true, epiProfile: null } }),
        ]);

        const now = new Date();
        const soon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
        const rows = users.map((u) => {
          const issuances = u.epiIssuances ?? [];
          const pendingReqs = (u.epiReplacementRequests ?? []).filter((r) => r.status === "pending");
          const dueSoon = issuances.some(
            (x) => (x.nextReplacementAt && x.nextReplacementAt <= soon) || x.status === "expired"
          );
          const lastIssuanceAt = issuances[0]?.issuedAt ?? null;
          const lastRequestAt = u.epiReplacementRequests?.[0]?.createdAt ?? null;
          const lastActionAt =
            lastIssuanceAt && lastRequestAt
              ? new Date(Math.max(lastIssuanceAt.getTime(), lastRequestAt.getTime()))
              : lastIssuanceAt ?? lastRequestAt ?? null;

          const statusCounts = issuances.reduce(
            (acc, x) => {
              acc.total += 1;
              if (x.status === "received") acc.received += 1;
              if (x.status === "issued" || x.status === "pending_renewal") acc.issued += 1;
              if (x.status === "expired") acc.expired += 1;
              if (x.status === "replaced") acc.replaced += 1;
              return acc;
            },
            { total: 0, issued: 0, received: 0, replaced: 0, expired: 0 }
          );

          return {
            userId: u.id,
            employeeId: u.employeeId,
            name: u.name,
            avatarColor: u.avatarColor,
            categoryCode: u.category?.code ?? null,
            profile: u.epiProfile,
            statusCounts,
            pendingRequests: pendingReqs.length,
            dueSoon,
            lastActionAt,
            issuances: issuances.slice(0, 10).map((x) => ({
              id: x.id,
              itemCode: x.itemCode,
              status: x.status,
              issuedAt: x.issuedAt,
              nextReplacementAt: x.nextReplacementAt ?? null,
            })),
          };
        });

        res.json({
          kpis: {
            pendingReplacementRequests: pendingRequestsCount,
            profilesMissing: profilesMissingCount,
          },
          total,
          page,
          pageSize: take,
          rows,
        });
      } catch (e) {
        if (isEpiSchemaNotReady(e) || isMissingTable(e)) {
          res.json({
            kpis: { pendingReplacementRequests: 0, profilesMissing: 0 },
            total: 0,
            page,
            pageSize: take,
            rows: [],
          });
          return;
        }
        throw e;
      }
    } catch (e) {
      next(e);
    }
  }
);

/**
 * Admin dashboard EPI list — same summary payload as GET /api/epi/summary per employee.
 */
router.get("/epi", async (_req, res, next) => {
  try {
    // DISABLED: auto-seed removed, admin issues EPI manually
    // try {
    //   await syncEpiCanonicalSeedIfEmpty();
    //   await ensureEpiDataForAllActiveEmployees();
    // } catch {
    //   /* ignore auto-fill errors */
    // }

    const users = await prisma.user.findMany({
      where: { role: "EMPLOYEE", isActive: true },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        employeeId: true,
        name: true,
        category: { select: { code: true, name: true } },
      },
    });

    let pendingByUser = new Map<string, number>();
    try {
      const [legacyPending, renewalPending] = await Promise.all([
        prisma.epiReplacementRequest.findMany({
          where: { status: "pending" },
          select: { userId: true },
        }),
        prisma.epiRenewalRequest.findMany({
          where: { status: "pending" },
          select: { userId: true },
        }),
      ]);
      for (const r of [...legacyPending, ...renewalPending]) {
        pendingByUser.set(r.userId, (pendingByUser.get(r.userId) ?? 0) + 1);
      }
    } catch (e) {
      if (!isEpiSchemaNotReady(e) && !isMissingTable(e)) throw e;
    }

    const employees = await Promise.all(
      users.map(async (u) => {
        const nameJson = u.category?.name as { ar?: string } | null;
        try {
          return {
            id: u.id,
            employeeId: u.employeeId,
            name: u.name,
            categoryCode: u.category?.code ?? null,
            categoryNameAr: nameJson?.ar ?? null,
            pendingRequests: pendingByUser.get(u.id) ?? 0,
            summary: await getEpiSummaryForUserId(u.id),
          };
        } catch (err) {
          console.error("[admin/epi] summary failed for", u.employeeId, err);
          return {
            id: u.id,
            employeeId: u.employeeId,
            name: u.name,
            categoryCode: u.category?.code ?? null,
            categoryNameAr: nameJson?.ar ?? null,
            pendingRequests: pendingByUser.get(u.id) ?? 0,
            summary: {
              profileComplete: false,
              profile: null,
              passport: [],
              catalog: [],
              categoryDefaults: [],
            },
          };
        }
      })
    );

    res.json({ employees });
  } catch (e) {
    if (isEpiSchemaNotReady(e) || isMissingTable(e)) {
      res.status(503).json({ employees: [], error: "DB_MIGRATION_REQUIRED" });
      return;
    }
    next(e);
  }
});

function categoryNameAr(name: unknown): string | null {
  if (!name || typeof name !== "object") return null;
  const ar = (name as { ar?: string }).ar;
  return ar && String(ar).trim() ? String(ar).trim() : null;
}

router.get("/epi/requests", async (_req, res, next) => {
  try {
    const rows = await prisma.epiRenewalRequest.findMany({
      where: { status: "pending" },
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            category: { select: { name: true } },
          },
        },
      },
    });
    res.json(
      rows.map((r) => ({
        id: r.id,
        employeeId: r.userId,
        employeeName: r.user.name,
        employeeRole: categoryNameAr(r.user.category?.name) ?? "—",
        itemType: r.itemType,
        itemLabel: r.itemLabel ?? r.itemType,
        reason: r.reason,
        note: r.note,
        createdAt: r.createdAt,
      }))
    );
  } catch (e) {
    if (isEpiSchemaNotReady(e) || isMissingTable(e)) {
      res.json([]);
      return;
    }
    next(e);
  }
});

router.patch("/epi/requests/:id/approve", param("id").isString(), async (req, res, next) => {
  try {
    const vr = validationResult(req);
    if (!vr.isEmpty()) throw new AppError(400, "Invalid request");

    const requestId = String(req.params?.id ?? "");
    if (!requestId) throw new AppError(400, "Invalid request");

    const existing = await prisma.epiRenewalRequest.findUnique({ where: { id: requestId } });
    if (!existing) throw new AppError(404, "Not found");
    if (existing.status !== "pending") throw new AppError(400, "Request already processed");

    const today = new Date();
    await prisma.$transaction(async (tx: PrismaTransaction) => {
      await tx.epiRenewalRequest.update({
        where: { id: existing.id },
        data: { status: "approved", processedAt: today },
      });

      const issuance = await tx.epiIssuance.findFirst({
        where: { userId: existing.userId, itemCode: existing.itemType },
        orderBy: { issuedAt: "desc" },
      });
      if (issuance) {
        const catalog = await tx.epiItemCatalog.findUnique({
          where: { code: existing.itemType },
          select: { defaultLifetimeDays: true },
        });
        const lifetimeDays = catalog?.defaultLifetimeDays ?? 365;
        const nextReplacementAt = new Date(today.getTime() + lifetimeDays * 24 * 60 * 60 * 1000);
        await tx.epiIssuance.update({
          where: { id: issuance.id },
          data: { status: "issued", issuedAt: today, nextReplacementAt },
        });
      }
    });

    res.json({ success: true });
  } catch (e) {
    if (isEpiSchemaNotReady(e) || isMissingTable(e)) throw new AppError(503, "DB_MIGRATION_REQUIRED");
    next(e);
  }
});

router.patch("/epi/requests/:id/reject", param("id").isString(), async (req, res, next) => {
  try {
    const vr = validationResult(req);
    if (!vr.isEmpty()) throw new AppError(400, "Invalid request");

    const requestId = String(req.params?.id ?? "");
    if (!requestId) throw new AppError(400, "Invalid request");

    const existing = await prisma.epiRenewalRequest.findUnique({ where: { id: requestId } });
    if (!existing) throw new AppError(404, "Not found");
    if (existing.status !== "pending") throw new AppError(400, "Request already processed");

    await prisma.epiRenewalRequest.update({
      where: { id: existing.id },
      data: { status: "rejected", processedAt: new Date() },
    });

    res.json({ success: true });
  } catch (e) {
    if (isEpiSchemaNotReady(e) || isMissingTable(e)) throw new AppError(503, "DB_MIGRATION_REQUIRED");
    next(e);
  }
});

/**
 * Admin EPI catalog + issuing endpoints.
 *
 * Note: Prisma client generation may be temporarily out-of-sync in some dev
 * environments on Windows. We use `as any` to avoid blocking builds; the schema
 * is the source of truth.
 */
const epiDb = prisma as any;

router.get("/epi/catalog", async (_req, res, next) => {
  try {
    const items = await epiDb.epiItemCatalog.findMany({
      orderBy: [{ active: "desc" }, { sortOrder: "asc" }, { code: "asc" }],
    });
    res.json({
      items: items.map((x: any) => ({
        code: x.code,
        labelAr: x.labelAr,
        labelFr: x.labelFr,
        labelEn: x.labelEn,
        emoji: x.emoji ?? null,
        defaultLifetimeDays: x.defaultLifetimeDays ?? null,
        sortOrder: x.sortOrder,
        active: x.active,
      })),
    });
  } catch (e) {
    next(e);
  }
});

router.get(
  "/epi/category-defaults/:categoryId",
  param("categoryId").isString().notEmpty(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const categoryId = req.params!.categoryId!;
      const rows = await epiDb.epiCategoryDefaultItem.findMany({
        where: { categoryId },
        orderBy: [{ sortOrder: "asc" }, { itemCode: "asc" }],
      });
      res.json({
        defaults: rows.map((r: any) => ({
          categoryId: r.categoryId,
          itemCode: r.itemCode,
          required: Boolean(r.required),
          lifetimeDaysOverride: r.lifetimeDaysOverride ?? null,
          sortOrder: r.sortOrder ?? 0,
        })),
      });
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  "/epi/category-defaults/:categoryId",
  param("categoryId").isString().notEmpty(),
  body("items").isArray({ min: 0 }),
  body("items.*.itemCode").isString().isLength({ min: 1, max: 80 }),
  body("items.*.required").optional().isBoolean(),
  body("items.*.lifetimeDaysOverride").optional().isInt({ min: 1, max: 3650 }),
  body("items.*.sortOrder").optional().isInt({ min: 0, max: 9999 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const categoryId = req.params!.categoryId!;
      const items = (req.body.items ?? []) as {
        itemCode: string;
        required?: boolean;
        lifetimeDaysOverride?: number;
        sortOrder?: number;
      }[];

      // Verify category exists.
      const cat = await prisma.category.findUnique({ where: { id: categoryId } });
      if (!cat) throw new AppError(404, "Category not found");

      // Validate item codes exist.
      const codes = [...new Set(items.map((x) => x.itemCode.trim()).filter(Boolean))];
      const found = await epiDb.epiItemCatalog.findMany({
        where: { code: { in: codes } },
        select: { code: true },
      });
      const foundSet = new Set(found.map((f: any) => f.code));
      const missing = codes.filter((c) => !foundSet.has(c));
      if (missing.length) throw new AppError(400, `Unknown itemCode(s): ${missing.join(", ")}`);

      await epiDb.$transaction(async (tx: any) => {
        await tx.epiCategoryDefaultItem.deleteMany({ where: { categoryId } });
        if (items.length) {
          await tx.epiCategoryDefaultItem.createMany({
            data: items.map((x, i) => ({
              categoryId,
              itemCode: x.itemCode.trim(),
              required: x.required ?? true,
              lifetimeDaysOverride: x.lifetimeDaysOverride ?? null,
              sortOrder: x.sortOrder ?? i,
            })),
          });
        }
      });

      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  }
);

function addDays(d: Date, days: number): Date {
  return new Date(d.getTime() + days * 24 * 60 * 60 * 1000);
}

function pick<T>(arr: T[], n: number): T[] {
  const copy = [...arr];
  const out: T[] = [];
  while (copy.length && out.length < n) {
    const i = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(i, 1)[0]!);
  }
  return out;
}

async function seedEpiExampleDataForEmployees(tx: any) {
  type CatalogRow = { code: string; defaultLifetimeDays: number | null };

  const employees = await tx.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: { id: true, categoryId: true },
    take: 500,
  });
  const catalog = (await tx.epiItemCatalog.findMany({
    where: { active: true },
    select: { code: true, defaultLifetimeDays: true },
    orderBy: { sortOrder: "asc" },
    take: 50,
  })) as CatalogRow[];
  if (!catalog.length) return { createdProfiles: 0, createdIssuances: 0 };

  const catalogByCode = new Map(catalog.map((c) => [c.code, c]));
  const now = new Date();
  let createdProfiles = 0;
  let createdIssuances = 0;

  for (const e of employees) {
    const existing = await tx.epiIssuance.findMany({
      where: { userId: e.id },
      select: { itemCode: true },
      take: 200,
    });
    const existingCodes = new Set<string>((existing ?? []).map((x: any) => x.itemCode));

    const profile = await tx.epiProfile.findUnique({ where: { userId: e.id } });
    if (!profile) {
      await tx.epiProfile.create({
        data: {
          userId: e.id,
          shirtSize: ["S", "M", "L", "XL"][Math.floor(Math.random() * 4)],
          shoeSize: ["39", "40", "41", "42", "43", "44"][Math.floor(Math.random() * 6)],
          gloveSize: ["S", "M", "L"][Math.floor(Math.random() * 3)],
          vestSize: ["S", "M", "L", "XL"][Math.floor(Math.random() * 4)],
          pantsSize: ["S", "M", "L", "XL", "XXL"][Math.floor(Math.random() * 5)],
          notes: "AUTO_EXAMPLE_DATA",
        },
      });
      createdProfiles += 1;
    }

    const categoryDefaults = e.categoryId
      ? await tx.epiCategoryDefaultItem.findMany({
          where: { categoryId: e.categoryId, required: true },
          orderBy: { sortOrder: "asc" },
          select: { itemCode: true },
        })
      : [];

    const defaultCodes = categoryDefaults.map((d: { itemCode: string }) => d.itemCode);
    const pool =
      defaultCodes.length > 0
        ? defaultCodes
            .map((code: string) => catalogByCode.get(code))
            .filter((row: CatalogRow | undefined): row is CatalogRow => Boolean(row))
        : catalog;

    const available = pool.filter((c: CatalogRow) => !existingCodes.has(c.code));
    const need = Math.max(0, Math.min(pool.length, 6 + Math.floor(Math.random() * 3)) - existingCodes.size);
    const items = pick<CatalogRow>(available.length ? available : pool, need);

    for (const it of items) {
      const ageDays = Math.floor(Math.random() * 120);
      const issuedAt = addDays(now, -ageDays);
      const lifetime = it.defaultLifetimeDays ?? 180;
      const nextReplacementAt = addDays(issuedAt, lifetime);

      const rand = Math.random();
      const status =
        nextReplacementAt <= now
          ? "expired"
          : rand < 0.55
            ? "received"
            : rand < 0.9
              ? "issued"
              : "replaced";

      const issuance = await tx.epiIssuance.create({
        data: {
          userId: e.id,
          itemCode: it.code,
          status,
          issuedAt,
          nextReplacementAt,
          size: null,
        },
      });
      createdIssuances += 1;

      if (status === "received") {
        await tx.epiReceptionConfirmation.create({
          data: {
            issuanceId: issuance.id,
            signatureName: "System",
            notes: "AUTO_EXAMPLE_DATA | FIT_OK | NOTIFY_SUPERVISOR",
          },
        });
      }

      if (status === "replaced" || (status === "issued" && Math.random() < 0.15)) {
        await tx.epiReplacementRequest.create({
          data: {
            userId: e.id,
            issuanceId: issuance.id,
            itemCode: it.code,
            reason: "AUTO_EXAMPLE_DATA: replacement request",
            status: "pending",
          },
        });
      }
    }
  }
  return { createdProfiles, createdIssuances };
}

router.post("/epi/demo-seed", async (_req, res, next) => {
  try {
    const result = await epiDb.$transaction(async (tx: any) => seedEpiExampleDataForEmployees(tx));
    res.json({ ok: true, ...result });
  } catch (e) {
    next(e);
  }
});

const EPI_ISSUANCE_STATUSES = ["issued", "received", "replaced", "expired", "pending_renewal"] as const;

router.patch(
  "/epi/issuances/:id",
  param("id").isString().notEmpty(),
  body("status").optional().isIn([...EPI_ISSUANCE_STATUSES]),
  body("size").optional().isString().isLength({ max: 40 }),
  body("issuedAt").optional().isISO8601(),
  body("nextReplacementAt").optional({ nullable: true }).isISO8601(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const id = String(req.params!.id);
      const existing = await prisma.epiIssuance.findUnique({ where: { id } });
      if (!existing) throw new AppError(404, "EPI issuance not found");

      const data: {
        status?: string;
        size?: string | null;
        issuedAt?: Date;
        nextReplacementAt?: Date | null;
      } = {};
      if (req.body.status) data.status = String(req.body.status);
      if (req.body.size !== undefined) data.size = req.body.size ? String(req.body.size) : null;
      if (req.body.issuedAt) data.issuedAt = new Date(req.body.issuedAt);
      if (req.body.nextReplacementAt !== undefined) {
        data.nextReplacementAt = req.body.nextReplacementAt
          ? new Date(req.body.nextReplacementAt)
          : null;
      }

      const updated = await prisma.epiIssuance.update({ where: { id }, data });
      res.json({ issuance: updated });
    } catch (e) {
      next(e);
    }
  }
);

router.delete("/epi/issuances/:id", param("id").isString().notEmpty(), async (req, res, next) => {
  try {
    const id = String(req.params!.id);
    const existing = await prisma.epiIssuance.findUnique({ where: { id } });
    if (!existing) throw new AppError(404, "EPI issuance not found");
    await prisma.epiIssuance.delete({ where: { id } });
    res.json({ success: true });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/epi/issue",
  body("userId").isString().notEmpty(),
  body("itemCodes").isArray({ min: 1 }),
  body("itemCodes.*").isString().isLength({ min: 1, max: 80 }),
  body("issuedAt").optional().isISO8601(),
  body("lifetimeDaysByItemCode").optional().isObject(),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }

      const userId = String(req.body.userId);
      const itemCodes = (req.body.itemCodes as string[]).map((x) => x.trim()).filter(Boolean);
      const issuedAt = req.body.issuedAt ? new Date(req.body.issuedAt) : new Date();
      const lifetimeDaysByItemCode = (req.body.lifetimeDaysByItemCode ?? {}) as Record<
        string,
        number
      >;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, isActive: true, categoryId: true },
      });
      if (!user || user.role !== "EMPLOYEE") throw new AppError(404, "Employee not found");

      // Resolve catalog lifetimes.
      const catalogItems = await epiDb.epiItemCatalog.findMany({
        where: { code: { in: itemCodes } },
        select: {
          code: true,
          labelAr: true,
          labelFr: true,
          labelEn: true,
          defaultLifetimeDays: true,
          active: true,
        },
      });
      const catByCode = new Map<string, any>(catalogItems.map((x: any) => [x.code, x]));
      const missing = itemCodes.filter((c) => !catByCode.has(c));
      if (missing.length) throw new AppError(400, `Unknown itemCode(s): ${missing.join(", ")}`);

      const results = await epiDb.$transaction(async (tx: any) => {
        const out: any[] = [];
        for (const code of itemCodes) {
          const existing = await tx.epiIssuance.findFirst({
            where: { userId, itemCode: code },
            orderBy: { issuedAt: "desc" },
          });

          const override = lifetimeDaysByItemCode[code];
          const base = catByCode.get(code)?.defaultLifetimeDays ?? null;
          const lifetimeDays =
            Number.isFinite(override) && override > 0 ? override : Number.isFinite(base) ? base : null;

          const nextReplacementAt = lifetimeDays ? addDays(issuedAt, lifetimeDays) : null;

          if (existing) {
            const updated = await tx.epiIssuance.update({
              where: { id: existing.id },
              data: {
                status: "issued",
                issuedAt,
                nextReplacementAt,
              },
            });
            out.push(updated);
          } else {
            const created = await tx.epiIssuance.create({
              data: {
                userId,
                itemCode: code,
                status: "issued",
                issuedAt,
                nextReplacementAt,
              },
            });
            out.push(created);
          }

          if (user.categoryId) {
            const hasDefault = await tx.epiCategoryDefaultItem.findFirst({
              where: { categoryId: user.categoryId, itemCode: code },
            });
            if (!hasDefault) {
              const agg = await tx.epiCategoryDefaultItem.aggregate({
                where: { categoryId: user.categoryId },
                _max: { sortOrder: true },
              });
              await tx.epiCategoryDefaultItem.create({
                data: {
                  categoryId: user.categoryId,
                  itemCode: code,
                  required: true,
                  lifetimeDaysOverride: lifetimeDays,
                  sortOrder: (agg._max.sortOrder ?? -1) + 1,
                },
              });
            }
          }
        }
        return out;
      });

      try {
        const labels = itemCodes.map((code) => {
          const c = catByCode.get(code);
          return {
            ar: String(c?.labelAr ?? code),
            fr: c?.labelFr ? String(c.labelFr) : undefined,
            en: c?.labelEn ? String(c.labelEn) : undefined,
          };
        });
        const { title, message } = epiIssuanceNotificationContent(labels);
        await createEmployeeNotification(userId, title, message);
      } catch (notifyErr) {
        console.error("[admin/epi/issue] notification failed:", notifyErr);
      }

      res.status(201).json({
        issued: results.map((x: any) => ({
          id: x.id,
          userId: x.userId,
          itemCode: x.itemCode,
          status: x.status,
          issuedAt: x.issuedAt,
          nextReplacementAt: x.nextReplacementAt ?? null,
        })),
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get(
  "/epi/employees",
  query("page").optional().isInt({ min: 1 }),
  query("search").optional(),
  async (req, res, next) => {
    try {
      const q = req.query ?? {};
      const page = Math.max(1, Number(q.page) || 1);
      const take = 20;
      const skip = (page - 1) * take;
      const search = (q.search as string | undefined)?.trim();

      const where: UserWhereInput = {
        role: "EMPLOYEE",
        isActive: true,
      };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
        ];
      }

      let total = 0;
      let users: any[] = [];
      try {
        const resu = await Promise.all([
          prisma.user.count({ where }),
          prisma.user.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take,
            select: {
              id: true,
              employeeId: true,
              name: true,
              avatarColor: true,
              categoryId: true,
              category: { select: { code: true, name: true } },
              epiProfile: {
                select: {
                  shirtSize: true,
                  shoeSize: true,
                  gloveSize: true,
                  vestSize: true,
                  pantsSize: true,
                  updatedAt: true,
                },
              },
              epiIssuances: {
                orderBy: { issuedAt: "desc" },
                take: 100,
                select: {
                  id: true,
                  itemCode: true,
                  status: true,
                  issuedAt: true,
                  nextReplacementAt: true,
                  receptions: {
                    orderBy: { confirmedAt: "desc" },
                    take: 1,
                    select: { confirmedAt: true },
                  },
                },
              },
            },
          }),
        ]);
        total = resu[0] as number;
        users = resu[1] as any[];
      } catch (e) {
        if (isEpiSchemaNotReady(e)) {
          res.json({ total: 0, page, pageSize: take, employees: [] });
          return;
        }
        throw e;
      }

      const now = new Date();
      const soon = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

      // Attach catalog labels for the codes present on this page.
      const codes = [...new Set(users.flatMap((u: any) => u.epiIssuances.map((i: any) => i.itemCode)))];
      let catalog: any[] = [];
      try {
        catalog = await epiDb.epiItemCatalog.findMany({
          where: { code: { in: codes } },
          select: { code: true, labelAr: true, labelFr: true, labelEn: true, emoji: true, active: true },
        });
      } catch (e) {
        if (isEpiSchemaNotReady(e)) {
          res.json({ total: 0, page, pageSize: take, employees: [] });
          return;
        }
        throw e;
      }
      const catByCode = new Map<string, any>(catalog.map((x: any) => [x.code, x]));

      res.json({
        total,
        page,
        pageSize: take,
        employees: users.map((u: any) => {
          const issuances = u.epiIssuances.map((x: any) => {
            const dueSoon =
              (x.nextReplacementAt && x.nextReplacementAt <= soon) || x.status === "expired";
            const overdue =
              (x.nextReplacementAt && x.nextReplacementAt <= now) || x.status === "expired";
            const notReceived = x.status === "issued" || x.status === "pending_renewal";
            const item = catByCode.get(x.itemCode) ?? null;
            return {
              id: x.id,
              itemCode: x.itemCode,
              item,
              status: x.status,
              issuedAt: x.issuedAt,
              nextReplacementAt: x.nextReplacementAt ?? null,
              lastReceptionAt: x.receptions?.[0]?.confirmedAt ?? null,
              dueSoon,
              overdue,
              notReceived,
            };
          });
          return {
            id: u.id,
            employeeId: u.employeeId,
            name: u.name,
            avatarColor: u.avatarColor,
            category: u.category,
            profile: u.epiProfile,
            issuances,
          };
        }),
      });
    } catch (e) {
      next(e);
    }
  }
);

function isAllowedSettingKey(k: string): k is AllowedSettingKey {
  return (ALLOWED_SETTING_KEYS as readonly string[]).includes(k);
}

router.get("/settings", async (_req, res, next) => {
  try {
    const keys = {
      ANTHROPIC_API_KEY: await getKeyMeta("ANTHROPIC_API_KEY"),
      ELEVENLABS_API_KEY: await getKeyMeta("ELEVENLABS_API_KEY"),
    };
    const [employeeCount, courseCount, latestUser] = await Promise.all([
      prisma.user.count({ where: { role: "EMPLOYEE", isActive: true } }),
      countAdminVisibleCourses(),
      prisma.user.findFirst({
        where: { role: "EMPLOYEE" },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);
    res.json({
      keys,
      appInfo: {
        version: "1.0.0",
        employeeCount,
        courseCount,
        lastSeedDate: latestUser?.createdAt?.toISOString() ?? null,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.post(
  "/settings",
  body("key").isString().trim().notEmpty(),
  body("value").isString().trim().isLength({ min: 8, max: 512 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed" });
        return;
      }
      const { key, value } = req.body as { key: string; value: string };
      if (!isAllowedSettingKey(key)) {
        res.status(400).json({ error: "Invalid setting key" });
        return;
      }
      const { userId } = (req as AuthedRequest).user;
      await saveIntegrationKey(key, value, userId);
      res.json({ success: true });
    } catch (e) {
      next(e);
    }
  }
);

router.get("/settings/test/:keyName", param("keyName").isString(), async (req, res, next) => {
  try {
    const keyName = String(req.params!.keyName ?? "");
    if (!isAllowedSettingKey(keyName)) {
      res.status(400).json({ success: false, message: "Invalid setting key" });
      return;
    }
    const result = await testIntegrationKey(keyName);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

export default router;
