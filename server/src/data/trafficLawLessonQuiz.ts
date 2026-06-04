/** احترام قانون السير — lesson quiz (server-side validation). */

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

export const TRAFFIC_LAW_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🏙️",
    text: "ما هي السرعة المسموح بها داخل الأحياء السكنية (أثناء الجمع)؟",
    options: ["40 كلم/ساعة", "20 كلم/ساعة", "60 كلم/ساعة", "80 كلم/ساعة"],
    correct: [1],
    explanation:
      "تنصّ قوانين السير على احترام سرعة 20 كلم/ساعة أثناء التجمعات وداخل الأحياء السكنية، لأن الكثافة البشرية تجعل الطريق أكثر خطورة.",
  },
  {
    id: 2,
    type: "single",
    emoji: "🛣️",
    text: "ما هي السرعة القصوى المسموح بها على الطريق العام خارج التجمعات؟",
    options: ["100 كلم/ساعة", "80 كلم/ساعة", "60 كلم/ساعة", "50 كلم/ساعة"],
    correct: [2],
    explanation: "على الطريق العام خارج الأحياء تكون السرعة القصوى هي 60 كلم/ساعة. احترام السرعة يحمي الجميع.",
  },
  {
    id: 3,
    type: "tf",
    emoji: "📘",
    text: "يكفي تعلّم قيادة السيارة دون الحاجة إلى معرفة قوانين المرور للسير بأمان.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. معرفة القيادة وحدها غير كافية — يجب فهم قوانين المرور العامة والقوانين الخاصة ببعض المناطق.",
  },
  {
    id: 4,
    type: "multi",
    emoji: "⛔",
    text: "من بين التالي، ما هي التصرفات الممنوعة أثناء القيادة؟",
    options: ["التكلم على الهاتف", "احترام الإشارات الضوئية", "تناول الممنوعات", "القيادة عكس السير", "استخدام الإضاءة بشكل جيد"],
    correct: [0, 2, 3],
    explanation:
      "الممنوع هو: التكلم على الهاتف، تناول الممنوعات، والقيادة عكس السير. أما احترام الإشارات والإضاءة الجيدة فهما واجبان.",
  },
  {
    id: 5,
    type: "single",
    emoji: "🛡️",
    text: "ما هو الدور الرئيسي لقوانين السير؟",
    options: ["تقليل الازدحام فقط", "حماية جميع مستخدمي الطريق وتنظيم استخدامه", "تغريم السائقين وجمع الأموال", "تسهيل عمل الشرطة فقط"],
    correct: [1],
    explanation:
      "قوانين السير تحمي جميع مستخدمي الطريق من سائقين وركاب ومشاة، وتنظّم استخدام الطريق لفائدة كل أفراد المجتمع.",
  },
  {
    id: 6,
    type: "tf",
    emoji: "💡",
    text: "الإضاءة السيئة للمركبة تُعدّ من الممنوعات أثناء القيادة.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. الإضاءة السيئة محظورة لأنها تشكّل خطراً على السائق والمحيطين به، خاصة في الليل.",
  },
  {
    id: 7,
    type: "multi",
    emoji: "🚦",
    text: "أي من القوانين التالية يجب على السائق احترامها وفق الدرس؟",
    options: ["احترام الإشارات الضوئية", "احترام ممر الراجلين", "التجاوز من اليمين دائماً", "احترام الخطوط", "احترام السرعة المحددة"],
    correct: [0, 1, 3, 4],
    explanation:
      "الدرس يحدد: احترام الإشارات الضوئية، ممر الراجلين، الخطوط، والسرعة. التجاوز من اليمين ليس ضمن القائمة.",
  },
  {
    id: 8,
    type: "single",
    emoji: "⚠️",
    text: "ماذا يحدث لو لم يلتزم أفراد المجتمع بقوانين السير؟",
    options: ["سيصبح الطريق أكثر أماناً", "ستعمّ الفوضى ويصعب التنقل والسفر", "لن يتأثر شيء", "سيزداد عدد السيارات فقط"],
    correct: [1],
    explanation:
      "بدون قوانين السير ستعمّ الفوضى ويصعب التنقل، ويصبح السير خطراً خاصة في الأحياء السكنية المكتظة.",
  },
  {
    id: 9,
    type: "multi",
    emoji: "👥",
    text: "أي من فئات مستخدمي الطريق تحميهم قوانين السير؟",
    options: ["السائقون", "الركاب", "المشاة", "عمال البناء في المصانع", "أفراد الأمن في المطارات"],
    correct: [0, 1, 2],
    explanation: "قوانين السير تحمي السائقين والركاب والمشاة فقط، وهم مستخدمو الطريق المباشرون.",
  },
  {
    id: 10,
    type: "tf",
    emoji: "📍",
    text: "يكفي أن يعرف السائق قوانين المرور العامة فقط دون معرفة القوانين الخاصة ببعض المناطق.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الدرس ينص على ضرورة الفهم الشامل للقوانين العامة وبعض القوانين الخاصة بالمناطق المختلفة.",
  },
];

export function getTrafficLawQuestionsForClient() {
  return TRAFFIC_LAW_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreTrafficLawAnswers(answers: { questionId: number; selectedIndices: number[] }[]) {
  const total = TRAFFIC_LAW_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of TRAFFIC_LAW_LESSON_QUESTIONS) {
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

