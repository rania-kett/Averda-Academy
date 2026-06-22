import { describe, it, expect } from "vitest";
import {
  ASSESSMENT_QUESTIONS,
  scoreAssessment,
  validateAssessmentAnswers,
} from "../../src/data/assessmentQuestions.js";
import { assessmentAnswersWithCorrectCount } from "../helpers/assessmentAnswers.js";

describe("scoreAssessment", () => {
  it("10/10 correct → score 100", () => {
    const answers = assessmentAnswersWithCorrectCount(10);
    const { scorePercent } = scoreAssessment(answers);
    expect(scorePercent).toBe(100);
    expect(scorePercent >= 70).toBe(true);
  });

  it("7/10 correct → score 70 (boundary pass)", () => {
    const answers = assessmentAnswersWithCorrectCount(7);
    const { scorePercent } = scoreAssessment(answers);
    expect(scorePercent).toBe(70);
    expect(scorePercent >= 70).toBe(true);
  });

  it("6/10 correct → score 60 (fail)", () => {
    const answers = assessmentAnswersWithCorrectCount(6);
    const { scorePercent } = scoreAssessment(answers);
    expect(scorePercent).toBe(60);
    expect(scorePercent >= 70).toBe(false);
  });

  it("0/10 correct → score 0", () => {
    const answers = assessmentAnswersWithCorrectCount(0);
    const { scorePercent } = scoreAssessment(answers);
    expect(scorePercent).toBe(0);
  });

  it("answers array length != 10 fails validation", () => {
    expect(validateAssessmentAnswers(Array(9).fill(0))).toBe(false);
    expect(validateAssessmentAnswers(Array(11).fill(0))).toBe(false);
    expect(validateAssessmentAnswers(ASSESSMENT_QUESTIONS.map((q) => q.correct))).toBe(true);
  });

  it("non-numeric answers fail validation", () => {
    const bad = ASSESSMENT_QUESTIONS.map((q) => q.correct);
    (bad as unknown[])[0] = "x";
    expect(validateAssessmentAnswers(bad)).toBe(false);
  });
});
