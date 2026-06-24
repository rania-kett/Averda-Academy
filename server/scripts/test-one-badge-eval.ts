import { prisma } from "../src/lib/prisma.js";
import { evaluateAllBadgesForUser } from "../src/services/badgeService.js";

const user = await prisma.user.findUnique({ where: { employeeId: "AV000001" } });
if (!user) throw new Error("not found");
const earned = await evaluateAllBadgesForUser(user.id);
console.log("newlyEarned", earned);
const rows = await prisma.userBadge.findMany({
  where: { userId: user.id },
  include: { badge: true },
});
console.log("all", rows.map((r) => r.badge.key));
await prisma.$disconnect();
