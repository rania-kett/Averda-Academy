/** الحفاظ على الجسم — lesson quiz (server-side validation). */

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

export const BODY_PRESERVATION_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "💪",
    text: "لماذا يجب على عامل الكنس معرفة أسس تدبير أنشطته؟",
    options: ["لتسريع إنجاز العمل فقط", "للحفاظ على جسده الذي يعد أداة عمله الرئيسية", "لإرضاء المشرف", "لتجنب الغرامات المالية"],
    correct: [1],
    explanation:
      "عمال الكنس يقومون بمجهود بدني كبير ويمشون لمسافات طويلة، لذا يجب معرفة أسس تدبير الأنشطة من أجل الحفاظ على الجسد الذي يُعدّ أداة العمل الرئيسية.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🧍",
    text: "يجوز لعامل الكنس ثني ظهره عند استخدام المكنسة إذا كان ذلك أسرع في العمل.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يجب تجنب ثني الظهر في جميع الظروف، سواء عند استخدام المكنسة أو الملقاة أو غيرها، لأن ذلك يضر بالظهر على المدى الطويل.",
  },
  {
    id: 3,
    type: "multi",
    emoji: "🦺",
    text: "ما هي معدات الحماية التي يجب على عامل الكنس ارتداؤها وفق الدرس؟",
    options: ["زي العمل", "أحذية مانعة للانزلاق", "قفازات مناسبة للعمل", "نظارات واقية", "خوذة الرأس"],
    correct: [0, 1, 2],
    explanation:
      "الدرس يحدد ثلاث معدات إلزامية: زي العمل، أحذية مانعة للانزلاق، وقفازات مناسبة للعمل. النظارات والخوذة لم تُذكر في هذا الدرس.",
  },
  {
    id: 4,
    type: "single",
    emoji: "🫁",
    text: "ما هو المؤشر الذي يدل على أن وتيرة العمل مناسبة لقدرات عامل الكنس؟",
    options: ["أن يشعر بتعب شديد في نهاية اليوم", "أن يكون قادراً على التحدث دون الشعور بضيق في التنفس", "أن ينهي العمل قبل الوقت المحدد", "أن لا يتوقف للراحة أبداً"],
    correct: [1],
    explanation:
      "يجب أن يكون العامل قادراً على التحدث دون الشعور بضيق في التنفس، وهذا يعني أن وتيرة عمله تتكيف مع قدراته.",
  },
  {
    id: 5,
    type: "tf",
    emoji: "🏋️",
    text: "يجب على عامل الكنس تجنب حمل الأشياء الثقيلة عندما يكون بمفرده.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. عندما يكون العامل بمفرده يجب تجنب حمل الأشياء الثقيلة، لأن ذلك قد يسبب إصابات جسدية.",
  },
  {
    id: 6,
    type: "single",
    emoji: "🛌",
    text: "متى يجب على عامل الكنس التخطيط لفترة يوم راحة؟",
    options: ["كل يوم بعد العمل", "في الوقت المناسب بعد بذل جهد مكثف كالعمل خلال أيام العطل", "مرة في الشهر فقط", "عند الشعور بمرض فقط"],
    correct: [1],
    explanation:
      "يجب التخطيط لفترة يوم راحة في الوقت المناسب بعد بذل جهد مكثف كالعمل خلال أيام العطل، حتى يتعافى الجسم ويستعيد طاقته.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "🍽️",
    text: "يجب على عامل الكنس الأكل بكثرة قبل العمل لتوفير الطاقة الكافية للمجهود البدني.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الدرس ينصح بعدم الإثقال من خلال الأكل بكثرة، لأن ذلك يثقل الجسم ويؤثر سلباً على الأداء أثناء العمل البدني.",
  },
  {
    id: 8,
    type: "multi",
    emoji: "📈",
    text: "ما هي النصائح المتعلقة بتنظيم وتيرة العمل للحفاظ على الجسم؟",
    options: [
      "الحفاظ على وتيرة عمل ثابتة تتكيف مع القدرات",
      "ضبط السرعة على المسار المراد تغطيته",
      "العمل بأقصى سرعة لإنهاء العمل مبكراً",
      "أخذ فترات راحة أثناء العمل حسب الحاجة بالاتفاق مع المشرف",
    ],
    correct: [0, 1, 3],
    explanation:
      "النصائح الصحيحة: الحفاظ على وتيرة ثابتة، ضبط السرعة على المسار، وأخذ فترات راحة بالاتفاق مع المشرف. العمل بأقصى سرعة لا يُنصح به.",
  },
  {
    id: 9,
    type: "single",
    emoji: "👔",
    text: "مع من يجب الاتفاق قبل أخذ فترات راحة أثناء العمل؟",
    options: ["مع زملاء العمل فقط", "مع المشرف", "لا يحتاج إلى اتفاق مع أحد", "مع إدارة الموارد البشرية"],
    correct: [1],
    explanation:
      "يجب أخذ فترات راحة حسب الحاجة بالاتفاق مع المشرف، لضمان تنظيم العمل وعدم التأثير على سير المهام.",
  },
  {
    id: 10,
    type: "multi",
    emoji: "🧠",
    text: "ما هي الأسباب التي تجعل الحفاظ على الجسم ضرورة لعمال الكنس؟",
    options: ["لأنهم يقومون بمجهود بدني كبير خلال عملهم", "لأنهم يمشون لمسافات طويلة", "لأن الجسم هو أداة عملهم الرئيسية", "لأن القانون يُلزمهم بذلك", "لأن المشرف يراقبهم باستمرار"],
    correct: [0, 1, 2],
    explanation:
      "الأسباب التي يذكرها الدرس: المجهود البدني الكبير، المشي لمسافات طويلة، وكون الجسم هو أداة العمل الرئيسية.",
  },
];

export function getBodyPreservationQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return BODY_PRESERVATION_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreBodyPreservationAnswers(
  answers: { questionId: number; selectedIndices: number[] }[]
): {
  score: number;
  total: number;
  percentage: number;
  details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[];
} {
  const total = BODY_PRESERVATION_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of BODY_PRESERVATION_LESSON_QUESTIONS) {
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

