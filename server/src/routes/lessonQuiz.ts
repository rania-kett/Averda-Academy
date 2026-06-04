import { Router } from "express";
import { body, param, validationResult } from "express-validator";
import { prisma } from "../lib/prisma.js";
import type { AuthedRequest } from "../middleware/auth.js";
import { authMiddleware } from "../middleware/auth.js";
import { AppError } from "../middleware/errorHandler.js";
import {
  isRoadTrafficSafetyCourse,
  isSweepingSafetyCourse,
  isSweepingAgainstTrafficCourse,
  isBasicsGuidanceCourse,
  isTrafficLawCourse,
  isFootrestReportingCourse,
  isReverseDrivingCourse,
  isSweepingEquipmentOrderCourse,
  isSafeRideBehindCompactorCourse,
  isCollectionSafetyCourse,
  isLoadingLiftingCourse,
  isHandInjuryAvoidanceCourse,
  isTrafficCollisionWhileSweepingCourse,
  isBadWeatherSweepingCourse,
  isStaySafeOnRoadsCourse,
  isSeriousSweepingAccidentsAwarenessCourse,
  isDrivingPrecautionsCourse,
  isCollectionBehaviorCourse,
  isDriverPreWorkInstructionsCourse,
  isLongSittingDrivingRecoCourse,
  isDangerousDrivingHabitsCourse,
  isBodyPreservationCourse,
  isRoundaboutSweepingCourse,
  isCollectionTrafficAccidentsCourse,
  isCollectionInstructions2Course,
  isCompactionContainersCourse,
  isDistractionDevicesCourse,
} from "../data/courseVisibility.js";
import {
  getRoadSafetyQuestionsForClient,
  scoreRoadSafetyAnswers,
} from "../data/roadSafetyLessonQuiz.js";
import {
  getTrafficLawQuestionsForClient,
  scoreTrafficLawAnswers,
} from "../data/trafficLawLessonQuiz.js";
import {
  getSweepingQuestionsForClient,
  scoreSweepingAnswers,
} from "../data/sweepingLessonQuiz.js";
import {
  getSweepingAgainstTrafficQuestionsForClient,
  scoreSweepingAgainstTrafficAnswers,
} from "../data/sweepingAgainstTrafficLessonQuiz.js";
import {
  getReverseDrivingQuestionsForClient,
  scoreReverseDrivingAnswers,
} from "../data/reverseDrivingLessonQuiz.js";
import {
  getSweepingEquipmentOrderQuestionsForClient,
  scoreSweepingEquipmentOrderAnswers,
} from "../data/sweepingEquipmentOrderLessonQuiz.js";
import {
  getSafeRideBehindCompactorQuestionsForClient,
  scoreSafeRideBehindCompactorAnswers,
} from "../data/safeRideBehindCompactorLessonQuiz.js";
import {
  getCollectionSafetyQuestionsForClient,
  scoreCollectionSafetyAnswers,
} from "../data/collectionSafetyLessonQuiz.js";
import {
  getLoadingLiftingQuestionsForClient,
  scoreLoadingLiftingAnswers,
} from "../data/loadingLiftingLessonQuiz.js";
import {
  getHandInjuryQuestionsForClient,
  scoreHandInjuryAnswers,
} from "../data/handInjuryLessonQuiz.js";
import {
  getTrafficCollisionWhileSweepingQuestionsForClient,
  scoreTrafficCollisionWhileSweepingAnswers,
} from "../data/trafficCollisionWhileSweepingLessonQuiz.js";
import {
  getBadWeatherSweepingQuestionsForClient,
  scoreBadWeatherSweepingAnswers,
} from "../data/badWeatherSweepingLessonQuiz.js";
import {
  getStaySafeOnRoadsQuestionsForClient,
  scoreStaySafeOnRoadsAnswers,
} from "../data/staySafeOnRoadsLessonQuiz.js";
import {
  getSeriousSweepingAccidentsAwarenessQuestionsForClient,
  scoreSeriousSweepingAccidentsAwarenessAnswers,
} from "../data/seriousSweepingAccidentsAwarenessLessonQuiz.js";
import {
  getDrivingPrecautionsQuestionsForClient,
  scoreDrivingPrecautionsAnswers,
} from "../data/drivingPrecautionsLessonQuiz.js";
import {
  getCollectionBehaviorQuestionsForClient,
  scoreCollectionBehaviorAnswers,
} from "../data/collectionBehaviorLessonQuiz.js";
import {
  getCollectionTrafficAccidentsQuestionsForClient,
  scoreCollectionTrafficAccidentsAnswers,
} from "../data/collectionTrafficAccidentsLessonQuiz.js";
import {
  getCollectionInstructions2QuestionsForClient,
  scoreCollectionInstructions2Answers,
} from "../data/collectionInstructions2LessonQuiz.js";
import {
  getCompactionContainersQuestionsForClient,
  scoreCompactionContainersAnswers,
} from "../data/compactionContainersLessonQuiz.js";
import {
  getDistractionDevicesQuestionsForClient,
  scoreDistractionDevicesAnswers,
} from "../data/distractionDevicesLessonQuiz.js";
import {
  getDriverPreWorkInstructionsQuestionsForClient,
  scoreDriverPreWorkInstructionsAnswers,
} from "../data/driverPreWorkInstructionsLessonQuiz.js";
import {
  getLongSittingDrivingRecoQuestionsForClient,
  scoreLongSittingDrivingRecoAnswers,
} from "../data/longSittingDrivingRecommendationsLessonQuiz.js";
import {
  getDangerousDrivingHabitsQuestionsForClient,
  scoreDangerousDrivingHabitsAnswers,
} from "../data/dangerousDrivingHabitsLessonQuiz.js";
import {
  getBodyPreservationQuestionsForClient,
  scoreBodyPreservationAnswers,
} from "../data/bodyPreservationLessonQuiz.js";
import {
  getRoundaboutSweepingQuestionsForClient,
  scoreRoundaboutSweepingAnswers,
} from "../data/roundaboutSweepingLessonQuiz.js";
import {
  getFootrestReportingQuestionsForClient,
  scoreFootrestReportingAnswers,
} from "../data/footrestReportingLessonQuiz.js";
import { ASSESSMENT_QUESTIONS, scoreAssessment } from "../data/assessmentQuestions.js";
import { evaluateBadgesAfterLessonQuizAttempt } from "../services/badgeService.js";

