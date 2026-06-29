import { prisma } from "../src/lib/prisma.js";

const badges = await prisma.badge.findMany({ select: { id: true, key: true } });
console.log("badges", badges);
const ub = await prisma.userBadge.findMany({
  include: { badge: true, user: { select: { employeeId: true } } },
});
console.log("userBadges", ub.map((x) => ({ emp: x.user.employeeId, key: x.badge.key })));
await prisma.$disconnect();
