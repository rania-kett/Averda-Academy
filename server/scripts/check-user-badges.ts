import { prisma } from "../src/lib/prisma.js";

for (const empId of ["AV000001", "AV000002"]) {
  const user = await prisma.user.findUnique({
    where: { employeeId: empId },
    include: { badges: { include: { badge: true } } },
  });
  console.log(
    empId,
    user?.badges.map((b) => ({ key: b.badge.key, badgeId: b.badgeId, ubId: b.id }))
  );
}
await prisma.$disconnect();
