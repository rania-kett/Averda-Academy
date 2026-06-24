/**
 * Restore EPI catalog + per-category defaults (no wipe).
 * Run: npx tsx scripts/upsert-epi-catalog.ts
 */
import { prisma } from "../src/lib/prisma.js";
import { upsertEpiCatalogAndDefaults } from "../src/services/epiCatalogSeed.js";
import { ROLE_EPI_CODES } from "../src/data/epiSeedData.js";

async function main() {
  await upsertEpiCatalogAndDefaults();
  const catalogCount = await prisma.epiItemCatalog.count({ where: { active: true } });
  const defaultsCount = await prisma.epiCategoryDefaultItem.count();
  console.log("Per-category defaults:");
  const cats = await prisma.category.findMany({
    include: { epiDefaultItems: { orderBy: { sortOrder: "asc" } } },
  });
  for (const c of cats) {
    const expected = ROLE_EPI_CODES[c.code];
    if (!expected?.length) continue;
    const codes = c.epiDefaultItems.map((d) => d.itemCode).join(", ");
    console.log(`  ${c.code}: ${codes}`);
  }
  console.log(`\n✅ EPI catalog restored — ${catalogCount} items, ${defaultsCount} category defaults`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
