-- Remove HSSEQ foundation courses (company-policy, basic-guidelines) from catalog.

DELETE FROM "QuizAttempt"
WHERE "quizId" IN (
  SELECT q.id FROM "Quiz" q
  INNER JOIN "Course" c ON c.id = q."courseId"
  WHERE c.slug IN ('company-policy', 'basic-guidelines')
);

DELETE FROM "Quiz"
WHERE "courseId" IN (
  SELECT id FROM "Course" WHERE slug IN ('company-policy', 'basic-guidelines')
);

DELETE FROM "LessonQuizAttempt"
WHERE "courseId" IN (
  SELECT id FROM "Course" WHERE slug IN ('company-policy', 'basic-guidelines')
);

DELETE FROM "LessonProgress"
WHERE "courseId" IN (
  SELECT id FROM "Course" WHERE slug IN ('company-policy', 'basic-guidelines')
);

DELETE FROM "CourseCategory"
WHERE "courseId" IN (
  SELECT id FROM "Course" WHERE slug IN ('company-policy', 'basic-guidelines')
);

DELETE FROM "Course"
WHERE slug IN ('company-policy', 'basic-guidelines');

UPDATE "User" SET "hsseqCourseRequired" = false WHERE "hsseqCourseRequired" = true;
