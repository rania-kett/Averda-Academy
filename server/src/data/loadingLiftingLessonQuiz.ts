/** السلامة خلال التحميل والرفع — lesson quiz (server-side validation). */

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

export const LOADING_LIFTING_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "📏",
    text: "أثناء عملية الرفع والتحميل والتفريغ، ماذا يجب على العامل أن يفعل بالنسبة لمسافته من الشاحنة؟",
    options: [
      "يقترب قدر الإمكان للمراقبة الجيدة",
      "يحافظ على مسافة مناسبة من الشاحنة",
      "يلتصق بالشاحنة لتجنب مخاطر الطريق",
      "يقف تحت الشاحنة مباشرة",
    ],
    correct: [1],
    explanation:
      "الوثيقة تنص صراحة: 'حافظ على مسافة مناسبة من الشاحنة أثناء الرفع والتحميل والتفريغ' لتجنب مخاطر السقوط أو الاصطدام.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "✋",
    text: "يجوز للعامل وضع يده في آلية الرفع إذا كان يعرف طريقة عملها جيداً.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الوثيقة تأمر بـ 'ابعد يدك دائما عن آلية الرفع' في أي ظرف من الظروف، بغض النظر عن خبرة العامل.",
  },
  {
    id: 3,
    type: "multi",
    emoji: "⛔",
    text: "أي من السلوكيات التالية تعتبر ممنوعة وفقاً للوثيقة؟",
    options: [
      "العبور من أمام الشاحنة أثناء توقفها",
      "الوقوف تحت حمولة أثناء رفعها",
      "الوقوف بالقرب من حمولة مرفوعة",
      "إبلاغ المشرف عن خلل في معدات الرفع",
    ],
    correct: [0, 1, 2],
    explanation:
      "الممنوعات: 'لا تعبر من امام الشاحنة أثناء توقفها'، 'لا تقف تحت حمولة أثناء رفعها أو بالقرب منها'. أما الإبلاغ عن خلل فهو واجب.",
  },
  {
    id: 4,
    type: "single",
    emoji: "📣",
    text: "ماذا يجب على العامل فعله إذا لاحظ خللاً في الشاحنة أو في معدات الرفع والضغط؟",
    options: [
      "يتجاهله إذا كان بسيطاً",
      "يحاول إصلاحه بنفسه فوراً",
      "يبلغ عن أي خلل لاحظه",
      "يستمر في العمل بحذر",
    ],
    correct: [2],
    explanation:
      "الوثيقة تنص: 'أبلغ عن أي خلل الحظته في الشاحنة او في معدات الرفع والضغط' لأن تجاهل الخلل قد يؤدي إلى حوادث خطيرة.",
  },
  {
    id: 5,
    type: "tf",
    emoji: "⬇️",
    text: "يُسمح للعامل بالوقوف تحت الحمولة إذا كانت الحمولة صغيرة وخفيفة الوزن.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الوثيقة تمنع الوقوف تحت حمولة أثناء رفعها أو بالقرب منها مهما كان حجمها أو وزنها، لأن أي حمولة يمكن أن تسقط.",
  },
  {
    id: 6,
    type: "single",
    emoji: "🖐️",
    text: "أين يُمنع منعاً كلياً وضع اليد حسب الوثيقة؟",
    options: [
      "في مكان المكبس أو الرفع للحاوية",
      "على مقبض باب الشاحنة",
      "على حافة الحاوية الخارجية",
      "في جيب العامل",
    ],
    correct: [0],
    explanation:
      "الوثيقة تنص: 'ممنوع منعا كليا وضع اليد في مكان المكبس الرفع للحاوية' لأن ذلك قد يؤدي إلى سحق أو بتر الأصابع.",
  },
  {
    id: 7,
    type: "multi",
    emoji: "✅",
    text: "من بين السلوكيات التالية، أيها يعتبر من 'ما يجب فعله' وفقاً للوثيقة؟",
    options: [
      "الحفاظ على مسافة مناسبة من الشاحنة",
      "إبعاد اليد عن آلية الرفع",
      "الإبلاغ عن أي خلل في المعدات",
      "العبور من أمام الشاحنة أثناء توقفها",
    ],
    correct: [0, 1, 2],
    explanation:
      "السلوكيات الصحيحة: الحفاظ على مسافة مناسبة، إبعاد اليد عن آلية الرفع، والإبلاغ عن الخلل. العبور من أمام الشاحنة ممنوع.",
  },
  {
    id: 8,
    type: "tf",
    emoji: "🚫",
    text: "يمكن للعامل العبور من أمام الشاحنة إذا كانت الشاحنة متوقفة بشكل كامل والسائق لا يتحرك.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الوثيقة تمنع العبور من أمام الشاحنة أثناء توقفها بشكل مطلق، لأن السائق قد يتحرك فجأة دون رؤية العامل.",
  },
  {
    id: 9,
    type: "single",
    emoji: "⚙️",
    text: "لماذا يجب على العامل إبعاد يده دائماً عن آلية الرفع؟",
    options: [
      "لأن الآلية قد تسحق اليد فجأة",
      "لأن الآلية ساخنة جداً",
      "لأن الزيت الموجود فيها سام",
      "لأن ذلك يبطئ العمل",
    ],
    correct: [0],
    explanation:
      "آلية الرفع والمكبس تتحرك بقوة كبيرة وقد تنشط فجأة، مما قد يسحق اليد أو يقطع الأصابع، لذلك يجب إبعاد اليد دائماً.",
  },
  {
    id: 10,
    type: "multi",
    emoji: "🚚",
    text: "أي من هذه المواقف قد تعرض العامل لخطر الدهس أو الاصطدام بالشاحنة؟",
    options: [
      "العبور من أمام الشاحنة أثناء توقفها",
      "الوقوف تحت حمولة مرفوعة",
      "الحفاظ على مسافة مناسبة من الشاحنة",
      "الوقوف بالقرب من حمولة يتم رفعها",
    ],
    correct: [0, 1, 3],
    explanation:
      "العبور من أمام الشاحنة يعرض للدهس، والوقوف تحت حمولة أو بالقرب منها يعرض للسقوط. أما الحفاظ على مسافة مناسبة فهو إجراء وقائي.",
  },
];

export function getLoadingLiftingQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return LOADING_LIFTING_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreLoadingLiftingAnswers(
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
  const total = LOADING_LIFTING_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of LOADING_LIFTING_LESSON_QUESTIONS) {
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

