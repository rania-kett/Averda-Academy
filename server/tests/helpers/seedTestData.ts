import bcrypt from "bcrypt";
import { PrismaClient, Role, Lang } from "@prisma/client";

const prisma = new PrismaClient();

const TEST_PREFIX = "TEST-";

async function hashPin(pin: string): Promise<string> {
  return bcrypt.hash(pin, 10);
}

async function hashPassword(pw: string): Promise<string> {
  return bcrypt.hash(pw, 10);
}

export async function seedMinimalTestData(): Promise<{
  adminId: string;
  employeeIds: Record<string, string>;
  courseIds: string[];
}> {
  const categories = await prisma.category.findMany();
  const byCode = new Map(categories.map((c) => [c.code, c.id]));

  const admin = await prisma.user.upsert({
    where: { employeeId: `${TEST_PREFIX}ADM-001` },
    create: {
      employeeId: `${TEST_PREFIX}ADM-001`,
      name: "Test Admin",
      pin: await hashPin("0000"),
      email: "test-admin@averda.test",
      passwordHash: await hashPassword("TestAdmin@2026"),
      role: Role.ADMIN,
      avatarColor: "#6366F1",
      language: Lang.EN,
    },
    update: {
      email: "test-admin@averda.test",
      passwordHash: await hashPassword("TestAdmin@2026"),
    },
  });

  const employeeIds: Record<string, string> = {};
  const roleCodes = ["driver", "sweeper", "loader", "teamLeader", "parkAgent", "maintenance"] as const;

  for (let i = 0; i < roleCodes.length; i++) {
    const code = roleCodes[i]!;
    const categoryId = byCode.get(code);
    if (!categoryId) continue;
    const employeeId = `${TEST_PREFIX}EMP-${String(i + 1).padStart(3, "0")}`;
    const user = await prisma.user.upsert({
      where: { employeeId },
      create: {
        employeeId,
        name: `Test ${code}`,
        pin: await hashPin("1234"),
        role: Role.EMPLOYEE,
        categoryId,
        avatarColor: "#2563EB",
        language: Lang.AR,
      },
      update: { categoryId },
    });
    employeeIds[code] = user.id;
  }

  const courseIds: string[] = [];
  const courseDefs = [
    { slug: `${TEST_PREFIX}driver-course`, code: "driver" },
    { slug: `${TEST_PREFIX}sweeper-course`, code: "sweeper" },
    { slug: `${TEST_PREFIX}loader-course`, code: "loader" },
  ];

  for (const def of courseDefs) {
    const categoryId = byCode.get(def.code);
    if (!categoryId) continue;
    const course = await prisma.course.upsert({
      where: { slug: def.slug },
      create: {
        slug: def.slug,
        title: { ar: `دورة ${def.code}`, fr: `Cours ${def.code}`, en: `${def.code} course` },
        description: { ar: "وصف", fr: "Desc", en: "Desc" },
        icon: "📘",
        coverColor: "#2563EB",
        pdfUrl: "/uploads/placeholder.pdf",
        pdfPageCount: 10,
        isActive: true,
        order: 900,
        categories: { create: [{ categoryId }] },
      },
      update: { isActive: true },
    });
    courseIds.push(course.id);
  }

  return { adminId: admin.id, employeeIds, courseIds };
}

export async function cleanTestData(): Promise<void> {
  const testUsers = await prisma.user.findMany({
    where: { employeeId: { startsWith: TEST_PREFIX } },
    select: { id: true },
  });
  const ids = testUsers.map((u) => u.id);
  if (ids.length) {
    await prisma.notification.deleteMany({ where: { userId: { in: ids } } });
    await prisma.lessonProgress.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }
  await prisma.course.deleteMany({ where: { slug: { startsWith: TEST_PREFIX } } });
}

export async function disconnectTestPrisma(): Promise<void> {
  await prisma.$disconnect();
}
