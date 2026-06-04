/** تعليمات للسائق قبل بداية العمل — lesson quiz (server-side validation). */

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

export const DRIVER_PREWORK_INSTRUCTIONS_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🕒",
    text: "متى يجب على السائق إجراء اختبارات السلامة على شاحنته؟",
    options: ["في نهاية يوم العمل فقط", "مرة في الأسبوع", "قبل بدء العمل كل يوم", "عند ظهور عطل فقط"],
    correct: [2],
    explanation:
      "يجب على كل سائق إجراء اختبارات السلامة قبل بدء العمل. هذه الدقائق القليلة يمكن أن تمنع حوادث جسيمة إذا تم القيام بها بشكل صحيح.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🔺",
    text: "يجب التأكد من أن المثلث العاكس متوفر في مقصورة الشاحنة قبل بداية العمل.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. التأكد من توفر المثلث العاكس في المقصورة هو أحد بنود فحص السلامة الإلزامية قبل بداية العمل.",
  },
  {
    id: 3,
    type: "multi",
    emoji: "🧰",
    text: "ما هي العناصر التي يجب على السائق فحصها قبل بداية العمل؟",
    options: [
      "طفاية الحريق والمثلث العاكس",
      "الأضواء والمنبه المسموع",
      "لون الشاحنة ونظافة الهيكل الخارجي",
      "مسند القدمين وسلك الونش",
      "خزان الوقود والتأكد من عدم وجود تسريب للبنزين",
    ],
    correct: [0, 1, 3, 4],
    explanation:
      "يجب فحص: طفاية الحريق والمثلث العاكس، الأضواء والمنبه، مسند القدمين وسلك الونش، وخزان الوقود والتسريبات. لون الشاحنة ليس من بنود الفحص.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "⛽",
    text: "يمكن للسائق الانطلاق حتى لو لاحظ تسريباً للبنزين إذا كان بسيطاً.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يجب التأكد من عدم وجود أي تسريب للبنزين قبل الانطلاق، والإبلاغ عن أي خلل لمصلحة مراقبة الشاحنات.",
  },
  {
    id: 5,
    type: "single",
    emoji: "📣",
    text: "ماذا يجب على السائق فعله عند اكتشاف أي خلل في الشاحنة قبل بداية العمل؟",
    options: ["الانطلاق وإصلاح الخلل لاحقاً", "الإبلاغ عنه لمصلحة مراقبة الشاحنات", "إصلاحه بنفسه دون إخبار أحد", "تجاهله إذا كان بسيطاً"],
    correct: [1],
    explanation:
      "يجب الإبلاغ عن أي خلل لمصلحة مراقبة الشاحنات، وعدم الانطلاق حتى تتم معالجة المشكلة.",
  },
  {
    id: 6,
    type: "single",
    emoji: "🪝",
    text: "لماذا يجب فحص سلك الونش قبل بداية العمل؟",
    options: ["للتأكد من أنه غير تالف ومشحم جيداً", "للتأكد من أن لونه جيد", "للتأكد من طوله الكافي", "لأن ذلك مطلوب قانونياً فقط"],
    correct: [0],
    explanation:
      "يجب التحقق من سلك الونش والتأكد من أنه غير تالف ومشحم جيداً، لأن سلك الونش التالف قد يتسبب في حوادث أثناء العمل.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "🧷",
    text: "يجب على السائق ارتداء حزام الأمان قبل الانطلاق.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation: "صحيح. ارتداء حزام الأمان هو أحد بنود التعليمات الإلزامية للسائق قبل بداية العمل.",
  },
  {
    id: 8,
    type: "multi",
    emoji: "🪞",
    text: "ما الذي يجب على السائق التحقق منه بخصوص المرايا والزجاج الأمامي؟",
    options: [
      "التأكد من خلوها من الشقوق",
      "التأكد من نظافتها من الأوساخ",
      "تعديلها بما يلائم السائق",
      "التأكد من إمكانية رؤية كل الجهات",
      "التأكد من أن لونها مناسب",
    ],
    correct: [0, 1, 2, 3],
    explanation:
      "يجب فحص المرايا والزجاج للتأكد من خلوها من الشقوق والأوساخ، وتعديلها بما يلائم السائق، والتأكد من إمكانية رؤية كل الجهات.",
  },
  {
    id: 9,
    type: "single",
    emoji: "🛑",
    text: "ما الهدف من إجراء اختبارات السلامة قبل بداية العمل؟",
    options: ["استيفاء الإجراءات الإدارية فقط", "منع حوادث جسيمة قبل وقوعها", "التأكد من نظافة الشاحنة", "تسريع وقت الانطلاق"],
    correct: [1],
    explanation:
      "الهدف الرئيسي هو منع الحوادث الجسيمة. الدرس يؤكد أن هذه الدقائق القليلة يمكن أن تمنع حوادث خطيرة إذا تم القيام بها بشكل صحيح.",
  },
  {
    id: 10,
    type: "multi",
    emoji: "🔧",
    text: "ما هي بنود فحص السلامة المتعلقة بحالة الآلية وأدائها؟",
    options: [
      "التحقق من عدم صدور أصوات غير معتادة",
      "التأكد من أن انبعاث الدخان مقبول",
      "التأكد من أن جميع الأضواء في حالة جيدة",
      "التأكد من نظافة المقاعد الداخلية",
      "فحص مسند القدمين",
    ],
    correct: [0, 1, 2, 4],
    explanation:
      "بنود فحص الآلية تشمل: عدم صدور أصوات غير معتادة، انبعاث الدخان المقبول، الأضواء في حالة جيدة، وفحص مسند القدمين. نظافة المقاعد ليست من بنود الفحص.",
  },
];

export function getDriverPreWorkInstructionsQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return DRIVER_PREWORK_INSTRUCTIONS_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreDriverPreWorkInstructionsAnswers(
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
  const total = DRIVER_PREWORK_INSTRUCTIONS_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of DRIVER_PREWORK_INSTRUCTIONS_LESSON_QUESTIONS) {
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

