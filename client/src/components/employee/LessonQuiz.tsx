import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AxiosError } from "axios";
import { lessonQuizApi, type LessonQuizKey, type LessonQuizQuestionClient } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { X } from "lucide-react";
import { SoundButton } from "@/components/SoundButton";
import confetti from "canvas-confetti";
import { getScoreTier } from "@/components/employee/quiz/scoreTier";
import { vibrateDevice } from "@/utils/vibrateDevice";

type Phase = "load" | "run" | "results";

type SubmitDetail = {
  questionId: number;
  selected: number[];
  correct: number[];
  is_correct: boolean;
};

export function LessonQuiz({
  courseId,
  onClose,
  onSubmitted,
  onContinue,
}: {
  courseId: string;
  onClose: () => void;
  onSubmitted?: () => void;
  onContinue?: () => void;
}) {
  const toast = useToast();
  const { refreshMe } = useAuth();
  const onCloseRef = useRef(onClose);
  const toastRef = useRef(toast);
  useEffect(() => {
    onCloseRef.current = onClose;
    toastRef.current = toast;
  });
  const [phase, setPhase] = useState<Phase>("load");
  const [questions, setQuestions] = useState<LessonQuizQuestionClient[]>([]);
  const [step, setStep] = useState(0);
  const [selectedByStep, setSelectedByStep] = useState<number[][]>([]);
  const [revealedByStep, setRevealedByStep] = useState<boolean[]>([]);
  const [streak, setStreak] = useState(0);

  const [resultPct, setResultPct] = useState(0);
  const [resultDetails, setResultDetails] = useState<SubmitDetail[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [_quizKey, setQuizKey] = useState<LessonQuizKey>("road");
  const originalQuestionsRef = useRef<LessonQuizQuestionClient[]>([]);
  const allAnswersRef = useRef<Map<number, number[]>>(new Map());

  const q = questions[step];
  const total = questions.length || 10;
  const selected = selectedByStep[step] ?? [];
  const revealed = Boolean(revealedByStep[step]);

  const correct = q?.correct ?? [];

  // Confetti should never affect hooks order: keep it in the top hooks section.
  const confettiFiredRef = useRef(false);
  useEffect(() => {
    if (phase !== "results") return;
    if (resultPct < 70) return;
    if (confettiFiredRef.current) return;
    confettiFiredRef.current = true;
    const tier = getScoreTier(resultPct, "ar");
    // Ensure confetti is visible above fullscreen modals.
    const canvas = document.createElement("canvas");
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.pointerEvents = "none";
    canvas.style.zIndex = "10080";
    document.body.appendChild(canvas);
    const c = confetti.create(canvas, { resize: true, useWorker: true });
    const common = { spread: tier.extraConfetti ? 120 : 90, startVelocity: 45, ticks: 220, scalar: 1.1, origin: { y: 0.65 } } as const;
    c({ particleCount: tier.extraConfetti ? 220 : 160, ...common });
    window.setTimeout(() => c({ particleCount: 120, ...common, spread: 120, origin: { y: 0.6 } }), 180);
    if (tier.extraConfetti) {
      window.setTimeout(() => c({ particleCount: 100, ...common, spread: 150, origin: { y: 0.55 } }), 420);
    }
    window.setTimeout(() => {
      try {
        canvas.remove();
      } catch {
        /* ignore */
      }
    }, 2500);
  }, [phase, resultPct]);

  const load = useCallback(async () => {
    setPhase("load");
    try {
      confettiFiredRef.current = false;
      const { data } = await lessonQuizApi.getQuestions(courseId);
      const payload = data as {
        questions: LessonQuizQuestionClient[];
        quizKey?: LessonQuizKey;
      };
      const qs = payload.questions;
      setQuizKey(payload.quizKey === "sweeping" ? "sweeping" : "road");
      originalQuestionsRef.current = qs;
      allAnswersRef.current = new Map();
      setQuestions(qs);
      setStep(0);
      setSelectedByStep(Array.from({ length: qs.length }, () => []));
      setRevealedByStep(Array.from({ length: qs.length }, () => false));
      setStreak(0);
      setPhase("run");
    } catch (e) {
      const err = e as AxiosError<{ error?: string }>;
      toastRef.current(
        err.response?.data?.error === "ASSESSMENT_REQUIRED" ? "أكمل التقييم أولاً" : "خطأ",
        "error"
      );
      onCloseRef.current();
    }
  }, [courseId]);

  useEffect(() => {
    void load();
  }, [load]);

  const pick = (idx: number) => {
    if (revealed) return;
    setSelectedByStep((prev) => {
      const next = prev.length ? prev.map((x) => [...x]) : Array.from({ length: total }, () => []);
      const isMulti = q?.type === "multi";
      if (isMulti) {
        const cur = next[step] ?? [];
        next[step] = cur.includes(idx) ? cur.filter((x) => x !== idx) : [...cur, idx];
      } else {
        next[step] = [idx];
      }
      return next;
    });
  };

  const reveal = () => {
    if (!q) return;
    if ((selected?.length ?? 0) === 0) return;
    setRevealedByStep((prev) => {
      const next = prev.length ? [...prev] : Array.from({ length: total }, () => false);
      next[step] = true;
      return next;
    });
    const aa = Array.from(new Set(selected)).sort((a, b) => a - b);
    const bb = Array.from(new Set(correct)).sort((a, b) => a - b);
    const ok = aa.length === bb.length && aa.every((v, i) => v === bb[i]);
    if (!ok) {
      vibrateDevice();
    }
    const nextStreak = ok ? streak + 1 : 0;
    setStreak(nextStreak);
    allAnswersRef.current.set(Number(q.id), [...selected]);
  };

  const goNext = async () => {
    if (!q || (selected?.length ?? 0) === 0) return;
    if (revealed) {
      allAnswersRef.current.set(Number(q.id), [...selected]);
    }
    if (step >= total - 1) {
      const catalog = originalQuestionsRef.current.length ? originalQuestionsRef.current : questions;
      const finalAnswers = catalog.map((qq) => {
        const qid = Number(qq.id);
        return {
          questionId: Number.isFinite(qid) ? qid : (qq.id as number),
          selectedIndices: allAnswersRef.current.get(qid) ?? [],
        };
      });
      const missing = finalAnswers.some((a) => (a.selectedIndices?.length ?? 0) === 0);
      const currentRevealed = revealed || Boolean(revealedByStep[step]);
      if (!currentRevealed || (selected?.length ?? 0) === 0) {
        toast(`خطأ في الإجابات. تأكد من تأكيد كل سؤال قبل الإنهاء.`, "error");
        return;
      }
      if (missing) {
        toast(`خطأ في الإجابات. تأكد من تأكيد كل سؤال قبل الإنهاء.`, "error");
        return;
      }
      setSubmitting(true);
      try {
        const { data } = await lessonQuizApi.submit({
          courseId,
          answers: finalAnswers,
        });
        const raw = data as Record<string, unknown>;
        const pct = raw.percentage;
        const detailsRaw = raw.details;
        if (typeof pct !== "number" || !Array.isArray(detailsRaw)) {
          toastRef.current("استجابة غير صالحة من الخادم", "error");
          return;
        }
        const details: SubmitDetail[] = detailsRaw.map((row: unknown) => {
          const r = row as Record<string, unknown>;
          return {
            questionId: Number(r.questionId),
            selected: Array.isArray(r.selected) ? (r.selected as unknown[]).map((x) => Number(x)) : [],
            correct: Array.isArray(r.correct) ? (r.correct as unknown[]).map((x) => Number(x)) : [],
            is_correct: Boolean(r.is_correct ?? r.isCorrect),
          };
        });
        setResultPct(pct);
        setResultDetails(details);
        if (originalQuestionsRef.current.length) {
          setQuestions(originalQuestionsRef.current);
        }
        setPhase("results");
        const newBadges = (raw.newBadges as string[] | undefined) ?? [];
        if (newBadges.length) {
          toastRef.current(`🎉 Badge: ${newBadges.join(", ")}`, "success");
        }
        void refreshMe();
        onSubmitted?.();
      } catch (e) {
        const err = e as AxiosError<{ error?: string }>;
        const msg = err.response?.data?.error ?? err.message ?? "فشل الحفظ";
        toastRef.current(typeof msg === "string" ? msg : "فشل الحفظ", "error");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    setStep((s) => s + 1);
  };

  const retry = () => {
    if (resultPct < 70) {
      const catalog = originalQuestionsRef.current.length ? originalQuestionsRef.current : questions;
      const wrongIds = new Set(resultDetails.filter((d) => !d.is_correct).map((d) => Number(d.questionId)));
      const wrongQuestions = catalog.filter((qq) => wrongIds.has(Number(qq.id)));
      if (wrongQuestions.length) {
        setQuestions(wrongQuestions);
        setStep(0);
        setSelectedByStep(Array.from({ length: wrongQuestions.length }, () => []));
        setRevealedByStep(Array.from({ length: wrongQuestions.length }, () => false));
        setStreak(0);
        setResultDetails([]);
        confettiFiredRef.current = false;
        setPhase("run");
        return;
      }
    }
    void load();
    setPhase("run");
    setResultDetails([]);
  };

  if (phase === "load") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#1e3a5f] border-t-transparent" />
      </div>
    );
  }

  if (phase === "results") {
    const passedByScore = resultPct >= 70;
    const correctCount = resultDetails.filter((d) => d.is_correct).length;
    const totalCount = Math.max(1, resultDetails.length || questions.length || 10);
    const tier = getScoreTier(resultPct, "ar");
    const wrongCount = resultDetails.filter((d) => !d.is_correct).length;
    const retryLabel =
      !passedByScore && wrongCount > 0
        ? `مراجعة الأسئلة الخاطئة (${wrongCount} ${wrongCount === 1 ? "سؤال" : "أسئلة"})`
        : "إعادة المحاولة";
    return (
      <div className="space-y-8 px-1" dir="rtl">
        <div className="flex items-start justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] transition hover:bg-[#E2E8F0] active:scale-[0.97]"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>

          <div className="min-w-0 flex-1 text-right">
            <div className="text-[18px] font-extrabold text-[#111827]">النتيجة</div>
            <div className="mt-1 text-[13px] font-semibold text-[#64748B]" dir="ltr">
              {correctCount}/{totalCount} • {resultPct}%
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          {passedByScore && onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex min-h-[44px] items-center justify-center rounded-2xl bg-emerald-600 px-4 text-[13px] font-extrabold text-white transition hover:bg-emerald-700 active:scale-[0.98]"
            >
              الانتقال إلى الدرس التالي
            </button>
          ) : null}
          <button
            type="button"
            onClick={retry}
            className="inline-flex min-h-[44px] items-center justify-center rounded-2xl border border-[#E2E8F0] bg-white px-4 text-[13px] font-extrabold text-[#0F172A] transition hover:bg-slate-50 active:scale-[0.98]"
          >
            {retryLabel}
          </button>
        </div>

        <div
          className="rounded-2xl p-3 text-[14px] font-extrabold leading-relaxed"
          style={{ backgroundColor: tier.bg, color: tier.color }}
        >
          {tier.label}
        </div>

        <div className="space-y-3">
          {resultDetails.map((d, i) => {
            const qq = questions.find((x) => Number(x.id) === Number(d.questionId));
            const your =
              d.selected.length > 0 && qq
                ? d.selected.map((ix) => qq.options[ix]).filter(Boolean).join(" • ")
                : "—";
            const correct =
              d.correct.length > 0 && qq
                ? d.correct.map((ix) => qq.options[ix]).filter(Boolean).join(" • ")
                : "—";
            const ok = d.is_correct;
            return (
              <div
                key={`${d.questionId}-${i}`}
                className="rounded-2xl border border-[#E2E8F0] bg-white p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-xl text-[12px] font-extrabold ${
                        ok ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      }`}
                      aria-hidden
                    >
                      {ok ? "✓" : "✕"}
                    </div>
                    <div className="min-w-0 flex-1 text-[13px] font-extrabold leading-relaxed text-[#111827]">
                      {i + 1}. {qq?.text ?? `س${d.questionId}`}
                    </div>
                  </div>
                  <SoundButton ariaLabel="تشغيل الصوت" onClick={() => { /* TTS later */ }} />
                </div>

                <div className="mt-3 grid gap-2 text-[12px] font-semibold text-[#111827]">
                  <div>
                    <span className="font-semibold">إجابتك:</span> {your}
                  </div>
                  <div>
                    <span className="font-semibold">الإجابة الصحيحة:</span> {correct}
                  </div>
                </div>

                <div className="mt-3 rounded-[12px] border border-[#99F6E4] bg-[#F0FDFA] px-4 py-3">
                  <div className="mb-1 text-[13px] font-semibold text-[#0F766E]">الشرح</div>
                  <div className="text-[14px] leading-[1.6] text-[#374151]">{qq?.explanation ?? ""}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (!q) return null;
  const showStreak = streak >= 3 && revealed;

  return (
    <div className="space-y-4" dir="rtl">
      {/* Top bar (matches lesson-quiz screenshot) */}
      <div className="flex items-start justify-between gap-3">
        <div />
        <div className="flex flex-col items-start gap-2">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-[34px] w-[34px] items-center justify-center rounded-full bg-[#F1F5F9] text-[#64748B] transition hover:bg-[#E2E8F0] active:scale-[0.97]"
            aria-label="إغلاق"
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
          <div className="text-[12px] font-extrabold text-[#57534E] dark:text-stone-400" dir="ltr">
            {step + 1}/{total}
          </div>
        </div>
      </div>

      <div className="h-[6px] w-full overflow-hidden rounded-full bg-[#E2E8F0]">
        <motion.div
          className="h-full bg-[#1e3a5f]"
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (step / total) * 100 + (revealed ? 100 / total / 2 : 0))}%` }}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={q.id}
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -16 }}
          className="rounded-2xl border border-[#E2E8F0] bg-white p-6"
          style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          {/* Force visual order: LEFT sound, RIGHT emoji (even in Arabic). */}
          <div className="flex items-start justify-between gap-3" dir="ltr">
            <SoundButton ariaLabel="تشغيل الصوت" onClick={() => { /* TTS later */ }} />
            <p className="min-w-0 flex-1 text-[17px] font-medium leading-[1.75] text-[#111827]" dir="rtl" style={{ textAlign: "right" }}>
              {q.text}
            </p>
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#F8FAFC] text-[22px]" aria-hidden>
              {q.emoji}
            </div>
          </div>

          <div className="my-4 h-px w-full bg-[#F1F5F9]" />

          {(() => {
            const grid = q.type === "tf" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2";
            return (
              <div className={grid}>
                {q.options.map((opt, idx) => {
                  const isSelected = selected.includes(idx);
                  const isCorrectOpt = correct.includes(idx);

                  const showSelectedCorrect = revealed && isSelected && isCorrectOpt;
                  const showSelectedWrong = revealed && isSelected && !isCorrectOpt;
                  const showMissedCorrect = revealed && !isSelected && isCorrectOpt;

                  const borderWidth = "1.5px";
                  const baseCls =
                    "flex min-h-[52px] w-full items-center gap-3 rounded-[12px] px-[18px] py-3 text-[15px] transition ";

                  let cls = baseCls;
                  let style: React.CSSProperties = { borderWidth, borderStyle: "solid" };

                  if (!revealed) {
                    if (isSelected) {
                      cls += "bg-[#1e3a5f]/10";
                      style.borderColor = "#1e3a5f";
                    } else {
                      cls += "bg-white hover:bg-[#F8FAFC]";
                      style.borderColor = "#E2E8F0";
                    }
                  } else {
                    if (showSelectedCorrect || showMissedCorrect) {
                      cls += "bg-[#ECFDF5] font-medium";
                      style.borderColor = "#16A34A";
                    } else if (showSelectedWrong) {
                      cls += "bg-[#FEF2F2] font-medium";
                      style.borderColor = "#DC2626";
                    } else {
                      cls += "bg-white";
                      style.borderColor = "#E2E8F0";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={revealed}
                      onClick={() => pick(idx)}
                      className={cls}
                      style={style}
                    >
                      <span className="min-w-0 flex-1 text-right leading-relaxed text-[#111827]">{opt}</span>
                      <span
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-full"
                        aria-hidden
                        style={{
                          width: 20,
                          height: 20,
                          borderWidth,
                          borderStyle: "solid",
                          borderColor: !revealed
                            ? isSelected
                              ? "#1e3a5f"
                              : "#CBD5E1"
                            : showSelectedCorrect || showMissedCorrect
                              ? "#16A34A"
                              : showSelectedWrong
                                ? "#DC2626"
                                : "#CBD5E1",
                          background:
                            !revealed
                              ? isSelected
                                ? "#1e3a5f"
                                : "transparent"
                              : showSelectedCorrect
                                ? "#16A34A"
                                : showSelectedWrong
                                  ? "#DC2626"
                                  : "transparent",
                          color:
                            showSelectedCorrect || showSelectedWrong ? "#ffffff" : "transparent",
                          fontSize: 12,
                          lineHeight: "1",
                        }}
                      >
                        {revealed ? (showSelectedCorrect ? "✓" : showSelectedWrong ? "✗" : "") : ""}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })()}

          {revealed && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              className="mt-4 overflow-hidden rounded-[12px] border border-[#99F6E4] bg-[#F0FDFA] px-4 py-3"
            >
              <div className="mb-1 text-[13px] font-semibold text-[#0F766E]">الشرح</div>
              <div className="text-[14px] leading-[1.6] text-[#374151]">{q.explanation}</div>
            </motion.div>
          )}

          {showStreak && (
            <p className="mt-4 text-center text-base font-extrabold text-orange-600 dark:text-orange-400">
              🔥 {streak} إجابات صحيحة متتالية!
            </p>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom actions: السابق (right) / تأكيد (center) / التالي (left) */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step <= 0 || submitting}
          className="min-w-[72px] px-2 text-[14px] font-medium text-[#374151] disabled:pointer-events-none disabled:text-[#CBD5E1]"
        >
          السابق
        </button>

        <button
          type="button"
          disabled={(selected?.length ?? 0) === 0 || revealed || submitting}
          onClick={reveal}
          className="h-12 flex-1 rounded-[12px] bg-[#1e3a5f] px-4 text-[15px] font-medium text-white transition hover:bg-[#163056] disabled:bg-[#E2E8F0] disabled:text-[#94A3B8]"
        >
          تأكيد الإجابة
        </button>

        <button
          type="button"
          onClick={() => void goNext()}
          disabled={!revealed || submitting}
          className="min-h-[44px] min-w-[92px] rounded-[12px] border border-[#E2E8F0] bg-white px-3 text-[14px] font-medium text-[#374151] transition hover:bg-[#F8FAFC] hover:border-[#CBD5E1] disabled:pointer-events-none disabled:text-[#CBD5E1]"
        >
          {submitting ? "جاري الحفظ…" : step >= total - 1 ? "إنهاء" : "التالي"}
        </button>
      </div>
    </div>
  );
}
