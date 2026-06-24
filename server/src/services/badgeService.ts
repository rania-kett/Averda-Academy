import { prisma } from "../lib/prisma.js";
import type { QuizQuestionJson } from "./claudeQuiz.js";
import { NEW_BADGES, NEW_BADGE_KEYS, type NewBadgeKey } from "./badgeCatalog.js";
import { isLessonQuizCourse } from "../data/courseVisibility.js";
import { Prisma } from "@prisma/client";

/** Internal marker — hidden from employee notification feed; used for login-day streak tracking. */
export const ACTIVITY_NOTIFICATION_MARKER = "__activity__";

let ensured = false;
let epiSchemaReady: boolean | null = null;

function markEpiSchemaNotReady(reason: unknown) {
  if (epiSchemaReady === false) return;
  epiSchemaReady = false;
  const msg = reason instanceof Error ? reason.message : String(reason);
  console.warn("[badges] EPI schema not ready; skipping EPI badge checks.", msg);
}

function isEpiSchemaMissing(e: unknown): boolean {
  if (e instanceof Prisma.PrismaClientKnownRequestError) {
    // P2021: table missing. P2022: column missing.
    if (e.code === "P2021" || e.code === "P2022") return true;
  }
  const msg = String((e as any)?.message ?? "").toLowerCase();
  return msg.includes("does not exist") || msg.includes("unknown column") || msg.includes("no such table");
}

async function ensureBadgeCatalog(): Promise<void> {
  if (ensured) return;
  ensured = true;
  // Create/update canonical badge list (old badges may still exist in DB, but UI will only show these).
  await Promise.all(
    NEW_BADGES.map((b) =>
      prisma.badge.upsert({
        where: { key: b.key },
        create: {
          key: b.key,
          icon: b.icon,
          title: b.title as unknown as object,
          description: b.description as unknown as object,
        },
        update: {
          icon: b.icon,
          title: b.title as unknown as object,
          description: b.description as unknown as object,
        },
      })
    )
  );
}

async function grantBadge(
  userId: string,
  key: NewBadgeKey
): Promise<{ key: string; earned: boolean } | null> {
  await ensureBadgeCatalog();
  const badge = await prisma.badge.findUnique({ where: { key } });
  if (!badge) return null;

  const already = await prisma.userBadge.findFirst({
    where: { userId, badgeId: badge.id },
    select: { id: true },
  });
  if (already) return { key, earned: false };

  let inserted = false;
  try {
    const created = await prisma.userBadge.create({
      data: { userId, badgeId: badge.id },
    });
    inserted = Boolean(created.id);
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return { key, earned: false };
    }
    throw e;
  }
  if (!inserted) return { key, earned: false };

  // User notification (unread) so the employee is aware immediately.
  try {
    const def = NEW_BADGES.find((b) => b.key === key);
    const title = {
      ar: "🏅 شارة جديدة!",
      fr: "🏅 Nouveau badge !",
      en: "🏅 New badge!",
    };
    const message = def
      ? {
          ar: `تم فتح شارة: ${def.title.ar} — ${def.description.ar}`,
          fr: `Badge débloqué : ${def.title.fr} — ${def.description.fr}`,
          en: `Unlocked badge: ${def.title.en} — ${def.description.en}`,
        }
      : {
          ar: "تم فتح شارة جديدة.",
          fr: "Nouveau badge débloqué.",
          en: "New badge unlocked.",
        };
    await prisma.notification.create({
      data: {
        userId,
        title: title as unknown as object,
        message: message as unknown as object,
      },
    });

    // Challenge completion notification (when driven by this badge).
    if (key === NEW_BADGE_KEYS.safety_starter) {
      await prisma.notification.create({
        data: {
          userId,
          title: {
            ar: "🎯 تم إنجاز تحدٍ",
            fr: "🎯 Défi terminé",
            en: "🎯 Challenge completed",
          } as unknown as object,
          message: {
            ar: "أحسنت! لقد اجتزت اختبارًا واحدًا.",
            fr: "Bravo ! Vous avez réussi 1 quiz.",
            en: "Nice! You passed 1 quiz.",
          } as unknown as object,
        },
      });
    }
  } catch {
    /* non-blocking */
  }

  return { key, earned: true };
}

