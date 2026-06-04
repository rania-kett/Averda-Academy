/** توصيات للحد من مخاطر الجلوس لفترة طويلة أثناء القيادة — lesson quiz (server-side validation). */

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

export const LONG_SITTING_DRIVING_RECO_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "⏱️",
    text: "كل كم ساعة يوصي الدرس بإيقاف السيارة للتحرك وعمل تمارين التمدد؟",
    options: ["كل ساعة", "كل ساعتين تقريباً", "كل ثلاث ساعات", "كل أربع ساعات"],
    correct: [1],
    explanation:
      "يوصي الدرس بإيقاف السيارة كل فترة (تقريباً كل ساعتين) للتحرك وعمل تمارين التمدد لدعم أسفل الظهر وتخفيف آلام الرقبة والكتف.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "📵",
    text: "يُنصح بوضع الهاتف النقال أو المحفظة في الجيب الخلفي أثناء القيادة لأن ذلك مريح.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. وضع الهاتف أو المحفظة في الجيب الخلفي قد يسبب ضرراً للعمود الفقري وألماً في الظهر أثناء القيادة مع مرور الوقت.",
  },
  {
    id: 3,
    type: "single",
    emoji: "🧍",
    text: "ما هي وضعية الجلوس الصحيحة أثناء القيادة وفق الدرس؟",
    options: ["الجسم مائل للأمام بشكل كبير", "الجسم مستقيم تقريباً مع ميلان خفيف", "الجسم مستلقٍ بشكل كامل", "الرأس بعيد جداً عن المقعد"],
    correct: [1],
    explanation:
      "يجب ضبط وضعية الجلوس بحيث يكون الجسم مستقيماً تقريباً مع ميلان خفيف. إذا كان الرأس بعيداً جداً فذلك يؤدي إلى إيذاء الرقبة ومنطقة الظهر العليا.",
  },
  {
    id: 4,
    type: "single",
    emoji: "🧻",
    text: "لماذا يُوصى بوضع منشفة خلف أسفل الظهر أثناء القيادة؟",
    options: ["لتجنب الشعور بالحرارة", "لأن كرسي السيارة لا يدعم المنحنى الطبيعي للظهر", "لإضافة ارتفاع للمقعد", "لتجنب التعرق"],
    correct: [1],
    explanation:
      "وضع منشفة خلف أسفل الظهر يوفر دعماً إضافياً لأن كرسي السيارة عادةً لا يدعم المنحنى الطبيعي للظهر.",
  },
  {
    id: 5,
    type: "tf",
    emoji: "🪞",
    text: "يجب على السائق أخذ وقت كافٍ قبل بدء الرحلة للتأكد من ارتياحه من وضعية الجلوس وضبط المرايا والمقعد.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. الدرس يوصي بأخذ فترة من الراحة قبل بدء الرحلة للتأكد من الارتياح من وضعية الجلوس والتحقق من المرايا وضبط المقعد.",
  },
  {
    id: 6,
    type: "multi",
    emoji: "🧘",
    text: "ما هي تمارين التمدد التي يذكرها الدرس للحد من آلام الجسم؟",
    options: ["الانحناء للأسفل للمس القدم مع ثني الركبتين", "تمارين لتخفيف آلام الرقبة والكتف", "ركض خفيف لمدة 30 دقيقة", "تمارين دعم أسفل الظهر"],
    correct: [0, 1, 3],
    explanation:
      "الدرس يذكر: الانحناء للأسفل لمس القدم مع ثني الركبتين، تمارين لتخفيف آلام الرقبة والكتف، وتمارين دعم أسفل الظهر. الركض لم يُذكر في الدرس.",
  },
  {
    id: 7,
    type: "single",
    emoji: "🛁",
    text: "ما الذي يُوصى به في نهاية يوم العمل للتخفيف من آثار الجلوس الطويل؟",
    options: ["تناول مسكنات الألم مباشرة", "استخدام كمامات ماء دافئة أو أخذ حمام دافئ", "ممارسة رياضة شاقة لمدة ساعة", "الاستلقاء مباشرة دون أي نشاط"],
    correct: [1],
    explanation:
      "يوصي الدرس باستخدام كمامات ماء دافئة أو أخذ حمام دافئ في نهاية يوم العمل للمساعدة على ارتخاء العضلات.",
  },
  {
    id: 8,
    type: "tf",
    emoji: "🧠",
    text: "إذا كان الرأس بعيداً جداً عن المقعد أثناء القيادة فذلك يؤدي إلى إيذاء الرقبة ومنطقة الظهر العليا.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. ابتعاد الرأس كثيراً يؤدي إلى إيذاء الرقبة ومنطقة الظهر العليا، لذا يجب ضبط وضعية الجلوس بشكل صحيح.",
  },
  {
    id: 9,
    type: "multi",
    emoji: "✅",
    text: "ما هي التوصيات الصحيحة للحد من مخاطر الجلوس الطويل أثناء القيادة؟",
    options: [
      "ضبط المقعد والمرايا قبل بدء الرحلة",
      "وضع منشفة خلف أسفل الظهر",
      "وضع المحفظة في الجيب الخلفي للراحة",
      "إيقاف السيارة كل ساعتين تقريباً للتمدد",
      "أخذ حمام دافئ في نهاية يوم العمل",
    ],
    correct: [0, 1, 3, 4],
    explanation:
      "التوصيات الصحيحة: ضبط المقعد والمرايا، وضع منشفة خلف أسفل الظهر، إيقاف السيارة كل ساعتين، وحمام دافئ في نهاية اليوم. وضع المحفظة في الجيب الخلفي ممنوع.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🦴",
    text: "ما الخطر الصحي الرئيسي من وضع الهاتف أو المحفظة في الجيب الخلفي أثناء القيادة؟",
    options: ["خطر ضياع الهاتف", "ضرر للعمود الفقري وألم في الظهر مع مرور الوقت", "صعوبة في الوصول للهاتف عند الحاجة", "خطر على الدورة الدموية في الساقين فقط"],
    correct: [1],
    explanation:
      "وضع الهاتف أو المحفظة في الجيب الخلفي يسبب ضرراً للعمود الفقري وألماً في الظهر أثناء القيادة مع مرور الوقت بسبب الجلوس على وضعية غير متوازنة.",
  },
];

export function getLongSittingDrivingRecoQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return LONG_SITTING_DRIVING_RECO_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreLongSittingDrivingRecoAnswers(
  answers: { questionId: number; selectedIndices: number[] }[]
): {
  score: number;
  total: number;
  percentage: number;
  details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[];
} {
  const total = LONG_SITTING_DRIVING_RECO_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of LONG_SITTING_DRIVING_RECO_LESSON_QUESTIONS) {
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

