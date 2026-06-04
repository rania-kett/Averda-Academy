/** الحرص على ترتيب معدات الكنس — lesson quiz (server-side validation). */

export type LessonQuizDef = {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
};

export const SWEEPING_EQUIPMENT_ORDER_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "⚠️",
    text: "ما هو الخطر الرئيسي الناتج عن عدم ترتيب معدات الكنس بشكل صحيح؟",
    options: ["تلف المعدات بسرعة", "التسبب في حوادث عديدة", "إزعاج المارة", "إبطاء سرعة العمل فقط"],
    correct: [1],
    explanation: "عدم ترتيب معدات الكنس بشكل أفقي يتسبب في حوادث عديدة، لذا وجب اتباع تعليمات السلامة.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "✅",
    text: "يجب ترتيب معدات الكنس بشكل أفقي لضمان السلامة.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. عدم الترتيب الأفقي لمعدات الكنس هو السبب في وقوع حوادث عديدة، والترتيب الأفقي هو الطريقة الصحيحة والآمنة.",
  },
  {
    id: 3,
    type: "single",
    emoji: "👥",
    text: "لمن هو موجَّه هذا الدرس التحسيسي؟",
    options: ["السائقين فقط", "عمال الجمع", "عمال الكنس وجميع المصالح", "مصلحة الصيانة فقط"],
    correct: [2],
    explanation:
      "هذا الموجز موجَّه لعمال الكنس وجميع المصالح، إذ يخص كل من يتعامل مع معدات الكنس في الميدان.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "⛔",
    text: "يمكن حمل معدات الكنس بشكل عمودي (رأسياً) أثناء التنقل دون أي خطر.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. الدرس يحذر من عدم الترتيب الأفقي لأنه يتسبب في حوادث. الترتيب الصحيح يجب أن يكون أفقياً.",
  },
  {
    id: 5,
    type: "single",
    emoji: "🖼️",
    text: "ما الذي تُظهره الصورة المعلَّم عليها بعلامة الصح (✓) في الدرس؟",
    options: ["عامل يحمل المعدات بشكل رأسي", "عامل يضع المعدات في العربة بشكل أفقي ومنظم", "عامل يركض في الطريق", "عامل يعبر الطريق السريع"],
    correct: [1],
    explanation:
      "الصورة الصحيحة تُظهر عامل الكنس وهو يرتب معداته بشكل أفقي ومنظم في العربة، وهو السلوك الآمن المطلوب.",
  },
  {
    id: 6,
    type: "multi",
    emoji: "✗",
    text: "ما الذي تُظهره الصور المعلَّم عليها بعلامة الخطأ (✗) في الدرس؟",
    options: [
      "معدات الكنس موضوعة بشكل خاطئ وغير أفقي",
      "عامل يضع المعدات بطريقة تشكّل خطراً على السيارات المجاورة",
      "عامل يرتب معداته بشكل صحيح",
      "معدات تبرز بشكل يعيق حركة المرور أو تشكّل خطراً",
    ],
    correct: [0, 1, 3],
    explanation:
      "صور الخطأ تُظهر معدات موضوعة بشكل غير أفقي، أو تبرز بطريقة تشكّل خطراً على السيارات وحركة المرور.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "📌",
    text: "اتباع تعليمات السلامة في ترتيب معدات الكنس هو أمر اختياري يعود لتقدير العامل.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. اتباع تعليمات السلامة في ترتيب المعدات أمر إلزامي وليس اختيارياً، نظراً لما يتسببه الإهمال من حوادث.",
  },
  {
    id: 8,
    type: "single",
    emoji: "↔️",
    text: "ما هو الوضع الصحيح لترتيب معدات الكنس أثناء التنقل؟",
    options: ["وضع رأسي (عمودي)", "وضع أفقي", "أي وضع يريده العامل", "الحمل باليد مباشرة دون عربة"],
    correct: [1],
    explanation: "الوضع الصحيح هو الأفقي، إذ أن عدم الترتيب الأفقي هو السبب المباشر في وقوع الحوادث.",
  },
  {
    id: 9,
    type: "multi",
    emoji: "🚧",
    text: "ما هي النتائج المحتملة لعدم ترتيب معدات الكنس بشكل صحيح؟",
    options: ["وقوع حوادث عديدة", "تشكيل خطر على السيارات المجاورة", "توفير وقت العمل", "الإخلال بتعليمات السلامة"],
    correct: [0, 1, 3],
    explanation:
      "عدم الترتيب الصحيح يؤدي إلى: وقوع حوادث، تشكيل خطر على السيارات، والإخلال بتعليمات السلامة. توفير الوقت ليس من النتائج المذكورة.",
  },
  {
    id: 10,
    type: "single",
    emoji: "📘",
    text: "ما هو عنوان هذا الموجز التحسيسي؟",
    options: ["أساسيات السلامة في الكنس", "الحرص على ترتيب معدات الكنس", "استخدام معدات الكنس بشكل صحيح", "القيادة الآمنة لعمال الكنس"],
    correct: [1],
    explanation:
      "عنوان الموجز هو 'الحرص على ترتيب معدات الكنس'، ويركز على ضرورة الترتيب الأفقي للمعدات لتفادي الحوادث.",
  },
];

export function getSweepingEquipmentOrderQuestionsForClient() {
  return SWEEPING_EQUIPMENT_ORDER_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreSweepingEquipmentOrderAnswers(answers: { questionId: number; selectedIndices: number[] }[]) {
  const total = SWEEPING_EQUIPMENT_ORDER_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];
  for (const q of SWEEPING_EQUIPMENT_ORDER_QUESTIONS) {
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

