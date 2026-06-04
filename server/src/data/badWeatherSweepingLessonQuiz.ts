/** حالة الكنس في طقس سيء — lesson quiz (server-side validation). */

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

export const BAD_WEATHER_SWEEPING_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🌧️",
    text: "ما الظروف الجوية التي يجب على عامل الكنس تجنب العمل فيها؟",
    options: [
      "المطر الخفيف والرياح الخفيفة",
      "المطر الغزير والعواصف الرملية والضباب الكثيف",
      "الحرارة الشديدة والجفاف",
      "الغيوم والبرودة الخفيفة",
    ],
    correct: [1],
    explanation:
      "يجب على عامل الكنس تجنب العمل تحت المطر الغزير والعواصف الرملية والضباب الكثيف، والبقاء في منطقة مغطاة وانتظار تعليمات المشرف المباشر.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🌪️",
    text: "عند وقوع عاصفة رملية أو ضباب كثيف، يمكن لعامل الكنس الاستمرار في العمل بشرط ارتداء معدات الحماية.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يجب على عامل الكنس التوقف عن العمل تماماً والبقاء في منطقة مغطاة وانتظار تعليمات المشرف المباشر، بغض النظر عن معدات الحماية المرتداة.",
  },
  {
    id: 3,
    type: "single",
    emoji: "⏸️",
    text: "ماذا يفعل عامل الكنس عند توقفه عن العمل بسبب الطقس السيء؟",
    options: [
      "يعود إلى المنزل مباشرة",
      "يواصل العمل بوتيرة أبطأ",
      "يبقى في منطقة مغطاة وينتظر تعليمات المشرف المباشر",
      "يتصل بالإدارة لطلب الإجازة",
    ],
    correct: [2],
    explanation:
      "يجب على عامل الكنس البقاء في منطقة مغطاة وانتظار تعليمات المشرف المباشر، لأن المشرف هو المخوّل باتخاذ قرار استئناف العمل أو التوقف.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "💧",
    text: "حالة الأمطار يمكن أن تزيد من احتمال انزلاق العامل وانزلاق السيارات المارة في نفس الوقت.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. المطر يجعل الأرض زلقة مما يزيد من احتمال انزلاق العامل، كما يقلل من التحكم في السيارات مما يرفع خطر انزلاقها، وهذا ما يجعل الطقس الممطر خطيراً بشكل مضاعف.",
  },
  {
    id: 5,
    type: "single",
    emoji: "🧥",
    text: "ما الملابس الإضافية التي يجب على عامل الكنس ارتداؤها في حالة المطر؟",
    options: [
      "قبعة واقية من المطر",
      "معطف المطر",
      "حذاء مطاطي فقط",
      "قفازات مقاومة للماء",
    ],
    correct: [1],
    explanation:
      "يجب على عامل الكنس ارتداء معطف المطر تحديداً عند العمل في الطقس الممطر، وهو من معدات الحماية الشخصية الإلزامية في هذه الحالة.",
  },
  {
    id: 6,
    type: "tf",
    emoji: "🦺",
    text: "السترة ذات الأشرطة العاكسة للضوء ضرورية فقط في الليل وليس أثناء الطقس السيء نهاراً.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يجب ارتداء السترة ذات الأشرطة العاكسة في أي حالة تكون فيها إمكانية رؤية العامل من طرف مستعملي الطريق ضعيفة، سواء كان ذلك ليلاً أو في حالات الضباب والمطر نهاراً.",
  },
  {
    id: 7,
    type: "single",
    emoji: "🚗",
    text: "لماذا يجب على عامل الكنس الانتباه لحركة المرور بشكل خاص أثناء المطر؟",
    options: [
      "لأن الأمطار تجعل الرؤية أوضح للسائقين",
      "لأن المطر يزيد من احتمال انزلاقه وانزلاق السيارات المارة",
      "لأن السائقين يسرعون أكثر في المطر",
      "لأن أدوات الكنس تصبح أثقل في المطر",
    ],
    correct: [1],
    explanation:
      "حالة الأمطار تزيد من احتمال انزلاق العامل بسبب الأرضية الزلقة، وتزيد أيضاً من احتمال انزلاق السيارات، مما يجعل التنبه لحركة المرور أكثر أهمية من المعتاد.",
  },
  {
    id: 8,
    type: "single",
    emoji: "👷",
    text: "من المخوّل بإعطاء العامل إذن استئناف العمل بعد توقفه بسبب الطقس السيء؟",
    options: [
      "العامل نفسه بناءً على تقديره الشخصي",
      "زملاؤه في الفريق",
      "المشرف المباشر",
      "إدارة السلامة المركزية",
    ],
    correct: [2],
    explanation:
      "يجب على العامل انتظار تعليمات المشرف المباشر، فهو المخوّل باتخاذ قرار استئناف العمل أو الاستمرار في الانتظار بناءً على تقييمه لظروف السلامة.",
  },
  {
    id: 9,
    type: "tf",
    emoji: "✅",
    text: "يجب على عامل الكنس ارتداء السترة العاكسة دائماً عند ضعف إمكانية رؤيته من طرف مستعملي الطريق.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. ارتداء السترة ذات الأشرطة العاكسة للضوء إلزامي في كل الأحوال التي تكون فيها إمكانية رؤية العامل ضعيفة، سواء بسبب الضباب أو المطر أو قلة الإضاءة.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🛡️",
    text: "ما مجموع معدات الحماية الواجب توفرها عند الكنس في الطقس السيء الممطر؟",
    options: [
      "معطف المطر فقط",
      "السترة العاكسة فقط",
      "معطف المطر والسترة ذات الأشرطة العاكسة للضوء",
      "القفازات والحذاء المطاطي",
    ],
    correct: [2],
    explanation:
      "في حالة الطقس الممطر السيء يجب الجمع بين معطف المطر للحماية من البلل، والسترة ذات الأشرطة العاكسة للضوء لضمان رؤية العامل من طرف مستعملي الطريق في ظل الرؤية الضعيفة.",
  },
];

export function getBadWeatherSweepingQuestionsForClient() {
  return BAD_WEATHER_SWEEPING_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreBadWeatherSweepingAnswers(answers: { questionId: number; selectedIndices: number[] }[]) {
  const total = BAD_WEATHER_SWEEPING_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of BAD_WEATHER_SWEEPING_LESSON_QUESTIONS) {
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
