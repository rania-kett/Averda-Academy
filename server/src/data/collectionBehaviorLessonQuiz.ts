/** السلوك الواجب تبنيه أثناء عملية الجمع — lesson quiz (server-side validation). */

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

export const COLLECTION_BEHAVIOR_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "multi",
    emoji: "🤝",
    text: "من بين السلوكيات التالية، أيها يجب تبنيه أثناء عملية الجمع وفقاً للوثيقة؟",
    options: ["التواصل مع زميلك", "مساعدة بعضكم", "تنظيف تحت الحاوية أثناء الرفع", "الابتعاد عن الحاوية أثناء عملية الرفع"],
    correct: [0, 1, 3],
    explanation:
      "الوثيقة تطلب: التواصل مع الزميل، مساعدة بعضكم، والابتعاد عن الحاوية أثناء الرفع. أما تنظيف تحت الحاوية فهو ممنوع.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "✅",
    text: "يجب التأكد من أن زميلك بعيد عن الحاوية قبل إعطاء الإشارة بتشغيل الرافعة.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. الوثيقة تنص صراحة: 'التأكد من أن زميلك بعيد عن الحاوية قبل إعطاء الإشارة بتشغيل الرافعة' لتجنب إصابته.",
  },
  {
    id: 3,
    type: "single",
    emoji: "↩️",
    text: "ماذا يجب على العامل فعله تجاه الحاوية أثناء عملية الرفع؟",
    options: ["الوقوف تحتها", "الاقتراب منها للمراقبة", "الابتعاد عنها", "الجلوس عليها"],
    correct: [2],
    explanation:
      "الوثيقة تأمر بـ 'ابتعد عن الحاوية أثناء عملية الرفع' لأن البقاء قربها يعرضك لخطر السقوط أو الاصطدام.",
  },
  {
    id: 4,
    type: "multi",
    emoji: "👷",
    text: "ما هي السلوكيات الصحيحة التي تعزز السلامة بين العمال أثناء عملية الجمع؟",
    options: ["التواصل مع زميلك", "مساعدة بعضكم", "العمل بشكل منفرد دون تعاون", "التأكد من ابتعاد الزميل قبل تشغيل الرافعة"],
    correct: [0, 1, 3],
    explanation:
      "التواصل، المساعدة المتبادلة، والتأكد من ابتعاد الزميل كلها سلوكيات صحيحة. العمل المنفرد دون تعاون يزيد المخاطر.",
  },
  {
    id: 5,
    type: "tf",
    emoji: "⛔",
    text: "يجوز للعامل تنظيف أسفل الحاوية أثناء عملية الرفع إذا كانت الحاوية فارغة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الوثيقة تمنع 'لا تنظف أسفل الحاوية أثناء عملية الرفع' في جميع الأحوال، بغض النظر عن محتوى الحاوية.",
  },
  {
    id: 6,
    type: "single",
    emoji: "📣",
    text: "متى يجب إعطاء الإشارة بتشغيل الرافعة؟",
    options: ["بمجرد وصول العامل إلى الحاوية", "بعد التأكد من أن الزميل بعيد عن الحاوية", "قرب نهاية الدوام", "عندما تكون الحاوية ممتلئة فقط"],
    correct: [1],
    explanation:
      "الوثيقة تنص: 'التأكد من أن زميلك بعيد عن الحاوية قبل إعطاء الإشارة بتشغيل الرافعة' لضمان سلامة الجميع.",
  },
  {
    id: 7,
    type: "multi",
    emoji: "🧯",
    text: "أي من هذه السلوكيات تساعد في تجنب الحوادث أثناء عملية الرفع؟",
    options: ["التواصل الجيد مع الزميل", "الابتعاد عن الحاوية أثناء الرفع", "عدم تنظيف أسفل الحاوية أثناء الرفع", "الوقوف تحت الحاوية لتثبيتها"],
    correct: [0, 1, 2],
    explanation:
      "التواصل، الابتعاد عن الحاوية، وعدم التنظيف تحتها كلها سلوكيات آمنة. الوقوف تحت الحاوية خطر كبير.",
  },
  {
    id: 8,
    type: "tf",
    emoji: "🫱🏻‍🫲🏽",
    text: "مساعدة بعضكم البعض أثناء عملية الجمع هي سلوك مطلوب حسب الوثيقة.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. الوثيقة تذكر 'مساعدة بعضكم' كأحد السلوكيات الواجب تبنيها لتعزيز السلامة والتعاون.",
  },
  {
    id: 9,
    type: "single",
    emoji: "🦺",
    text: "لماذا يجب التأكد من ابتعاد الزميل قبل تشغيل الرافعة؟",
    options: ["لتجنب إصابته بالرافعة أو الحاوية", "لكي لا يرى طريقة العمل", "لكي لا يزعج السائق", "لتوفير الوقت"],
    correct: [0],
    explanation:
      "التأكد من ابتعاد الزميل يمنع أن تصطدم به الرافعة أو الحاوية أثناء حركتها، مما قد يسبب إصابات خطيرة.",
  },
  {
    id: 10,
    type: "multi",
    emoji: "🧠",
    text: "من بين العبارات التالية، أيها يمثل سلوكاً صحيحاً وأيها يمثل سلوكاً خاطئاً؟",
    options: [
      "التواصل مع زميلك (صحيح)",
      "تنظيف أسفل الحاوية أثناء الرفع (خطأ)",
      "الوقوف تحت الحاوية أثناء الرفع (صحيح)",
      "مساعدة بعضكم (صحيح)",
    ],
    correct: [0, 1, 3],
    explanation:
      "التواصل والمساعدة صحيحان. تنظيف أسفل الحاوية خطأ. الوقوف تحت الحاوية خطأ أيضاً وليس صحيحاً كما ورد في الخيار الثالث.",
  },
];

export function getCollectionBehaviorQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return COLLECTION_BEHAVIOR_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreCollectionBehaviorAnswers(
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
  const total = COLLECTION_BEHAVIOR_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of COLLECTION_BEHAVIOR_LESSON_QUESTIONS) {
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

