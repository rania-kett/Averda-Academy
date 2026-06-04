/** عملية الكبس وكبس الحاويات — lesson quiz (server-side validation). */

export type LessonQuizDef = {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  /** Indices into `options` */
  correct: number[];
  explanation: string;
};

export const COMPACTION_CONTAINERS_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "tf",
    emoji: "🧤",
    text: "يمكن لعامل الجمع استخدام يديه لإدخال النفايات داخل المكبس إذا كانت النفايات صغيرة الحجم.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يُمنع منعاً باتاً استخدام اليدين أو أي شيء آخر لإدخال النفايات داخل المكبس تحت أي ظرف أو مبرر.",
  },
  {
    id: 2,
    type: "single",
    emoji: "🛠️",
    text: "ما الذي يجب على العامل فعله إذا وقع عطل في آلية الرفع؟",
    options: [
      "رفع الحاوية بمساعدة يده",
      "الاستعانة بزميل لرفع الحاوية معاً",
      "عدم رفع الحاوية بيده وإبلاغ الجهة المختصة",
      "الانتظار حتى تعود الآلية للعمل تلقائياً",
    ],
    correct: [2],
    explanation:
      "إذا وقع عطل في آلية الرفع، يُمنع رفع الحاوية بمساعدة اليد مطلقاً، ويجب إبلاغ الجهة المختصة للتدخل.",
  },
  {
    id: 3,
    type: "single",
    emoji: "🛑",
    text: "أين يجب أن يقف العامل دائماً أثناء عملية الكبس؟",
    options: ["على الجانب الخلفي للشاحنة", "بجانب زر إيقاف آلية الضغط", "أمام الحاوية مباشرة", "على مسند القدم"],
    correct: [1],
    explanation:
      "يجب دائماً أن يقف عامل بجانب زر إيقاف آلية الضغط، حتى يتمكن من إيقاف العملية فوراً في حالة الخطر.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "🎓",
    text: "يجوز لعامل الجمع تشغيل آلية الضغط حتى لو لم يكن مدرباً عليها، طالما أن زميله يشرف عليه.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. لا يجوز تشغيل آلية الضغط إطلاقاً إن لم يكن العامل مدرباً جيداً عليها، بغض النظر عن وجود إشراف أو عدمه.",
  },
  {
    id: 5,
    type: "multi",
    emoji: "🚫",
    text: "ما هي التصرفات المحظورة على عامل الجمع خلال عملية الكبس؟",
    options: [
      "لمس الشفرة أثناء تشغيلها",
      "فحص أدوات وحبال الرفع",
      "استخدام القدمين لدفع النفايات داخل المكبس",
      "الوقوف بجانب زر الإيقاف",
      "رفع الحاوية بالأيدي عند عطل آلية الرفع",
    ],
    correct: [0, 2, 4],
    explanation:
      "التصرفات المحظورة هي: لمس الشفرة أثناء التشغيل، استخدام القدمين لدفع النفايات، ورفع الحاوية بالأيدي عند العطل. أما فحص الأدوات والوقوف بجانب زر الإيقاف فهما واجبان.",
  },
  {
    id: 6,
    type: "single",
    emoji: "📣",
    text: "ماذا يجب على العامل فعله عند ملاحظة أي ضرر في أدوات أو حبال الرفع؟",
    options: ["الاستمرار في العمل بحذر", "إصلاح الضرر بنفسه", "الإبلاغ عن الضرر فوراً", "تجنب استخدام آلية الرفع فقط"],
    correct: [2],
    explanation:
      "يجب الإبلاغ عن أي ضرر في أدوات أو حبال الرفع فوراً، ولا يجوز الاستمرار في العمل أو محاولة الإصلاح الذاتي.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "⛔",
    text: "يمكن لعامل الجمع الوقوف على الجانب الخلفي واستخدام قدميه لدفع النفايات داخل المكبس لتوفير الوقت.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يُمنع منعاً باتاً الوقوف على الجانب الخلفي واستخدام القدمين لدفع النفايات داخل المكبس، لأن ذلك يعرّض حياة العامل لخطر جسيم.",
  },
  {
    id: 8,
    type: "multi",
    emoji: "✅",
    text: "ما هي التصرفات الصحيحة الواجبة على عامل الجمع خلال عملية الكبس؟",
    options: [
      "الوقوف دائماً بجانب زر إيقاف آلية الضغط",
      "فحص كل أدوات وحبال الرفع قبل العمل",
      "لمس الشفرة للتأكد من توقفها",
      "الإبلاغ عن أي ضرر فوراً",
      "تشغيل آلية الضغط بدون تدريب في حالات الطوارئ",
    ],
    correct: [0, 1, 3],
    explanation:
      "التصرفات الصحيحة هي: الوقوف بجانب زر الإيقاف، فحص أدوات الرفع، والإبلاغ الفوري عن أي ضرر. أما لمس الشفرة أو تشغيل الآلية بدون تدريب فمحظوران.",
  },
  {
    id: 9,
    type: "single",
    emoji: "🚨",
    text: "لماذا يجب أن يقف عامل دائماً بجانب زر إيقاف آلية الضغط؟",
    options: ["لتشغيل الآلية عند الحاجة", "لإيقاف العملية فوراً في حالة الخطر", "لمراقبة كمية النفايات داخل المكبس", "لتنظيم دخول الحاويات"],
    correct: [1],
    explanation:
      "يجب الوقوف بجانب زر إيقاف آلية الضغط لإمكانية إيقاف العملية فوراً في حالة الخطر وتفادي وقوع حوادث.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🧩",
    text: "ما الوصف الصحيح لطبيعة مخاطر عملية الجمع وفق هذا الدرس؟",
    options: [
      "مخاطر نادرة ومحدودة",
      "مخاطر متعددة تستوجب الالتزام التام بتعليمات السلامة",
      "مخاطر تخص السائق فقط دون العمال",
      "مخاطر يمكن تجاهلها عند الخبرة الكافية",
    ],
    correct: [1],
    explanation:
      "وفق الدرس، تتخلل عملية الجمع مخاطر متعددة، لذلك يجب على جميع العاملين الالتزام التام بتعليمات السلامة دون استثناء أو تهاون.",
  },
];

export function getCompactionContainersQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return COMPACTION_CONTAINERS_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreCompactionContainersAnswers(
  answers: { questionId: number; selectedIndices: number[] }[]
): {
  score: number;
  total: number;
  percentage: number;
  details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[];
} {
  const total = COMPACTION_CONTAINERS_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of COMPACTION_CONTAINERS_LESSON_QUESTIONS) {
    const sub = answers.find((a) => a.questionId === q.id);
    const selected = Array.isArray(sub?.selectedIndices) ? sub!.selectedIndices : [];
    const aa = Array.from(new Set(selected)).sort((a, b) => a - b);
    const bb = Array.from(new Set(q.correct)).sort((a, b) => a - b);
    const is_correct = aa.length === bb.length && aa.every((v, i) => v === bb[i]);
    if (is_correct) score++;
    details.push({ questionId: q.id, selected, correct: q.correct, is_correct });
  }

  const percentage = Math.round((score / total) * 100);
  return { score, total, percentage, details };
}

