-- CreateTable
CREATE TABLE "LessonQuizAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "percentage" INTEGER NOT NULL,
    "answers" JSONB NOT NULL,
    "attemptNumber" INTEGER NOT NULL,
    "takenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LessonQuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LessonQuizAttempt_userId_courseId_idx" ON "LessonQuizAttempt"("userId", "courseId");

-- CreateIndex
CREATE INDEX "LessonQuizAttempt_courseId_takenAt_idx" ON "LessonQuizAttempt"("courseId", "takenAt");

-- AddForeignKey
ALTER TABLE "LessonQuizAttempt" ADD CONSTRAINT "LessonQuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LessonQuizAttempt" ADD CONSTRAINT "LessonQuizAttempt_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
