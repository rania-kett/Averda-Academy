export type QuizQuestionJson = {
  id: number;
  difficulty: "easy" | "medium" | "hard";
  question: { ar: string; fr: string; en: string };
  options: {
    A: { ar: string; fr: string; en: string };
    B: { ar: string; fr: string; en: string };
    C: { ar: string; fr: string; en: string };
    D: { ar: string; fr: string; en: string };
  };
  correct: "A" | "B" | "C" | "D";
  explanation: { ar: string; fr: string; en: string };
};