async function passedCourseIds(userId: string): Promise<Set<string>> {
  const [quizAttempts, lessonAttempts] = await Promise.all([
    prisma.quizAttempt.findMany({
      where: { userId, passed: true },
      select: { quiz: { select: { courseId: true } } },
    }),
    prisma.lessonQuizAttempt.findMany({
      where: { userId, percentage: { gte: 70 } },
      select: { courseId: true },
    }),
  ]);
  const set = new Set<string>();
  for (const a of quizAttempts) set.add(a.quiz.courseId);
  for (const a of lessonAttempts) set.add(a.courseId);
  return set;
}

function utcDay(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function longestConsecutiveDayStreak(sortedDays: string[]): number {
  if (!sortedDays.length) return 0;
  let max = 1;
  let cur = 1;
  for (let i = 1; i < sortedDays.length; i++) {
    const prev = new Date(`${sortedDays[i - 1]!}T00:00:00.000Z`);
    const day = new Date(`${sortedDays[i]!}T00:00:00.000Z`);
    const diffDays = Math.round((day.getTime() - prev.getTime()) / 86_400_000);
    cur = diffDays === 1 ? cur + 1 : 1;
    max = Math.max(max, cur);
  }
  return max;
}

/** Idempotent — records one activity day per user (login / app visit). No schema migration. */
export async function recordUserActivityDay(userId: string): Promise<void> {
  const today = utcDay(new Date());
  const existing = await prisma.notification.findFirst({
    where: {
      userId,
      title: { path: ["en"], equals: ACTIVITY_NOTIFICATION_MARKER },
      message: { path: ["en"], equals: today },
    },
  });
  if (existing) return;
  await prisma.notification.create({
    data: {
      userId,
      title: {
        ar: ACTIVITY_NOTIFICATION_MARKER,
        en: ACTIVITY_NOTIFICATION_MARKER,
        fr: ACTIVITY_NOTIFICATION_MARKER,
      } as object,
      message: { ar: today, en: today, fr: today } as object,
      isRead: true,
    },
  });
}

async function collectActivityDays(userId: string): Promise<string[]> {
  const dates = new Set<string>();
  const add = (d?: Date | null) => {
    if (d && !Number.isNaN(d.getTime())) dates.add(utcDay(d));
  };

  const [user, progress, quizzes, lessons, activityNotes, receptions] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { createdAt: true, assessmentTakenAt: true },
    }),
    prisma.lessonProgress.findMany({ where: { userId }, select: { lastAccessedAt: true } }),
    prisma.quizAttempt.findMany({ where: { userId }, select: { attemptedAt: true } }),
    prisma.lessonQuizAttempt.findMany({ where: { userId }, select: { takenAt: true } }),
    prisma.notification.findMany({
      where: { userId, title: { path: ["en"], equals: ACTIVITY_NOTIFICATION_MARKER } },
      select: { message: true },
    }),
    prisma.epiReceptionConfirmation.findMany({
      where: { issuance: { userId } },
      select: { confirmedAt: true },
      take: 100,
    }),
  ]);

  add(user?.createdAt);
  add(user?.assessmentTakenAt);
  for (const p of progress) add(p.lastAccessedAt);
  for (const q of quizzes) add(q.attemptedAt);
  for (const l of lessons) add(l.takenAt);
  for (const r of receptions) add(r.confirmedAt);
  for (const n of activityNotes) {
    const msg = n.message as { en?: string } | null;
    if (msg?.en) dates.add(msg.en);
  }

  return [...dates].sort();
}

async function checkActiveUser(userId: string, out: string[]) {
  const days = await collectActivityDays(userId);
  if (longestConsecutiveDayStreak(days) >= 5) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.active_user);
    if (g?.earned) out.push(NEW_BADGE_KEYS.active_user);
  }
}

