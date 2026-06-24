import { prisma } from "../src/lib/prisma.js";

const profiles = await prisma.epiProfile.findMany({
  include: { user: { select: { employeeId: true } } },
});
for (const p of profiles) {
  console.log(p.user.employeeId, {
    shirt: p.shirtSize,
    shoe: p.shoeSize,
    glove: p.gloveSize,
    vest: p.vestSize,
  });
}
await prisma.$disconnect();
