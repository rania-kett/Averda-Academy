/** السلامة أثناء عملية الكنس - الكنس في المدار — lesson quiz (server-side validation). */

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

export const ROUNDABOUT_SWEEPING_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🛣️",
    text: "أين يجب أن يكون عامل الكنس عند كنس المدار؟",
    options: ["في وسط المدار", "فوق الرصيف", "في اتجاه حركة المرور", "على جانب الطريق السريع"],
    correct: [1],
    explanation: "يجب على عامل الكنس أن يكنس وهو فوق الرصيف، وليس داخل المدار نفسه، للحماية من مخاطر حركة المرور.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🚫",
    text: "يجوز لعامل الكنس الكنس في المدار في اتجاه حركة المرور.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. لا يجب الكنس في المدار في اتجاه حركة المرور، لأن ذلك يعرّض العامل لخطر كبير من السيارات القادمة.",
  },
  {
    id: 3,
    type: "single",
    emoji: "🚧",
    text: "أين يجب وضع المخرط إذا كان متوفراً أثناء الكنس في المدار؟",
    options: ["أمام العامل مباشرة", "بجانب العربة في عكس اتجاه حركة المرور", "خلف العربة في اتجاه حركة المرور", "على الرصيف بعيداً عن المدار"],
    correct: [1],
    explanation: "يجب وضع المخرط بجانب العربة في عكس اتجاه حركة المرور، ليكون تحذيراً للسائقين القادمين.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "📵",
    text: "يمكن لعامل الكنس التحدث في الهاتف أثناء قيامه بعملية الكنس في المدار.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. التحدث في الهاتف أثناء الكنس في المدار ممنوع لأنه يشتت الانتباه ويعرّض العامل للخطر.",
  },
  {
    id: 5,
    type: "single",
    emoji: "🧹",
    text: "من أين يجب على عامل الكنس التقاط النفايات الموجودة في المدار؟",
    options: ["من داخل المدار مباشرة", "فقط من فوق الرصيف", "من وسط الطريق", "من جانب السيارات الواقفة"],
    correct: [1],
    explanation: "يجب التقاط النفايات في المدار فقط من فوق الرصيف، وليس بالنزول إلى داخل المدار.",
  },
  {
    id: 6,
    type: "multi",
    emoji: "✅",
    text: "ما هي الأفعال الصحيحة (ما يجب فعله) أثناء الكنس في المدار؟",
    options: [
      "الكنس وأنت فوق الرصيف",
      "الكنس في اتجاه حركة المرور",
      "وضع المخرط بجانب العربة عكس اتجاه المرور إذا كان متوفراً",
      "التقاط النفايات في المدار فقط من فوق الرصيف",
      "التحدث في الهاتف لتمرير الوقت",
    ],
    correct: [0, 2, 3],
    explanation:
      "الأفعال الصحيحة: الكنس من فوق الرصيف، وضع المخرط عكس اتجاه المرور، والتقاط النفايات من فوق الرصيف. الكنس في اتجاه المرور والتحدث في الهاتف ممنوعان.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "⚠️",
    text: "تحمل عملية الكنس في المدار العديد من المخاطر.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation: "صحيح. الدرس يؤكد أن عملية الكنس في المدار تحمل العديد من المخاطر، ولهذا يجب التقيد بأساسيات السلامة.",
  },
  {
    id: 8,
    type: "single",
    emoji: "👀",
    text: "ما هو الهدف من وضع المخرط بجانب العربة أثناء الكنس في المدار؟",
    options: ["لتعليم الأدوات عليه", "لتنبيه السائقين وتحذيرهم من وجود عامل الكنس", "لتحديد منطقة عمل العامل", "لمنع العربة من التحرك"],
    correct: [1],
    explanation:
      "الغرض من المخرط هو تنبيه السائقين وتحذيرهم من وجود عامل الكنس، ويوضع عكس اتجاه المرور حتى يراه السائقون مبكراً.",
  },
  {
    id: 9,
    type: "multi",
    emoji: "⛔",
    text: "ما هي الأفعال الممنوعة أثناء الكنس في المدار؟",
    options: [
      "الكنس في المدار في اتجاه حركة المرور",
      "التحدث في الهاتف أثناء عملية الكنس في المدار",
      "وضع المخرط عكس اتجاه المرور",
      "الكنس من فوق الرصيف",
      "النزول إلى المدار لالتقاط النفايات مباشرة",
    ],
    correct: [0, 1, 4],
    explanation:
      "الممنوعات: الكنس في اتجاه المرور، التحدث في الهاتف، والنزول إلى المدار لالتقاط النفايات. وضع المخرط والكنس من الرصيف هما الفعل الصحيح.",
  },
  {
    id: 10,
    type: "single",
    emoji: "👷",
    text: "لمن هو موجَّه هذا الدرس التحسيسي؟",
    options: ["السائقين", "عمال الجمع", "عمال الكنس", "مصلحة الصيانة"],
    correct: [2],
    explanation: "هذا الموجز موجَّه لعمال الكنس الذين يعملون في المدارات ويتعرضون لمخاطر حركة المرور يومياً.",
  },
];

export function getRoundaboutSweepingQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return ROUNDABOUT_SWEEPING_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreRoundaboutSweepingAnswers(
  answers: { questionId: number; selectedIndices: number[] }[]
): {
  score: number;
  total: number;
  percentage: number;
  details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[];
} {
  const total = ROUNDABOUT_SWEEPING_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of ROUNDABOUT_SWEEPING_LESSON_QUESTIONS) {
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

