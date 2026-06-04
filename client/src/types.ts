export type I18nText = { ar: string; fr: string; en: string };

export type LegacyQuizQuestionJson = {
  id: number;
  emoji?: string | null;
  difficulty: "easy" | "medium" | "hard";
  question: I18nText;
  options: {
    A: I18nText;
    B: I18nText;
    C: I18nText;
    D: I18nText;
  };
  correct: "A" | "B" | "C" | "D";
  explanation: I18nText;
};

export type AiMcqQuestion = {
  id: number;
  type: "mcq";
  question: I18nText;
  options: { ar: string[]; fr: string[]; en: string[] };
  correct_index: number;
  explanation: I18nText;
  emoji?: string | null;
  difficulty?: "easy" | "medium" | "hard";
};

export type AiTrueFalseQuestion = {
  id: number;
  type: "true_false";
  question: I18nText;
  correct: boolean;
  explanation: I18nText;
  emoji?: string | null;
  difficulty?: "easy" | "medium" | "hard";
};

export type AiMultiSelectQuestion = {
  id: number;
  type: "multi_select";
  question: I18nText;
  options: { ar: string[]; fr: string[]; en: string[] };
  correct_indexes: number[];
  explanation: I18nText;
  emoji?: string | null;
  difficulty?: "easy" | "medium" | "hard";
};

export type AiOrderQuestion = {
  id: number;
  type: "order";
  question: I18nText;
  steps: { ar: string[]; fr: string[]; en: string[] };
  correct_order: number[];
  explanation: I18nText;
  emoji?: string | null;
  difficulty?: "easy" | "medium" | "hard";
};

export type QuizQuestionJson =
  | LegacyQuizQuestionJson
  | AiMcqQuestion
  | AiTrueFalseQuestion
  | AiMultiSelectQuestion
  | AiOrderQuestion;

