import { prisma } from "../lib/prisma.js";
import { EPI_ITEMS, ROLE_EPI_CODES } from "../data/epiSeedData.js";

/** Upsert catalog + per-category EPI defaults without wiping employees or issuances. */
export async function upsertEpiCatalogAndDefaults(): Promise<void> {
  const usedCodes = new Set<string>();
  for (const codes of Object.values(ROLE_EPI_CODES)) {
    for (const code of codes) usedCodes.add(code);
  }

  let sortOrder = 0;
  for (const code of [...usedCodes].sort()) {
    const item = EPI_ITEMS[code];
    if (!item) continue;
    await prisma.epiItemCatalog.upsert({
      where: { code: item.code },
      create: {
        code: item.code,
        labelAr: item.labelAr,
        labelFr: item.labelFr,
        labelEn: item.labelEn,
        emoji: item.emoji,
        defaultLifetimeDays: item.lifespanDays,
        sortOrder: sortOrder++,
        active: true,
      },
      update: {
        labelAr: item.labelAr,
        labelFr: item.labelFr,
        labelEn: item.labelEn,
        emoji: item.emoji,
        defaultLifetimeDays: item.lifespanDays,
        sortOrder: sortOrder - 1,
        active: true,
      },
    });
  }

  const categories = await prisma.category.findMany({ select: { id: true, code: true } });
  const categoryIdByCode = new Map(categories.map((c) => [c.code, c.id]));

  for (const [catCode, codes] of Object.entries(ROLE_EPI_CODES)) {
    const categoryId = categoryIdByCode.get(catCode);
    if (!categoryId) continue;

    await prisma.epiCategoryDefaultItem.deleteMany({
      where: { categoryId, itemCode: { notIn: codes } },
    });

    let order = 0;
    for (const itemCode of codes) {
      const item = EPI_ITEMS[itemCode];
      if (!item) continue;
      await prisma.epiCategoryDefaultItem.upsert({
        where: { categoryId_itemCode: { categoryId, itemCode } },
        create: {
          categoryId,
          itemCode,
          required: true,
          lifetimeDaysOverride: item.lifespanDays,
          sortOrder: order,
        },
        update: {
          required: true,
          lifetimeDaysOverride: item.lifespanDays,
          sortOrder: order,
        },
      });
      order += 1;
    }
  }
}