const router = Router();
router.use(authMiddleware);

function assertAssessmentPassed(user: {
  assessmentCompleted: boolean;
  assessmentScore: number | null;
}): void {
  if (!user.assessmentCompleted || (user.assessmentScore ?? 0) < 70) {
    throw new AppError(403, "ASSESSMENT_REQUIRED");
  }
}

async function assertCourseAccess(
  userId: string,
  categoryId: string | null,
  courseId: string
): Promise<{ id: string; slug: string; title: unknown; pdfUrl: string }> {
  if (!categoryId) throw new AppError(400, "User category not set");
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { categories: true },
  });
  if (!course?.isActive) throw new AppError(404, "Course not found");
  if (!course.categories.some((cc) => cc.categoryId === categoryId)) {
    throw new AppError(403, "Forbidden");
  }
  return { id: course.id, slug: course.slug, title: course.title, pdfUrl: course.pdfUrl };
}

router.get(
  "/:courseId/questions",
  param("courseId").notEmpty(),
  async (req, res, next) => {
    try {
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, "User not found");
      assertAssessmentPassed(user);
      const courseIdParam = req.params?.courseId;
      if (!courseIdParam) {
        throw new AppError(400, "Missing course id");
      }
      const { slug, title, pdfUrl } = await assertCourseAccess(userId, user.categoryId, courseIdParam);
      if (isBasicsGuidanceCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: ASSESSMENT_QUESTIONS.map((q) => ({
            id: q.id,
            type: q.type === "tf" ? "tf" : "single",
            emoji: q.emoji,
            text: q.text,
            options: q.options,
            correct: [q.correct],
            explanation: q.explanation,
          })),
        });
        return;
      }
      if (isRoadTrafficSafetyCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getRoadSafetyQuestionsForClient(),
        });
        return;
      }
      // Traffic law course shares the same canonical road-safety lesson quiz dataset.
      if (isTrafficLawCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getTrafficLawQuestionsForClient(),
        });
        return;
      }
      if (isFootrestReportingCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getFootrestReportingQuestionsForClient(),
        });
        return;
      }
      if (isSweepingSafetyCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "sweeping",
          questions: getSweepingQuestionsForClient(),
        });
        return;
      }
      if (isSweepingAgainstTrafficCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "sweeping",
          questions: getSweepingAgainstTrafficQuestionsForClient(),
        });
        return;
      }
      if (isReverseDrivingCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getReverseDrivingQuestionsForClient(),
        });
        return;
      }
      if (isSweepingEquipmentOrderCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "sweeping",
          questions: getSweepingEquipmentOrderQuestionsForClient(),
        });
        return;
      }
      if (isSafeRideBehindCompactorCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "sweeping",
          questions: getSafeRideBehindCompactorQuestionsForClient(),
        });
        return;
      }
      if (isCollectionSafetyCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getCollectionSafetyQuestionsForClient(),
        });
        return;
      }
      if (isLoadingLiftingCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getLoadingLiftingQuestionsForClient(),
        });
        return;
      }
      if (isHandInjuryAvoidanceCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getHandInjuryQuestionsForClient(),
        });
        return;
      }
      if (isTrafficCollisionWhileSweepingCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getTrafficCollisionWhileSweepingQuestionsForClient(),
        });
        return;
      }
      if (isBadWeatherSweepingCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getBadWeatherSweepingQuestionsForClient(),
        });
        return;
      }
      if (isStaySafeOnRoadsCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getStaySafeOnRoadsQuestionsForClient(),
        });
        return;
      }
      if (isSeriousSweepingAccidentsAwarenessCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getSeriousSweepingAccidentsAwarenessQuestionsForClient(),
        });
        return;
      }
      if (isDrivingPrecautionsCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getDrivingPrecautionsQuestionsForClient(),
        });
        return;
      }
      if (isCollectionBehaviorCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getCollectionBehaviorQuestionsForClient(),
        });
        return;
      }
      if (isCollectionTrafficAccidentsCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getCollectionTrafficAccidentsQuestionsForClient(),
        });
        return;
      }
      if (isCollectionInstructions2Course(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getCollectionInstructions2QuestionsForClient(),
        });
        return;
      }
      if (isCompactionContainersCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getCompactionContainersQuestionsForClient(),
        });
        return;
      }
      if (isDistractionDevicesCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getDistractionDevicesQuestionsForClient(),
        });
        return;
      }
      if (isDriverPreWorkInstructionsCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getDriverPreWorkInstructionsQuestionsForClient(),
        });
        return;
      }
      if (isLongSittingDrivingRecoCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getLongSittingDrivingRecoQuestionsForClient(),
        });
        return;
      }
      if (isDangerousDrivingHabitsCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "road",
          questions: getDangerousDrivingHabitsQuestionsForClient(),
        });
        return;
      }
      if (isBodyPreservationCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "sweeping",
          questions: getBodyPreservationQuestionsForClient(),
        });
        return;
      }
      if (isRoundaboutSweepingCourse(slug, title, pdfUrl)) {
        res.json({
          courseId: courseIdParam,
          quizKey: "sweeping",
          questions: getRoundaboutSweepingQuestionsForClient(),
        });
        return;
      }
      throw new AppError(404, "Lesson quiz not available for this course");
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  "/submit",
  body("courseId").notEmpty(),
  body("answers").isArray({ min: 1 }),
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        res.status(400).json({ error: "Validation failed", details: errors.array() });
        return;
      }
      const { userId, role } = (req as AuthedRequest).user;
      if (role !== "EMPLOYEE") throw new AppError(403, "Forbidden");
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError(404, "User not found");
      assertAssessmentPassed(user);

      const { courseId, answers } = req.body as {
        courseId: string;
        answers: { questionId: number; selectedIndices: number[] }[];
      };

      const { slug, id: cid, title, pdfUrl } = await assertCourseAccess(userId, user.categoryId, courseId);
      const trafficLaw = isTrafficLawCourse(slug, title, pdfUrl);
      const road = isRoadTrafficSafetyCourse(slug, title, pdfUrl);
      const sweeping = isSweepingSafetyCourse(slug, title, pdfUrl);
      const sweepingAgainstTraffic = isSweepingAgainstTrafficCourse(slug, title, pdfUrl);
      const footrest = isFootrestReportingCourse(slug, title, pdfUrl);
      const reverse = isReverseDrivingCourse(slug, title, pdfUrl);
      const sweepOrder = isSweepingEquipmentOrderCourse(slug, title, pdfUrl);
      const safeRide = isSafeRideBehindCompactorCourse(slug, title, pdfUrl);
      const collection = isCollectionSafetyCourse(slug, title, pdfUrl);
      const loadingLifting = isLoadingLiftingCourse(slug, title, pdfUrl);
      const handInjury = isHandInjuryAvoidanceCourse(slug, title, pdfUrl);
      const trafficCollisionWhileSweeping = isTrafficCollisionWhileSweepingCourse(slug, title, pdfUrl);
      const badWeatherSweeping = isBadWeatherSweepingCourse(slug, title, pdfUrl);
      const staySafeOnRoads = isStaySafeOnRoadsCourse(slug, title, pdfUrl);
      const seriousSweepingAccidentsAwareness = isSeriousSweepingAccidentsAwarenessCourse(slug, title, pdfUrl);
      const drivingPrecautions = isDrivingPrecautionsCourse(slug, title, pdfUrl);
      const collectionBehavior = isCollectionBehaviorCourse(slug, title, pdfUrl);
      const collectionTrafficAccidents = isCollectionTrafficAccidentsCourse(slug, title, pdfUrl);
      const collectionInstructions2 = isCollectionInstructions2Course(slug, title, pdfUrl);
      const compaction = isCompactionContainersCourse(slug, title, pdfUrl);
      const distractionDevices = isDistractionDevicesCourse(slug, title, pdfUrl);
      const driverPreWork = isDriverPreWorkInstructionsCourse(slug, title, pdfUrl);
      const longSittingReco = isLongSittingDrivingRecoCourse(slug, title, pdfUrl);
      const dangerousDriving = isDangerousDrivingHabitsCourse(slug, title, pdfUrl);
      const bodyPreservation = isBodyPreservationCourse(slug, title, pdfUrl);
      const roundaboutSweeping = isRoundaboutSweepingCourse(slug, title, pdfUrl);
      const basics = isBasicsGuidanceCourse(slug, title, pdfUrl);
      if (!trafficLaw && !road && !sweeping && !sweepingAgainstTraffic && !footrest && !reverse && !sweepOrder && !safeRide && !collection && !loadingLifting && !handInjury && !trafficCollisionWhileSweeping && !badWeatherSweeping && !staySafeOnRoads && !seriousSweepingAccidentsAwareness && !drivingPrecautions && !collectionBehavior && !collectionTrafficAccidents && !collectionInstructions2 && !compaction && !distractionDevices && !driverPreWork && !longSittingReco && !dangerousDriving && !bodyPreservation && !roundaboutSweeping && !basics) {
        throw new AppError(400, "Lesson quiz not available for this course");
      }

      const normalized = Array.isArray(answers)
        ? answers.map((a) => ({
            questionId: Number(a.questionId),
            selectedIndices: Array.isArray((a as any).selectedIndices)
              ? (a as any).selectedIndices.map((x: any) => Number(x)).filter((n: number) => Number.isFinite(n))
              : [],
          }))
        : [];
      if (normalized.length !== 10) {
        res.status(400).json({ error: "Expected 10 answers" });
        return;
      }

      const { score, total, percentage, details } = basics
        ? (() => {
            const byId = new Map(normalized.map((a) => [a.questionId, a.selectedIndices]));
            const answersByIndex = ASSESSMENT_QUESTIONS.map((q) => (byId.get(q.id)?.[0] ?? -1));
            const resu = scoreAssessment(answersByIndex);
            const details = ASSESSMENT_QUESTIONS.map((q, i) => ({
              questionId: q.id,
              selected: Array.isArray(byId.get(q.id)) ? (byId.get(q.id) as number[]) : [],
              correct: [q.correct],
              is_correct: (byId.get(q.id)?.[0] ?? -1) === q.correct,
            }));
            return {
              score: resu.correct,
              total: ASSESSMENT_QUESTIONS.length,
              percentage: resu.scorePercent,
              details,
            };
          })()
        : reverse
          ? scoreReverseDrivingAnswers(normalized as any)
          : sweepOrder
            ? scoreSweepingEquipmentOrderAnswers(normalized as any)
            : safeRide
              ? scoreSafeRideBehindCompactorAnswers(normalized as any)
            : collection
              ? scoreCollectionSafetyAnswers(normalized as any)
              : loadingLifting
                ? scoreLoadingLiftingAnswers(normalized as any)
                : drivingPrecautions
                  ? scoreDrivingPrecautionsAnswers(normalized as any)
                  : collectionBehavior
                    ? scoreCollectionBehaviorAnswers(normalized as any)
                    : collectionTrafficAccidents
                      ? scoreCollectionTrafficAccidentsAnswers(normalized as any)
                      : collectionInstructions2
                        ? scoreCollectionInstructions2Answers(normalized as any)
                        : compaction
                          ? scoreCompactionContainersAnswers(normalized as any)
                          : distractionDevices
                            ? scoreDistractionDevicesAnswers(normalized as any)
                    : driverPreWork
                      ? scoreDriverPreWorkInstructionsAnswers(normalized as any)
                      : longSittingReco
                        ? scoreLongSittingDrivingRecoAnswers(normalized as any)
                        : dangerousDriving
                          ? scoreDangerousDrivingHabitsAnswers(normalized as any)
                          : bodyPreservation
                            ? scoreBodyPreservationAnswers(normalized as any)
                            : roundaboutSweeping
                              ? scoreRoundaboutSweepingAnswers(normalized as any)
                              : footrest
                                ? scoreFootrestReportingAnswers(normalized as any)
              : trafficLaw
                ? scoreTrafficLawAnswers(normalized as any)
                              : handInjury
                                ? scoreHandInjuryAnswers(normalized as any)
                              : trafficCollisionWhileSweeping
                                ? scoreTrafficCollisionWhileSweepingAnswers(normalized as any)
                              : badWeatherSweeping
                                ? scoreBadWeatherSweepingAnswers(normalized as any)
                              : staySafeOnRoads
                                ? scoreStaySafeOnRoadsAnswers(normalized as any)
                              : seriousSweepingAccidentsAwareness
                                ? scoreSeriousSweepingAccidentsAwarenessAnswers(normalized as any)
              : road
                ? scoreRoadSafetyAnswers(normalized as any)
                : sweepingAgainstTraffic
                  ? scoreSweepingAgainstTrafficAnswers(normalized as any)
                  : scoreSweepingAnswers(normalized as any);

      const prev = await prisma.lessonQuizAttempt.count({
        where: { userId, courseId: cid },
      });
      const attemptNumber = prev + 1;

      const row = await prisma.lessonQuizAttempt.create({
        data: {
          userId,
          courseId: cid,
          score,
          total,
          percentage,
          answers: details as object,
          attemptNumber,
        },
      });

      const newBadges = await evaluateBadgesAfterLessonQuizAttempt({
        userId,
        courseId: cid,
        percentage,
      });

      res.json({
        attemptId: row.id,
        score,
        total,
        percentage,
        attemptNumber,
        takenAt: row.takenAt.toISOString(),
        details,
        newBadges,
      });
    } catch (e) {
      next(e);
    }
  }
);

export default router;
