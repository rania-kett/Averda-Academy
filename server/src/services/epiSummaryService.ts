import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
// import { ensureEpiSeedForEmployee } from "./epiCanonicalSeed.js";

const epiDb = prisma as any;

export type EpiSummaryPayload = {
  profileComplete: boolean;
  profile: {
    shirtSize: string | null;
    shoeSize: string | null;
    gloveSize: string | null;
    vestSize: string | null;
    pantsSize: string | null;
    notes?: string | null;
    updatedAt?: Date;
  } | null;
  catalog: {
    code: string;
    labelAr: string;
    labelFr: string;
    labelEn: string;
    emoji: string | null;
    defaultLifetimeDays: number | null;
    sortOrder: number;
    active: boolean;
  }[];
  categoryDefaults: {
    categoryId: string;
    itemCode: string;
    required: boolean;
    lifetimeDaysOverride: number | null;
    sortOrder: number;
  }[];
  passport: {
    id: string;
    itemCode: string;
    item: {
      code: string;
      labelAr: string;
      labelFr: string;
      labelEn: string;
      emoji: string | null;
      defaultLifetimeDays: number | null;
      sortOrder: number;
      active: boolean;
    } | null;
    size: string | null;
    status: string;
    issuedAt: Date;
    nextReplacementAt: Date | null;
    lastReceptionAt: Date | null;
  }[];
};

function isMissingTable(e: unknown): boolean {
  return e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2021";
}

const EMPTY_SUMMARY: EpiSummaryPayload = {
  profileComplete: false,
  profile: null,
  passport: [],
  catalog: [],
  categoryDefaults: [],
};

/** Same payload as GET /api/epi/summary — used by employee routes and admin dashboard. */
export async function getEpiSummaryForUserId(userId: string): Promise<EpiSummaryPayload> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, employeeId: true, categoryId: true },
    });
    // DISABLED: auto-seed removed, admin issues EPI manually
    // if (user?.employeeId) {
    //   try {
    //     await ensureEpiSeedForEmployee(user.id, user.employeeId);
    //   } catch {
    //     /* seed optional if tables missing */
    //   }
    // }
    const categoryId = user?.categoryId ?? null;

    const [profile, issuances, catalog, defaults] = await Promise.all([
      prisma.epiProfile.findUnique({ where: { userId } }),
      prisma.epiIssuance.findMany({
        where: { userId },
        orderBy: { issuedAt: "desc" },
        take: 50,
        include: { receptions: { orderBy: { confirmedAt: "desc" }, take: 1 } },
      }),
      epiDb.epiItemCatalog.findMany({
        where: { active: true },
        orderBy: [{ sortOrder: "asc" }, { code: "asc" }],
      }),
      categoryId
        ? epiDb.epiCategoryDefaultItem.findMany({
            where: { categoryId },
            orderBy: [{ sortOrder: "asc" }, { itemCode: "asc" }],
          })
        : Promise.resolve([]),
    ]);

    const profileComplete = Boolean(profile?.shoeSize || profile?.gloveSize || profile?.vestSize);
    const catByCode = new Map<string, { code: string; labelAr: string; labelFr: string; labelEn: string; emoji: string | null; defaultLifetimeDays: number | null; sortOrder: number; active: boolean }>(
      (catalog ?? []).map((x: { code: string; labelAr: string; labelFr: string; labelEn: string; emoji: string | null; defaultLifetimeDays: number | null; sortOrder: number; active: boolean }) => [x.code, x])
    );

    return {
      profileComplete,
      profile: profile
        ? {
            shirtSize: profile.shirtSize,
            shoeSize: profile.shoeSize,
            gloveSize: profile.gloveSize,
            vestSize: profile.vestSize,
            pantsSize: profile.pantsSize,
            notes: profile.notes,
            updatedAt: profile.updatedAt,
          }
        : null,
      catalog: (catalog ?? []).map((x: { code: string; labelAr: string; labelFr: string; labelEn: string; emoji: string | null; defaultLifetimeDays: number | null; sortOrder: number; active: boolean }) => ({
        code: x.code,
        labelAr: x.labelAr,
        labelFr: x.labelFr,
        labelEn: x.labelEn,
        emoji: x.emoji ?? null,
        defaultLifetimeDays: x.defaultLifetimeDays ?? null,
        sortOrder: x.sortOrder,
        active: x.active,
      })),
      categoryDefaults: (defaults ?? []).map((d: { categoryId: string; itemCode: string; required: boolean; lifetimeDaysOverride: number | null; sortOrder: number }) => ({
        categoryId: d.categoryId,
        itemCode: d.itemCode,
        required: Boolean(d.required),
        lifetimeDaysOverride: d.lifetimeDaysOverride ?? null,
        sortOrder: d.sortOrder ?? 0,
      })),
      passport: issuances.map((x) => {
        const code = x.itemCode ?? (x as { itemType?: string }).itemType ?? "";
        const it = catByCode.get(code);
        return {
          id: x.id,
          itemCode: code,
          item: it
            ? {
                code: it.code,
                labelAr: it.labelAr,
                labelFr: it.labelFr,
                labelEn: it.labelEn,
                emoji: it.emoji ?? null,
                defaultLifetimeDays: it.defaultLifetimeDays ?? null,
                sortOrder: it.sortOrder ?? 0,
                active: Boolean(it.active),
              }
            : null,
          size: x.size,
          status: x.status,
          issuedAt: x.issuedAt,
          nextReplacementAt: x.nextReplacementAt,
          lastReceptionAt: x.receptions?.[0]?.confirmedAt ?? null,
          photoProofPath: (x as any).photoProofPath ?? null,
        };
      }),
    };
  } catch (e) {
    if (isMissingTable(e)) return { ...EMPTY_SUMMARY };
    throw e;
  }
}

/** Employee-specific EPI rows — catalog alone does not mean the employee has equipment assigned. */
export function epiSummaryHasPassport(summary: EpiSummaryPayload): boolean {
  return (summary.passport?.length ?? 0) > 0;
}
