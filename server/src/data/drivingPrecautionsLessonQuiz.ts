/** بعض الاحتياطات أثناء السياقة — lesson quiz (server-side validation). */

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

export const DRIVING_PRECAUTIONS_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🪞",
    text: "ماذا يجب على السائق فعله عند الانطلاق، التوقف وتغيير الاتجاه؟",
    options: ["النظر إلى المرايا", "إغلاق النوافذ", "تشغيل الراديو", "رفع السرعة"],
    correct: [0],
    explanation:
      "الوثيقة تنص صراحة: 'عند الانطلاق، التوقف وتغيير الاتجاه يجب النظر إلى المرايا' لأنها أساسية لتجنب الحوادث.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "✅",
    text: "استخدام المرايا بشكل صحيح يعتبر أولوية قصوى قبل الانطلاق على الطريق.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. الوثيقة تؤكد أن 'الحفاظ على عادة استخدام المرايا بشكل صحيح هي أولوية قصوى قبل أن تنطلق على الطريق'.",
  },
  {
    id: 3,
    type: "multi",
    emoji: "📋",
    text: "ما هي الإجراءات التي يجب على السائق القيام بها قبل الانطلاق وفقاً للوثيقة؟",
    options: ["ضبط المرايا", "استعمال المنبه الصوتي (الكلاكسون)", "مراقبة الرؤية وإزالة العوائق", "رفع السرعة تدريجياً"],
    correct: [0, 1, 2],
    explanation:
      "الوثيقة تطلب: 'يجب عليك ضبط مرايا'، 'استعمال المنبه الصوتي (كالاكصون)'، و'مراقبة الرؤية (إزالة كل العوائق)'. رفع السرعة ليس إجراءً وقائياً.",
  },
  {
    id: 4,
    type: "single",
    emoji: "📣",
    text: "متى يجب استعمال المنبه الصوتي (الكلاكسون) حسب الوثيقة؟",
    options: ["عند الانطلاق فقط", "عند التوقف فقط", "عند تغيير الاتجاه فقط", "عند الانطلاق والتوقف وتغيير الاتجاه"],
    correct: [0],
    explanation:
      "الوثيقة تنص: 'عند الانطلاق، يجب استعمال المنبه الصوتي (كالاكصون)' لتنبيه الآخرين قبل بدء الحركة.",
  },
  {
    id: 5,
    type: "tf",
    emoji: "🚫",
    text: "يمكن للسائق تجاهل العوائق التي تحجب رؤيته إذا كان الطريق قصيراً.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الوثيقة تؤكد على 'مراقبة الرؤية (إزالة كل العوائق التي يمكن أن تحجب رؤية السائق من الداخل ومن الخارج)' في جميع الأحوال.",
  },
  {
    id: 6,
    type: "multi",
    emoji: "📞",
    text: "إلى من يجب إبلاغ أي مشكلة تتعلق بالرؤية أو أي خطر آخر؟",
    options: ["لمسؤول المنطقة", "لمدير المشروع", "لمصلحة مراقبة الآليات", "للسائقين الآخرين فقط"],
    correct: [0, 1, 2],
    explanation:
      "الوثيقة تحدد: 'إبلاغ عن أي مشكلة تتعلق بمسألة الرؤية أو أي خطر آخر لمسؤول المنطقة أو لمدير المشروع أو مصلحة مراقبة الآليات أو ممثل السلامة والصحة'.",
  },
  {
    id: 7,
    type: "single",
    emoji: "⚠️",
    text: "ما الهدف الرئيسي من الاحتياطات المذكورة في الوثيقة؟",
    options: ["تجنب الحوادث الناجمة عن النقط العمياء", "توفير الوقود", "زيادة سرعة التوصيل", "تقليل ضوضاء المركبة"],
    correct: [0],
    explanation:
      "الوثيقة تذكر أن هذه الاحتياطات هي 'لتجنب الحوادث الناجمة عن النقط العمياء'، وهي مناطق الرؤية التي لا ترى في المرايا.",
  },
  {
    id: 8,
    type: "tf",
    emoji: "👥",
    text: "تبني عادات القيادة السيئة لا يشكل خطراً إلا على السائق نفسه فقط.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الوثيقة تنص أن 'تبني عادات القيادة السيئة تشكل خطرًا على السائق نفسه وكذلك على السائقين الآخرين والركاب والمشاة على حد سواء'.",
  },
  {
    id: 9,
    type: "single",
    emoji: "🧼",
    text: "ماذا يجب على السائق فعله بخصوص العوائق التي تحجب رؤيته؟",
    options: ["تجاهلها إذا كانت صغيرة", "إزالتها كلياً", "القيادة ببطء فقط", "الاعتماد على المرايا فقط"],
    correct: [1],
    explanation:
      "الوثيقة تطلب 'إزالة كل العوائق التي يمكن أن تحجب رؤية السائق من الداخل ومن الخارج' لأن الرؤية الواضحة أساسية للسلامة.",
  },
  {
    id: 10,
    type: "multi",
    emoji: "🚸",
    text: "من بين الفئات التالية، من يمكن أن يتأثر بعادات القيادة السيئة للسائق؟",
    options: ["السائق نفسه", "السائقين الآخرين", "الركاب", "المشاة"],
    correct: [0, 1, 2, 3],
    explanation:
      "الوثيقة تؤكد أن عادات القيادة السيئة تشكل خطراً على 'السائق نفسه وكذلك على السائقين الآخرين والركاب والمشاة على حد سواء'، أي جميع الفئات.",
  },
];

export function getDrivingPrecautionsQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return DRIVING_PRECAUTIONS_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreDrivingPrecautionsAnswers(
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
  const total = DRIVING_PRECAUTIONS_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of DRIVING_PRECAUTIONS_LESSON_QUESTIONS) {
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

