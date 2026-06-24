import { prisma } from "../src/lib/prisma.js";

async function main() {
  const cats = await prisma.category.findMany({
    include: { epiDefaultItems: { orderBy: { sortOrder: "asc" } } },
  });
  for (const c of cats) {
    console.log(
      c.code,
      "->",
      c.epiDefaultItems.map((d) => d.itemCode).join(", ") || "(none)"
    );
  }
  const catalog = await prisma.epiItemCatalog.count();
  const issuances = await prisma.epiIssuance.findMany({
    select: { userId: true, itemCode: true, user: { select: { employeeId: true, category: { select: { code: true } } } } },
  });
  const byEmp = new Map<string, string[]>();
  for (const i of issuances) {
    const key = `${i.user.employeeId} (${i.user.category?.code})`;
    const list = byEmp.get(key) ?? [];
    list.push(i.itemCode);
    byEmp.set(key, list);
  }
  console.log("\ncatalog items:", catalog);
  for (const [emp, codes] of byEmp) console.log(emp, "->", codes.join(", "));
  if (!byEmp.size) console.log("(no issuances)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
