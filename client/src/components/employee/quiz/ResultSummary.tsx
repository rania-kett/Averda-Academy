import { motion } from "framer-motion";
import type { QuizLang } from "./getResultFeedback";

export type QuizResultRow = {
  questionId: number;
  emoji?: string | null;
  questionText: string;
  isCorrect: boolean;
  yourAnswer: string;
  correctAnswer: string;
};

export function ResultSummary(props: {
  lang: QuizLang;
  score: number;
  correctCount: number;
  wrongCount: number;
  rows: QuizResultRow[];
  passed: boolean;
  onFinish: () => void;
  onRetryWrong: () => void;
  finishing?: boolean;
  saved?: boolean;
}) {
  const { lang, score, correctCount, wrongCount, rows, passed, onFinish, onRetryWrong, finishing, saved } = props;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
      dir={lang === "ar" ? "rtl" : "ltr"}
    >
      <div className="text-center">
        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-4 border-[#1e3a5f] text-4xl font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
          {Math.round(score)}%
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-[#292524]">
          <div className="text-[14px] font-extrabold text-emerald-900 dark:text-emerald-100">
            {lang === "ar" ? "إجابات صحيحة" : lang === "fr" ? "Bonnes réponses" : "Correct answers"}
          </div>
          <div className="mt-2 text-[28px] font-extrabold tabular-nums text-emerald-700 dark:text-emerald-300">
            {correctCount}
          </div>
        </div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-[#292524]">
          <div className="text-[14px] font-extrabold text-red-900 dark:text-red-100">
            {lang === "ar" ? "إجابات خاطئة" : lang === "fr" ? "Réponses incorrectes" : "Wrong answers"}
          </div>
          <div className="mt-2 text-[28px] font-extrabold tabular-nums text-red-700 dark:text-red-300">
            {wrongCount}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {rows.map((row) =>
          row.isCorrect ? (
            <div
              key={row.questionId}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 dark:border-emerald-800/50 dark:bg-[#292524]"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl" aria-hidden>
                  ✅
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-extrabold leading-relaxed text-[#1C1917] dark:text-white">
                    {row.emoji ? `${row.emoji} ` : ""}
                    {row.questionText}
                  </div>
                  <div className="mt-2 text-[14px] font-semibold text-emerald-800 dark:text-emerald-200">
                    {lang === "ar"
                      ? `إجابتك صحيحة: ${row.yourAnswer}`
                      : lang === "fr"
                        ? `Votre réponse (correcte) : ${row.yourAnswer}`
                        : `Your correct answer: ${row.yourAnswer}`}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              key={row.questionId}
              className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-800/50 dark:bg-[#292524]"
            >
              <div className="flex items-start gap-3">
                <span className="text-xl" aria-hidden>
                  ❌
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[15px] font-extrabold leading-relaxed text-[#1C1917] dark:text-white">
                    {row.emoji ? `${row.emoji} ` : ""}
                    {row.questionText}
                  </div>
                  <div className="mt-2 text-[14px] font-semibold text-red-800 dark:text-red-200">
                    {lang === "ar" ? `إجابتك: ${row.yourAnswer}` : lang === "fr" ? `Votre réponse : ${row.yourAnswer}` : `Your answer: ${row.yourAnswer}`}
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-emerald-800 dark:text-emerald-200">
                    {lang === "ar"
                      ? `الإجابة الصحيحة: ${row.correctAnswer}`
                      : lang === "fr"
                        ? `Bonne réponse : ${row.correctAnswer}`
                        : `Correct answer: ${row.correctAnswer}`}
                  </div>
                </div>
              </div>
            </div>
          )
        )}
      </div>

      {passed ? (
        <>
          <div className="rounded-2xl border border-emerald-300 bg-emerald-100 px-4 py-3 text-center text-[15px] font-extrabold text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-100">
            {lang === "ar" ? "أحسنت! اجتزت الاختبار ✅" : lang === "fr" ? "Bravo ! Vous avez réussi ✅" : "Well done! You passed ✅"}
          </div>
          <button
            type="button"
            disabled={finishing}
            onClick={onFinish}
            className="min-h-[56px] w-full rounded-2xl bg-emerald-600 px-4 text-[16px] font-extrabold text-white transition active:scale-[0.98] disabled:opacity-60"
          >
            {finishing
              ? lang === "ar"
                ? "جاري الحفظ…"
                : lang === "fr"
                  ? "Enregistrement…"
                  : "Saving…"
              : saved
                ? lang === "ar"
                  ? "إنهاء"
                  : lang === "fr"
                    ? "Terminer"
                    : "Finish"
                : lang === "ar"
                  ? "إنهاء وحفظ"
                  : lang === "fr"
                    ? "Terminer et enregistrer"
                    : "Finish & save"}
          </button>
        </>
      ) : (
        <>
          <div className="rounded-2xl border border-red-300 bg-red-100 px-4 py-3 text-center text-[15px] font-extrabold text-red-900 dark:border-red-800 dark:bg-red-900/30 dark:text-red-100">
            {lang === "ar"
              ? "لم تجتز الاختبار، يجب إعادة الأسئلة الخاطئة"
              : lang === "fr"
                ? "Échec — refaites les questions ratées"
                : "You did not pass — retry the missed questions"}
          </div>
          <button
            type="button"
            onClick={onRetryWrong}
            className="min-h-[56px] w-full rounded-2xl bg-[#1e3a5f] px-4 text-[16px] font-extrabold text-white transition hover:bg-[#163056] active:scale-[0.98]"
          >
            {lang === "ar"
              ? `إعادة الأسئلة الخاطئة (${wrongCount} سؤال)`
              : lang === "fr"
                ? `Réessayer les ratées (${wrongCount})`
                : `Retry wrong questions (${wrongCount})`}
          </button>
        </>
      )}
    </motion.div>
  );
}
