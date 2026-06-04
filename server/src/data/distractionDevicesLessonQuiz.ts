/** مخاطر استعمال أجهزة الإلهاء أو المفقدة للتركيز (كالهاتف أو سماعات الأذن) — lesson quiz (server-side validation). */

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

export const DISTRACTION_DEVICES_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "📱",
    text: "بكم مرة يزيد استخدام الهاتف وسماعات الأذن أثناء العمل من احتمالية وقوع الحوادث؟",
    options: ["مرتين", "ثلاث مرات", "أربع مرات", "خمس مرات"],
    correct: [2],
    explanation:
      "استخدام الهاتف وأجهزة الإلهاء كسماعات الأذن أثناء العمل يزيد من احتمالية وقوع الحوادث أربع مرات أكثر من الوضع الطبيعي.",
  },
  {
    id: 2,
    type: "single",
    emoji: "⏱️",
    text: "كم من الوقت من عدم التركيز يكفي لوقوع حادث؟",
    options: ["ثانية كاملة", "نصف ثانية", "ثانيتان", "خمس ثوانٍ"],
    correct: [1],
    explanation:
      "نصف ثانية من عدم التركيز كافية لوقوع حادث، مما يدل على خطورة أي تشتت للانتباه ولو لفترة قصيرة جداً.",
  },
  {
    id: 3,
    type: "tf",
    emoji: "🧠",
    text: "يمكن لعامل الجمع استخدام الهاتف أثناء العمل إذا كانت المكالمة إيجابية وسارة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الانفعالات في المكالمات سواء كانت إيجابية أو سلبية ستؤثر عكسياً في القدرة على التركيز، لذلك يجب تجنب استخدام الهاتف أثناء العمل بغض النظر عن طبيعة المكالمة.",
  },
  {
    id: 4,
    type: "single",
    emoji: "🚨",
    text: "ما الإجراء الصحيح إذا اضطر العامل للاتصال في حالة طارئة؟",
    options: [
      "الاتصال أثناء المشي بعيداً عن الشاحنة",
      "الاتصال في فترة استراحة في مكان آمن وألا تتجاوز المكالمة دقيقتين",
      "الاتصال بسرعة وإنهاء المكالمة خلال ثوانٍ",
      "تكليف زميل بالاتصال نيابةً عنه",
    ],
    correct: [1],
    explanation:
      "عند الضرورة، الأسلم أن تتصل وأنت في فترة استراحة في مكان آمن، وأن لا تتجاوز مدة المكالمة دقيقتين.",
  },
  {
    id: 5,
    type: "multi",
    emoji: "🚚",
    text: "ما هي الأخطار الناتجة عن استخدام الهاتف وأجهزة الإلهاء أثناء القيادة؟",
    options: [
      "ضعف تحكم السائق بمقود الشاحنة",
      "تجاوز الإشارة الضوئية الحمراء",
      "زيادة سرعة الاستجابة لمفاجآت الطريق",
      "عدم ترك مسافة الأمان بين العربات",
      "عدم الاستقرار في مسار واحد والدخول إلى المسارات الأخرى دون انتباه",
    ],
    correct: [0, 1, 3, 4],
    explanation:
      "الأخطار الصحيحة هي: ضعف التحكم بالمقود، تجاوز الإشارة الحمراء، عدم ترك مسافة الأمان، وعدم الاستقرار في المسار. أما زيادة سرعة الاستجابة فهي عكس الصحيح، إذ يؤدي الإلهاء إلى بطء الاستجابة.",
  },
  {
    id: 6,
    type: "tf",
    emoji: "🧘",
    text: "إذا شعر العامل بانفعال شديد أثناء مكالمة هاتفية، يجب عليه إنهاء المكالمة فوراً والعودة للعمل بعد استعادة حالته النفسية الطبيعية.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. في حالة الانفعال سواء كان إيجابياً أو سلبياً، يجب إنهاء المكالمة فوراً، والانتظار حتى العودة إلى الحالة النفسية الطبيعية قبل مواصلة العمل.",
  },
  {
    id: 7,
    type: "single",
    emoji: "🚦",
    text: "ما الذي يحدث لانتباه السائق تجاه الإشارات المرورية عند استخدام الهاتف؟",
    options: [
      "يتحسن تركيزه على الإشارات المهمة فقط",
      "ينخفض تركيزه وتتشتت انتباهه لما يدور حوله ومدلولات الإشارات المرورية",
      "لا يتأثر انتباهه بشكل ملحوظ",
      "يصبح أكثر حذراً تلقائياً",
    ],
    correct: [1],
    explanation:
      "يؤدي استخدام الهاتف إلى انخفاض التركيز وتشتت انتباه السائق لما يدور حوله، بما في ذلك مدلولات الإشارات المرورية المانعة والملزمة والتوجيهية.",
  },
  {
    id: 8,
    type: "multi",
    emoji: "👷",
    text: "لمن هو موجَّه هذا الموجز التحسيسي؟",
    options: ["عمال الكنس", "عمال الجمع", "عمال الصيانة", "مسؤولي الموارد البشرية", "السائقين فقط"],
    correct: [0, 1, 2],
    explanation:
      "هذا الموجز موجَّه لعمال الكنس والجمع والصيانة جميعاً، لأن جميعهم يعملون في بيئة الطريق ويتعرضون لمخاطر الإلهاء.",
  },
  {
    id: 9,
    type: "single",
    emoji: "📌",
    text: "ما الموقف الصحيح تجاه الهاتف النقال وفق ما ورد في الدرس؟",
    options: [
      "الهاتف خطر كامل ويجب تجنبه في جميع الأوقات",
      "للهاتف مزايا وإرشادات استخدام آمنة يجب استغلالها دون إلحاق أضرار",
      "الهاتف مفيد فقط في حالات الطوارئ ويجب إيقافه في باقي الأوقات",
      "لا علاقة للهاتف بسلامة العمل",
    ],
    correct: [1],
    explanation:
      "وفق الدرس، للهاتف النقال مزايا وإرشادات استخدام آمنة، ويجب الحرص على استغلالها والاستفادة منها دون إلحاق أضرار بالنفس والآخرين.",
  },
  {
    id: 10,
    type: "tf",
    emoji: "🐢",
    text: "الاستجابة البطيئة لمفاجآت الطريق من بين الأخطار الناتجة عن استخدام الهاتف أثناء العمل.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. يؤدي استخدام الهاتف إلى الاستجابة البطيئة لمفاجآت الطريق، كمنع الشاحنة من الانحراف وتجنب وقوع الحوادث وعدم التوقف الآمن عند التعرض للمواقف الحرجة.",
  },
];

export function getDistractionDevicesQuestionsForClient(): {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
}[] {
  return DISTRACTION_DEVICES_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreDistractionDevicesAnswers(
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
  const total = DISTRACTION_DEVICES_LESSON_QUESTIONS.length;
  let score = 0;
  const details: {
    questionId: number;
    selected: number[];
    correct: number[];
    is_correct: boolean;
  }[] = [];

  for (const q of DISTRACTION_DEVICES_LESSON_QUESTIONS) {
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

