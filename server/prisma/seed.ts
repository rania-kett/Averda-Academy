import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { EPI_ITEMS, ROLE_EPI_CODES } from "../src/data/epiSeedData.js";

const Role = { ADMIN: "ADMIN", EMPLOYEE: "EMPLOYEE" } as const;
const Lang = { AR: "AR", FR: "FR", EN: "EN" } as const;

const prisma = new PrismaClient();

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 12);
}

async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 12);
}

/** Tables wiped by seed (no ActivityLog/AuditLog in schema — activity feed is built from these). */
async function printWipeCounts(label: string): Promise<void> {
  const counts = {
    notification: await prisma.notification.count(),
    epiReceptionConfirmation: await prisma.epiReceptionConfirmation.count(),
    epiIssuance: await prisma.epiIssuance.count(),
    epiReplacementRequest: await prisma.epiReplacementRequest.count(),
    epiRenewalRequest: await prisma.epiRenewalRequest.count(),
    lessonProgress: await prisma.lessonProgress.count(),
    quizAttempt: await prisma.quizAttempt.count(),
    lessonQuizAttempt: await prisma.lessonQuizAttempt.count(),
    userBadge: await prisma.userBadge.count(),
    certificate: await prisma.certificate.count(),
    employees: await prisma.user.count({ where: { role: Role.EMPLOYEE } }),
  };
  console.log(`📊 ${label}:`, JSON.stringify(counts, null, 2));
}

/** Wipe employee-linked data in FK-safe order. Preserves admin, courses, lessons, quizzes, categories. */
async function wipeEmployeeData(): Promise<void> {
  // 1–7 EPI (children before parents)
  await prisma.epiReceptionConfirmation.deleteMany();
  await prisma.epiComplianceProof.deleteMany();
  await prisma.epiFeedback.deleteMany();
  await prisma.epiRenewalRequest.deleteMany();
  await prisma.epiReplacementRequest.deleteMany();
  await prisma.epiIssuance.deleteMany();
  await prisma.epiProfile.deleteMany();
  // 8–9 EPI catalog (recreated by seed)
  await prisma.epiCategoryDefaultItem.deleteMany();
  await prisma.epiItemCatalog.deleteMany();
  // 10–12 training progress
  await prisma.lessonQuizAttempt.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.lessonProgress.deleteMany();
  // 13–16 gamification / notifications
  await prisma.certificate.deleteMany();
  await prisma.userBadge.deleteMany();
  await prisma.notification.deleteMany();
  // 19 employees (admin preserved)
  await prisma.user.deleteMany({ where: { role: Role.EMPLOYEE } });
}

const CATEGORY_DEFS = [
  { code: "driver", idPrefix: "AV", name: { fr: "Chauffeur", en: "Driver", ar: "سائق" } },
  { code: "loader", idPrefix: "AV", name: { fr: "Chargeur", en: "Loader", ar: "عامل شحن" } },
  {
    code: "maintenance",
    idPrefix: "AV",
    name: { fr: "Agent de Maintenance", en: "Maintenance Agent", ar: "عون الصيانة" },
  },
  { code: "sweeper", idPrefix: "AV", name: { fr: "Balayeur", en: "Sweeper", ar: "عامل نظافة" } },
  {
    code: "teamLeader",
    idPrefix: "AV",
    name: { fr: "Chef d'équipe", en: "Team Leader", ar: "رئيس فريق" },
  },
] as const;

type EmployeeSeed = {
  employeeId: string;
  name: string;
  categoryCode: (typeof CATEGORY_DEFS)[number]["code"];
  lang: (typeof Lang)[keyof typeof Lang];
  shirtSize: string;
  pantsSize: string;
  shoeSize: string;
  gloveSize: string;
  vestSize: string;
};

const EMPLOYEES: EmployeeSeed[] = [
  {
    employeeId: "AV000001",
    name: "يوسف العلوي",
    categoryCode: "driver",
    lang: Lang.AR,
    shirtSize: "L",
    pantsSize: "42",
    shoeSize: "42",
    gloveSize: "M",
    vestSize: "M",
  },
  {
    employeeId: "AV000002",
    name: "كريم بنعلي",
    categoryCode: "loader",
    lang: Lang.AR,
    shirtSize: "XL",
    pantsSize: "44",
    shoeSize: "43",
    gloveSize: "L",
    vestSize: "L",
  },
  {
    employeeId: "AV000003",
    name: "أمين الراشدي",
    categoryCode: "maintenance",
    lang: Lang.AR,
    shirtSize: "M",
    pantsSize: "40",
    shoeSize: "41",
    gloveSize: "M",
    vestSize: "M",
  },
  {
    employeeId: "AV000004",
    name: "سعيد المنصوري",
    categoryCode: "sweeper",
    lang: Lang.FR,
    shirtSize: "L",
    pantsSize: "42",
    shoeSize: "42",
    gloveSize: "L",
    vestSize: "L",
  },
  {
    employeeId: "AV000005",
    name: "هشام التازي",
    categoryCode: "teamLeader",
    lang: Lang.AR,
    shirtSize: "XL",
    pantsSize: "44",
    shoeSize: "44",
    gloveSize: "XL",
    vestSize: "XL",
  },
];

