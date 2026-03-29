import { Router } from "express";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();
router.use(authMiddleware);

function courseVisibleForUser(
  targetGroup: ("DRIVER" | "WORKER")[],
  userGroup: "DRIVER" | "WORKER"
): boolean {
  if (targetGroup.length === 2) return true;
  return targetGroup.includes(userGroup);
}

router.get("/me", async (req, res, next) => {
  try {
    const { userId, role } = (req as AuthedRequest).user;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        badges: { include: { badge: true } },
        progress: { include: { course: true } },
        attempts: true,
        certificates: true,
      },
    });
    if (!user) throw new AppError(404, "Not found");
    if (role === "ADMIN") {
      res.json({
        user: {
          id: user.id,
          name: user.name,
          role: user.role,
          email: user.email,
        },
        progress: null,
      });
      return;
    }
    const assigned = await prisma.course.findMany({
      where: { isActive: true },
    });
    const visible = assigned.filter((c) =>
      courseVisibleForUser(c.targetGroup, user.group)
    );
    const completed = user.progress.filter(
      (p) => p.isCompleted && visible.some((c) => c.id === p.courseId)
    ).length;
    const overallPct =
      visible.length > 0 ? Math.round((completed / visible.length) * 100) : 0;
    const avgScore =
      user.attempts.length > 0
        ? Math.round(
            user.attempts.reduce((a, b) => a + b.score, 0) /
              user.attempts.length
          )
        : 0;
    res.json({
      user: {
        id: user.id,
        employeeId: user.employeeId,
        name: user.name,
        role: user.role,
        group: user.group,
        language: user.language,
        avatarColor: user.avatarColor,
        badges: user.badges,
        certificates: user.certificates,
      },
      progress: {
        overallCompletionPct: overallPct,
        coursesCompleted: completed,
        coursesTotal: visible.length,
        avgQuizScore: avgScore,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/badges", async (req, res, next) => {
  try {
    const { userId } = (req as AuthedRequest).user;
    const all = await prisma.badge.findMany({ orderBy: { key: "asc" } });
    const earned = await prisma.userBadge.findMany({
      where: { userId },
      select: { badgeId: true },
    });
    const earnedSet = new Set(earned.map((e) => e.badgeId));
    res.json({
      badges: all.map((b) => ({
        ...b,
        earned: earnedSet.has(b.id),
      })),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
