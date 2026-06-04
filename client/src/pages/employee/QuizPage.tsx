import type { AxiosError } from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { quizApi, coursesApi } from "@/api/api";
import type { QuizQuestionJson, LegacyQuizQuestionJson, AiOrderQuestion, AiMultiSelectQuestion, AiMcqQuestion } from "@/types";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import confetti from "canvas-confetti";
import { LanguageToggle } from "@/components/employee/quiz/LanguageToggle";
import { ProgressBar } from "@/components/employee/quiz/ProgressBar";
import { AnswerOption } from "@/components/employee/quiz/AnswerOption";
import { ResultSummary, type QuizResultRow } from "@/components/employee/quiz/ResultSummary";
import { getScoreTier } from "@/components/employee/quiz/scoreTier";
import { SoundButton } from "@/components/SoundButton";
import { useAiSpeak } from "@/hooks/useAiSpeak";
import { vibrateDevice } from "@/utils/vibrateDevice";
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  clearOfflineQuizState,
  loadOfflineQuizState,
  saveOfflineQuizState,
  type OfflineQuizState,
} from "@/components/employee/quiz/offlineQuizStore";

type QuizPhase = "taking" | "results";
type QuizLangKey = "ar" | "fr" | "en";

const DEFAULT_LETTERS = ["A", "B", "C", "D"] as const;
const isLegacy = (q: QuizQuestionJson | undefined | null): q is LegacyQuizQuestionJson =>
  Boolean(q && !("type" in (q as any)));

function shuffleInPlace<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i]!;
    arr[i] = arr[j]!;
    arr[j] = tmp;
  }
  return arr;
}

function remapAnswerToOriginal(selected: unknown, permutation: number[] | null, q: QuizQuestionJson): unknown {
  if (!permutation) return selected;
  if ((q as any).type === "mcq" && typeof selected === "number") {
    return permutation[selected] ?? selected;
  }
  if ((q as any).type === "multi_select" && Array.isArray(selected)) {
    return selected.map((i) => permutation[Number(i)] ?? Number(i));
  }
  return selected;
}

function buildServerAnswers(
  answerMap: Record<string, unknown>,
  questionList: QuizQuestionJson[],
  permutations: Record<string, number[]>
): Record<string, unknown> {
  const byId = new Map(questionList.map((qq) => [Number(qq.id), qq]));
  const out: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(answerMap)) {
    const qq = byId.get(Number(key));
    const perm = permutations[key] ?? null;
    out[key] = qq ? remapAnswerToOriginal(val, perm, qq) : val;
  }
  return out;
}

function sameNumberSet(a: number[], b: number[]): boolean {
  const aa = [...new Set(a)].sort((x, y) => x - y);
  const bb = [...new Set(b)].sort((x, y) => x - y);
  return aa.length === bb.length && aa.every((v, i) => v === bb[i]);
}

function isSelectedAnswerCorrect(q: QuizQuestionJson, selected: unknown): boolean {
  if (isLegacy(q)) return selected === q.correct;
  if ((q as any).type === "true_false") return selected === (q as any).correct;
  if ((q as any).type === "mcq") return selected === (q as AiMcqQuestion).correct_index;
  if ((q as any).type === "multi_select") {
    return Array.isArray(selected) && sameNumberSet(selected.map((x) => Number(x)), (q as AiMultiSelectQuestion).correct_indexes ?? []);
  }
  if ((q as any).type === "order") {
    return Array.isArray(selected) && (q as AiOrderQuestion).correct_order.every((v, i) => Number(selected[i]) === v);
  }
  return false;
}

function pickLangText(v: { ar: string; fr: string; en: string }, lang: QuizLangKey): string {
  return v[lang] || v.ar || v.en;
}

function boolLabel(v: boolean, lang: QuizLangKey): string {
  if (lang === "ar") return v ? "صحيح" : "خطأ";
  if (lang === "fr") return v ? "Vrai" : "Faux";
  return v ? "True" : "False";
}

