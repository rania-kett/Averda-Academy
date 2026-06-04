/** السلامة أولاً: قانون السير — canonical lesson quiz (server-side validation). Do not translate. */

export const ROAD_TRAFFIC_SAFETY_SLUG = "road-traffic-safety";

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

export const ROAD_SAFETY_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🚗",
    text: "ما هو الهدف الرئيسي من قوانين السير في الطريق؟",
    options: [
      "تحقيق الإيرادات من الغرامات",
      "تنظيم حركة المرور وحماية جميع مستخدمي الطريق من السائقين والراكبين والمشاة",
      "تقليص استخدام السيارات",
      "تسهيل عمل الشرطة فقط",
    ],
    correct: [1],
    explanation:
      "قوانين السير تهدف إلى: تأمين التنقل الآمن في الأحياء، منع الفوضى، وحماية جميع مستخدمي الطريق.",
  },
  {
    id: 2,
    type: "single",
    emoji: "🔺",
    text: "ما الذي يرمز إليه شكل المثلث في لافتات الطريق؟",
    options: [
      "معلومات وتوجيهات",
      "المنع الفوري والإلزامي",
      "التنبه لوجود خطر محتمل",
      "الإذن بالعبور",
    ],
    correct: [2],
    explanation: "المربع = معلومات. المثلث = انتباه لوجود خطر. الدائرة = منع فوري وإلزامي.",
  },
  {
    id: 3,
    type: "single",
    emoji: "🚦",
    text: "ماذا يعني الضوء الأصفر في إشارة المرور؟",
    options: [
      "السرعة قبل تحول الإشارة للأحمر",
      "مرحلة انتقالية — استعد للتوقف",
      "الطريق آمن للعبور",
      "التوقف فوراً كالضوء الأحمر",
    ],
    correct: [1],
    explanation: "الأصفر = استعد للتوقف. الأحمر = توقف تام. الأخضر = الطريق آمن للعبور.",
  },
  {
    id: 4,
    type: "single",
    emoji: "➡️",
    text: "ما نوع خط الطريق الذي يُسمح فيه بالتجاوز؟",
    options: [
      "الخط المتصل فقط",
      "الخط المختلط من جهة اليمين والخط المتقطع",
      "الخط المتصل والمتقطع معاً",
      "لا يُسمح بالتجاوز في أي حال",
    ],
    correct: [1],
    explanation: "المتقطع = مسموح. المتصل = ممنوع. المختلط = مسموح من جهة اليمين فقط.",
  },
  {
    id: 5,
    type: "single",
    emoji: "🏙️",
    text: "ما هو الحد الأقصى للسرعة في مناطق الجمع والأحياء السكنية المكتظة؟",
    options: ["40 كلم/ساعة", "60 كلم/ساعة", "20 كلم/ساعة", "30 كلم/ساعة"],
    correct: [2],
    explanation: "20 كلم/ساعة في الأحياء السكنية. 60 كلم/ساعة في الطريق العادي.",
  },
  {
    id: 6,
    type: "tf",
    emoji: "🚶",
    text: "يُعدّ احترام ممر الراجلين التزاماً اختيارياً يتوقف على تقدير السائق.",
    options: ["✓ صحيح", "✗ خطأ"],
    correct: [1],
    explanation: "خطأ. احترام ممر الراجلين التزام أخلاقي وقانوني. المشاة لهم أولوية المرور.",
  },
  {
    id: 7,
    type: "single",
    emoji: "📵",
    text: "أيٌّ من التصرفات التالية يُعدّ من الممنوعات الأربعة التي تهدد الحياة أثناء القيادة؟",
    options: [
      "فتح النافذة",
      "التكلم على الهاتف أثناء القيادة",
      "تشغيل المكيف",
      "الاستماع للراديو بصوت منخفض",
    ],
    correct: [1],
    explanation:
      "الممنوعات الأربعة: تناول الممنوعات، التكلم على الهاتف، القيادة عكس السير، الإضاءة السيئة.",
  },
  {
    id: 8,
    type: "tf",
    emoji: "🔄",
    text: "القيادة في الاتجاه المعاكس قد تكون مقبولة في حالات الطوارئ.",
    options: ["✓ صحيح", "✗ خطأ"],
    correct: [1],
    explanation: "خطأ تماماً. القيادة عكس السير هي خطأ قاتل ومباشر في جميع الأحوال بلا أي استثناء.",
  },
  {
    id: 9,
    type: "single",
    emoji: "🛡️",
    text: "ما الذي يضمن عودة الجميع إلى منازلهم بسلام وفق ما ورد في الدورة؟",
    options: [
      "السرعة الفائقة والحيلة في القيادة",
      "معرفة علامات المنع واحترام الخطوط وتجنب المشتتات",
      "امتلاك سيارة بمواصفات عالية",
      "تجنب القيادة في الليل فقط",
    ],
    correct: [1],
    explanation: "الطريق الآمن = معرفة علامات المنع + احترام الخطوط + تجنب المشتتات.",
  },
  {
    id: 10,
    type: "single",
    emoji: "💡",
    text: "ما الدور الحقيقي للإضاءة السيئة للمركبة على الطريق؟",
    options: [
      "تساعد السائق على الرؤية",
      "تعمي السائقين الآخرين أو تخفي المخاطر",
      "لا تأثير لها على السلامة",
      "تُستخدم فقط في الطرق السريعة",
    ],
    correct: [1],
    explanation:
      "الإضاءة السيئة تعمي السائقين القادمين أو تخفي المخاطر — لذا هي من الممنوعات الأربعة.",
  },
];

export function getRoadSafetyQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return ROAD_SAFETY_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreRoadSafetyAnswers(
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
  const total = ROAD_SAFETY_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of ROAD_SAFETY_LESSON_QUESTIONS) {
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

export function getExplanation(questionId: number): string | undefined {
  return ROAD_SAFETY_LESSON_QUESTIONS.find((q) => q.id === questionId)?.explanation;
}