async function ensureCategories(): Promise<Map<string, string>> {
  const categoryIdByCode = new Map<string, string>();
  for (const c of CATEGORY_DEFS) {
    const row = await prisma.category.upsert({
      where: { code: c.code },
      create: { code: c.code, idPrefix: c.idPrefix, name: c.name as object },
      update: { idPrefix: c.idPrefix, name: c.name as object },
    });
    categoryIdByCode.set(c.code, row.id);
  }
  return categoryIdByCode;
}

async function seedEpiCatalog(categoryIdByCode: Map<string, string>): Promise<void> {
  const usedCodes = new Set<string>();
  for (const codes of Object.values(ROLE_EPI_CODES)) {
    for (const code of codes) usedCodes.add(code);
  }

  let sortOrder = 0;
  for (const code of [...usedCodes].sort()) {
    const item = EPI_ITEMS[code];
    if (!item) continue;
    await prisma.epiItemCatalog.create({
      data: {
        code: item.code,
        labelAr: item.labelAr,
        labelFr: item.labelFr,
        labelEn: item.labelEn,
        emoji: item.emoji,
        defaultLifetimeDays: item.lifespanDays,
        sortOrder: sortOrder++,
        active: true,
      },
    });
  }

  for (const [catCode, codes] of Object.entries(ROLE_EPI_CODES)) {
    const categoryId = categoryIdByCode.get(catCode);
    if (!categoryId) continue;
    let order = 0;
    for (const itemCode of codes) {
      const item = EPI_ITEMS[itemCode];
      if (!item) continue;
      await prisma.epiCategoryDefaultItem.create({
        data: {
          categoryId,
          itemCode,
          required: true,
          lifetimeDaysOverride: item.lifespanDays,
          sortOrder: order++,
        },
      });
    }
  }
}

async function main() {
  console.log("ℹ️  schema.prisma: no ActivityLog or AuditLog model (admin activity is derived from quiz/EPI tables).");
  await printWipeCounts("BEFORE wipe");
  console.log("🧹 Wiping employee + EPI data (preserving admin, courses, categories)…");
  await wipeEmployeeData();
  await printWipeCounts("AFTER wipe");

  const adminPass = await hashPassword("Admin@2026");
  await prisma.user.upsert({
    where: { employeeId: "ADM-000" },
    create: {
      employeeId: "ADM-000",
      name: "Averda Admin",
      pin: await hashPin("0000"),
      email: "admin@averda.com",
      passwordHash: adminPass,
      role: Role.ADMIN,
      avatarColor: "#6366F1",
      language: Lang.EN,
    },
    update: {
      name: "Averda Admin",
      email: "admin@averda.com",
      passwordHash: adminPass,
    },
  });

  const pinHash = await hashPin("1234");
  const categoryIdByCode = await ensureCategories();
  await seedEpiCatalog(categoryIdByCode);

  const avatarPalette = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"] as const;

  for (let i = 0; i < EMPLOYEES.length; i++) {
    const e = EMPLOYEES[i]!;
    const categoryId = categoryIdByCode.get(e.categoryCode)!;

    const user = await prisma.user.create({
      data: {
        employeeId: e.employeeId,
        name: e.name,
        pin: pinHash,
        role: Role.EMPLOYEE,
        categoryId,
        avatarColor: avatarPalette[i % avatarPalette.length]!,
        language: e.lang,
        isActive: true,
        assessmentCompleted: false,
        assessmentScore: null,
        hsseqCourseRequired: true,
      },
    });

    await prisma.epiProfile.create({
      data: {
        userId: user.id,
        shirtSize: e.shirtSize,
        pantsSize: e.pantsSize,
        shoeSize: e.shoeSize,
        gloveSize: e.gloveSize,
        vestSize: e.vestSize,
      },
    });
  }

  await printWipeCounts("AFTER seed (final)");
  const courseCount = await prisma.course.count({ where: { isActive: true } });
  console.log("✅ Seed completed");
  console.log(`   activeCourses: ${courseCount} (queried from DB)`);
  console.log("   Employee PIN: 1234 | Admin: admin@averda.com / Admin@2026");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
