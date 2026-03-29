import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { quizApi, coursesApi } from "@/api/api";
import type { QuizQuestionJson } from "@/types";
import { useToast } from "@/context/ToastContext";
import { BackNavButton } from "@/components/BackNavButton";

const LETTERS = ["A", "B", "C", "D"] as const;

export function QuizPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestionJson[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<"quiz" | "done">("quiz");
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(60);
  const [startTime] = useState(() => Date.now());

  const q = questions[step];

  useEffect(() => {
    if (!courseId) return;
    void (async () => {
      try {
        const { data: qz } = await quizApi.get(courseId);
        if (!(qz as { questions?: unknown }).questions) {
          setQuestions([]);
          setLoading(false);
          return;
        }
        setQuestions((qz as { questions: QuizQuestionJson[] }).questions);
        const { data: c } = await coursesApi.get(courseId);
        const course = (c as { course: { title: Record<string, string> } }).course;
        setCourseTitle(course.title[lang] || course.title.ar);
      } catch {
        toast(t("common.error"), "error");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, lang, t, toast]);

  useEffect(() => {
    if (phase !== "quiz" || !q) return;
    setTimeLeft(60);
    setSelected(null);
    setConfirmed(false);
    const iv = setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          clearInterval(iv);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(iv);
  }, [step, phase, q?.id]);

  const confirmStep = () => {
    if (!selected) return;
    setConfirmed(true);
  };

  const finishQuiz = async (finalAnswers: Record<string, string>) => {
    if (!courseId) return;
    const timeSpent = Math.floor((Date.now() - startTime) / 1000);
    try {
      const { data } = await quizApi.attempt(courseId, {
        answers: finalAnswers,
        timeSpent,
      });
      setScore((data as { score: number }).score);
      setPassed((data as { passed: boolean }).passed);
      setNewBadges((data as { newBadges?: string[] }).newBadges ?? []);
      setPhase("done");
    } catch {
      toast(t("common.error"), "error");
    }
  };

  const nextStep = () => {
    if (!q || !selected) return;
    const merged = { ...answers, [String(q.id)]: selected };
    if (step >= 9) {
      void finishQuiz(merged);
      return;
    }
    setAnswers(merged);
    setStep((s) => s + 1);
    setConfirmed(false);
    setSelected(null);
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-stone-200 dark:bg-white/5" />;
  }

  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-[#E7E5E4] bg-white p-8 text-center dark:border-[#44403C] dark:bg-[#292524]">
        <p className="text-[#57534E] dark:text-stone-400">{t("employee.viewer.quizSoonLong")}</p>
        <Link to="/courses" className="mt-4 inline-block text-amber-600 dark:text-employee-amber">
          {t("employee.quiz.backCourses")}
        </Link>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="space-y-6 text-center"
      >
        {passed && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[...Array(24)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute h-3 w-3 rounded-full bg-employee-amber"
                initial={{ x: 0, y: 0, opacity: 1 }}
                animate={{
                  x: (Math.random() - 0.5) * 400,
                  y: (Math.random() - 0.5) * 400,
                  opacity: 0,
                }}
                transition={{ duration: 1.2 }}
              />
            ))}
          </motion.div>
        )}
        <div className="mx-auto flex h-36 w-36 items-center justify-center rounded-full border-4 border-employee-amber text-4xl font-bold text-[#1C1917] dark:text-[#F5F5F4]">
          {score}%
        </div>
        <h2 className="text-2xl font-bold text-[#1C1917] dark:text-[#F5F5F4]">
          {passed ? t("employee.quiz.passedTitle") : t("employee.quiz.failedTitle")}
        </h2>
        {!passed && <p className="text-[#57534E] dark:text-stone-400">{t("employee.quiz.failedMsg")}</p>}
        {newBadges.length > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="rounded-xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            {t("badge.new")} {newBadges.join(", ")}
          </motion.div>
        )}
        <div className="flex flex-col gap-3">
          {!passed && (
            <button
              type="button"
              onClick={() => {
                setPhase("quiz");
                setStep(0);
                setAnswers({});
              }}
              className="min-h-[52px] rounded-xl border border-[#E7E5E4] bg-white font-bold text-[#1C1917] transition hover:bg-[#F5F5F4] dark:border-[#44403C] dark:bg-[#292524] dark:text-white dark:hover:bg-[#44403C]"
            >
              {t("employee.quiz.tryAgain")}
            </button>
          )}
          <Link
            to="/courses"
            className="flex min-h-[52px] items-center justify-center rounded-xl bg-[#F59E0B] font-bold text-[#1C1917]"
          >
            {t("employee.quiz.backCourses")}
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      {courseId && (
        <BackNavButton to={`/courses/${courseId}`} label={t("nav.backToCourse")} />
      )}
      <div className="text-center text-sm text-[#57534E] dark:text-stone-400">{courseTitle}</div>
      <div className="text-center text-sm font-semibold text-[#57534E] dark:text-stone-400">
        {t("employee.quiz.of", { n: step + 1 })}
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[#F5F5F4] dark:bg-[#44403C]">
        <motion.div
          className={`h-full ${timeLeft <= 10 ? "bg-red-500" : "bg-employee-teal"}`}
          animate={{ width: `${(timeLeft / 60) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      <AnimatePresence mode="wait">
        {q && (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl border border-[#E7E5E4] bg-white p-6 dark:border-[#44403C] dark:bg-[#292524]"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <p className="mb-6 text-xl font-semibold leading-relaxed text-[#1C1917] dark:text-[#F5F5F4]">
              {q.question[lang as "ar"] || q.question.ar}
            </p>
            <div className="grid gap-3">
              {LETTERS.map((L) => {
                const opt = q.options[L];
                const text = opt[lang as "ar"] || opt.ar;
                const isSel = selected === L;
                return (
                  <motion.button
                    key={L}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => !confirmed && setSelected(L)}
                    className={`min-h-[52px] rounded-xl border-2 px-4 py-3 text-start text-[#1C1917] transition dark:text-white ${
                      isSel
                        ? "border-[#F59E0B] bg-[#FFFBEB] dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-50"
                        : "border-[#D6D3D1] bg-white dark:border-[#44403C] dark:bg-[#292524]"
                    }`}
                  >
                    <span className="font-bold me-2">{L}.</span>
                    {text}
                  </motion.button>
                );
              })}
            </div>
            {confirmed && q && selected && (
              <div
                className={`mt-4 rounded-xl border p-4 ${
                  selected === q.correct
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-100"
                    : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/25 dark:text-red-100"
                }`}
              >
                <p className="text-sm font-medium">{t("employee.quiz.review")}</p>
                <p className="mt-2 text-[#1C1917] dark:text-[#F5F5F4]">
                  {q.explanation[lang as "ar"] || q.explanation.ar}
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i <= step ? "bg-employee-amber" : "bg-stone-300 dark:bg-zinc-600"
            }`}
          />
        ))}
      </div>

      <div className="flex gap-3">
        {!confirmed ? (
          <button
            type="button"
            disabled={!selected}
            onClick={confirmStep}
            className="flex-1 min-h-[52px] rounded-xl bg-[#F59E0B] font-bold text-[#1C1917] disabled:opacity-40"
          >
            {t("employee.quiz.confirm")}
          </button>
        ) : (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 min-h-[52px] rounded-xl bg-employee-teal font-bold text-[#1C1917]"
          >
            {step >= 9 ? t("common.confirm") : t("employee.quiz.nextQ")}
          </button>
        )}
      </div>
    </div>
  );
}
