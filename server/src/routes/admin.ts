import { Router } from "express";
import path from "path";
import { body, param, query, validationResult } from "express-validator";
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { adminOnly } from "../middleware/adminOnly.js";
import { AppError } from "../middleware/errorHandler.js";
import { hashPin } from "../utils/hash.js";
import { generateTrainingCertificate } from "../services/certificateService.js";
import { parseQuizQuestions } from "../services/badgeService.js";
import type { QuizQuestionJson } from "../services/claudeQuiz.js";

const router = Router();
router.use(authMiddleware);
router.use(adminOnly);

function uploadDir(): string {
  return process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
}

function courseVisibleForUser(
  targetGroup: ("DRIVER" | "WORKER")[],
  userGroup: "DRIVER" | "WORKER"
): boolean {
  if (targetGroup.length === 2) return true;
  return targetGroup.includes(userGroup);
}

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

    const completionsWeek = await prisma.lessonProgress.count({
      where: {
        isCompleted: true,
        completedAt: { gte: weekAgo },
      },
    });

    const attempts = await prisma.quizAttempt.findMany({
      select: { score: true },
    });
    const avgScore =
      attempts.length > 0
        ? Math.round(
            attempts.reduce((a, b) => a + b.score, 0) / attempts.length
          )
        : 0;

    const failGroups = await prisma.quizAttempt.groupBy({
      by: ["userId", "quizId"],
      where: { passed: false },
      _count: { _all: true },
    });
    const atRiskCount = new Set(
      failGroups.filter((g) => g._count._all >= 2).map((g) => g.userId)
    ).size;

    const recentAttempts = await prisma.quizAttempt.findMany({
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
      where: { attemptedAt: { gte: startMonth } },
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

router.get(
  "/employees",
  query("page").optional().isInt({ min: 1 }),
  query("search").optional(),
  query("group").optional().isIn(["DRIVER", "WORKER", "ALL"]),
  query("status").optional().isIn(["all", "completed", "incomplete"]),
  async (req, res, next) => {
    try {
      const q = req.query ?? {};
      const page = Math.max(1, Number(q.page) || 1);
      const take = 20;
      const skip = (page - 1) * take;
      const search = (q.search as string | undefined)?.trim();
      const group = (q.group as string) || "ALL";
      const status = (q.status as string) || "all";

      const where: Prisma.UserWhereInput = {
        role: "EMPLOYEE",
      };
      if (search) {
        where.OR = [
          { name: { contains: search, mode: "insensitive" } },
          { employeeId: { contains: search, mode: "insensitive" } },
        ];
      }
      if (group !== "ALL") {
        where.group = group as "DRIVER" | "WORKER";
      }

      const users = await prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        include: {
          progress: { where: { isCompleted: true } },
          attempts: true,
        },
      });

      const coursesForGroup = async (g: "DRIVER" | "WORKER") => {
        const all = await prisma.course.findMany({
          where: { isActive: true },
        });
        return all.filter((c) => courseVisibleForUser(c.targetGroup, g));
      };

      const enriched = [];
      for (const u of users) {
        const assigned = await coursesForGroup(u.group);
        const done = u.progress.filter((p) =>
          assigned.some((c) => c.id === p.courseId)
        ).length;
        const avg =
          u.attempts.length > 0
            ? Math.round(
                u.attempts.reduce((a, b) => a + b.score, 0) /
                  u.attempts.length
              )
            : 0;
        const lastActive = await prisma.lessonProgress.findFirst({
          where: { userId: u.id },
          orderBy: { lastAccessedAt: "desc" },
        });
        const completedAll = assigned.length > 0 && done >= assigned.length;
        enriched.push({
          id: u.id,
          employeeId: u.employeeId,
          name: u.name,
          group: u.group,
          language: u.language,
          avatarColor: u.avatarColor,
          isActive: u.isActive,
          createdAt: u.createdAt,
          coursesDone: done,
          coursesTotal: assigned.length,
          avgScore: avg,
          lastActiveAt: lastActive?.lastAccessedAt ?? u.createdAt,
          status: completedAll ? "completed" : done > 0 ? "in_progress" : "not_started",
        });
      }

      let filtered = enriched;
      if (status === "completed") {
        filtered = enriched.filter((e) => e.status === "completed");
      } else if (status === "incomplete") {
        filtered = enriched.filter((e) => e.status !== "completed");
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
  body("employeeId").trim().notEmpty(),
  body("name").trim().notEmpty(),
  body("pin").isLength({ min: 4, max: 4 }),
  body("group").isIn(["DRIVER", "WORKER"]),
  body("language").optional().isIn(["AR", "FR", "EN"]),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { employeeId, name, pin, group, language } = req.body as {
        employeeId: string;
        name: string;
        pin: string;
        group: "DRIVER" | "WORKER";
        language?: "AR" | "FR" | "EN";
      };
      const colors = ["#6366F1", "#10B981", "#F59E0B", "#EC4899", "#14B8A6"];
      const avatarColor = colors[Math.floor(Math.random() * colors.length)]!;
      const hashed = await hashPin(pin);
      const user = await prisma.user.create({
        data: {
          employeeId: employeeId.trim(),
          name: name.trim(),
          pin: hashed,
          group,
          language: language ?? "AR",
          avatarColor,
          role: "EMPLOYEE",
        },
      });
      res.status(201).json({
        user: {
          id: user.id,
          employeeId: user.employeeId,
          name: user.name,
          group: user.group,
        },
      });
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
        badges: { include: { badge: true } },
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

router.get(
  "/employees/:id/certificate",
  param("id").notEmpty(),
  async (req, res, next) => {
    try {
      const uid = req.params!.id!;
      const user = await prisma.user.findUnique({
        where: { id: uid, role: "EMPLOYEE" },
      });
      if (!user) throw new AppError(404, "Employee not found");
      const assigned = await prisma.course.findMany({
        where: { isActive: true },
      });
      const visible = assigned.filter((c) =>
        courseVisibleForUser(c.targetGroup, user.group)
      );
      const titles: string[] = [];
      for (const c of visible) {
        const quiz = await prisma.quiz.findUnique({ where: { courseId: c.id } });
        if (!quiz) throw new AppError(400, "Not all courses have quizzes");
        const pass = await prisma.quizAttempt.findFirst({
          where: { userId: uid, quizId: quiz.id, passed: true },
        });
        if (!pass) throw new AppError(400, "Employee has not passed all assigned courses");
        const t = c.title as { ar?: string; en?: string };
        titles.push(t.en || t.ar || c.slug);
      }
      const ud = uploadDir();
      const pdfUrl = await generateTrainingCertificate({
        userId: uid,
        employeeName: user.name,
        courseTitles: titles,
        uploadDir: ud,
      });
      await prisma.certificate.create({
        data: { userId: uid, pdfUrl },
      });
      res.json({ url: pdfUrl });
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
      if (attempts.length === 0) continue;
      const raw =
        attempts.reduce((a, b) => a + b.score, 0) / attempts.length;
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
    });
    const cells: {
      userId: string;
      courseId: string;
      completionPct: number;
    }[] = [];
    for (const u of users) {
      for (const c of courses) {
        if (!courseVisibleForUser(c.targetGroup, u.group)) continue;
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

export default router;
