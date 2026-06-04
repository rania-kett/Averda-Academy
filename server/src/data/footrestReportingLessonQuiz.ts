/** الإبلاغ عن أعطال مسند القدم — lesson quiz (server-side validation). */

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

export const FOOTREST_REPORTING_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🦶",
    text: "لماذا يُعدّ الإبلاغ عن أعطال مسند القدم أمراً مهماً؟",
    options: ["لأنه إجراء إداري روتيني فقط", "لأنه جزء أساسي من ضمان سلامة المسار", "لأنه يساعد على تسريع العمل", "لأن القانون يُلزم به فقط"],
    correct: [1],
    explanation: "الإبلاغ عن الأعطال في مسند القدم هو جزء هام من ضمان سلامة المسار، وهو إجراء وقائي يحمي العمال من الحوادث.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🛡️",
    text: "الإبلاغ عن أعطال مسند القدم هو إجراء علاجي يُنفَّذ بعد وقوع الحادثة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. الإبلاغ هو إجراء وقائي يهدف إلى منع الحوادث قبل وقوعها، وليس بعدها.",
  },
  {
    id: 3,
    type: "single",
    emoji: "📣",
    text: "من يجب إخباره عند اكتشاف عطل في مسند القدم؟",
    options: ["زملاء العمل فقط", "مصلحة التتبع والصيانة", "إدارة الموارد البشرية", "العميل مباشرة"],
    correct: [1],
    explanation: "يجب إخبار مصلحة التتبع والصيانة للقيام بالإصلاحات اللازمة في أقرب وقت.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "⛔",
    text: "يمكن لعامل الجمع الاستمرار في العمل رغم وجود عطل في مسند القدم إذا كان العطل بسيطاً.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. يجب الإبلاغ عن أي عطل مهما كان حجمه، لأن مسند القدم المعطوب يشكّل خطراً حقيقياً على سلامة العامل.",
  },
  {
    id: 5,
    type: "single",
    emoji: "🔧",
    text: "ما هو الهدف الرئيسي من الإبلاغ لمصلحة التتبع والصيانة؟",
    options: ["تسجيل الحادثة في السجلات فقط", "القيام بالإصلاحات اللازمة", "إيقاف العمل نهائياً", "محاسبة العامل المسؤول"],
    correct: [1],
    explanation: "الهدف هو تمكين مصلحة الصيانة من القيام بالإصلاحات اللازمة لضمان سلامة المسار.",
  },
  {
    id: 6,
    type: "multi",
    emoji: "✅",
    text: "ما هي الصفات التي يتسم بها الإبلاغ عن أعطال مسند القدم وفق الدرس؟",
    options: ["هو إجراء وقائي", "هو جزء من ضمان سلامة المسار", "هو اختياري ويعود للعامل", "هو إجراء هام"],
    correct: [0, 1, 3],
    explanation: "الإبلاغ هو: إجراء وقائي، جزء هام من ضمان سلامة المسار. وليس اختيارياً بل إلزامي.",
  },
  {
    id: 7,
    type: "single",
    emoji: "👷",
    text: "من هو الموجَّه إليه هذا الدرس التحسيسي بشكل رئيسي؟",
    options: ["السائقون فقط", "عمال الجمع", "مصلحة الصيانة", "مديرو الفرق"],
    correct: [1],
    explanation: "هذا الموجز موجَّه أساساً لعمال الجمع الذين يستخدمون مسند القدم يومياً.",
  },
  {
    id: 8,
    type: "tf",
    emoji: "⚠️",
    text: "مسند القدم المعطوب قد يؤدي إلى حوادث خطيرة تُلحق الضرر بالعامل.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation: "صحيح. الصورة التوضيحية تُظهر عاملاً مصاباً جراء عطل في مسند القدم، مما يؤكد خطورة إهمال الإبلاغ.",
  },
  {
    id: 9,
    type: "multi",
    emoji: "🧰",
    text: "ما الذي يضمنه الإبلاغ الفوري عن عطل مسند القدم؟",
    options: ["سلامة العامل", "سلامة المسار", "زيادة أجر العامل", "القيام بالإصلاحات اللازمة"],
    correct: [0, 1, 3],
    explanation: "الإبلاغ الفوري يضمن سلامة العامل، سلامة المسار، والإصلاحات اللازمة. زيادة الأجر لا علاقة لها بالموضوع.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🖼️",
    text: "ما الذي تُظهره الصورة التحذيرية في الدرس؟",
    options: ["مركبة جمع في حالة جيدة", "عامل مصاب بسبب عطل في مسند القدم", "عامل يقوم بإصلاح المركبة", "مسند قدم جديد"],
    correct: [1],
    explanation: "الصورة تُظهر عاملاً مصاباً ملقىً على الأرض بجانب مسند القدم المنفصل، للتأكيد على خطورة إهمال الإبلاغ.",
  },
];

export function getFootrestReportingQuestionsForClient() {
  return FOOTREST_REPORTING_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreFootrestReportingAnswers(answers: { questionId: number; selectedIndices: number[] }[]) {
  const total = FOOTREST_REPORTING_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of FOOTREST_REPORTING_LESSON_QUESTIONS) {
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

