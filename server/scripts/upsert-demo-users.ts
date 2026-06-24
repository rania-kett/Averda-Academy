/**
 * Safe user restore — upserts only, never deletes existing data.
 * Run: npx tsx scripts/upsert-demo-users.ts
 */
import { Lang, Role } from "@prisma/client";
import { prisma } from "../src/lib/prisma.js";
import { hashPassword, hashPin } from "../src/utils/hash.js";
import { upsertEpiCatalogAndDefaults } from "../src/services/epiCatalogSeed.js";

const ADMIN_EMAIL = "admin@averda.com";
const ADMIN_PASSWORD = "Admin@2026";
const EMPLOYEE_PIN = "1234";

const EMPLOYEES = [
  { employeeId: "AV000001", name: "يوسف العلوي", categoryCode: "driver", lang: Lang.AR },
  { employeeId: "AV000002", name: "كريم بنعلي", categoryCode: "loader", lang: Lang.AR },
  { employeeId: "AV000003", name: "أمين الراشدي", categoryCode: "maintenance", lang: Lang.AR },
  { employeeId: "AV000004", name: "سعيد المنصوري", categoryCode: "sweeper", lang: Lang.FR },
  { employeeId: "AV000005", name: "هشام التازي", categoryCode: "teamLeader", lang: Lang.AR },
] as const;

const EPI_SIZES: Record<string, { shirtSize: string; pantsSize: string; shoeSize: string; gloveSize: string; vestSize: string }> = {
  AV000001: { shirtSize: "L", pantsSize: "42", shoeSize: "42", gloveSize: "M", vestSize: "M" },
  AV000002: { shirtSize: "XL", pantsSize: "44", shoeSize: "43", gloveSize: "L", vestSize: "L" },
  AV000003: { shirtSize: "M", pantsSize: "40", shoeSize: "41", gloveSize: "M", vestSize: "M" },
  AV000004: { shirtSize: "L", pantsSize: "42", shoeSize: "42", gloveSize: "L", vestSize: "L" },
  AV000005: { shirtSize: "XL", pantsSize: "44", shoeSize: "44", gloveSize: "XL", vestSize: "XL" },
};

const AVATARS = ["#2563EB", "#10B981", "#F59E0B", "#8B5CF6", "#EF4444"] as const;

const CATEGORY_DEFS = [
  { code: "driver", idPrefix: "AV", name: { fr: "Chauffeur", en: "Driver", ar: "سائق" } },
  { code: "loader", idPrefix: "AV", name: { fr: "Chargeur", en: "Loader", ar: "عامل شحن" } },
  { code: "maintenance", idPrefix: "AV", name: { fr: "Agent de Maintenance", en: "Maintenance Agent", ar: "عون الصيانة" } },
  { code: "sweeper", idPrefix: "AV", name: { fr: "Balayeur", en: "Sweeper", ar: "عامل نظافة" } },
  { code: "teamLeader", idPrefix: "AV", name: { fr: "Chef d'équipe", en: "Team Leader", ar: "رئيس فريق" } },
] as const;

async function ensureCategories(): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  for (const c of CATEGORY_DEFS) {
    const row = await prisma.category.upsert({
      where: { code: c.code },
      create: { code: c.code, idPrefix: c.idPrefix, name: c.name as object },
      update: { idPrefix: c.idPrefix, name: c.name as object },
    });
    map.set(c.code, row.id);
  }
  return map;
}

async function main() {
  const adminPass = await hashPassword(ADMIN_PASSWORD);
  const pinHash = await hashPin(EMPLOYEE_PIN);

  const categoryByCode = await ensureCategories();

  // Remove stale .ma admin email if it blocks the unique email constraint
  const staleMa = await prisma.user.findFirst({
    where: { email: "admin@averda.ma", role: Role.ADMIN },
  });
  if (staleMa && staleMa.employeeId !== "ADM-000") {
    await prisma.user.update({
      where: { id: staleMa.id },
      data: { email: null },
    });
  }

  await prisma.user.upsert({
    where: { employeeId: "ADM-000" },
    create: {
      employeeId: "ADM-000",
      name: "Averda Admin",
      pin: await hashPin("0000"),
      email: ADMIN_EMAIL,
      passwordHash: adminPass,
      role: Role.ADMIN,
      avatarColor: "#6366F1",
      language: Lang.EN,
      isActive: true,
    },
    update: {
      name: "Averda Admin",
      email: ADMIN_EMAIL,
      passwordHash: adminPass,
      isActive: true,
      role: Role.ADMIN,
    },
  });

  for (let i = 0; i < EMPLOYEES.length; i++) {
    const e = EMPLOYEES[i]!;
    const categoryId = categoryByCode.get(e.categoryCode);
    if (!categoryId) {
      console.warn(`⚠️  Category "${e.categoryCode}" missing — skipping ${e.employeeId}.`);
      continue;
    }

    const user = await prisma.user.upsert({
      where: { employeeId: e.employeeId },
      create: {
        employeeId: e.employeeId,
        name: e.name,
        pin: pinHash,
        role: Role.EMPLOYEE,
        categoryId,
        avatarColor: AVATARS[i % AVATARS.length]!,
        language: e.lang,
        isActive: true,
        assessmentCompleted: false,
        hsseqCourseRequired: true,
      },
      update: {
        name: e.name,
        pin: pinHash,
        categoryId,
        isActive: true,
        role: Role.EMPLOYEE,
      },
    });

    const sizes = EPI_SIZES[e.employeeId];
    if (sizes) {
      await prisma.epiProfile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...sizes },
        update: sizes,
      });
    }
  }

  await upsertEpiCatalogAndDefaults();

  const count = await prisma.user.count({ where: { role: Role.EMPLOYEE } });
  console.log(`✅ Done — ${count} employees in DB (no data was deleted)`);
  console.log(`   Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`   Employees AV000001–AV000005 / PIN ${EMPLOYEE_PIN}`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