async function runCoreBadgeChecks(userId: string, out: string[]) {
  await checkActiveUser(userId, out);
  await checkLearningBadges(userId, out);
  await checkEpiBadges(userId, out);
  await checkSafetyChampionAndTopPerformer(userId, out);
  await checkChallengeTrifecta(userId, out);
}

async function checkQuizMasterHistory(userId: string, out: string[]) {
  // Retroactive unlock: if the user EVER got 100% in any quiz, unlock.
  const [hasPerfectQuiz, hasPerfectLesson] = await Promise.all([
    prisma.quizAttempt.findFirst({ where: { userId, score: 100 }, select: { id: true } }),
    prisma.lessonQuizAttempt.findFirst({ where: { userId, percentage: 100 }, select: { id: true } }),
  ]);
  if (hasPerfectQuiz || hasPerfectLesson) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.quiz_master);
    if (g?.earned) out.push(NEW_BADGE_KEYS.quiz_master);
  }
}

async function checkLearningBadges(userId: string, out: string[]) {
  await checkQuizMasterHistory(userId, out);
  const passed = await passedCourseIds(userId);
  if (passed.size >= 1) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.safety_starter);
    if (g?.earned) out.push(NEW_BADGE_KEYS.safety_starter);
  }
  if (passed.size >= 5) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.consistent_learner);
    if (g?.earned) out.push(NEW_BADGE_KEYS.consistent_learner);
  }
}

async function epiRequiredCodesForUser(userId: string): Promise<string[]> {
  if (epiSchemaReady === false) return [];
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { categoryId: true } });
  const categoryId = user?.categoryId ?? null;
  if (!categoryId) return [];
  const db = prisma as any;
  try {
    const defaults = await db.epiCategoryDefaultItem.findMany({
      where: { categoryId, required: true },
      orderBy: [{ sortOrder: "asc" }, { itemCode: "asc" }],
    });
    epiSchemaReady = true;
    return (defaults ?? []).map((d: any) => String(d.itemCode));
  } catch (e: any) {
    if (isEpiSchemaMissing(e)) {
      markEpiSchemaNotReady(e);
      return [];
    }
    throw e;
  }
}

async function latestIssuanceByCode(userId: string): Promise<Map<string, { id: string; status: string; issuedAt: Date }>> {
  if (epiSchemaReady === false) return new Map();
  let rows: { id: string; itemCode: string; status: string; issuedAt: Date }[] = [];
  try {
    rows = await prisma.epiIssuance.findMany({
      where: { userId },
      orderBy: [{ issuedAt: "desc" }],
      select: { id: true, itemCode: true, status: true, issuedAt: true },
      take: 200,
    });
    epiSchemaReady = true;
  } catch (e) {
    if (isEpiSchemaMissing(e)) {
      markEpiSchemaNotReady(e);
      return new Map();
    }
    throw e;
  }
  const m = new Map<string, { id: string; status: string; issuedAt: Date }>();
  for (const r of rows) {
    if (!m.has(r.itemCode)) m.set(r.itemCode, { id: r.id, status: r.status, issuedAt: r.issuedAt });
  }
  return m;
}

