-- AlterTable
ALTER TABLE "User" ADD COLUMN     "assessmentCompleted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "assessmentScore" INTEGER,
ADD COLUMN     "assessmentTakenAt" TIMESTAMP(3),
ADD COLUMN     "hsseqCourseRequired" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Course" ADD COLUMN     "isHsseqFoundation" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Course" SET "isHsseqFoundation" = true WHERE slug = 'company-policy';
