/** السلامة أثناء عملية الجمع — lesson quiz (server-side validation). */

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

export const COLLECTION_SAFETY_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🛣️",
    text: "أثناء دفع الحاوية على الطريق، أين يجب أن يكون موقع العامل بالنسبة للحاوية؟",
    options: ["خلف الحاوية", "أمام الحاوية", "على جانب الحاوية", "فوق الحاوية"],
    correct: [1],
    explanation:
      "بحسب الوثيقة، يجب دفع الحاوية وهي أمام العامل ('دفع الحاوية وهي أمامه') لتجنب مخاطر الطريق ورؤية المركبات القادمة.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🛡️",
    text: "عند تثبيت الحاوية على العمال، يجب على العامل الاحتماء بالحاوية لتجنب مخاطر الطريق.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. الوثيقة تنص على أنه عند تثبيت الحاوية على العمال، يجب الاحتماء بالحاوية لتجنب مخاطر الطريق.",
  },
  {
    id: 3,
    type: "multi",
    emoji: "⛔",
    text: "أي من السلوكيات التالية تعتبر ممنوعة أثناء عملية رفع الحاوية؟",
    options: [
      "تنظيف تحت الحاوية عند عملية الرفع",
      "الوقوف بعيداً عن الحاوية أثناء الرفع",
      "وضع اليد في الرافعة عند عملية الرفع",
      "مراقبة الحاوية من مسافة آمنة",
    ],
    correct: [0, 2],
    explanation:
      "الممنوعات حسب الوثيقة: 'تنظيف تحت الحاوية عند عملية الرفع' و'وضع اليد في الرافعة عند عملية الرفع' لأنهما يعرضان العامل لخطر السحق أو القطع.",
  },
  {
    id: 4,
    type: "single",
    emoji: "🦶",
    text: "ما هي الوضعية الخاطئة لاستخدام مسند القدم (الرافعة) حسب الوثيقة؟",
    options: [
      "امتطاء مسند القدم والإمساك بالمقبض بكلتا اليدين",
      "امتطاء مسند القدم والإمساك بالمقبض بيد واحدة",
      "الوقوف على مسند القدم بثبات",
      "النزول من مسند القدم بعد توقف المركبة",
    ],
    correct: [1],
    explanation:
      "الوثيقة تظهر في قسم 'ما لا يجب فعله': 'امتطاء مسند القدم والإمساك بالمقبض بيد واحدة' وهي وضعية خطيرة قد تؤدي إلى السقوط.",
  },
  {
    id: 5,
    type: "tf",
    emoji: "👀",
    text: "يجوز للعامل تثبيت الحاوية على العمال دون مراقبة الطريق إذا كان الطريق خالياً.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الوثيقة تمنع 'تثبيت الحاوية والعامل غير مراقب وحذر من الطريق'، أي يجب دائماً مراقبة الطريق مهما كانت حالته.",
  },
  {
    id: 6,
    type: "single",
    emoji: "⬇️",
    text: "عند رفع الحاوية على العمال، أين يجب أن يتجنب العامل الوقوف؟",
    options: ["بجانب الحاوية", "أمام الحاوية", "تحت الحاوية", "خلف الحاوية"],
    correct: [2],
    explanation:
      "الوثيقة تنص صراحة: 'عند رفع الحاوية على العمال تجنب الوقوف تحتها' لأن سقوطها قد يسبب إصابات خطيرة.",
  },
  {
    id: 7,
    type: "multi",
    emoji: "✅",
    text: "من بين السلوكيات التالية، أيها يعتبر من 'ما يجب فعله' وفقاً للوثيقة؟",
    options: [
      "دفع الحاوية أمام العامل",
      "الاحتماء بالحاوية عند تثبيتها على العمال",
      "تنظيف تحت الحاوية أثناء الرفع",
      "استخدام الطريقة الصحيحة لمسند القدم",
    ],
    correct: [0, 1, 3],
    explanation:
      "السلوكيات الصحيحة: دفع الحاوية أمام العامل، الاحتماء بالحاوية، والطريقة الصحيحة لمسند القدم. تنظيف تحت الحاوية ممنوع.",
  },
  {
    id: 8,
    type: "tf",
    emoji: "✋",
    text: "يمكن للعامل وضع يده في الرافعة إذا كانت الحاوية خفيفة الوزن.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. وضع اليد في الرافعة ممنوع في جميع الأحوال، بغض النظر عن وزن الحاوية، لأن الرافعة يمكن أن تتحرك فجأة وتسحق اليد.",
  },
  {
    id: 9,
    type: "single",
    emoji: "🤝",
    text: "ماذا يقصد بالطريقة الصحيحة 'المتطاهة' لمسند القدم؟",
    options: [
      "الوقوف بقدم واحدة فقط",
      "امتطاء المسند بثبات مع الإمساك الجيد",
      "القفز على المسند أثناء الحركة",
      "استخدام المسند للجلوس",
    ],
    correct: [1],
    explanation:
      "'المتطاهة' تعني امتطاء المسند بشكل صحيح وآمن، مع ثبات القدمين والإمساك الجيد بالمقبض، لتجنب السقوط أثناء حركة المركبة.",
  },
  {
    id: 10,
    type: "multi",
    emoji: "⚠️",
    text: "أي من هذه الأخطاء قد تؤدي إلى حادث خطير أثناء عملية الجمع؟",
    options: [
      "تنظيف تحت الحاوية أثناء الرفع",
      "الاحتماء بالحاوية من الطريق",
      "وضع اليد في الرافعة",
      "عدم مراقبة الطريق أثناء تثبيت الحاوية",
    ],
    correct: [0, 2, 3],
    explanation:
      "تنظيف تحت الحاوية قد يؤدي إلى السحق، وضع اليد في الرافعة يسبب بتر الأصابع، وعدم مراقبة الطريق قد يسبب دهساً. أما الاحتماء بالحاوية فهو إجراء وقائي صحيح.",
  },
];

export function getCollectionSafetyQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return COLLECTION_SAFETY_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreCollectionSafetyAnswers(
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
  const total = COLLECTION_SAFETY_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of COLLECTION_SAFETY_LESSON_QUESTIONS) {
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