async function checkEpiBadges(userId: string, out: string[]) {
  // Profile-driven badges must not depend on category defaults being set.
  // Otherwise, users can enter all sizes but never earn "Detail Oriented".
  const profile = await prisma.epiProfile.findUnique({ where: { userId } });

  const sizesOk = Boolean(profile?.shirtSize && profile?.shoeSize && profile?.gloveSize && profile?.vestSize);
  if (sizesOk) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.detail_oriented);
    if (g?.earned) out.push(NEW_BADGE_KEYS.detail_oriented);
  }

  const required = await epiRequiredCodesForUser(userId);
  if (!required.length) return;

  const byCode = await latestIssuanceByCode(userId);

  const missing = required.filter((code) => !byCode.has(code));
  if (missing.length === 0) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.safety_compliant);
    if (g?.earned) out.push(NEW_BADGE_KEYS.safety_compliant);
  }

  const allReceived = required.every((code) => (byCode.get(code)?.status ?? "") === "received");
  if (allReceived) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.fully_equipped);
    if (g?.earned) out.push(NEW_BADGE_KEYS.fully_equipped);
  }

  // Fit confirmations: require latest reception notes include FIT_OK.
  const fitOkAll = await (async () => {
    for (const code of required) {
      const iss = byCode.get(code);
      if (!iss) return false;
      const latest = await prisma.epiReceptionConfirmation.findFirst({
        where: { issuanceId: iss.id },
        orderBy: { confirmedAt: "desc" },
        select: { notes: true },
      });
      if (!String(latest?.notes ?? "").includes("FIT_OK")) return false;
    }
    return true;
  })();
  if (fitOkAll) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.perfect_fit);
    if (g?.earned) out.push(NEW_BADGE_KEYS.perfect_fit);
  }
}

async function checkQuickResponder(userId: string, issuanceId: string, out: string[]) {
  const issuance = await prisma.epiIssuance.findUnique({ where: { id: issuanceId }, select: { issuedAt: true } });
  if (!issuance) return;
  const latest = await prisma.epiReceptionConfirmation.findFirst({
    where: { issuanceId },
    orderBy: { confirmedAt: "desc" },
    select: { confirmedAt: true },
  });
  if (!latest) return;
  const deltaMs = new Date(latest.confirmedAt).getTime() - new Date(issuance.issuedAt).getTime();
  if (deltaMs >= 0 && deltaMs <= 24 * 60 * 60 * 1000) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.quick_responder);
    if (g?.earned) out.push(NEW_BADGE_KEYS.quick_responder);
  }
}

async function checkSafetyChampionAndTopPerformer(userId: string, out: string[]) {
  // Safety Champion: EPI compliance 100% (no missing + all received) AND all quizzes passed.
  const required = await epiRequiredCodesForUser(userId);
  const byCode = await latestIssuanceByCode(userId);
  const noMissing = required.length > 0 && required.every((c) => byCode.has(c));
  const allReceived = required.length > 0 && required.every((c) => (byCode.get(c)?.status ?? "") === "received");
  const epi100 = noMissing && allReceived;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { categoryId: true } });
  const categoryId = user?.categoryId ?? null;
  if (!categoryId) return;
  const courses = await prisma.course.findMany({
    where: { isActive: true, categories: { some: { categoryId } } },
    include: { quiz: true, categories: true },
  });
  const needsQuiz = courses.filter((c) => Boolean(c.quiz) || isLessonQuizCourse(c.slug, c.title, c.pdfUrl));

  const passed = await passedCourseIds(userId);
  const allQuizzesPassed = needsQuiz.every((c) => passed.has(c.id));

  if (epi100 && allQuizzesPassed) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.safety_champion);
    if (g?.earned) out.push(NEW_BADGE_KEYS.safety_champion);
  }

  // Top Performer: all other badges unlocked.
  const allKeys = NEW_BADGES.map((b) => b.key).filter((k) => k !== NEW_BADGE_KEYS.top_performer);
  const earned = await prisma.userBadge.findMany({
    where: { userId, badge: { key: { in: allKeys } } },
    select: { badge: { select: { key: true } } },
  });
  const earnedSet = new Set(earned.map((e) => e.badge.key));
  if (allKeys.every((k) => earnedSet.has(k))) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.top_performer);
    if (g?.earned) out.push(NEW_BADGE_KEYS.top_performer);
  }
}

