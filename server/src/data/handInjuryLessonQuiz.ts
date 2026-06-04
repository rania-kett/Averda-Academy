/** تجنب الإصابة في اليد أو الساعد عند التقاط أكياس النفايات — lesson quiz (server-side validation). */

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

export const HAND_INJURY_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🎯",
    text: "ما الهدف الرئيسي من هذا الموجز التحسيسي الأسبوعي؟",
    options: [
      "تعليم تقنيات الكنس الصحيحة",
      "الوقاية من إصابات اليد والساعد عند التقاط الأكياس",
      "شرح كيفية استخدام الحاوية",
      "توضيح جداول العمل اليومية",
    ],
    correct: [1],
    explanation:
      "يهدف الموجز إلى تقديم إجراءات السلامة التي تحمي عمال الكنس والجمع من وقوع حوادث إصابة اليد والساعد أثناء التقاط الأكياس البلاستيكية.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🧤",
    text: "يجب على العامل ارتداء القفازات قبل لمس أي كيس نفايات.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. ارتداء القفازات إلزامي لحماية اليدين من أي مواد حادة أو ملوثة قد تكون داخل الكيس.",
  },
  {
    id: 3,
    type: "single",
    emoji: "🤲",
    text: "من أين يجب أن يمسك العامل الكيس البلاستيكي؟",
    options: [
      "من الأسفل لدعمه بشكل أفضل",
      "من الجوانب لتوزيع الوزن",
      "من الرقبة (الجزء العلوي)",
      "من أي مكان مريح للعامل",
    ],
    correct: [2],
    explanation:
      "يجب الإمساك بالكيس من رقبته (الجزء العلوي) لتجنب التعرض لأي محتويات حادة أو خطرة قد تكون في الأسفل أو الجوانب.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "⛔",
    text: "يمكن للعامل الإمساك بالكيس من الأسفل إذا كان الكيس يبدو آمناً.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يُمنع الإمساك بالكيس من الأسفل أو الجوانب في جميع الأحوال، حتى لو بدا الكيس آمناً، لأن محتوياته الداخلية غير مرئية وقد تكون خطرة.",
  },
  {
    id: 5,
    type: "single",
    emoji: "👀",
    text: "ماذا يفعل العامل قبل التقاط الكيس مباشرة؟",
    options: [
      "يرفعه بسرعة لتوفير الوقت",
      "يلقي نظرة فاحصة على النفايات",
      "يطلب من زميله المساعدة",
      "يضع الكيس في الحاوية أولاً",
    ],
    correct: [1],
    explanation:
      "يجب إلقاء نظرة فاحصة على النفايات قبل التقاطها، لتقييم ما إذا كانت تحتوي على مواد حادة أو خطرة قد تسبب إصابة.",
  },
  {
    id: 6,
    type: "single",
    emoji: "🤝",
    text: "ما الإجراء الصحيح عند الإحساس بأن الكيس ثقيل جداً؟",
    options: [
      "محاولة رفعه بشكل أسرع",
      "استخدام كلتا اليدين فقط",
      "طلب المساعدة من زميل",
      "وضعه جانباً وتركه",
    ],
    correct: [2],
    explanation:
      "عند الشعور بأن الكيس ثقيل جداً يجب طلب المساعدة من زميل، لتجنب إصابات الظهر أو اليدين الناجمة عن الحمل الزائد.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "📋",
    text: "فحص الكيس بالعين قبل رفعه يُعدّ خطوة اختيارية يمكن تخطيها لتوفير الوقت.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. فحص الكيس بالعين قبل رفعه هو إجراء سلامة أساسي وإلزامي، لأنه يساعد على الكشف المبكر عن أي محتويات خطرة كالأجسام الحادة.",
  },
  {
    id: 8,
    type: "single",
    emoji: "⚠️",
    text: "لماذا يُمنع الإمساك بالكيس من الجوانب؟",
    options: [
      "لأن ذلك يُتلف الكيس",
      "لأنه قد يتسبب في لمس محتويات حادة أو خطرة",
      "لأن ذلك يبطئ العمل",
      "لأن ذلك يُشوّه شكل الكيس",
    ],
    correct: [1],
    explanation:
      "الإمساك من الجوانب يُعرّض اليد لخطر ملامسة مواد حادة كالزجاج أو المسامير التي قد تكون داخل الكيس، مما يُسبب إصابات خطيرة.",
  },
  {
    id: 9,
    type: "tf",
    emoji: "✅",
    text: "تتضمن تعليمات السلامة في هذا الموجز: فحص الكيس، ارتداء القفازات، الإمساك من الرقبة، وطلب المساعدة عند الحاجة.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. هذه هي التعليمات الأربعة الرئيسية الواردة في الموجز التحسيسي لحماية عمال الكنس والجمع من الإصابات.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🦺",
    text: "ما الخطر الرئيسي الذي تهدف هذه التعليمات إلى الوقاية منه؟",
    options: [
      "التعب العام أثناء العمل",
      "إصابات اليد والساعد عند التقاط الأكياس",
      "انزلاق العامل على الأرض",
      "سقوط الحاوية على العامل",
    ],
    correct: [1],
    explanation:
      "يهدف الموجز تحديداً إلى الوقاية من إصابات اليد والساعد التي تحدث أثناء عملية التقاط الأكياس البلاستيكية غير الموضوعة في الحاوية.",
  },
];

export function getHandInjuryQuestionsForClient() {
  return HAND_INJURY_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreHandInjuryAnswers(answers: { questionId: number; selectedIndices: number[] }[]) {
  const total = HAND_INJURY_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of HAND_INJURY_LESSON_QUESTIONS) {
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