function formatSelectedAnswer(q: QuizQuestionJson, selected: unknown, lang: QuizLangKey): string {
  if (selected == null) return "—";
  if (isLegacy(q)) {
    const letter = String(selected) as keyof typeof q.options;
    return pickLangText(q.options[letter] ?? q.options.A, lang);
  }
  if ((q as any).type === "true_false") return boolLabel(Boolean(selected), lang);
  if ((q as any).type === "mcq") {
    const qq = q as AiMcqQuestion;
    const idx = Number(selected);
    return qq.options[lang]?.[idx] ?? qq.options.ar[idx] ?? "—";
  }
  if ((q as any).type === "multi_select") {
    const qq = q as AiMultiSelectQuestion;
    const idxs = Array.isArray(selected) ? selected.map((x) => Number(x)) : [];
    return idxs
      .map((i) => qq.options[lang]?.[i] ?? qq.options.ar[i] ?? "")
      .filter(Boolean)
      .join(lang === "ar" ? "، " : ", ");
  }
  if ((q as any).type === "order") {
    const qq = q as AiOrderQuestion;
    const order = Array.isArray(selected) ? selected.map((x) => Number(x)) : [];
    return order
      .map((i, n) => `${n + 1}. ${qq.steps[lang]?.[i] ?? qq.steps.ar[i] ?? ""}`)
      .join(lang === "ar" ? " → " : " → ");
  }
  return String(selected);
}

function formatCorrectAnswer(q: QuizQuestionJson, lang: QuizLangKey): string {
  if (isLegacy(q)) return pickLangText(q.options[q.correct], lang);
  if ((q as any).type === "true_false") return boolLabel(Boolean((q as any).correct), lang);
  if ((q as any).type === "mcq") {
    const qq = q as AiMcqQuestion;
    const idx = qq.correct_index;
    return qq.options[lang]?.[idx] ?? qq.options.ar[idx] ?? "—";
  }
  if ((q as any).type === "multi_select") {
    const qq = q as AiMultiSelectQuestion;
    return (qq.correct_indexes ?? [])
      .map((i) => qq.options[lang]?.[i] ?? qq.options.ar[i] ?? "")
      .filter(Boolean)
      .join(lang === "ar" ? "، " : ", ");
  }
  if ((q as any).type === "order") {
    const qq = q as AiOrderQuestion;
    return qq.correct_order
      .map((i, n) => `${n + 1}. ${qq.steps[lang]?.[i] ?? qq.steps.ar[i] ?? ""}`)
      .join(lang === "ar" ? " → " : " → ");
  }
  return "—";
}

function buildResultRows(
  currentQuestions: QuizQuestionJson[],
  userAnswers: Record<string, unknown>,
  lang: QuizLangKey
): QuizResultRow[] {
  return currentQuestions.map((q) => {
    const selected = userAnswers[String(q.id)];
    const isCorrect = isSelectedAnswerCorrect(q, selected);
    return {
      questionId: q.id,
      emoji: q.emoji ?? null,
      questionText: pickLangText(q.question, lang),
      isCorrect,
      yourAnswer: formatSelectedAnswer(q, selected, lang),
      correctAnswer: formatCorrectAnswer(q, lang),
    };
  });
}

