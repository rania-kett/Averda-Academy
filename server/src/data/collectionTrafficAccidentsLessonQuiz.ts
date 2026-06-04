/** تجنب حوادث السير أثناء الجمع — lesson quiz (server-side validation). */

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

export const COLLECTION_TRAFFIC_ACCIDENTS_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "📏",
    text: "كم المسافة الدنيا التي يجب أن يقف عليها عامل الجمع خلف الشاحنة أثناء الرجوع للخلف؟",
    options: [
      "أكثر من 5 أمتار للخلف أو متر واحد من الجانب",
      "متر واحد للخلف أو نصف متر من الجانب",
      "3 أمتار للخلف أو متران من الجانب",
      "لا توجد مسافة محددة",
    ],
    correct: [0],
    explanation:
      "يجب أن يقف عامل الجمع على أكثر من 5 أمتار للخلف أو متر واحد من جانب الشاحنة، لتفادي خطر عصارة النفايات والاصطدام.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "📵",
    text: "يمكن لعامل الجمع التحدث في الهاتف أثناء رجوع الشاحنة للخلف إذا كانت المكالمة مهمة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. لا يجوز على الإطلاق التحدث في الهاتف أثناء رجوع الشاحنة للخلف، لأن ذلك يشتت الانتباه ويعرّض الحياة للخطر.",
  },
  {
    id: 3,
    type: "single",
    emoji: "🚚",
    text: "ما هو دور عامل الجمع أثناء رجوع الشاحنة للخلف؟",
    options: [
      "الانتظار بعيداً حتى تتوقف الشاحنة",
      "إعطاء إشارات واضحة لسائق الشاحنة وتحذير المشاة والمركبات",
      "التقاط النفايات المجاورة لتوفير الوقت",
      "التحدث مع المواطنين لإبعادهم عن المنطقة",
    ],
    correct: [1],
    explanation:
      "يجب على عامل الجمع إعطاء إشارات واضحة لسائق الشاحنة وتحذير العربات والمشاة ومساعدة السائق على العمل بأمان.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "⛔",
    text: "يجوز لعامل الجمع امتطاء مسند القدم أثناء رجوع الشاحنة للوراء.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يُمنع منعاً باتاً امتطاء مسند القدم أثناء رجوع الشاحنة للوراء لأن ذلك يشكل خطراً جسيماً على سلامة العامل.",
  },
  {
    id: 5,
    type: "multi",
    emoji: "🚫",
    text: "ما هي التصرفات الممنوعة على عامل الجمع أثناء رجوع الشاحنة للخلف؟",
    options: [
      "التحدث في الهاتف",
      "إعطاء إشارات للسائق",
      "التناقش مع المواطنين",
      "التقاط النفايات",
      "امتطاء مسند القدم",
    ],
    correct: [0, 2, 3, 4],
    explanation:
      "التصرفات الممنوعة هي: التحدث في الهاتف، التناقش مع المواطنين، التقاط النفايات، وامتطاء مسند القدم. أما إعطاء الإشارات للسائق فهو واجب وليس ممنوعاً.",
  },
  {
    id: 6,
    type: "single",
    emoji: "🛡️",
    text: "لماذا يجب على عامل الجمع إعطاء إشارات واضحة لسائق الشاحنة عند الانطلاق؟",
    options: [
      "لتسريع عملية الجمع",
      "لمنع الاصطدام بالمارة أو المركبات الأخرى",
      "لإعلام الجيران ببدء العمل",
      "لا داعي لإعطاء إشارات عند الانطلاق",
    ],
    correct: [1],
    explanation:
      "يجب إعطاء إشارات واضحة للسائق عند الرجوع للخلف وعند الانطلاق لمنع الاصطدام بالمارة أو المركبات الأخرى وضمان سلامة الجميع.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "🧠",
    text: "يمكن لعامل الجمع التناقش مع المواطنين بسرعة أثناء رجوع الشاحنة للخلف طالما أنه يراقب الشاحنة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. لا يجوز التناقش مع المواطنين أثناء رجوع الشاحنة للخلف تحت أي ظرف، لأن ذلك يشتت الانتباه ويمنع العامل من القيام بمهمة التوجيه والتحذير بشكل صحيح.",
  },
  {
    id: 8,
    type: "multi",
    emoji: "✅",
    text: "ما هي التصرفات الصحيحة التي يجب على عامل الجمع القيام بها لمنع حوادث السير؟",
    options: [
      "الوقوف على مسافة آمنة من الشاحنة",
      "التقاط النفايات بسرعة أثناء رجوع الشاحنة",
      "إعطاء إشارات واضحة للسائق",
      "تحذير المشاة والمركبات الأخرى",
      "استخدام الهاتف للتنسيق مع الفريق",
    ],
    correct: [0, 2, 3],
    explanation:
      "التصرفات الصحيحة هي: الوقوف على مسافة آمنة، إعطاء إشارات واضحة للسائق، وتحذير المشاة والمركبات. أما التقاط النفايات أثناء الرجوع أو استخدام الهاتف فممنوعان.",
  },
  {
    id: 9,
    type: "single",
    emoji: "👷",
    text: "لمن هو موجَّه هذا الموجز التحسيسي الأسبوعي؟",
    options: ["السائقين فقط", "عمال الكنس", "عمال الجمع", "مصلحة الصيانة"],
    correct: [2],
    explanation:
      "هذا الموجز التحسيسي الأسبوعي موجَّه لعمال الجمع، الذين يعملون مع شاحنات النفايات ويتعرضون لمخاطر خاصة أثناء عمليات الجمع.",
  },
  {
    id: 10,
    type: "single",
    emoji: "⚠️",
    text: "ما الخطر الرئيسي الذي يتناوله هذا الدرس فيما يخص الشاحنة؟",
    options: [
      "خطر انفجار الإطارات",
      "مخاطر عصارة النفايات والرجوع للخلف",
      "خطر تسرب الوقود",
      "خطر ارتفاع درجة حرارة المحرك",
    ],
    correct: [1],
    explanation:
      "يتناول الدرس بشكل خاص مخاطر عصارة النفايات وخطر رجوع الشاحنة للخلف، وكيفية تفاديها من خلال المسافة الآمنة والإشارات الصحيحة.",
  },
];

export function getCollectionTrafficAccidentsQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return COLLECTION_TRAFFIC_ACCIDENTS_LESSON_QUESTIONS.map(
    ({ id, type, emoji, text, options, correct, explanation }) => ({
      id,
      type,
      emoji,
      text,
      options,
      correct,
      explanation,
    })
  );
}

export function scoreCollectionTrafficAccidentsAnswers(
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
  const total = COLLECTION_TRAFFIC_ACCIDENTS_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of COLLECTION_TRAFFIC_ACCIDENTS_LESSON_QUESTIONS) {
    const sub = answers.find((a) => a.questionId === q.id);
    const selected = Array.isArray(sub?.selectedIndices) ? sub!.selectedIndices : [];
    const aa = Array.from(new Set(selected)).sort((a, b) => a - b);
    const bb = Array.from(new Set(q.correct)).sort((a, b) => a - b);
    const is_correct = aa.length === bb.length && aa.every((v, i) => v === bb[i]);
    if (is_correct) score++;
    details.push({
      questionId: q.id,
      selected,
      correct: q.correct,
      is_correct,
    });
  }

  const percentage = Math.round((score / total) * 100);
  return { score, total, percentage, details };
}

