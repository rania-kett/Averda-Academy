import { prisma } from "../lib/prisma.js";
import type { QuizQuestionJson } from "./claudeQuiz.js";

const BADGE_KEYS = {
  first_step: "first_step",
  quiz_starter: "quiz_starter",
  perfect_score: "perfect_score",
  safety_expert: "safety_expert",
  fleet_master: "fleet_master",
  team_player: "team_player",
  speed_reader: "speed_reader",
  comeback_kid: "comeback_kid",
  top_scorer: "top_scorer",
} as const;

async function grantBadge(
  userId: string,
  key: string
): Promise<{ key: string; earned: boolean } | null> {
  const badge = await prisma.badge.findUnique({ where: { key } });
  if (!badge) return null;
  const existing = await prisma.userBadge.findUnique({
    where: { userId_badgeId: { userId, badgeId: badge.id } },
  });
  if (existing) return { key, earned: false };
  await prisma.userBadge.create({
    data: { userId, badgeId: badge.id },
  });
  return { key, earned: true };
}

function passed(score: number): boolean {
  return score >= 70;
}

export async function evaluateBadgesAfterLessonComplete(params: {
  userId: string;
  courseId: string;
  timeSpentSecs: number;
  completionPct: number;
}): Promise<string[]> {
  const { userId, courseId, timeSpentSecs, completionPct } = params;
  const newBadges: string[] = [];

  if (completionPct >= 100) {
    const completedCount = await prisma.lessonProgress.count({
      where: { userId, isCompleted: true },
    });
    if (completedCount === 1) {
      const g = await grantBadge(userId, BADGE_KEYS.first_step);
      if (g?.earned) newBadges.push(BADGE_KEYS.first_step);
    }
  }

  if (completionPct >= 100 && timeSpentSecs > 0 && timeSpentSecs < 10 * 60) {
    const g = await grantBadge(userId, BADGE_KEYS.speed_reader);
    if (g?.earned) newBadges.push(BADGE_KEYS.speed_reader);
  }

  await checkSafetyExpert(userId, newBadges);
  await checkFleetMaster(userId, newBadges);
  await checkTeamPlayer(userId, newBadges);

  return newBadges;
}

async function courseSlugPassed(userId: string, slug: string): Promise<boolean> {
  const course = await prisma.course.findUnique({
    where: { slug },
    include: { quiz: true },
  });
  if (!course?.quiz) return false;
  const best = await prisma.quizAttempt.findFirst({
    where: { userId, quizId: course.quiz.id, passed: true },
  });
  return !!best;
}

async function checkSafetyExpert(userId: string, out: string[]): Promise<void> {
  const slugs = ["first-aid", "fleet-safety", "fire-safety"];
  for (const s of slugs) {
    if (!(await courseSlugPassed(userId, s))) return;
  }
  const g = await grantBadge(userId, BADGE_KEYS.safety_expert);
  if (g?.earned) out.push(BADGE_KEYS.safety_expert);
}

async function checkFleetMaster(userId: string, out: string[]): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user || user.group !== "DRIVER") return;
  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      targetGroup: { has: "DRIVER" },
    },
    include: { quiz: true },
  });
  for (const c of courses) {
    if (!c.quiz) return;
    const ok = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: c.quiz.id, passed: true },
    });
    if (!ok) return;
  }
  const g = await grantBadge(userId, BADGE_KEYS.fleet_master);
  if (g?.earned) out.push(BADGE_KEYS.fleet_master);
}

async function checkTeamPlayer(userId: string, out: string[]): Promise<void> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;
  const courses = await prisma.course.findMany({
    where: {
      isActive: true,
      OR: [
        { targetGroup: { has: user.group } },
        {
          AND: [
            { targetGroup: { has: "DRIVER" } },
            { targetGroup: { has: "WORKER" } },
          ],
        },
      ],
    },
    include: { quiz: true },
  });
  for (const c of courses) {
    if (!c.quiz) return;
    const ok = await prisma.quizAttempt.findFirst({
      where: { userId, quizId: c.quiz.id, passed: true },
    });
    if (!ok) return;
  }
  if (courses.length === 0) return;
  const g = await grantBadge(userId, BADGE_KEYS.team_player);
  if (g?.earned) out.push(BADGE_KEYS.team_player);
}

export async function evaluateBadgesAfterQuizAttempt(params: {
  userId: string;
  quizId: string;
  courseId: string;
  score: number;
  passed: boolean;
}): Promise<string[]> {
  const { userId, quizId, courseId, score, passed: didPass } = params;
  const newBadges: string[] = [];

  const attempts = await prisma.quizAttempt.count({ where: { userId } });
  if (attempts === 1) {
    const g = await grantBadge(userId, BADGE_KEYS.quiz_starter);
    if (g?.earned) newBadges.push(BADGE_KEYS.quiz_starter);
  }

  if (score === 100) {
    const g = await grantBadge(userId, BADGE_KEYS.perfect_score);
    if (g?.earned) newBadges.push(BADGE_KEYS.perfect_score);
  }

  if (didPass) {
    const failsBeforeThis = await prisma.quizAttempt.count({
      where: { userId, quizId, passed: false },
    });
    if (failsBeforeThis > 0) {
      const g = await grantBadge(userId, BADGE_KEYS.comeback_kid);
      if (g?.earned) newBadges.push(BADGE_KEYS.comeback_kid);
    }
  }

  await checkSafetyExpert(userId, newBadges);
  await checkFleetMaster(userId, newBadges);
  await checkTeamPlayer(userId, newBadges);

  await checkTopScorerMonthly(userId, newBadges);

  return newBadges;
}

export async function checkTopScorerMonthly(
  userId: string,
  newBadges: string[]
): Promise<void> {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const attempts = await prisma.quizAttempt.findMany({
    where: { attemptedAt: { gte: start } },
  });
  if (attempts.length === 0) return;
  const bestByUser = new Map<string, number>();
  for (const a of attempts) {
    const cur = bestByUser.get(a.userId) ?? 0;
    if (a.score > cur) bestByUser.set(a.userId, a.score);
  }
  const maxScore = Math.max(0, ...bestByUser.values());
  if (maxScore <= 0) return;
  const winners = [...bestByUser.entries()]
    .filter(([, s]) => s === maxScore)
    .map(([id]) => id);
  if (!winners.includes(userId)) return;
  const g = await grantBadge(userId, BADGE_KEYS.top_scorer);
  if (g?.earned) newBadges.push(BADGE_KEYS.top_scorer);
}

export function parseQuizQuestions(raw: unknown): QuizQuestionJson[] {
  if (!Array.isArray(raw)) return [];
  return raw as QuizQuestionJson[];
}
