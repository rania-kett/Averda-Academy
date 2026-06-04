-- AlterTable
ALTER TABLE "QuizAttempt" ADD COLUMN     "attemptNumber" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "QuizAttempt" ADD COLUMN     "wrongQuestionIds" JSONB;
ALTER TABLE "QuizAttempt" ADD COLUMN     "questionIds" JSONB;

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_quizId_attemptedAt_idx" ON "QuizAttempt"("userId", "quizId", "attemptedAt");

