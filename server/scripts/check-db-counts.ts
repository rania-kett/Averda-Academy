import { prisma } from "../src/lib/prisma.js";

async function main() {
  const [users, employees, courses, activeCourses, quizzes, categories, quizAttempts, lessonProgress] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "EMPLOYEE" } }),
      prisma.course.count(),
      prisma.course.count({ where: { isActive: true } }),
      prisma.quiz.count(),
      prisma.category.count(),
      prisma.quizAttempt.count(),
      prisma.lessonProgress.count(),
    ]);

  console.log(
    JSON.stringify(
      {
        users,
        employees,
        courses,
        activeCourses,
        quizzes,
        categories,
        quizAttempts,
        lessonProgress,
      },
      null,
      2
    )
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
