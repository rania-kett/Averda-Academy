/** موجز تحسيسي لتجنب الحوادث البليغة في عمليات الكنس — lesson quiz (server-side validation). */

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

export const SERIOUS_SWEEPING_ACCIDENTS_AWARENESS_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🎯",
    text: "ما الهدف من هذا الموجز التحسيسي لتجنب الحوادث المميتة في عمليات الكنس؟",
    options: [
      "تحسين جودة الكنس وإنتاجية العمال",
      "الوقاية من وقوع حوادث مميتة كالحادثة التي توفي فيها زميل في منطقة سيدي البرنوصي",
      "تعليم العمال كيفية استخدام العربة بشكل صحيح",
      "تنظيم مواعيد العمل في المناطق الخطرة",
    ],
    correct: [1],
    explanation:
      "يهدف الموجز إلى تقديم إجراءات السلامة التي تحمي من وقوع حوادث مميتة، مستلهماً من حادثة حقيقية توفي فيها أحد العمال في منطقة سيدي البرنوصي.",
  },
  {
    id: 2,
    type: "single",
    emoji: "🧍",
    text: "ما الموقف الصحيح للعامل عند إفراغ العربة؟",
    options: [
      "الوقوف في منتصف الطريق لرؤية المحيط بشكل أفضل",
      "الصعود فوق الرصيف أو الاحتماء بالحاوية مع مواجهة حركة المرور",
      "الوقوف خلف العربة لحماية نفسه",
      "الابتعاد عن الحاوية لتسهيل حركة المرور",
    ],
    correct: [1],
    explanation:
      "عند إفراغ العربة يجب الصعود فوق الرصيف أو الاحتماء بالحاوية مع مواجهة حركة المرور، وهو الوضع الأكثر أماناً لحماية العامل من أي اصطدام.",
  },
  {
    id: 3,
    type: "tf",
    emoji: "⛔",
    text: "يجوز إفراغ الحاوية في منتصف الطريق إذا كانت حركة المرور خفيفة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يُمنع إفراغ الحاوية وهو غير مقابل لحركة المرور أو بعيد جداً عن الرصيف في وسط الطريق، في جميع الأحوال بغض النظر عن كثافة حركة المرور.",
  },
  {
    id: 4,
    type: "single",
    emoji: "🚧",
    text: "ما الاستخدام الصحيح للمخروط (المخرط) عند إفراغ العربة؟",
    options: [
      "وضعه خلف العامل لمنع السيارات من الاقتراب",
      "وضعه في مكان مرئي لحركة المرور وفي نفس الوقت يحمي العامل من أي اصطدام",
      "وضعه أمام العربة لتوجيه حركة المرور",
      "استخدامه فقط في الطرق السريعة",
    ],
    correct: [1],
    explanation:
      "عند إفراغ العربة وتوفر مخروط، يجب وضعه في مكان يكون مرئياً لحركة المرور وفي نفس الوقت يحمي العامل من أي اصطدام، مما يجمع بين التحذير والحماية.",
  },
  {
    id: 5,
    type: "tf",
    emoji: "⛰️",
    text: "يجب مضاعفة الحذر عند العمل في الطرق المنحدرة وبالقرب من المطبات.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. الطرق المنحدرة والمناطق القريبة من المطبات تشكّل خطراً مضاعفاً على العامل، لأن السيارات قد تفقد السيطرة أو تتصرف بشكل غير متوقع في هذه المناطق.",
  },
  {
    id: 6,
    type: "single",
    emoji: "👀",
    text: "لماذا يجب مراقبة مكان إفراغ العربة بشكل جيد؟",
    options: [
      "للتأكد من نظافة المكان بعد الإفراغ",
      "لتجنب إزعاج السكان المجاورين",
      "للبقاء متيقظاً ضد أي خطر قد يظهر",
      "لضمان سرعة إنجاز العمل",
    ],
    correct: [2],
    explanation:
      "يجب مراقبة مكان إفراغ العربة بشكل جيد للبقاء متيقظاً ضد أي خطر، إذ أن الانشغال بعملية الإفراغ قد يجعل العامل غافلاً عن السيارات المقتربة.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "🛑",
    text: "يمكن لعامل الكنس جمع النفايات من منتصف الطريق إذا كانت العربة قريبة منه.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يُمنع جمع النفايات من منتصف الطريق في جميع الأحوال، بغض النظر عن موقع العربة، لأن وسط الطريق يعرّض العامل لخطر الاصطدام المباشر بالسيارات.",
  },
  {
    id: 8,
    type: "single",
    emoji: "🛒",
    text: "ما وضع العربة الصحيح أثناء عملية الكنس؟",
    options: [
      "خلف العامل لتسهيل حركته للأمام",
      "على الرصيف بعيداً عن الطريق",
      "في مكان ظاهر ومناسب أمام العامل لملاحظة تدفق حركة المرور",
      "في منتصف الطريق كعلامة تحذيرية",
    ],
    correct: [2],
    explanation:
      "يجب وضع العربة في مكان ظاهر ومناسب أمام العامل بحيث يمكنه ملاحظة تدفق حركة المرور اتجاهه، مما يمنحه وقتاً كافياً للتفاعل مع أي خطر قادم.",
  },
  {
    id: 9,
    type: "tf",
    emoji: "🎧",
    text: "تجنب ارتداء السماعات أثناء العمل هو أحد تعليمات السلامة الواردة في هذا الموجز.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. تجنب ارتداء السماعات أثناء العمل من التعليمات الصريحة في الموجز، لأن السماعات تحجب صوت السيارات المقتربة وتقلل من قدرة العامل على الاستجابة للمخاطر.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🚗",
    text: "ما الإجراء الصحيح عند الالتقاط النفايات بالقرب من السيارات؟",
    options: [
      "العمل بسرعة لتقليل وقت التعرض للخطر",
      "الاستعانة بزميل لتنبيهه من السيارات",
      "الحذر من السيارات المحيطة عند الالتقاط مع مواجهة حركة المرور",
      "الانتظار حتى تمر جميع السيارات قبل الالتقاط",
    ],
    correct: [2],
    explanation:
      "يجب الحذر من السيارات من حوله عند التقاط النفايات مع مواجهة حركة المرور دائماً، لأن لحظة الانحناء للالتقاط تجعل العامل أكثر عرضة للخطر وأقل قدرة على الحركة السريعة.",
  },
];

export function getSeriousSweepingAccidentsAwarenessQuestionsForClient() {
  return SERIOUS_SWEEPING_ACCIDENTS_AWARENESS_QUESTIONS.map(
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

export function scoreSeriousSweepingAccidentsAwarenessAnswers(
  answers: { questionId: number; selectedIndices: number[] }[]
) {
  const total = SERIOUS_SWEEPING_ACCIDENTS_AWARENESS_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of SERIOUS_SWEEPING_ACCIDENTS_AWARENESS_QUESTIONS) {
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