function SortableStepCard({
  id,
  text,
  disabled,
}: {
  id: string;
  text: string;
  disabled: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white p-3 text-sm font-semibold shadow-sm dark:bg-[#1C1917] ${
        disabled ? "border-stone-200 dark:border-white/10" : "border-stone-200 dark:border-white/10"
      }`}
      {...attributes}
      {...listeners}
    >
      {text}
    </div>
  );
}

export function QuizPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { refreshMe } = useAuth();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<QuizQuestionJson[]>([]);
  const [baseQuestions, setBaseQuestions] = useState<QuizQuestionJson[]>([]);
  const [courseTitle, setCourseTitle] = useState("");
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState<unknown>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [phase, setPhase] = useState<QuizPhase>("taking");
  const [isRetryRound, setIsRetryRound] = useState(false);
  const [attemptScore, setAttemptScore] = useState(0);
  const [resultRows, setResultRows] = useState<QuizResultRow[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<QuizQuestionJson[]>([]);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [finishing, setFinishing] = useState(false);
  const [quizSaved, setQuizSaved] = useState(false);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const startTimeRef = useRef<number>(Date.now());
  const initialQuestionsRef = useRef<QuizQuestionJson[]>([]);
  const isRetryRoundRef = useRef(false);
  /** All answers across the session (first attempt + retry corrections), server indices. */
  const cumulativeAnswersRef = useRef<Record<string, unknown>>({});
  const finishPayloadRef = useRef<Record<string, unknown> | null>(null);
  const quizSavedRef = useRef(false);
  const saveInFlightRef = useRef(false);
  /** Maps question id → option permutation when retry shuffles MCQ/multi options. */
  const answerPermutationRef = useRef<Record<string, number[]>>({});
  const [celebrateToken, setCelebrateToken] = useState(0);
  const dndSensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const { speakCourse } = useAiSpeak();
  const [tracking, setTracking] = useState<{ scoreHistory: number[]; retries: number; incorrectQuestions: number[] }>({
    scoreHistory: [],
    retries: 0,
    incorrectQuestions: [],
  });

  const isTakingPhase = phase === "taking";
  const isResultsPhase = phase === "results";

  useEffect(() => {
    isRetryRoundRef.current = isRetryRound;
  }, [isRetryRound]);

  const q = questions[step];
  const total = Math.max(1, questions.length);
  const progressPct = Math.round(((step + 1) / total) * 100);
  const letters = useMemo(() => {
    if (!q || !isLegacy(q)) return DEFAULT_LETTERS;
    const keys = Object.keys(q.options ?? {}) as Array<keyof typeof q.options>;
    const ordered = DEFAULT_LETTERS.filter((k) => keys.includes(k));
    if (ordered.length) return ordered;
    // Fallback (should be rare): keep whatever keys exist.
    return keys as unknown as typeof DEFAULT_LETTERS;
  }, [q]);

  const passedByScore = attemptScore >= 70;
  const correctCount = useMemo(() => resultRows.filter((d) => d.isCorrect).length, [resultRows]);
  const wrongCount = useMemo(() => resultRows.filter((d) => !d.isCorrect).length, [resultRows]);

  useEffect(() => {
    if (!isResultsPhase) return;
    if (attemptScore < 70) return;
    if (celebrateToken <= 0) return;
    const tier = getScoreTier(attemptScore, lang as any);
    confetti({
      particleCount: tier.extraConfetti ? 180 : 100,
      spread: tier.extraConfetti ? 100 : 70,
      origin: { y: 0.6 },
    });
    if (tier.extraConfetti) {
      window.setTimeout(() => confetti({ particleCount: 120, spread: 120, origin: { y: 0.55 } }), 220);
    }
  }, [celebrateToken, isResultsPhase, attemptScore, lang]);

  useEffect(() => {
    if (!courseId) return;
    void (async () => {
      try {
        // Offline resume (if any)
        const offline = loadOfflineQuizState(courseId);
        if (offline?.questions?.length) {
          setQuestions(offline.questions);
          setBaseQuestions(offline.questions);
          setStep(Math.max(0, Math.min(offline.step ?? 0, offline.questions.length - 1)));
          setAnswers((offline.answers ?? {}) as unknown as Record<string, unknown>);
          setTracking(offline.tracking ?? { scoreHistory: [], retries: 0, incorrectQuestions: [] });
        }

        const { data: qz } = await quizApi.get(courseId);
        if (!(qz as { questions?: unknown }).questions) {
          setQuestions([]);
          setLoading(false);
          return;
        }
        const pool = (qz as { questions: QuizQuestionJson[] }).questions;
        setBaseQuestions(pool);
        initialQuestionsRef.current = pool;
        setQuestions(pool);
        const { data: c } = await coursesApi.get(courseId);
        const course = (c as { course: { title: Record<string, string> } }).course;
        setCourseTitle(course.title[lang] || course.title.ar);
      } catch (e) {
        const err = e as AxiosError<{ error?: string }>;
        if (err.response?.status === 403 && err.response?.data?.error === "ASSESSMENT_REQUIRED") {
          toast(
            lang === "ar" ? "أكمل اختبار التقييم أولاً من الرئيسية." : t("common.error"),
            "error"
          );
          navigate("/home", { replace: true });
        } else if (err.response?.status === 403 && err.response?.data?.error === "BASICS_REQUIRED") {
          toast(t("employee.basicsGate.toast"), "error");
          navigate("/courses", { replace: true });
        } else {
          toast(t("common.error"), "error");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, lang, navigate, t, toast]);

  useEffect(() => {
    if (!isTakingPhase || !q) return;
    setTimeLeft(60);
    if (!isLegacy(q) && (q as any).type === "order") {
      setSelected(shuffleInPlace([0, 1, 2, 3]));
    } else {
      setSelected(null);
    }
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
  }, [step, isTakingPhase, q?.id]);

  useEffect(() => {
    if (!courseId) return;
    if (!questions.length) return;
    if (!isTakingPhase) return;
    if (!questions.every((qq) => isLegacy(qq))) return;
    const st: OfflineQuizState = {
      version: 1,
      courseId,
      updatedAt: Date.now(),
      questions: questions as LegacyQuizQuestionJson[],
      step,
      answers: answers as Record<string, string>,
      tracking,
    };
    saveOfflineQuizState(st);
  }, [answers, courseId, phase, questions, step, tracking]);

  const confirmStep = () => {
    if (!q || selected == null) return;
    if (Array.isArray(selected) && selected.length === 0) return;
    if (!isSelectedAnswerCorrect(q, selected)) {
      vibrateDevice();
    }
    setConfirmed(true);
  };

  const buildFullFinishPayload = useCallback((): Record<string, unknown> => {
    return { ...cumulativeAnswersRef.current };
  }, []);

  const persistPassedQuiz = useCallback(
    async (payload: Record<string, unknown>): Promise<boolean> => {
      if (!courseId || Object.keys(payload).length === 0) return false;
      if (quizSavedRef.current) return true;
      setFinishing(true);
      const timeSpent = Math.max(1, Math.floor((Date.now() - startTimeRef.current) / 1000));
      try {
        const { data } = await quizApi.attempt(courseId, { answers: payload, timeSpent });
        const serverScore = (data as { score?: number }).score;
        const serverPassed =
          (data as { passed?: boolean }).passed ?? (serverScore != null && serverScore >= 70);
        if (!serverPassed) {
          toast(
            lang === "ar"
              ? `لم تُحفظ النتيجة (المحاولة: ${serverScore ?? "—"}%). أعد الأسئلة الخاطئة.`
              : t("common.error"),
            "error"
          );
          if (serverScore != null) setAttemptScore(serverScore);
          return false;
        }
        setNewBadges((data as { newBadges?: string[] }).newBadges ?? []);
        quizSavedRef.current = true;
        setQuizSaved(true);
        clearOfflineQuizState(courseId);
        void refreshMe();
        return true;
      } catch (e) {
        const err = e as AxiosError<{ error?: string; message?: string }>;
        const detail = err.response?.data?.error ?? err.response?.data?.message ?? err.message;
        toast(
          lang === "ar"
            ? detail
              ? `تعذّر حفظ النتيجة: ${detail}`
              : "تعذّر حفظ النتيجة — حاول مرة أخرى"
            : t("common.error"),
          "error"
        );
        return false;
      } finally {
        setFinishing(false);
      }
    },
    [courseId, lang, refreshMe, t, toast]
  );

  const submitQuizLocally = (finalAnswers: Record<string, unknown>) => {
    const rows = buildResultRows(questions, finalAnswers, lang as QuizLangKey);
    const correct = rows.filter((r) => r.isCorrect).length;
    const score = Math.round((correct / Math.max(1, questions.length)) * 100);
    const wrong = questions.filter((qq) => {
      const row = rows.find((r) => r.questionId === qq.id);
      return row && !row.isCorrect;
    });

    const poolForMapping = initialQuestionsRef.current.length ? initialQuestionsRef.current : baseQuestions;
    const serverMapped = buildServerAnswers(finalAnswers, poolForMapping, answerPermutationRef.current);
    if (!isRetryRoundRef.current) {
      cumulativeAnswersRef.current = { ...serverMapped };
    } else {
      cumulativeAnswersRef.current = { ...cumulativeAnswersRef.current, ...serverMapped };
    }

    setResultRows(rows);
    setAttemptScore(score);
    setWrongQuestions(wrong);
    setTracking((tr) => ({
      scoreHistory: [...(tr.scoreHistory ?? []), score],
      retries: tr.retries ?? 0,
      incorrectQuestions: wrong.map((qq) => Number((qq as any).id)),
    }));

    if (score >= 70) {
      const fullPayload = buildFullFinishPayload();
      finishPayloadRef.current = fullPayload;
      setCelebrateToken((n) => n + 1);
      if (!quizSavedRef.current && !saveInFlightRef.current) {
        saveInFlightRef.current = true;
        void persistPassedQuiz(fullPayload).finally(() => {
          saveInFlightRef.current = false;
        });
      }
    } else {
      finishPayloadRef.current = null;
      quizSavedRef.current = false;
      setQuizSaved(false);
    }

    setPhase("results");
  };

  const handleFinish = useCallback(async () => {
    if (quizSavedRef.current) {
      navigate("/courses", { replace: true });
      return;
    }
    const payload = finishPayloadRef.current ?? buildFullFinishPayload();
    if (!courseId || Object.keys(payload).length === 0) {
      toast(
        lang === "ar" ? "تعذّر إنهاء الاختبار — أعد المحاولة" : t("common.error"),
        "error"
      );
      return;
    }
    const ok = await persistPassedQuiz(payload);
    if (ok) navigate("/courses", { replace: true });
  }, [buildFullFinishPayload, courseId, lang, navigate, persistPassedQuiz, t, toast]);

  const nextStep = () => {
    if (!q) return;
    if (selected == null) return;
    if (Array.isArray(selected) && selected.length === 0) return;
    const merged = { ...answers, [String(q.id)]: selected };
    if (step >= questions.length - 1) {
      submitQuizLocally(merged);
      return;
    }
    setAnswers(merged);
    setStep((s) => s + 1);
    setConfirmed(false);
    setSelected(null);
  };

  const startRetryWrong = () => {
    answerPermutationRef.current = {};
    setQuestions([...wrongQuestions]);
    setAnswers({});
    setStep(0);
    setSelected(null);
    setConfirmed(false);
    finishPayloadRef.current = null;
    quizSavedRef.current = false;
    setQuizSaved(false);
    saveInFlightRef.current = false;
    setIsRetryRound(true);
    isRetryRoundRef.current = true;
    setPhase("taking");
    setTracking((tr) => ({ ...tr, retries: (tr.retries ?? 0) + 1 }));
    startTimeRef.current = Date.now();
  };

  const resetToOriginalQuiz = () => {
    setQuestions(initialQuestionsRef.current.length ? initialQuestionsRef.current : baseQuestions);
    setAnswers({});
    setStep(0);
    setSelected(null);
    setConfirmed(false);
    setAttemptScore(0);
    setResultRows([]);
    setWrongQuestions([]);
    cumulativeAnswersRef.current = {};
    answerPermutationRef.current = {};
    finishPayloadRef.current = null;
    quizSavedRef.current = false;
    setQuizSaved(false);
    saveInFlightRef.current = false;
    setIsRetryRound(false);
    isRetryRoundRef.current = false;
    setCelebrateToken(0);
    setPhase("taking");
    startTimeRef.current = Date.now();
    setAbandonOpen(false);
  };

  const requestLeaveQuiz = () => {
    if (isRetryRound && phase === "taking") {
      setAbandonOpen(true);
      return;
    }
    if (courseId) navigate(`/courses/${courseId}`);
    else navigate("/courses");
  };

  if (loading) {
    return <div className="h-64 animate-pulse rounded-2xl bg-stone-200 dark:bg-white/5" />;
  }

  if (!questions.length) {
    return (
      <div className="rounded-2xl border border-[#E7E5E4] bg-white p-8 text-center dark:border-[#44403C] dark:bg-[#292524]">
        <p className="text-[#57534E] dark:text-stone-400">{t("employee.viewer.quizSoonLong")}</p>
        <Link to="/courses" className="mt-4 inline-block text-[#1e3a5f] dark:text-[#1e3a5f]">
          {t("employee.quiz.backCourses")}
        </Link>
      </div>
    );
  }

  if (isResultsPhase) {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div />
          <LanguageToggle />
        </div>

        <ResultSummary
          lang={lang as any}
          score={attemptScore}
          correctCount={correctCount}
          wrongCount={wrongCount}
          rows={resultRows}
          passed={passedByScore}
          onFinish={() => void handleFinish()}
          onRetryWrong={startRetryWrong}
          finishing={finishing}
          saved={quizSaved}
        />

        {newBadges.length > 0 && (
          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="rounded-2xl bg-emerald-50 p-4 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
          >
            <span className="font-extrabold">{t("badge.new")}</span> {newBadges.join(", ")}
          </motion.div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={requestLeaveQuiz}
        className="mb-4 inline-flex items-center gap-2 text-sm text-[#57534E] transition hover:text-[#1C1917] dark:text-stone-400 dark:hover:text-[#F5F5F4]"
      >
        <span className="inline-block rtl:rotate-180" aria-hidden>
          ←
        </span>
        {t("nav.backToCourse")}
      </button>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 text-sm font-semibold text-[#57534E] dark:text-stone-400">
          <span className="truncate">{courseTitle}</span>
        </div>
        <LanguageToggle />
      </div>

      <div className="flex items-center justify-between gap-3 text-[13px] font-extrabold text-[#57534E] dark:text-stone-400" dir={lang === "ar" ? "rtl" : "ltr"}>
        <span>
          {lang === "ar" ? `سؤال ${step + 1} من ${total}` : lang === "fr" ? `Question ${step + 1} sur ${total}` : `Question ${step + 1} of ${total}`}
        </span>
        <span dir="ltr">{timeLeft}s</span>
      </div>
      {isRetryRound && phase === "taking" && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-center text-[14px] font-extrabold text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
          {lang === "ar"
            ? `🔄 مراجعة — ${questions.length} سؤال`
            : lang === "fr"
              ? `🔄 Révision — ${questions.length} question(s)`
              : `🔄 Review — ${questions.length} question(s)`}
        </div>
      )}
      <ProgressBar valuePct={progressPct} />

      <AnimatePresence mode="wait">
        {q && (
          <motion.div
            key={q.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="rounded-2xl border border-[#E7E5E4] bg-white p-6 dark:border-[#44403C] dark:bg-[#292524]"
            dir={lang === "ar" ? "rtl" : "ltr"}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              {/* Force visual order: LEFT sound, RIGHT emoji (even in Arabic). */}
              <div className="flex w-full items-start justify-between gap-3" dir="ltr">
                <div className="flex items-center gap-2">
                  <SoundButton
                    ariaLabel="تشغيل الصوت"
                    onClick={() => {
                      if (!courseId) return;
                      void speakCourse({ courseId, lang: lang as any });
                    }}
                  />
                  <span className="text-sm font-medium text-[#374151]">استمع للسؤال</span>
                </div>

                <p
                  className="min-w-0 flex-1 text-xl font-semibold leading-relaxed text-[#1C1917] dark:text-[#F5F5F4]"
                  dir={lang === "ar" ? "rtl" : "ltr"}
                  style={{ textAlign: lang === "ar" ? "right" : "left" }}
                >
                  {q.question[lang as "ar"] || q.question.ar}
                </p>

                {q.emoji ? (
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#1e3a5f]/10 text-[26px]" aria-hidden>
                    {q.emoji}
                  </div>
                ) : (
                  <div className="h-12 w-12 shrink-0" aria-hidden />
                )}
              </div>
            </div>

            {isLegacy(q) ? (
              <>
                <div className="grid gap-3">
                  {letters.map((L) => {
                    const opt = q.options[L as keyof typeof q.options];
                    const text = opt[lang as "ar"] || opt.ar;
                    const isSel = selected === L;
                    return (
                      <AnswerOption
                        key={L}
                        letter={L}
                        text={text}
                        selected={isSel}
                        disabled={confirmed}
                        onSelect={() => !confirmed && setSelected(L)}
                      />
                    );
                  })}
                </div>
                {confirmed && selected != null && (
                  <div
                    className={`mt-4 rounded-xl border p-4 ${
                      selected === q.correct
                        ? "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-900/25 dark:text-emerald-100"
                        : "border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-900/25 dark:text-red-100"
                    }`}
                  >
                    <p className="text-sm font-extrabold">
                      {selected === q.correct
                        ? lang === "ar"
                          ? "✅ إجابة صحيحة"
                          : lang === "fr"
                            ? "✅ Bonne réponse"
                            : "✅ Correct"
                        : lang === "ar"
                          ? "❌ إجابة غير صحيحة"
                          : lang === "fr"
                            ? "❌ Mauvaise réponse"
                            : "❌ Incorrect"}
                    </p>
                    <p className="mt-2 text-[#1C1917] dark:text-[#F5F5F4]">
                      {q.explanation[lang as "ar"] || q.explanation.ar}
                    </p>
                  </div>
                )}
              </>
            ) : (
              <>
                {String((q as any).type) === "true_false" ? (
                  <div className="grid gap-3">
                    <button
                      type="button"
                      disabled={confirmed}
                      onClick={() => !confirmed && setSelected(true)}
                      className={`h-14 w-full rounded-xl border px-4 text-[15px] font-extrabold transition ${
                        selected === true ? "border-emerald-400 bg-emerald-50 text-emerald-900" : "border-stone-200 bg-white text-stone-900"
                      } dark:border-white/10 dark:bg-[#1C1917] dark:text-white`}
                    >
                      {lang === "ar" ? "✓ صحيح" : lang === "fr" ? "✓ Vrai" : "✓ True"}
                    </button>
                    <button
                      type="button"
                      disabled={confirmed}
                      onClick={() => !confirmed && setSelected(false)}
                      className={`h-14 w-full rounded-xl border px-4 text-[15px] font-extrabold transition ${
                        selected === false ? "border-emerald-400 bg-emerald-50 text-emerald-900" : "border-stone-200 bg-white text-stone-900"
                      } dark:border-white/10 dark:bg-[#1C1917] dark:text-white`}
                    >
                      {lang === "ar" ? "✗ خطأ" : lang === "fr" ? "✗ Faux" : "✗ False"}
                    </button>
                  </div>
                ) : String((q as any).type) === "multi_select" ? (
                  <div className="grid gap-3">
                    <div className="text-xs font-extrabold text-[#57534E] dark:text-stone-400">
                      {lang === "ar"
                        ? "اختر كل الإجابات الصحيحة"
                        : lang === "fr"
                          ? "Sélectionnez toutes les bonnes réponses"
                          : "Select all that apply"}
                    </div>
                    {((q as AiMultiSelectQuestion).options?.[lang as "ar"] ?? []).slice(0, 4).map((opt, idx) => {
                      const arr = Array.isArray(selected) ? (selected as number[]) : [];
                      const checked = arr.includes(idx);
                      return (
                        <label
                          key={idx}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-4 py-3 text-sm font-semibold transition dark:bg-[#1C1917] ${
                            checked ? "border-[#1e3a5f] ring-2 ring-[#1e3a5f]/15" : "border-stone-200 dark:border-white/10"
                          }`}
                        >
                          <input
                            type="checkbox"
                            disabled={confirmed}
                            checked={checked}
                            onChange={() => {
                              if (confirmed) return;
                              const cur = Array.isArray(selected) ? (selected as number[]) : [];
                              const next = checked ? cur.filter((x) => x !== idx) : [...cur, idx];
                              setSelected(next);
                            }}
                            className="h-5 w-5 accent-[#1e3a5f]"
                          />
                          <span className="min-w-0 flex-1">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : String((q as any).type) === "order" ? (
                  <div className="grid gap-3">
                    <div className="text-xs font-extrabold text-[#57534E] dark:text-stone-400">
                      {lang === "ar" ? "رتّب الخطوات" : lang === "fr" ? "Ordonnez les étapes" : "Order the steps"}
                    </div>
                    <DndContext
                      collisionDetection={closestCenter}
                      sensors={dndSensors}
                      onDragEnd={(ev) => {
                        if (confirmed) return;
                        const activeId = String(ev.active.id);
                        const overId = ev.over ? String(ev.over.id) : null;
                        if (!overId || activeId === overId) return;
                        const cur = Array.isArray(selected) ? (selected as number[]) : [0, 1, 2, 3];
                        const ids = cur.map((x) => String(x));
                        const oldIndex = ids.indexOf(activeId);
                        const newIndex = ids.indexOf(overId);
                        if (oldIndex < 0 || newIndex < 0) return;
                        setSelected(arrayMove(cur, oldIndex, newIndex));
                      }}
                    >
                      <SortableContext
                        items={(Array.isArray(selected) ? (selected as number[]) : [0, 1, 2, 3]).map((x) => String(x))}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="grid gap-2">
                          {(Array.isArray(selected) ? (selected as number[]) : [0, 1, 2, 3]).map((idx) => {
                            const label = ((q as AiOrderQuestion).steps?.[lang as "ar"] ?? [])[idx] ?? "";
                            return (
                              <SortableStepCard key={String(idx)} id={String(idx)} text={label} disabled={confirmed} />
                            );
                          })}
                        </div>
                      </SortableContext>
                    </DndContext>
                  </div>
                ) : (
                  <div className="grid gap-3">
                    {((q as AiMcqQuestion).options?.[lang as "ar"] ?? []).slice(0, 4).map((opt, idx) => {
                      const isSel = selected === idx;
                      const letter = (["A", "B", "C", "D"] as const)[idx] ?? "A";
                      return (
                        <AnswerOption
                          key={idx}
                          letter={letter}
                          text={opt}
                          selected={isSel}
                          disabled={confirmed}
                          onSelect={() => !confirmed && setSelected(idx)}
                        />
                      );
                    })}
                  </div>
                )}

                {confirmed && (
                  <div className="mt-4 rounded-xl border border-stone-200 bg-stone-50 p-4 text-stone-900 dark:border-white/10 dark:bg-white/5 dark:text-white">
                    <p className="text-sm font-extrabold">
                      {lang === "ar" ? "تم تأكيد الإجابة" : lang === "fr" ? "Réponse confirmée" : "Answer confirmed"}
                    </p>
                    <p className="mt-2">{(q as any).explanation?.[lang as "ar"] ?? (q as any).explanation?.ar ?? ""}</p>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex justify-center gap-2">
        {questions.map((_, i) => (
          <div
            key={i}
            className={`h-2 w-2 rounded-full ${
              i <= step ? "bg-[#1e3a5f]" : "bg-stone-300 dark:bg-zinc-600"
            }`}
          />
        ))}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 bg-[#FAFAF7] px-4 pb-[env(safe-area-inset-bottom)] pt-3 dark:bg-[#1C1917]">
        <div className="flex gap-3">
        {!confirmed ? (
          <button
            type="button"
            disabled={selected == null || (Array.isArray(selected) && selected.length === 0)}
            onClick={confirmStep}
            className="flex-1 h-14 rounded-xl bg-[#1e3a5f] font-bold text-white transition hover:bg-[#163056] disabled:opacity-40 active:scale-95"
          >
            {t("employee.quiz.confirm")}
          </button>
        ) : (
          <button
            type="button"
            onClick={nextStep}
            className="flex-1 h-14 rounded-xl bg-[#1e3a5f] font-bold text-white transition hover:bg-[#163056] active:scale-95"
          >
            {step >= questions.length - 1 ? t("common.confirm") : t("employee.quiz.nextQ")}
          </button>
        )}
        </div>
      </div>

      {abandonOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl dark:bg-[#292524]" dir={lang === "ar" ? "rtl" : "ltr"}>
            <p className="text-[15px] font-extrabold text-[#1C1917] dark:text-white">
              {lang === "ar"
                ? "هل تريد التخلي؟ سيتم اعتبار الاختبار غير مكتمل"
                : lang === "fr"
                  ? "Abandonner ? Le quiz sera considéré comme non terminé."
                  : "Leave? The quiz will be considered incomplete."}
            </p>
            <div className="mt-4 flex gap-3">
              <button
                type="button"
                onClick={() => setAbandonOpen(false)}
                className="flex-1 min-h-[48px] rounded-xl border border-[#E7E5E4] bg-white font-bold text-[#1C1917] dark:border-[#44403C] dark:bg-[#1C1917] dark:text-white"
              >
                {lang === "ar" ? "متابعة" : lang === "fr" ? "Continuer" : "Continue"}
              </button>
              <button
                type="button"
                onClick={resetToOriginalQuiz}
                className="flex-1 min-h-[48px] rounded-xl bg-red-600 font-bold text-white"
              >
                {lang === "ar" ? "تخلي" : lang === "fr" ? "Abandonner" : "Leave"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
