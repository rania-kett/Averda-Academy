import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ASSESSMENT_QUESTIONS,
  scoreAssessment,
  type AssessmentQuestion,
} from "@/data/assessmentQuestions";
import { userApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import confetti from "canvas-confetti";
import { getScoreTier } from "@/components/employee/quiz/scoreTier";
import { vibrateDevice } from "@/utils/vibrateDevice";

const GOLD = "#F5A623";
const BLUE = "#1e3a5f";

type Props = {
  isOpen: boolean;
  onComplete: () => void;
};

export function AssessmentModal({ isOpen, onComplete }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [phase, setPhase] = useState<"quiz" | "results">("quiz");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>(() => Array(10).fill(-1));
  const [picked, setPicked] = useState<number | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [streak, setStreak] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [slideKey, setSlideKey] = useState(0);
  const [resultDraft, setResultDraft] = useState<{ correct: number; scorePercent: number } | null>(
    null
  );

  const q = ASSESSMENT_QUESTIONS[step]!;
  const total = ASSESSMENT_QUESTIONS.length;
  const langKey = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const isArabic = langKey === "ar";

  const reset = useCallback(() => {
    setPhase("quiz");
    setStep(0);
    setAnswers(Array(10).fill(-1));
    setPicked(null);
    setRevealed(false);
    setStreak(0);
    setSubmitting(false);
    setSlideKey(0);
    setResultDraft(null);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      reset();
      document.body.style.overflow = "";
      return;
    }
    reset();
    document.body.style.overflow = "hidden";
    const blockEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") e.preventDefault();
    };
    window.addEventListener("keydown", blockEsc);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", blockEsc);
    };
  }, [isOpen, reset]);

  const progressPct = phase === "quiz" ? ((step + (revealed ? 1 : 0)) / total) * 100 : 100;

  const pickOption = (idx: number) => {
    if (revealed) return;
    setPicked(idx);
  };

  const confirmAnswer = () => {
    if (picked === null || revealed) return;
    setRevealed(true);
    if (picked !== q.correct) {
      vibrateDevice();
    }
    if (picked === q.correct) {
      setStreak((s) => s + 1);
    } else {
      setStreak(0);
    }
  };

  const goNext = () => {
    if (picked === null) return;
    const nextAnswers = [...answers];
    nextAnswers[step] = picked;
    setAnswers(nextAnswers);
    if (step >= total - 1) {
      setResultDraft(scoreAssessment(nextAnswers));
      setPhase("results");
      return;
    }
    setStep((s) => s + 1);
    setPicked(null);
    setRevealed(false);
    setSlideKey((k) => k + 1);
  };

  const finishAndSave = async () => {
    if (!resultDraft || answers.some((a) => a < 0)) return;
    setSubmitting(true);
    try {
      await userApi.completeAssessment(answers);
      onComplete();
    } catch {
      toast(t("employee.assessmentModal.saveFailed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex flex-col justify-end"
      dir={isArabic ? "rtl" : "ltr"}
      role="dialog"
      aria-modal="true"
      aria-labelledby="assessment-title"
    >
      {/* Visual dim only — no pointer capture (cannot dismiss by tap) */}
      <div className="pointer-events-none absolute inset-0 bg-black/50" aria-hidden />

      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative flex max-h-[100dvh] w-full flex-col rounded-t-2xl bg-[#F5F5F5] shadow-2xl dark:bg-[#1C1C1E]"
        style={{ pointerEvents: "auto" }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {phase === "quiz" ? (
          <QuizPhase
            q={q}
            step={step}
            total={total}
            progressPct={progressPct}
            picked={picked}
            revealed={revealed}
            streak={streak}
            slideKey={slideKey}
            onPick={pickOption}
            onConfirm={confirmAnswer}
            onNext={goNext}
            isArabic={isArabic}
          />
        ) : resultDraft ? (
          <ResultsPhase
            answers={answers}
            result={resultDraft}
            onCta={finishAndSave}
            submitting={submitting}
          />
        ) : null}
      </motion.div>
    </div>
  );
}

function QuizPhase({
  q,
  step,
  total,
  progressPct,
  picked,
  revealed,
  streak,
  slideKey,
  onPick,
  onConfirm,
  onNext,
  isArabic,
}: {
  q: AssessmentQuestion;
  step: number;
  total: number;
  progressPct: number;
  picked: number | null;
  revealed: boolean;
  streak: number;
  slideKey: number;
  onPick: (i: number) => void;
  onConfirm: () => void;
  onNext: () => void;
  isArabic: boolean;
}) {
  const { t } = useTranslation();
  const wrongShake = revealed && picked !== null && picked !== q.correct;

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      <div className="shrink-0 px-4 pb-2 pt-4">
        <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: GOLD }}
            initial={false}
            animate={{ width: `${Math.min(100, progressPct)}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>
        <p className="text-center text-[15px] font-semibold text-[#111827] dark:text-white">
          {t("employee.assessmentModal.quiz.progress", { current: step + 1, total })}
        </p>
        {streak >= 2 && revealed && picked === q.correct && (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-center text-[14px] font-bold text-amber-700 dark:text-amber-300"
          >
            {t("employee.assessmentModal.quiz.streak", { n: streak })} 🔥
          </motion.p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideKey}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className={`mx-auto max-w-lg ${wrongShake ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
          >
            <div className="mb-4 flex justify-center">
              <motion.span
                key={q.id}
                initial={{ scale: 0.85 }}
                animate={{ scale: 1 }}
                className="text-5xl"
                aria-hidden
              >
                {q.emoji}
              </motion.span>
            </div>

            <h2
              id="assessment-title"
              className="mb-6 text-center text-[20px] font-bold leading-[1.5] text-[#111827] dark:text-white"
            >
              {q.text}
            </h2>

            {q.type === "tf" ? (
              <div className="grid grid-cols-2 gap-3">
                {q.options.map((label, idx) => (
                  <TfButton
                    key={idx}
                    label={label}
                    idx={idx}
                    picked={picked}
                    revealed={revealed}
                    correct={q.correct}
                    onPick={() => onPick(idx)}
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {q.options.map((label, idx) => (
                  <McqButton
                    key={idx}
                    label={label}
                    idx={idx}
                    picked={picked}
                    revealed={revealed}
                    correct={q.correct}
                    onPick={() => onPick(idx)}
                  />
                ))}
              </div>
            )}

            <AnimatePresence>
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mt-5 rounded-2xl border-s-4 bg-white p-4 text-[16px] leading-[1.65] text-[#374151] dark:bg-[#2C2C2E] dark:text-[#E5E7EB]"
                  style={{ borderColor: GOLD }}
                >
                  {q.explanation}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="shrink-0 border-t border-black/5 bg-[#F5F5F5] p-4 pb-[calc(16px+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#1C1C1E]">
        <button
          type="button"
          disabled={picked === null}
          onClick={revealed ? onNext : onConfirm}
          className="flex h-14 w-full items-center justify-center rounded-2xl text-[17px] font-bold text-white transition enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40"
          style={{ backgroundColor: BLUE }}
        >
          {revealed ? `${t("employee.assessmentModal.quiz.next")} ${isArabic ? "←" : "→"}` : t("employee.quiz.confirm")}
        </button>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
      `}</style>
    </div>
  );
}

function McqButton({
  label,
  idx,
  picked,
  revealed,
  correct,
  onPick,
}: {
  label: string;
  idx: number;
  picked: number | null;
  revealed: boolean;
  correct: number;
  onPick: () => void;
}) {
  const isSel = picked === idx;
  const isCor = idx === correct;
  let border = "border-[#E5E7EB] dark:border-[#44403C]";
  let bg = "bg-white dark:bg-[#2C2C2E]";
  if (revealed) {
    if (isCor) {
      border = "border-emerald-500";
      bg = "bg-emerald-50 dark:bg-emerald-950/40";
    } else if (isSel && !isCor) {
      border = "border-red-500";
      bg = "bg-red-50 dark:bg-red-950/30";
    }
  } else if (isSel) {
    border = "border-[#3B82F6]";
    bg = "bg-blue-50 dark:bg-blue-950/30";
  }

  return (
    <motion.button
      type="button"
      disabled={revealed}
      onClick={onPick}
      whileTap={revealed ? undefined : { scale: 0.98 }}
      animate={revealed && isCor ? { scale: [1, 1.02, 1] } : {}}
      transition={{ duration: 0.4 }}
      className={`min-h-[56px] w-full rounded-2xl border-2 px-4 py-3 text-right text-[16px] font-semibold leading-snug text-[#111827] transition dark:text-white ${border} ${bg}`}
    >
      <span className="flex items-center justify-between gap-2">
        <span>{label}</span>
        {revealed && isCor && <span className="text-emerald-600">✓</span>}
        {revealed && isSel && !isCor && <span className="text-red-600">✗</span>}
      </span>
    </motion.button>
  );
}

function TfButton({
  label,
  idx,
  picked,
  revealed,
  correct,
  onPick,
}: {
  label: string;
  idx: number;
  picked: number | null;
  revealed: boolean;
  correct: number;
  onPick: () => void;
}) {
  return (
    <div className="min-h-[56px]">
      <McqButton
        label={label}
        idx={idx}
        picked={picked}
        revealed={revealed}
        correct={correct}
        onPick={onPick}
      />
    </div>
  );
}

function ResultsPhase({
  answers,
  result,
  onCta,
  submitting,
}: {
  answers: number[];
  result: { correct: number; scorePercent: number };
  onCta: () => void;
  submitting: boolean;
}) {
  const { t, i18n } = useTranslation();
  const langKey = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const pct = result.scorePercent;
  const tier = getScoreTier(pct, langKey);
  const tierIcon = pct >= 100 ? "🎯" : pct >= 90 ? "🏆" : pct >= 80 ? "🌟" : pct >= 70 ? "✅" : "📚";
  const extraConfetti = tier.extraConfetti;

  useEffect(() => {
    if (pct < 70) return;
    confetti({ particleCount: extraConfetti ? 180 : 100, spread: extraConfetti ? 100 : 70, origin: { y: 0.6 } });
    if (extraConfetti) {
      window.setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { y: 0.55 } }), 220);
    }
  }, [pct, extraConfetti]);

  const msg =
    pct >= 70
      ? t("employee.assessmentModal.results.msgPass")
      : t("employee.assessmentModal.results.msgFail");

  const r = 56;
  const c = 2 * Math.PI * r;

  return (
    <div className="flex max-h-[100dvh] flex-col overflow-hidden pt-[env(safe-area-inset-top)]">
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
        <div className="mx-auto flex max-w-lg flex-col items-center py-6">
          <div className="relative h-[140px] w-[140px]">
            <svg width={140} height={140} className="-rotate-90">
              <circle cx={70} cy={70} r={r} fill="none" stroke="currentColor" className="text-black/10 dark:text-white/15" strokeWidth={12} />
              <motion.circle
                cx={70}
                cy={70}
                r={r}
                fill="none"
                stroke={GOLD}
                strokeWidth={12}
                strokeLinecap="round"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: c - (pct / 100) * c }}
                transition={{ duration: 1.5, ease: [0.22, 1, 0.36, 1] }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-[28px] font-extrabold text-[#111827] dark:text-white">
                {result.correct} / 10
              </div>
              <div className="text-[18px] font-bold text-[#6B7280]">{pct}%</div>
            </div>
          </div>

          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 15, delay: 0.4 }}
            className="mt-4 flex items-center gap-2 rounded-2xl px-5 py-3 text-[18px] font-extrabold"
            style={{ backgroundColor: tier.bg, color: tier.color }}
          >
            <span>{tierIcon}</span>
            <span>{tier.label}</span>
          </motion.div>

          <p className="mt-5 text-center text-[16px] leading-[1.7] text-[#374151] dark:text-[#D1D5DB]">{msg}</p>
        </div>

        <div className="mx-auto max-w-lg space-y-3 pb-4">
          <h3 className="text-[17px] font-bold text-[#111827] dark:text-white">
            {t("employee.assessmentModal.results.reviewTitle")}
          </h3>
          {ASSESSMENT_QUESTIONS.map((qq, i) => {
            const ua = answers[i]!;
            const ok = ua === qq.correct;
            return (
              <div
                key={qq.id}
                className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-[#44403C] dark:bg-[#2C2C2E]"
              >
                <p className="text-[14px] font-bold text-[#111827] dark:text-white line-clamp-2">{qq.text}</p>
                <p className="mt-2 text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">
                  {t("employee.assessmentModal.results.yourAnswer")}{" "}
                  <span className={ok ? "text-emerald-600" : "text-red-600"}>
                    {qq.options[ua] ?? t("employee.assessmentModal.results.noAnswer")}
                  </span>
                </p>
                {!ok && (
                  <p className="mt-1 text-[14px] text-[#6B7280] dark:text-[#9CA3AF]">
                    {t("employee.assessmentModal.results.correctAnswer")}{" "}
                    <span className="font-semibold text-emerald-600">{qq.options[qq.correct]}</span>
                  </p>
                )}
                <p className="mt-2 border-s-4 border-amber-400 ps-3 text-[14px] leading-relaxed text-[#4B5563] dark:text-[#D1D5DB]">
                  {qq.explanation}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 border-t border-black/5 bg-[#F5F5F5] p-4 pb-[calc(16px+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#1C1C1E]">
        <button
          type="button"
          disabled={submitting}
          onClick={onCta}
          className="flex h-14 w-full items-center justify-center rounded-2xl text-[17px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
          style={{ backgroundColor: BLUE }}
        >
          {submitting ? t("common.saving") : t("employee.assessmentModal.results.cta")} 🚀
        </button>
      </div>
    </div>
  );
}
