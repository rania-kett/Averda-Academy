import type { QuizAttemptDetail } from "./offlineQuizStore";
import type { QuizLang } from "./getResultFeedback";
import { useTranslation } from "react-i18next";

const LETTERS = ["A", "B", "C", "D"] as const;

function pickLang<T extends Record<string, string>>(v: T, lang: QuizLang): string {
  return v[lang] || v.ar || v.en;
}

export function MistakesReview(props: {
  lang: QuizLang;
  mistakes: QuizAttemptDetail[];
  onBack: () => void;
  onRetryMistakesOnly: () => void;
  onRetryFull: () => void;
}) {
  const { lang, mistakes, onBack, onRetryMistakesOnly, onRetryFull } = props;
  const { t } = useTranslation();

  return (
    <div className="space-y-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="min-h-[48px] rounded-2xl border border-[#E7E5E4] bg-white px-4 text-[14px] font-extrabold text-[#1C1917] transition active:scale-[0.98] hover:bg-[#1e3a5f]/10 dark:border-[#44403C] dark:bg-[#292524] dark:text-white dark:hover:bg-[#1e3a5f]/20"
        >
          {t("employee.quiz.mistakes.back")}
        </button>
        <div className="text-[14px] font-extrabold text-[#1C1917] dark:text-white">
          {t("employee.quiz.mistakes.title")}
        </div>
        <div />
      </div>

      {!mistakes.length ? (
        <div className="rounded-2xl border border-[#E7E5E4] bg-white p-6 text-center text-[14px] font-semibold text-[#57534E] dark:border-[#44403C] dark:bg-[#292524] dark:text-stone-400">
          {t("employee.quiz.mistakes.empty")}
        </div>
      ) : (
        <div className="space-y-3">
          {mistakes.map((m) => {
            const qText = pickLang(m.question, lang);
            const selectedText =
              m.selected && (LETTERS as readonly string[]).includes(m.selected)
                ? pickLang(m.options[m.selected as "A"], lang)
                : "";
            const correctText = pickLang(m.options[m.correct as "A"], lang);
            return (
              <div
                key={m.questionId}
                className="quiz-card rounded-2xl border border-red-200 bg-red-50 p-4 shadow-sm dark:border-red-800/50 dark:bg-[#292524]"
              >
                <div className="flex items-start gap-3">
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-600 text-[18px] font-extrabold text-white" aria-hidden>
                    ❌
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[16px] font-extrabold leading-relaxed text-[#1C1917] dark:text-white">
                      {m.emoji ? `${m.emoji} ` : ""}
                      {qText}
                    </div>
                    <div className="mt-3 grid gap-2 text-[14px] font-semibold">
                      <div className="rounded-xl border border-red-200 bg-white px-3 py-2 text-red-900 dark:border-red-900/40 dark:bg-[#292524] dark:text-red-100">
                        <span className="font-extrabold">
                          {t("employee.quiz.mistakes.yourAnswer")}
                        </span>
                        {m.selected ? `${m.selected}. ${selectedText}` : "—"}
                      </div>
                      <div className="rounded-xl border border-emerald-200 bg-white px-3 py-2 text-emerald-900 dark:border-emerald-900/40 dark:bg-[#292524] dark:text-emerald-100">
                        <span className="font-extrabold">
                          {t("employee.quiz.mistakes.correctAnswer")}
                        </span>
                        {m.correct}. {correctText}
                      </div>
                      <div className="rounded-xl border border-[#E7E5E4] bg-white px-3 py-2 text-[#1C1917] dark:border-[#44403C] dark:bg-[#292524] dark:text-[#F5F5F4]">
                        <span className="font-extrabold">
                          {t("employee.quiz.mistakes.explanation")}
                        </span>
                        {pickLang(m.explanation, lang)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <button
          type="button"
          onClick={onRetryMistakesOnly}
          className="min-h-[56px] rounded-2xl bg-[#1e3a5f] px-4 text-[16px] font-extrabold text-white transition hover:bg-[#163056] active:scale-[0.98]"
        >
          {t("employee.quiz.mistakes.retryMistakesOnly")}
        </button>
        <button
          type="button"
          onClick={onRetryFull}
          className="min-h-[56px] rounded-2xl border border-[#E7E5E4] bg-white px-4 text-[16px] font-extrabold text-[#1C1917] transition active:scale-[0.98] hover:bg-[#1e3a5f]/10 dark:border-[#44403C] dark:bg-[#292524] dark:text-white dark:hover:bg-[#1e3a5f]/20"
        >
          {t("employee.quiz.mistakes.retryFull")}
        </button>
      </div>
    </div>
  );
}

