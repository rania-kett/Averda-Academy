/** تعليمات خلال عملية الجمع 2 — lesson quiz (server-side validation). */

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

export const COLLECTION_INSTRUCTIONS_2_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "tf",
    emoji: "🧤",
    text: "يمكن لعامل الجمع استخدام يديه المجردتين لإدخال النفايات داخل الحاوية إذا كانت النفايات تبدو آمنة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يُمنع منعاً باتاً استخدام الأيدي المجردة لإدخال النفايات داخل الحاوية تحت أي ظرف، لأن محتوى النفايات قد يخفي أجساماً حادة أو خطيرة.",
  },
  {
    id: 2,
    type: "single",
    emoji: "🛍️",
    text: "من أي جزء يجب رفع الأكياس البلاستيكية عند إزالتها من صندوق القمامة أو الأرض؟",
    options: ["من الأسفل لدعمها جيداً", "من رقبتها (الجزء العلوي)", "من المنتصف", "من أي مكان مريح للعامل"],
    correct: [1],
    explanation:
      "يجب دائماً رفع الأكياس البلاستيكية من رقبتها (الجزء العلوي) عند إزالتها، لتفادي تمزقها وتعرض العامل لمحتوياتها المجهولة.",
  },
  {
    id: 3,
    type: "single",
    emoji: "⚠️",
    text: "ما السبب الرئيسي الذي يجعل رفع الأكياس البلاستيكية من رقبتها أمراً ضرورياً؟",
    options: ["لأن ذلك يسرّع عملية الجمع", "لأن العامل لا يعرف ماذا في داخلها", "لأن ذلك يحافظ على نظافة الكيس", "لأن الكيس يكون أخف وزناً هكذا"],
    correct: [1],
    explanation:
      "السبب الأساسي هو أن العامل لا يعرف ماذا في داخل الكيس، إذ قد يحتوي على زجاج أو أجسام حادة أو مواد خطيرة قد تؤذيه.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "❌",
    text: "إذا بدت النفايات خفيفة وغير خطيرة، يمكن لعامل الجمع رفع الكيس من أسفله لتوزيع الثقل.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يجب دائماً رفع الأكياس من رقبتها بغض النظر عن وزنها أو مظهرها، لأن محتواها مجهول وقد يخفي أخطاراً غير مرئية.",
  },
  {
    id: 5,
    type: "multi",
    emoji: "✅",
    text: "ما هي التصرفات الصحيحة التي يجب على عامل الجمع اتباعها خلال عملية الجمع؟",
    options: [
      "رفع الأكياس البلاستيكية من رقبتها",
      "استخدام الأيدي المجردة لضغط النفايات داخل الحاوية",
      "تجنب استخدام الأيدي المجردة لإدخال النفايات",
      "رفع الأكياس من أسفلها لتفادي تمزقها",
      "الالتزام بجميع تعليمات السلامة خلال العمليات",
    ],
    correct: [0, 2, 4],
    explanation:
      "التصرفات الصحيحة هي: رفع الأكياس من رقبتها، تجنب الأيدي المجردة، والالتزام بتعليمات السلامة. أما استخدام الأيدي المجردة أو الرفع من الأسفل فهما ممنوعان.",
  },
  {
    id: 6,
    type: "single",
    emoji: "🛡️",
    text: "ما الهدف الرئيسي من الالتزام بتعليمات السلامة خلال عملية الجمع؟",
    options: ["تسريع إنجاز العمل", "إتمام عملية الجمع في ظروف آمنة", "تقليل عدد العمال اللازمين", "الحفاظ على نظافة الشاحنة"],
    correct: [1],
    explanation:
      "الهدف الأساسي من الالتزام بجميع تعليمات السلامة هو ضمان إتمام عملية الجمع في ظروف آمنة وحماية العمال من المخاطر.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "🧠",
    text: "يجب على عامل الجمع رفع الأكياس من رقبتها فقط عند إزالتها من الأرض، أما من صندوق القمامة فيمكن رفعها بأي طريقة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يجب رفع الأكياس البلاستيكية من رقبتها دائماً سواء عند إزالتها من صندوق القمامة أو من الأرض، دون استثناء.",
  },
  {
    id: 8,
    type: "single",
    emoji: "👷",
    text: "لمن هو موجَّه هذا الموجز التحسيسي الأسبوعي؟",
    options: ["السائقين فقط", "مصلحة الصيانة", "عمال الجمع", "فريق السلامة والجودة"],
    correct: [2],
    explanation:
      "هذا الموجز التحسيسي موجَّه لعمال الجمع الذين يتعاملون مباشرة مع النفايات ويواجهون مخاطر الإصابة خلال عمليات الجمع.",
  },
  {
    id: 9,
    type: "multi",
    emoji: "🩹",
    text: "ما هي المخاطر المحتملة التي قد يواجهها عامل الجمع عند استخدام يديه المجردتين لإدخال النفايات؟",
    options: [
      "الإصابة بالزجاج المكسور",
      "التعرض لأجسام حادة مخفية",
      "تلوث يديه بمواد خطيرة مجهولة",
      "إتلاف الحاوية",
      "إبطاء سرعة العمل",
    ],
    correct: [0, 1, 2],
    explanation:
      "المخاطر الحقيقية هي: الإصابة بالزجاج، التعرض لأجسام حادة، والتلوث بمواد خطيرة مجهولة. محتوى النفايات مجهول دائماً وقد يخفي أخطاراً متعددة.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🛍️",
    text: "ما التعليمة الصحيحة عند التعامل مع كيس بلاستيكي موجود على الأرض؟",
    options: ["دفعه بالقدم نحو الحاوية ثم رفعه", "رفعه من أسفله لتفادي تمزق الرقبة", "رفعه من رقبته مباشرة", "فتحه أولاً للتحقق من محتواه"],
    correct: [2],
    explanation:
      "التعليمة الصحيحة هي رفع الكيس من رقبته مباشرة، دون فتحه أو دفعه أو رفعه من أسفله، لأن ذلك يضمن سلامة العامل من محتويات الكيس المجهولة.",
  },
];

export function getCollectionInstructions2QuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return COLLECTION_INSTRUCTIONS_2_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreCollectionInstructions2Answers(
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
  const total = COLLECTION_INSTRUCTIONS_2_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of COLLECTION_INSTRUCTIONS_2_LESSON_QUESTIONS) {
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

