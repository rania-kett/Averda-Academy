/** من أجل البقاء آمنا على الطرق — lesson quiz (server-side validation). */

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

export const STAY_SAFE_ON_ROADS_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🦺",
    text: "ما الغرض الرئيسي من ارتداء الأشرطة العاكسة للضوء؟",
    options: [
      "حماية الجسم من الصدمات",
      "أن يكون العامل مرئياً بوضوح لمستعملي الطريق",
      "الحماية من البرد والمطر",
      "التمييز بين عمال الكنس والمارة",
    ],
    correct: [1],
    explanation:
      "الأشرطة العاكسة ضرورية لجعل العامل مرئياً بوضوح لمستعملي الطريق، خصوصاً عند العمل قبل غروب الشمس بقليل أو بعدها حين تضعف الرؤية.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "✅",
    text: "إذا لم يكن لدى العامل بدلة عاكسة، فإن سترة عاكسة خفيفة تُعدّ خياراً مقبولاً.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. إذا كان العامل لا يملك بدلة عاكسة، فإن سترة عاكسة خفيفة هي خيار جيد لضمان الرؤية الكافية من طرف السائقين.",
  },
  {
    id: 3,
    type: "single",
    emoji: "📏",
    text: "ما المسافة الموصى بها بين العامل والحاوية أثناء الكنس في مواجهة حركة المرور؟",
    options: ["5 خطوات", "10 خطوات", "15 خطوة", "20 خطوة"],
    correct: [1],
    explanation:
      "يجب وضع الحاوية على مسافة 10 خطوات من العامل، بحيث تكون أمامه في مواجهة حركة المرور مما يسهّل رؤية السيارات القادمة والتفاعل معها.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "🛡️",
    text: "وضع الحاوية أمام العامل يوفر له حماية إضافية في حالة وقوع اصطدام.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. بالإضافة إلى تسهيل رؤية السيارات القادمة، فإن الحاوية تحمي العامل بعض الشيء في حالة وقوع اصطدام، مما يجعل موضعها أمامه أكثر أماناً.",
  },
  {
    id: 5,
    type: "single",
    emoji: "👁️",
    text: "ما المبدأ الأساسي الذي يجب أن يتبناه عامل الكنس دائماً بشأن رؤية السائقين له؟",
    options: [
      "افتراض أن السائقين يرونه دائماً لأنه يرتدي ملابس مضيئة",
      "افتراض أنه غير مرئي والتصرف وفقاً لذلك",
      "الاعتماد على التواصل البصري مع السائقين",
      "افتراض أن السائقين سيتجنبونه تلقائياً",
    ],
    correct: [1],
    explanation:
      "يجب على العامل دائماً افتراض أنه غير مرئي، أي تخيّل أن السائق لا يستطيع رؤيته والتصرف وفقاً لذلك، لأن هذا المبدأ يجعله أكثر حذراً وتحسباً للمخاطر.",
  },
  {
    id: 6,
    type: "single",
    emoji: "🚧",
    text: "ماذا يفعل العامل في حالة تعثر حركة المرور أو ضيق الطريق؟",
    options: [
      "يتوقف عن الكنس وينتظر في مكانه",
      "يسرع في إنهاء عمله بالمنطقة",
      "يكون مستعداً للصعود للرصيف أو إلى جانب الطريق",
      "يطلب من السيارات تغيير مسارها",
    ],
    correct: [2],
    explanation:
      "في حالة تعثر حركة المرور أو ضيق الطريق، يجب أن يكون العامل مستعداً للصعود للرصيف أو إلى جانب الطريق فوراً لتجنب أي خطر.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "🎧",
    text: "يمكن لعامل الكنس استخدام سماعة أذن واحدة فقط أثناء العمل للبقاء على تواصل مع المحيط.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يجب فصل السماعة تماماً أثناء العمل، لأن العامل يجب أن يكون قادراً على سماع السيارات المقتربة منه، وأي استخدام للسماعات يقلل من هذه القدرة.",
  },
  {
    id: 8,
    type: "single",
    emoji: "🚗",
    text: "لماذا يُنصح بمواجهة حركة المرور ووضع الحاوية أمامك؟",
    options: [
      "لأن ذلك يجعل الكنس أسرع وأكثر كفاءة",
      "لأنه من الأسهل رؤية السيارات القادمة والتفاعل معها، وكذلك للسيارات رؤيتك",
      "لأن الحاوية تمنع النفايات من الانتشار في الطريق",
      "لأن ذلك يقلل من التعب الجسدي للعامل",
    ],
    correct: [1],
    explanation:
      "مواجهة حركة المرور مع وضع الحاوية أمامك يجعل من الأسهل رؤية السيارات القادمة والتفاعل معها، كما يمكّن السيارات أيضاً من رؤيتك، إضافة إلى أن الحاوية توفر بعض الحماية في حالة الاصطدام.",
  },
  {
    id: 9,
    type: "tf",
    emoji: "🌅",
    text: "الأشرطة العاكسة ضرورية فقط في حالات العمل الليلي وليس عند غروب الشمس.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الأشرطة العاكسة ضرورية خصوصاً عند العمل قبل غروب الشمس بقليل أو بعدها، لأن الرؤية تكون ضعيفة في هذه الأوقات حتى قبل حلول الظلام التام.",
  },
  {
    id: 10,
    type: "single",
    emoji: "📋",
    text: "ما مجموع قواعد السلامة الرئيسية المذكورة في هذا الموجز للبقاء آمناً على الطرق؟",
    options: [
      "أن تكون مرئياً، مواجهة حركة المرور مع الحاوية، افتراض أنك غير مرئي، الاستعداد للصعود للرصيف، وفصل السماعة",
      "ارتداء الخوذة، وضع الحاوية خلفك، تجنب العمل ليلاً",
      "العمل في مجموعات، ارتداء القفازات، استخدام إشارات اليد",
      "تجنب الطرق السريعة، العمل في النهار فقط، ارتداء الزي الموحد",
    ],
    correct: [0],
    explanation:
      "يتضمن الموجز خمس قواعد رئيسية: أن تكون مرئياً بارتداء معدات عاكسة، مواجهة حركة المرور مع وضع الحاوية على مسافة 10 خطوات، دائماً افتراض أنك غير مرئي، الاستعداد للصعود للرصيف عند ضيق الطريق، وفصل السماعة لسماع السيارات المقتربة.",
  },
];

export function getStaySafeOnRoadsQuestionsForClient() {
  return STAY_SAFE_ON_ROADS_LESSON_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreStaySafeOnRoadsAnswers(answers: { questionId: number; selectedIndices: number[] }[]) {
  const total = STAY_SAFE_ON_ROADS_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of STAY_SAFE_ON_ROADS_LESSON_QUESTIONS) {
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
