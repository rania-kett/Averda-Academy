/** الكنس مقابل حركة المرور — lesson quiz (server-side validation). */

export type LessonQuizDef = {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
};

export const SWEEPING_AGAINST_TRAFFIC_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🚦",
    text: "ما أهم أساس لإجراءات السلامة أثناء أنشطة الكنس؟",
    options: ["ارتداء ملابس العمل المناسبة", "الكنس مقابل حركة المرور", "استخدام أدوات الكنس الصحيحة", "العمل في مجموعات"],
    correct: [1],
    explanation:
      "الكنس مقابل حركة المرور يُعد أهم أساس لإجراءات السلامة أثناء أنشطة الكنس، لأنه يمكّن العامل من رؤية السيارات القادمة والتفاعل معها في الوقت المناسب.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "⚠️",
    text: "في المواقع الاستثنائية التي يتعذر فيها الكنس مقابل حركة المرور، يمكن للعامل العمل بشكل طبيعي دون الحاجة لأي احتياط إضافي.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. حتى في المواقع الاستثنائية التي يتعذر فيها احترام هذه الإرشادات، يجب على العامل أن يبقى يقظاً في مراقبة الطريق باستمرار.",
  },
  {
    id: 3,
    type: "single",
    emoji: "👀",
    text: "ما الذي يجب على عامل الكنس فعله في المواقع الاستثنائية التي لا يمكنه فيها الكنس مقابل حركة المرور؟",
    options: ["التوقف عن العمل حتى تخف حركة المرور", "البقاء على الرصيف فقط", "البقاء يقظاً في مراقبة الطريق", "طلب مساعدة زميل للتنبيه"],
    correct: [2],
    explanation:
      "في المواقع الاستثنائية، يجب على عامل الكنس أن يبقى يقظاً في مراقبة الطريق باستمرار لتعويض غياب الإرشاد الأساسي.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "🚗",
    text: "الكنس في نفس اتجاه حركة المرور (أي السيارات خلف العامل) هو الأسلوب الصحيح والآمن.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الكنس في نفس اتجاه حركة المرور يعني أن السيارات تأتي من خلف العامل دون أن يراها، وهو ما يُعرّضه للخطر. يجب دائماً الكنس مقابل حركة المرور.",
  },
  {
    id: 5,
    type: "single",
    emoji: "🧹",
    text: "لماذا يُعد الكنس مقابل حركة المرور أكثر أماناً من الكنس في نفس اتجاهها؟",
    options: ["لأنه يجعل العمل أسرع وأكثر كفاءة", "لأن العامل يرى السيارات القادمة ويمكنه تفاديها", "لأن ذلك يقلل من تراكم الغبار", "لأن السائقين لا ينتبهون للعمال من الخلف"],
    correct: [1],
    explanation:
      "الكنس مقابل حركة المرور يجعل العامل مواجهاً للسيارات القادمة، مما يمكنه من رؤيتها مبكراً واتخاذ الإجراء المناسب لحماية نفسه.",
  },
  {
    id: 6,
    type: "single",
    emoji: "👷",
    text: "لمن هو موجَّه هذا الموجز التحسيسي الأسبوعي؟",
    options: ["عمال الجمع", "السائقين", "عمال الكنس", "مصلحة الصيانة"],
    correct: [2],
    explanation:
      "هذا الموجز التحسيسي موجَّه لعمال الكنس الذين يعملون على الطريق ويحتاجون إلى اتباع إجراءات السلامة المتعلقة بحركة المرور.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "📍",
    text: "إرشادات الكنس مقابل حركة المرور إلزامية في جميع المواقع دون استثناء.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. في بعض المواقع الاستثنائية قد يتعذر احترام هذه الإرشادات، لكن يجب في هذه الحالة البقاء يقظاً في مراقبة الطريق كإجراء بديل.",
  },
  {
    id: 8,
    type: "single",
    emoji: "↩️",
    text: "ما الوضع الصحيح لعامل الكنس بالنسبة لحركة المرور؟",
    options: ["العامل والسيارات في نفس الاتجاه", "العامل يكنس بشكل عمودي على الطريق", "العامل في مواجهة السيارات القادمة", "لا يهم الاتجاه طالما العامل على الرصيف"],
    correct: [2],
    explanation:
      "يجب أن يكون العامل في مواجهة السيارات القادمة أثناء الكنس، أي أن يكنس مقابل حركة المرور وليس في نفس اتجاهها.",
  },
  {
    id: 9,
    type: "tf",
    emoji: "✅",
    text: "اليقظة ومراقبة الطريق واجبة على عامل الكنس في جميع الأحوال، سواء كان يكنس مقابل حركة المرور أو في مواقع استثنائية.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. اليقظة ومراقبة الطريق واجبة دائماً على عامل الكنس في جميع الأحوال، وهي الحد الأدنى من السلامة الواجب احترامه في كل الأوقات.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🛑",
    text: "ما الخطر الرئيسي الذي يواجهه عامل الكنس الذي لا يلتزم بالكنس مقابل حركة المرور؟",
    options: ["تعب أكبر أثناء العمل", "عدم رؤية السيارات القادمة من خلفه مما يعرّضه للاصطدام", "انخفاض جودة الكنس", "الإخلال بحركة المرور"],
    correct: [1],
    explanation:
      "الخطر الرئيسي هو عدم رؤية السيارات القادمة من خلفه، مما يجعله عرضة للاصطدام دون أي إنذار مسبق، وهو ما قد يؤدي إلى حوادث خطيرة أو وفاة.",
  },
];

export function getSweepingAgainstTrafficQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return SWEEPING_AGAINST_TRAFFIC_LESSON_QUESTIONS.map(
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

export function scoreSweepingAgainstTrafficAnswers(
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
  const total = SWEEPING_AGAINST_TRAFFIC_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of SWEEPING_AGAINST_TRAFFIC_LESSON_QUESTIONS) {
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

