/** سلامة عمليات الكنس — lesson quiz (server-side validation). */

export const SWEEPING_SAFETY_SLUG = "street-sweeping-safety";

export type LessonQuizDef = {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
};

export const SWEEPING_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1, type: "single",
    emoji: "🧹",
    text: "في أي اتجاه يجب على عامل الكنس أن يعمل بالنسبة لحركة السير؟",
    options: ["في نفس اتجاه حركة السير", "في الاتجاه المعاكس لحركة السير", "في المنتصف بين الاتجاهين", "لا يهم الاتجاه"],
    correct: [1],
    explanation: "يجب على عامل الكنس أن يكنس في الاتجاه المعاكس لحركة السير، حتى يتمكن من رؤية السيارات القادمة ويراه السائقون بوضوح."
  },
  {
    id: 2, type: "tf",
    emoji: "🏃",
    text: "يجوز لعامل الكنس النزول من الرصيف والركض إلى منتصف الطريق لالتقاط الورق إذا كانت الحركة المرورية خفيفة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. لا يجوز النزول من الرصيف ولا الركض إلى منتصف الطريق لالتقاط الورق مهما كانت الظروف."
  },
  {
    id: 3, type: "single",
    emoji: "🧤",
    text: "ما الذي يجب على عامل الكنس استخدامه دائماً عند التقاط النفايات؟",
    options: ["أكياس بلاستيكية", "قفازات اليد", "حذاء خاص", "أداة التقاط طويلة فقط"],
    correct: [1],
    explanation: "يجب استخدام قفازات اليد دائماً عند التقاط النفايات، لحماية اليدين من الإصابة بالزجاج أو المسامير أو الآلات الحادة."
  },
  {
    id: 4, type: "single",
    emoji: "🚧",
    text: "كيف يجب وضع العربة أثناء الكنس؟",
    options: ["بجانب الرصيف بعيداً عن الطريق", "في مكان واضح للعيان حتى تنتبه له حركة المرور", "خلف عامل الكنس مباشرة", "لا يهم مكان وضعها"],
    correct: [1],
    explanation: "يجب وضع العربة في مكان واضح للعيان بحيث يمكن لحركة المرور الانتباه لوجود العامل وتفاديه."
  },
  {
    id: 5, type: "tf",
    emoji: "🌉",
    text: "يمكن لعامل الكنس العبور من جهة إلى أخرى في الطرق السريعة من أي مكان يراه مناسباً.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. في الطرق السريعة يجب استخدام جسر المشاة أو القنطرة للعبور، ولا يجوز العبور العشوائي لأنه يعرّض الحياة للخطر."
  },
  {
    id: 6, type: "multi",
    emoji: "⚠️",
    text: "ما هي الأخطار التي يجب على عامل الكنس الانتباه إليها عند المشي؟",
    options: ["الزجاج", "المسامير", "الآلات الحادة", "الأشجار على الرصيف", "النفايات التي يمشي عليها"],
    correct: [0, 1, 2, 4],
    explanation: "الأخطار المذكورة هي: الزجاج، المسامير، الآلات الحادة، والمشي على النفايات. أما الأشجار فلم تُذكر كخطر في الدرس."
  },
  {
    id: 7, type: "single",
    emoji: "🚸",
    text: "ما الوسيلة الصحيحة للعبور في الطرق السريعة وفق الدرس؟",
    options: ["العبور السريع بين السيارات", "الانتظار حتى تنتهي حركة السير", "جسر المشاة أو القنطرة", "العبور من المنعطف الأقرب"],
    correct: [2],
    explanation: "يجب استخدام جسر المشاة أو القنطرة للعبور في الطرق السريعة، وهي الوسيلة الآمنة الوحيدة المذكورة في الدرس."
  },
  {
    id: 8, type: "tf",
    emoji: "🚶",
    text: "عند عبور الطريق، يمكن للعامل الركض إذا تأكد من أن الطريق آمنة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. حتى عند التأكد من أن الطريق آمنة، لا يجوز الركض ولا المخاطرة بالحياة عند العبور."
  },
  {
    id: 9, type: "multi",
    emoji: "📋",
    text: "ما هي القواعد الصحيحة التي يجب على عامل الكنس اتباعها؟",
    options: ["الكنس في الاتجاه المعاكس لحركة السير", "استخدام قفازات اليد دائماً", "الركض لالتقاط النفايات البعيدة", "وضع العربة في مكان واضح للعيان", "استخدام جسر المشاة في الطرق السريعة"],
    correct: [0, 1, 3, 4],
    explanation: "القواعد الصحيحة: الكنس عكس السير، استخدام القفازات، وضع العربة بوضوح، واستخدام جسر المشاة. الركض لالتقاط النفايات ممنوع."
  },
  {
    id: 10, type: "single",
    emoji: "👷",
    text: "لمن هو موجَّه هذا الدرس التحسيسي؟",
    options: ["السائقين", "عمال الجمع", "عمال الكنس", "مصلحة الصيانة"],
    correct: [2],
    explanation: "هذا الموجز التحسيسي موجَّه لعمال الكنس، الذين يعملون في الطريق ويتعرضون يومياً لمخاطر حركة المرور."
  },
];

export function getSweepingQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return SWEEPING_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreSweepingAnswers(
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
  const total = SWEEPING_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of SWEEPING_LESSON_QUESTIONS) {
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
