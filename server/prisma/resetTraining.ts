import { prisma } from "../src/lib/prisma.js";

async function main() {
  const employees = await prisma.user.findMany({
    where: { role: "EMPLOYEE" },
    select: { id: true, employeeId: true },
  });

  const employeeIds = employees.map((e) => e.id);
  if (employeeIds.length === 0) {
    console.log("[resetTraining] No employees found. Nothing to reset.");
    return;
  }

  console.log(`[resetTraining] Resetting training state for ${employeeIds.length} employees...`);

  await prisma.$transaction([
    prisma.lessonProgress.deleteMany({ where: { userId: { in: employeeIds } } }),
    prisma.quizAttempt.deleteMany({ where: { userId: { in: employeeIds } } }),
    prisma.lessonQuizAttempt.deleteMany({ where: { userId: { in: employeeIds } } }),
    prisma.userBadge.deleteMany({ where: { userId: { in: employeeIds } } }),
    prisma.certificate.deleteMany({ where: { userId: { in: employeeIds } } }),
    prisma.notification.deleteMany({ where: { userId: { in: employeeIds } } }),
    prisma.user.updateMany({
      where: { id: { in: employeeIds } },
      data: {
        assessmentCompleted: false,
        assessmentScore: null,
        assessmentTakenAt: null,
        hsseqCourseRequired: true,
      },
    }),
  ]);

  console.log("[resetTraining] Done.");
}

main()
  .catch((e) => {
    console.error("[resetTraining] Failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