async function checkChallengeTrifecta(userId: string, out: string[]) {
  // Challenges are derived from existing canonical badge signals.
  // Unlock a special badge when the employee completes 3+ missions.
  const earned = await prisma.userBadge.findMany({
    where: { userId, badge: { key: { in: Object.values(NEW_BADGE_KEYS) as any } } },
    select: { badge: { select: { key: true } } },
  });
  const has = new Set(earned.map((e) => e.badge.key));

  const done = (keys: Array<string>) => keys.every((k) => has.has(k));
  const doneCount = [
    // 1. Onboarding Completion Sprint
    done([NEW_BADGE_KEYS.active_user, NEW_BADGE_KEYS.consistent_learner, NEW_BADGE_KEYS.safety_compliant]),
    // 2. Field Readiness Preparation
    done([NEW_BADGE_KEYS.fully_equipped, NEW_BADGE_KEYS.safety_compliant]),
    // 3. Equipment Verification Cycle
    done([NEW_BADGE_KEYS.fully_equipped, NEW_BADGE_KEYS.safety_compliant]),
    // 4. PPE Adaptation & Validation Loop
    done([NEW_BADGE_KEYS.perfect_fit, NEW_BADGE_KEYS.safety_compliant]),
    // 5. Structured Learning Path Completion
    done([NEW_BADGE_KEYS.consistent_learner, NEW_BADGE_KEYS.quiz_master]),
    // 6. Competency Validation Assessment
    done([NEW_BADGE_KEYS.quiz_master]),
    // 7. Operational Discipline Cycle
    done([NEW_BADGE_KEYS.active_user, NEW_BADGE_KEYS.quick_responder]),
    // 8. Responsiveness Under SLA
    done([NEW_BADGE_KEYS.quick_responder, NEW_BADGE_KEYS.safety_compliant]),
    // 9. End-to-End Compliance Closure
    done([NEW_BADGE_KEYS.safety_champion, NEW_BADGE_KEYS.safety_compliant, NEW_BADGE_KEYS.fully_equipped, NEW_BADGE_KEYS.quiz_master]),
  ].filter(Boolean).length;

  if (doneCount >= 3) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.challenge_trifecta);
    if (g?.earned) out.push(NEW_BADGE_KEYS.challenge_trifecta);
  }
}

export async function evaluateBadgesAfterLessonComplete(params: {
  userId: string;
  courseId: string;
  timeSpentSecs: number;
  completionPct: number;
}): Promise<string[]> {
  const { userId } = params;
  const out: string[] = [];
  await runCoreBadgeChecks(userId, out);
  return out;
}

export async function evaluateAllBadgesForUser(userId: string): Promise<string[]> {
  await recordUserActivityDay(userId);
  return evaluateBadgesAfterLessonComplete({
    userId,
    courseId: "",
    timeSpentSecs: 0,
    completionPct: 0,
  });
}

export async function evaluateBadgesAfterQuizAttempt(params: {
  userId: string;
  quizId: string;
  courseId: string;
  score: number;
  passed: boolean;
}): Promise<string[]> {
  const { userId, score } = params;
  const out: string[] = [];
  if (score === 100) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.quiz_master);
    if (g?.earned) out.push(NEW_BADGE_KEYS.quiz_master);
  }
  await runCoreBadgeChecks(userId, out);
  return out;
}

export async function evaluateBadgesAfterLessonQuizAttempt(params: {
  userId: string;
  courseId: string;
  percentage: number;
}): Promise<string[]> {
  const { userId, percentage } = params;
  const out: string[] = [];
  if (percentage === 100) {
    const g = await grantBadge(userId, NEW_BADGE_KEYS.quiz_master);
    if (g?.earned) out.push(NEW_BADGE_KEYS.quiz_master);
  }
  await runCoreBadgeChecks(userId, out);
  return out;
}

export async function evaluateBadgesAfterEpiProfileUpdate(userId: string): Promise<string[]> {
  const out: string[] = [];
  await runCoreBadgeChecks(userId, out);
  return out;
}

export async function evaluateBadgesAfterEpiReceptionConfirm(params: {
  userId: string;
  issuanceId: string;
}): Promise<string[]> {
  const { userId, issuanceId } = params;
  const out: string[] = [];
  await checkQuickResponder(userId, issuanceId, out);
  await runCoreBadgeChecks(userId, out);
  return out;
}

export function parseQuizQuestions(raw: unknown): QuizQuestionJson[] {
  if (!Array.isArray(raw)) return [];
  return raw as QuizQuestionJson[];
}
