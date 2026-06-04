/** القيادة إلى الخلف — lesson quiz (server-side validation). */

export type LessonQuizDef = {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
};

export const REVERSE_DRIVING_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "📏",
    text: "على أي مسافة يجب أن يقف المساعد خلف المركبة أثناء القيادة إلى الخلف؟",
    options: ["1 إلى 3 أمتار", "5 إلى 10 أمتار", "10 إلى 15 متراً", "أكثر من 15 متراً"],
    correct: [1],
    explanation:
      "يجب على المساعد الوقوف على مسافة 5 إلى 10 أمتار خلف المركبة، أو متراً عن جانبها، بحيث يمكن للسائق رؤيته في جميع الأوقات.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "⛔",
    text: "يجوز للمساعد الوقوف مباشرة خلف الآلية لإعطاء الإشارات بشكل أوضح.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. لا يجوز أبداً الوقوف مباشرة خلف أو قريباً من الآلية لأن ذلك يعرّض المساعد لخطر الدهس.",
  },
  {
    id: 3,
    type: "single",
    emoji: "👀",
    text: "ما الذي يجب على السائق فعله قبل الرجوع بالآلية إلى الخلف؟",
    options: [
      "الاعتماد على المرايا فقط",
      "التأكد من عدم وجود أي شخص أو خطر بالمشي والنظر حول المركبة",
      "تشغيل المنبه والرجوع مباشرة",
      "الانتظار حتى يُشير المساعد",
    ],
    correct: [1],
    explanation: "يجب على السائق التأكد من عدم وجود أي شخص أو خطر قريب عبر المشي والنظر حول المركبة قبل الصعود والرجوع.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "❓",
    text: "يمكن للسائق الرجوع بالآلية إلى الخلف حتى لو لم يكن متأكداً، إذا كان المساعد موجوداً.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. السائق لا يرجع بالآلية إلى الخلف إن لم يكن متأكداً من عدم وجود أي خطر، حتى لو كان المساعد موجوداً.",
  },
  {
    id: 5,
    type: "single",
    emoji: "🧭",
    text: "لماذا يجب أن يكون المساعد مرئياً للسائق في جميع الأوقات؟",
    options: [
      "لكي يتمكن السائق من التواصل معه بالكلام",
      "حتى يتمكن السائق من اتباع إشاراته وتفادي الاصطدام",
      "لأن ذلك شرط قانوني فقط",
      "لتسريع عملية الرجوع",
    ],
    correct: [1],
    explanation: "يجب أن يكون المساعد مرئياً دائماً حتى يتمكن السائق من اتباع إشاراته الواضحة وتفادي الاصطدام بالمشاة أو المركبات.",
  },
  {
    id: 6,
    type: "multi",
    emoji: "🦺",
    text: "ما هي مهام المساعد أثناء القيادة إلى الخلف؟",
    options: ["إرشاد السائق بإشارات واضحة", "تحذير المركبات والمارة من الاقتراب", "قيادة الآلية بدلاً من السائق", "مساعدة السائق على التحرك أو الرجوع الآمن", "الوقوف مباشرة خلف الآلية"],
    correct: [0, 1, 3],
    explanation:
      "مهام المساعد: إرشاد السائق بإشارات واضحة، تحذير المركبات والمارة، ومساعدة السائق على التحرك الآمن. الوقوف خلف الآلية مباشرة ممنوع.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "🚫",
    text: "يمكن للمساعد المشي إلى الوراء أثناء إعطاء الإشارات للسائق.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. لا يجوز للمساعد المشي إلى الوراء عند إعطاء الإشارات، لأن ذلك يجعله عرضة للسقوط أو الاصطدام.",
  },
  {
    id: 8,
    type: "single",
    emoji: "🪞",
    text: "ما هي النقاط المخفية التي يذكرها الدرس؟",
    options: ["مناطق لا يراها المساعد", "مناطق لا تستطيع المرايا إظهارها للسائق", "أجزاء من الآلية لا يُمكن إصلاحها", "مناطق محظورة في الطريق"],
    correct: [1],
    explanation:
      "النقاط المخفية هي المناطق التي لا تستطيع المرايا إظهارها للسائق. يمكن تقليلها بتعديل المرايا والمقعد، ولهذا يُطلب دائماً مساعدة شخص آخر.",
  },
  {
    id: 9,
    type: "multi",
    emoji: "✅",
    text: "ما هي التعليمات الصحيحة للسائق عند القيادة إلى الخلف؟",
    options: [
      "التأكد من خلو المحيط بالمشي حول المركبة قبل الصعود",
      "طلب المساعدة دائماً من الآخرين",
      "الاعتماد على المرايا فقط دون مساعد",
      "عدم الرجوع إن لم يكن متأكداً من الخلف",
      "تعديل المرايا والمقعد لتقليل النقاط المخفية",
    ],
    correct: [0, 1, 3, 4],
    explanation:
      "التعليمات الصحيحة: التأكد من خلو المحيط، طلب المساعدة، عدم الرجوع عند الشك، وتعديل المرايا والمقعد. الاعتماد على المرايا وحدها غير كافٍ.",
  },
  {
    id: 10,
    type: "single",
    emoji: "👷",
    text: "لمن هو موجَّه هذا الدرس التحسيسي بشكل رئيسي؟",
    options: ["عمال الكنس", "عمال الجمع فقط", "السائقين وعمال العمليات الخاصة", "مصلحة الصيانة"],
    correct: [2],
    explanation:
      "هذا الموجز موجَّه للسائقين وعمال العمليات الخاصة، إذ يتضمن تعليمات مفصّلة لكلا الطرفين: المساعد والسائق.",
  },
];

export function getReverseDrivingQuestionsForClient() {
  return REVERSE_DRIVING_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreReverseDrivingAnswers(answers: { questionId: number; selectedIndices: number[] }[]) {
  const total = REVERSE_DRIVING_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];
  for (const q of REVERSE_DRIVING_LESSON_QUESTIONS) {
    const sub = answers.find((a) => a.questionId === q.id);
    const selected = Array.isArray(sub?.selectedIndices) ? sub!.selectedIndices : [];
    const aa = Array.from(new Set(selected)).sort((a, b) => a - b);
    const bb = Array.from(new Set(q.correct)).sort((a, b) => a - b);
    const is_correct = aa.length === bb.length && aa.every((v, i) => v === bb[i]);
    if (is_correct) score++;
    details.push({ questionId: q.id, selected, correct: q.correct, is_correct });
  }
  const percentage = total > 0 ? Math.round((score / total) * 100) : 0;
  return { score, total, percentage, details };
}

