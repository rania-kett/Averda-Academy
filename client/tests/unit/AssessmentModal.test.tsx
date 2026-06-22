import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { AssessmentModal } from "@/components/employee/AssessmentModal";
import { ASSESSMENT_QUESTIONS } from "@/data/assessmentQuestions";
import { renderWithProviders } from "../helpers/renderWithProviders";

vi.mock("@/api/api", () => ({
  userApi: {
    completeAssessment: vi.fn(),
  },
}));

vi.mock("canvas-confetti", () => ({ default: vi.fn() }));

import { userApi } from "@/api/api";

function clickOption(optionText: string) {
  const btn = screen
    .getAllByRole("button")
    .find((b) => b.textContent?.includes(optionText.slice(0, 24)));
  if (!btn) throw new Error(`Option not found: ${optionText.slice(0, 40)}…`);
  fireEvent.click(btn);
}

async function answerAllQuestions() {
  for (let step = 0; step < ASSESSMENT_QUESTIONS.length; step++) {
    const q = ASSESSMENT_QUESTIONS[step]!;
    await waitFor(() => {
      expect(screen.getByText(q.text)).toBeInTheDocument();
    });
    clickOption(q.options[q.correct]!);
    fireEvent.click(screen.getByRole("button", { name: /confirm|تأكيد|valider/i }));
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /next|التالي|suivant/i })).toBeEnabled();
    });
    fireEvent.click(screen.getByRole("button", { name: /next|التالي|suivant/i }));
  }
  await waitFor(() => {
    expect(screen.getByText(/10\s*\/\s*10/)).toBeInTheDocument();
  });
}

describe("AssessmentModal", () => {
  const onComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders first question when open", () => {
    renderWithProviders(<AssessmentModal isOpen onComplete={onComplete} />);
    expect(screen.getByText(ASSESSMENT_QUESTIONS[0]!.text)).toBeInTheDocument();
  });

  it("cannot advance without picking an answer", () => {
    renderWithProviders(<AssessmentModal isOpen onComplete={onComplete} />);
    const confirm = screen.getByRole("button", { name: /confirm|تأكيد|valider/i });
    fireEvent.click(confirm);
    expect(screen.getByText(ASSESSMENT_QUESTIONS[0]!.text)).toBeInTheDocument();
  });

  it("submitting after all questions calls completeAssessment", async () => {
    vi.mocked(userApi.completeAssessment).mockResolvedValue({ data: { ok: true } } as never);
    renderWithProviders(<AssessmentModal isOpen onComplete={onComplete} />);
    await answerAllQuestions();

    fireEvent.click(screen.getByRole("button", { name: /start learning|ابدأ|commencer/i }));
    await waitFor(() => {
      expect(userApi.completeAssessment).toHaveBeenCalled();
      expect(onComplete).toHaveBeenCalled();
    });
  });

  it("shows pass result UI for perfect score", async () => {
    renderWithProviders(<AssessmentModal isOpen onComplete={onComplete} />);
    await answerAllQuestions();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
