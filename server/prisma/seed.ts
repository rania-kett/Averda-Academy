import { PrismaClient, Role, UserGroup, Lang } from "@prisma/client";
import bcrypt from "bcrypt";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}
async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(10 + (days % 7), 30, 0, 0);
  return d;
}

const dummyQuiz = () => {
  const mk = (
    id: number,
    diff: "easy" | "medium" | "hard",
    ar: string,
    fr: string,
    en: string
  ) => ({
    id,
    difficulty: diff,
    question: { ar, fr, en },
    options: {
      A: { ar: "خيار أ", fr: "Option A", en: "Option A" },
      B: { ar: "خيار ب", fr: "Option B", en: "Option B" },
      C: { ar: "خيار ج", fr: "Option C", en: "Option C" },
      D: { ar: "خيار د", fr: "Option D", en: "Option D" },
    },
    correct: "A" as const,
    explanation: {
      ar: "الإجابة الصحيحة وفق المادة التدريبية.",
      fr: "Réponse correcte selon le support.",
      en: "Correct answer per the training material.",
    },
  });
  return [
    mk(1, "easy", "سؤال 1؟", "Question 1 ?", "Question 1?"),
    mk(2, "easy", "سؤال 2؟", "Question 2 ?", "Question 2?"),
    mk(3, "easy", "سؤال 3؟", "Question 3 ?", "Question 3?"),
    mk(4, "easy", "سؤال 4؟", "Question 4 ?", "Question 4?"),
    mk(5, "medium", "سؤال 5؟", "Question 5 ?", "Question 5?"),
    mk(6, "medium", "سؤال 6؟", "Question 6 ?", "Question 6?"),
    mk(7, "medium", "سؤال 7؟", "Question 7 ?", "Question 7?"),
    mk(8, "medium", "سؤال 8؟", "Question 8 ?", "Question 8?"),
    mk(9, "hard", "سؤال 9؟", "Question 9 ?", "Question 9?"),
    mk(10, "hard", "سؤال 10؟", "Question 10 ?", "Question 10?"),
  ];
};

/** Driver-assigned course slugs (matches seed order) */
const DRIVER_SLUGS = [
  "first-aid",
  "fleet-safety",
  "formation-collecte",
  "fire-safety",
  "company-policy",
  "emergency-procedures",
] as const;

const WORKER_SLUGS = [
  "first-aid",
  "formation-collecte",
  "fire-safety",
  "ppe-usage",
  "company-policy",
  "emergency-procedures",
] as const;

