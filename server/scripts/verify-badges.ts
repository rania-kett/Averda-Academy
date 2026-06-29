/**
 * Idempotent badge/challenge re-evaluation for all employees (no data wipe).
 * Run: npx tsx scripts/verify-badges.ts
 */
import { prisma } from "../src/lib/prisma.js";
import { NEW_BADGE_KEYS } from "../src/services/badgeCatalog.js";
import { evaluateAllBadgesForUser } from "../src/services/badgeService.js";

async function main() {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE", isActive: true },
    select: { id: true, employeeId: true, name: true },
    orderBy: { employeeId: "asc" },
  });

  console.log(`Re-evaluating badges for ${employees.length} employees…\n`);

  for (const e of employees) {
    const newlyEarned = await evaluateAllBadgesForUser(e.id);
    const earned = await prisma.userBadge.findMany({
      where: { userId: e.id, badge: { key: { in: Object.values(NEW_BADGE_KEYS) } } },
      include: { badge: { select: { key: true, icon: true } } },
      orderBy: { earnedAt: "asc" },
    });
    const keys = earned.map((ub) => ub.badge.key);
    const flag = newlyEarned.length ? ` (+${newlyEarned.join(", ")})` : "";
    console.log(`${e.employeeId} ${e.name}: ${keys.length} badges [${keys.join(", ")}]${flag}`);
  }

  console.log("\n✅ Badge evaluation complete — no rows were deleted.");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
