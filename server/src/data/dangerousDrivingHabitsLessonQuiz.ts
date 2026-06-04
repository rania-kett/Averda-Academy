/** عادات القيادة الخطرة — lesson quiz (server-side validation). */

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

export const DANGEROUS_DRIVING_HABITS_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "⚠️",
    text: "على من تشكّل عادات القيادة السيئة خطراً وفق الدرس؟",
    options: ["على السائق نفسه فقط", "على المشاة فقط", "على السائق والسائقين الآخرين والركاب والمشاة على حد سواء", "على الركاب داخل السيارة فقط"],
    correct: [2],
    explanation: "عادات القيادة السيئة تشكّل خطراً على السائق نفسه وكذلك على السائقين الآخرين والركاب والمشاة على حد سواء.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🏘️",
    text: "القيادة بسرعة زائدة خطيرة بشكل خاص عند القيادة في الأحياء السكنية.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation: "صحيح. تجاوز السرعة هو ممارسة خطيرة بشكل خاص عند القيادة في الأحياء السكنية نظراً لكثرة المشاة والسكان.",
  },
  {
    id: 3,
    type: "single",
    emoji: "📵",
    text: "ماذا يجب على السائق فعله إذا اضطر للتحدث على الهاتف الخليوي أثناء القيادة؟",
    options: ["يتحدث بسرعة ويكمل القيادة", "يستخدم سماعة اللاسلكي", "يتوقف قليلاً على جانب الطريق", "يخفّض السرعة ويكمل المحادثة"],
    correct: [2],
    explanation:
      "إذا كان لا بد من التحدث يجب التوقف قليلاً على جانب الطريق، لأن من الصعب للغاية إبقاء العينين على الطريق أثناء التحدث على الهاتف.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "🍔",
    text: "تناول وجبة خفيفة أثناء القيادة أمر مقبول طالما كانت السرعة منخفضة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الأكل أثناء القيادة غير مستحسن بتاتاً. يجب أن يكون الانتباه الكامل على الطريق، ومحاولة تناول الطعام مع التحكم بالسيارة مهمة صعبة إن لم تكن مستحيلة.",
  },
  {
    id: 5,
    type: "single",
    emoji: "↩️",
    text: "ما الغرض من استخدام إشارات الانعطاف؟",
    options: ["إضاءة الطريق في الليل", "إعلام الآخرين على الطريق بنية تغيير الاتجاه أو الالتفاف", "التواصل مع الشرطة", "الإشارة إلى وقود منخفض"],
    correct: [1],
    explanation:
      "إشارات الانعطاف توجّه إشعاراً للأشخاص الآخرين بنية السائق تغيير الاتجاه أو الالتفاف. عدم استخدامها قد يؤدي إلى وقوع حادث.",
  },
  {
    id: 6,
    type: "multi",
    emoji: "🚦",
    text: "ما هي العواقب المحتملة لعدم استخدام إشارات الانعطاف؟",
    options: ["وقوع حادث مروري", "التعرض لعواقب الغضب على الطريق من سائقين آخرين", "تلف السيارة الميكانيكي", "غرامة مالية من الشرطة فقط"],
    correct: [0, 1],
    explanation:
      "الدرس يذكر عاقبتين: وقوع حادث، والتعرض لمواقف يعاني فيها السائق من عواقب غضب الطريق من سائقين آخرين.",
  },
  {
    id: 7,
    type: "single",
    emoji: "🧷",
    text: "لماذا يُعدّ عدم استخدام حزام الأمان من أخطر عادات القيادة؟",
    options: ["لأنه يسبب تعب للسائق", "لأنه أحد الأسباب الرئيسية للوفاة أثناء الحوادث", "لأنه يُضعف التحكم بالسيارة", "لأن القانون يُلزم به فقط"],
    correct: [1],
    explanation:
      "عدم استخدام حزام الأمان هو أحد الأسباب الرئيسية للوفاة أثناء الحوادث، عندما يتجاهل السائقون استخدام هذه الميزة الأمنية.",
  },
  {
    id: 8,
    type: "tf",
    emoji: "🪞",
    text: "الانطلاق وتغيير الاتجاه دون النظر إلى المرايا هو عادة قيادة خطرة.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. الحفاظ على عادة استخدام المرايا بشكل صحيح هي أولوية قصوى، والانطلاق أو تغيير الاتجاه دون النظر إليها يُعدّ من عادات القيادة الخطرة.",
  },
  {
    id: 9,
    type: "multi",
    emoji: "🚫",
    text: "ما هي عادات القيادة الخطرة التي يذكرها الدرس؟",
    options: ["تجاوز السرعة", "استخدام الهاتف الخليوي أثناء القيادة", "الأكل أثناء القيادة", "فتح النافذة أثناء القيادة", "عدم استخدام حزام الأمان"],
    correct: [0, 1, 2, 4],
    explanation:
      "العادات الخطرة المذكورة: تجاوز السرعة، استخدام الهاتف، الأكل أثناء القيادة، وعدم استخدام حزام الأمان. فتح النافذة لم يُذكر.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🧠",
    text: "لماذا يصعب إبقاء العينين على الطريق أثناء التحدث على الهاتف الخليوي؟",
    options: ["لأن الهاتف يُصدر ضوءاً مشتتاً", "لأن التحدث على الهاتف يشغل الانتباه الذهني ويصرفه عن الطريق", "لأن الهاتف يُضعف البصر", "لأن الصوت يُربك السائق"],
    correct: [1],
    explanation:
      "من الصعب للغاية إبقاء العينين على الطريق أثناء التحدث على الهاتف، لأن المحادثة تشغل الانتباه الذهني وتصرفه عن متابعة ما يحدث على الطريق.",
  },
];

export function getDangerousDrivingHabitsQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return DANGEROUS_DRIVING_HABITS_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreDangerousDrivingHabitsAnswers(
  answers: { questionId: number; selectedIndices: number[] }[]
): {
  score: number;
  total: number;
  percentage: number;
  details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[];
} {
  const total = DANGEROUS_DRIVING_HABITS_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of DANGEROUS_DRIVING_HABITS_LESSON_QUESTIONS) {
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