async function main() {
  await prisma.quizAttempt.deleteMany();
  await prisma.lessonProgress.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.certificate.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.course.deleteMany();
  await prisma.user.deleteMany({ where: { role: "EMPLOYEE" } });

  const uploadRoot = path.join(__dirname, "..", "uploads");
  if (!fs.existsSync(uploadRoot)) fs.mkdirSync(uploadRoot, { recursive: true });
  const placeholderPdf = path.join(uploadRoot, "placeholder.pdf");
  if (!fs.existsSync(placeholderPdf)) {
    const minimal = Buffer.from(
      "%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF",
      "utf-8"
    );
    fs.writeFileSync(placeholderPdf, minimal);
  }
  const pdfRel = "/uploads/placeholder.pdf";

  const adminPass = await hashPassword("Admin@2026");
  await prisma.user.upsert({
    where: { employeeId: "ADM-000" },
    create: {
      employeeId: "ADM-000",
      name: "Averda Admin",
      pin: await hashPin("0000"),
      email: "admin@averda.ma",
      passwordHash: adminPass,
      role: Role.ADMIN,
      group: UserGroup.DRIVER,
      avatarColor: "#6366F1",
      language: Lang.EN,
    },
    update: {
      name: "Averda Admin",
      email: "admin@averda.ma",
      passwordHash: adminPass,
    },
  });

  const pinHash = await hashPin("1234");

  const driverDefs: {
    eid: string;
    name: string;
    lang: Lang;
    pcts: readonly number[];
  }[] = [
    { eid: "AVR-DRV-001", name: "يوسف العلوي", lang: Lang.AR, pcts: [100, 100, 100, 100, 100, 40] },
    { eid: "AVR-DRV-002", name: "كريم الإدريسي", lang: Lang.FR, pcts: [60, 60, 60, 60, 60, 60] },
    { eid: "AVR-DRV-003", name: "أحد بنعلي", lang: Lang.AR, pcts: [100, 100, 100, 100, 100, 100] },
    { eid: "AVR-DRV-004", name: "سارة المرابط", lang: Lang.EN, pcts: [100, 80, 0, 0, 0, 0] },
    { eid: "AVR-DRV-005", name: "فاطمة الزهراء", lang: Lang.AR, pcts: [60, 0, 0, 0, 0, 0] },
  ];

  const workerDefs: {
    eid: string;
    name: string;
    lang: Lang;
    pcts: readonly number[] | null;
  }[] = [
    { eid: "AVR-WRK-001", name: "محمد الحسني", lang: Lang.AR, pcts: [100, 100, 100, 100, 40, 40] },
    { eid: "AVR-WRK-002", name: "نور الدين العمراني", lang: Lang.FR, pcts: [100, 100, 100, 100, 100, 100] },
    { eid: "AVR-WRK-003", name: "إيمان بوعزة", lang: Lang.AR, pcts: [50, 50, 50, 50, 50, 50] },
    { eid: "AVR-WRK-004", name: "رشيد الطاهري", lang: Lang.EN, pcts: [20, 20, 20, 20, 20, 20] },
    { eid: "AVR-WRK-005", name: "لمياء الشرقاوي", lang: Lang.AR, pcts: null },
  ];

  const userIdByEid = new Map<string, string>();

  for (const d of driverDefs) {
    const u = await prisma.user.create({
      data: {
        employeeId: d.eid,
        name: d.name,
        pin: pinHash,
        role: Role.EMPLOYEE,
        group: UserGroup.DRIVER,
        avatarColor: "#10B981",
        language: d.lang,
      },
    });
    userIdByEid.set(d.eid, u.id);
  }
  for (const w of workerDefs) {
    const u = await prisma.user.create({
      data: {
        employeeId: w.eid,
        name: w.name,
        pin: pinHash,
        role: Role.EMPLOYEE,
        group: UserGroup.WORKER,
        avatarColor: "#F59E0B",
        language: w.lang,
      },
    });
    userIdByEid.set(w.eid, u.id);
  }

  const courseDefs = [
    {
      slug: "first-aid",
      order: 1,
      icon: "⛑️",
      cover: "from-red-500 to-rose-600",
      target: [UserGroup.DRIVER, UserGroup.WORKER] as UserGroup[],
      title: {
        ar: "الإسعافات الأولية",
        fr: "Premiers secours",
        en: "First Aid",
      },
      desc: {
        ar: "مبادئ الإسعافات الأولية في مواقع العمل.",
        fr: "Principes de premiers secours sur le terrain.",
        en: "First aid principles in the field.",
      },
    },
    {
      slug: "fleet-safety",
      order: 2,
      icon: "🚛",
      cover: "from-indigo-500 to-violet-600",
      target: [UserGroup.DRIVER] as UserGroup[],
      title: {
        ar: "سلامة الأسطول",
        fr: "Sécurité de la flotte",
        en: "Fleet Safety",
      },
      desc: {
        ar: "قيادة آمنة وصيانة المركبات.",
        fr: "Conduite sûre et maintenance des véhicules.",
        en: "Safe driving and vehicle maintenance.",
      },
    },
    {
      slug: "formation-collecte",
      order: 3,
      icon: "♻️",
      cover: "from-emerald-500 to-teal-600",
      target: [UserGroup.DRIVER, UserGroup.WORKER] as UserGroup[],
      title: {
        ar: "تكوين الجمع",
        fr: "Formation collecte",
        en: "Collection Training",
      },
      desc: {
        ar: "إجراءات الجمع والفرز.",
        fr: "Procédures de collecte et de tri.",
        en: "Collection and sorting procedures.",
      },
    },
    {
      slug: "fire-safety",
      order: 4,
      icon: "🔥",
      cover: "from-orange-500 to-red-600",
      target: [UserGroup.DRIVER, UserGroup.WORKER] as UserGroup[],
      title: {
        ar: "السلامة من الحريق",
        fr: "Sécurité incendie",
        en: "Fire Safety",
      },
      desc: {
        ar: "استخدام الطفايات والإخلاء.",
        fr: "Extincteurs et évacuation.",
        en: "Extinguishers and evacuation.",
      },
    },
    {
      slug: "ppe-usage",
      order: 5,
      icon: "⛑️",
      cover: "from-amber-500 to-yellow-600",
      target: [UserGroup.WORKER] as UserGroup[],
      title: {
        ar: "معدات الحماية الشخصية",
        fr: "Équipements de protection",
        en: "PPE Usage",
      },
      desc: {
        ar: "ارتداء وصيانة معدات الحماية.",
        fr: "Port et entretien des EPI.",
        en: "Wearing and maintaining PPE.",
      },
    },
    {
      slug: "company-policy",
      order: 6,
      icon: "🏢",
      cover: "from-slate-600 to-slate-800",
      target: [UserGroup.DRIVER, UserGroup.WORKER] as UserGroup[],
      title: {
        ar: "سياسة الشركة",
        fr: "Politique de l'entreprise",
        en: "Company Policy",
      },
      desc: {
        ar: "القواعد والالتزامات.",
        fr: "Règles et engagements.",
        en: "Rules and commitments.",
      },
    },
    {
      slug: "emergency-procedures",
      order: 7,
      icon: "🚨",
      cover: "from-rose-500 to-pink-600",
      target: [UserGroup.DRIVER, UserGroup.WORKER] as UserGroup[],
      title: {
        ar: "الإجراءات الطارئة",
        fr: "Procédures d'urgence",
        en: "Emergency Procedures",
      },
      desc: {
        ar: "التصرف في الحوادث والطوارئ.",
        fr: "Réaction face aux incidents.",
        en: "Responding to incidents.",
      },
    },
  ];

  const courseBySlug = new Map<string, { id: string }>();

  for (const c of courseDefs) {
    const course = await prisma.course.create({
      data: {
        slug: c.slug,
        title: c.title,
        description: c.desc,
        icon: c.icon,
        coverColor: c.cover,
        pdfUrl: pdfRel,
        pdfPageCount: 10,
        targetGroup: c.target,
        order: c.order,
        extractedText:
          "مادة تدريبية باللغة العربية. تعليمات السلامة والوقاية في مواقع العمل.",
      },
    });
    courseBySlug.set(c.slug, { id: course.id });
    await prisma.quiz.create({
      data: {
        courseId: course.id,
        questions: dummyQuiz() as object,
      },
    });
  }

  const badgeDefs = [
    {
      key: "first_step",
      icon: "🎯",
      title: { ar: "الخطوة الأولى", fr: "Premier pas", en: "First Step" },
      description: {
        ar: "أكمل أول درس.",
        fr: "Première leçon terminée.",
        en: "Completed your first lesson.",
      },
    },
    {
      key: "quiz_starter",
      icon: "📝",
      title: { ar: "بداية الاختبارات", fr: "Début des quiz", en: "Quiz Starter" },
      description: {
        ar: "قدّم أول اختبار.",
        fr: "Premier quiz soumis.",
        en: "Submitted your first quiz.",
      },
    },
  ];

  for (const b of badgeDefs) {
    await prisma.badge.upsert({
      where: { key: b.key },
      create: {
        key: b.key,
        title: b.title,
        description: b.description,
        icon: b.icon,
      },
      update: { title: b.title, description: b.description, icon: b.icon },
    });
  }

  async function upsertProgress(
    userId: string,
    courseId: string,
    completionPct: number,
    completedAt: Date | null
  ) {
    const isCompleted = completionPct >= 100;
    const pagesRead = Math.min(10, Math.round((completionPct / 100) * 10));
    await prisma.lessonProgress.create({
      data: {
        userId,
        courseId,
        pagesRead,
        totalPages: 10,
        completionPct,
        isCompleted,
        completedAt: isCompleted ? completedAt : null,
        lastAccessedAt: completedAt ?? daysAgo(3),
        timeSpentSecs: 200 + Math.round(completionPct * 3),
      },
    });
  }

  /** Completions this week: exactly AVR-DRV-003 — six courses finished in last 7 days */
  const drv3Id = userIdByEid.get("AVR-DRV-003")!;
  for (let i = 0; i < DRIVER_SLUGS.length; i++) {
    const slug = DRIVER_SLUGS[i]!;
    const cid = courseBySlug.get(slug)!.id;
    await upsertProgress(drv3Id, cid, 100, daysAgo(6 - i));
  }

  /** Other drivers — completed lessons dated outside this week */
  const oldComplete = daysAgo(45);

  for (const d of driverDefs) {
    if (d.eid === "AVR-DRV-003") continue;
    const uid = userIdByEid.get(d.eid)!;
    for (let i = 0; i < DRIVER_SLUGS.length; i++) {
      const slug = DRIVER_SLUGS[i]!;
      const pct = d.pcts[i] ?? 0;
      const cid = courseBySlug.get(slug)!.id;
      const done = pct >= 100;
      await upsertProgress(uid, cid, pct, done ? oldComplete : null);
    }
  }

  for (const w of workerDefs) {
    if (w.pcts == null) continue;
    const uid = userIdByEid.get(w.eid)!;
    for (let i = 0; i < WORKER_SLUGS.length; i++) {
      const slug = WORKER_SLUGS[i]!;
      const pct = w.pcts[i] ?? 0;
      const cid = courseBySlug.get(slug)!.id;
      const done = pct >= 100;
      await upsertProgress(uid, cid, pct, done ? oldComplete : null);
    }
  }

  const quizId = async (slug: string) => {
    const c = await prisma.course.findUnique({
      where: { slug },
      include: { quiz: true },
    });
    return c?.quiz?.id;
  };

  const qFirst = await quizId("first-aid");
  const qFleet = await quizId("fleet-safety");
  const qCollect = await quizId("formation-collecte");
  const qFire = await quizId("fire-safety");
  const qCompany = await quizId("company-policy");

  type Att = {
    eid: string;
    quizId: string;
    score: number;
    passed: boolean;
    daysAgo: number;
  };

  const answers = { "1": "A" };

  const attempts: Att[] = [];

  const add = (a: Att) => attempts.push(a);

  if (qFirst && qFleet && qCollect && qFire) {
    const u1 = "AVR-DRV-001";
    add({ eid: u1, quizId: qFirst, score: 86, passed: true, daysAgo: 2 });
    add({ eid: u1, quizId: qFleet, score: 90, passed: true, daysAgo: 5 });
    add({ eid: u1, quizId: qCollect, score: 86, passed: true, daysAgo: 12 });
    add({ eid: u1, quizId: qFire, score: 88, passed: true, daysAgo: 20 });

    const u2 = "AVR-DRV-002";
    add({ eid: u2, quizId: qFirst, score: 72, passed: true, daysAgo: 1 });
    add({ eid: u2, quizId: qFleet, score: 72, passed: true, daysAgo: 8 });
    add({ eid: u2, quizId: qCollect, score: 72, passed: true, daysAgo: 15 });
    add({ eid: u2, quizId: qFire, score: 72, passed: true, daysAgo: 22 });

    const u3 = "AVR-DRV-003";
    add({ eid: u3, quizId: qFirst, score: 95, passed: true, daysAgo: 3 });
    add({ eid: u3, quizId: qFleet, score: 95, passed: true, daysAgo: 9 });
    add({ eid: u3, quizId: qCollect, score: 95, passed: true, daysAgo: 18 });
    add({ eid: u3, quizId: qFire, score: 95, passed: true, daysAgo: 25 });

    const u4 = "AVR-DRV-004";
    add({ eid: u4, quizId: qFirst, score: 50, passed: false, daysAgo: 28 });
    add({ eid: u4, quizId: qFirst, score: 55, passed: false, daysAgo: 24 });
    add({ eid: u4, quizId: qFirst, score: 90, passed: true, daysAgo: 18 });
  }

  if (qFirst && qCollect && qFire && qCompany) {
    const w1 = "AVR-WRK-001";
    add({ eid: w1, quizId: qFirst, score: 78, passed: true, daysAgo: 4 });
    add({ eid: w1, quizId: qCollect, score: 78, passed: true, daysAgo: 11 });
    add({ eid: w1, quizId: qFire, score: 78, passed: true, daysAgo: 17 });
    add({ eid: w1, quizId: qCompany, score: 78, passed: true, daysAgo: 26 });

    const w2 = "AVR-WRK-002";
    add({ eid: w2, quizId: qFirst, score: 91, passed: true, daysAgo: 6 });
    add({ eid: w2, quizId: qCollect, score: 91, passed: true, daysAgo: 14 });
    add({ eid: w2, quizId: qFire, score: 91, passed: true, daysAgo: 21 });

    const w3 = "AVR-WRK-003";
    add({ eid: w3, quizId: qFirst, score: 70, passed: true, daysAgo: 7 });
    add({ eid: w3, quizId: qCollect, score: 70, passed: true, daysAgo: 16 });
    add({ eid: w3, quizId: qFire, score: 70, passed: true, daysAgo: 23 });

    const w4 = "AVR-WRK-004";
    add({ eid: w4, quizId: qFirst, score: 48, passed: false, daysAgo: 27 });
    add({ eid: w4, quizId: qFirst, score: 52, passed: false, daysAgo: 21 });
    add({ eid: w4, quizId: qFirst, score: 80, passed: true, daysAgo: 14 });
  }

  for (const a of attempts) {
    const uid = userIdByEid.get(a.eid);
    if (!uid) continue;
    const at = daysAgo(a.daysAgo);
    await prisma.quizAttempt.create({
      data: {
        userId: uid,
        quizId: a.quizId,
        score: a.score,
        answers: answers as object,
        passed: a.passed,
        timeSpent: 100 + (a.score % 40) * 2,
        attemptedAt: at,
      },
    });
  }

  const b1 = await prisma.badge.findUnique({ where: { key: "quiz_starter" } });
  const uid001 = userIdByEid.get("AVR-DRV-001");
  if (b1 && uid001) {
    await prisma.userBadge.create({
      data: { userId: uid001, badgeId: b1.id },
    });
  }

  const allScores = attempts.map((x) => x.score);
  const avg = allScores.reduce((s, x) => s + x, 0) / allScores.length;
  console.log(
    `Seed completed. Demo checks — attempts: ${allScores.length}, avg score: ${avg.toFixed(2)} (dashboard rounds to ${Math.round(avg)})`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
