import { ASSESSMENT_QUESTIONS } from "../../src/data/assessmentQuestions.js";

/** All correct answer indices (length 10). */
export function allCorrectAssessmentAnswers(): number[] {
  return ASSESSMENT_QUESTIONS.map((q) => q.correct);
}

/** Build answers with exactly `correctCount` correct (0–10). */
export function assessmentAnswersWithCorrectCount(correctCount: number): number[] {
  const answers = allCorrectAssessmentAnswers();
  const wrongNeeded = ASSESSMENT_QUESTIONS.length - correctCount;
  for (let i = 0; i < wrongNeeded; i++) {
    const q = ASSESSMENT_QUESTIONS[i]!;
    answers[i] = (q.correct + 1) % q.options.length;
  }
  return answers;
}
