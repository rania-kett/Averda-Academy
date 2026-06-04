/** الركوب بأمان خلف آلية الضغط — lesson quiz dataset (server-side). */

export type LessonQuizDef = {
  id: number;
  type: "single" | "multi" | "tf";
  emoji: string;
  text: string;
  options: string[];
  correct: number[];
  explanation: string;
};

export const SAFE_RIDE_BEHIND_COMPACTOR_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "🧗",
    text: "كم عدد نقاط التماس التي يجب الحفاظ عليها مع الشاحنة عند الصعود والنزول من لوح تثبيت الأقدام؟",
    options: ["نقطة واحدة", "نقطتان", "ثلاث نقاط", "أربع نقاط"],
    correct: [2],
    explanation:
      "يجب دائماً الحفاظ على ثلاث نقاط تماس بالشاحنة: إحدى اليدين والقدمين معاً، أو اليدين وقدم ملتصقة بالشاحنة عند الصعود والنزول.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🚫",
    text: "يجوز لعدد من عمال الجمع الوقوف معاً على لوح تثبيت الأقدام في نفس الوقت.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. يُسمح فقط لشخص واحد بالوقوف على لوح تثبيت الأقدام في آنٍ واحد.",
  },
  {
    id: 3,
    type: "multi",
    emoji: "⚠️",
    text: "في أي من الحالات التالية يجب عدم استخدام لوح تثبيت الأقدام؟",
    options: [
      "على الطرق السريعة",
      "عندما تتحرك السيارة بسرعة أكبر من 20 كم/ساعة",
      "عندما تتحرك السيارة على المنحدرات والطرق الزلقة",
      "عندما تتحرك السيارة لأكثر من 0.5 كم",
      "عند السير في الأحياء السكنية بسرعة منخفضة",
    ],
    correct: [0, 1, 2, 3],
    explanation:
      "يجب عدم استخدام لوح تثبيت الأقدام في أربع حالات: على الطرق السريعة، عند السرعة فوق 20 كم/ساعة، عند التحرك لأكثر من 0.5 كم، وعلى المنحدرات والطرق الزلقة.",
  },
  {
    id: 4,
    type: "single",
    emoji: "🪑",
    text: "ماذا يجب على عمال الجمع فعله في الحالات التي يُمنع فيها استخدام لوح تثبيت الأقدام؟",
    options: ["الوقوف خلف الشاحنة", "الجلوس بجانب السائق", "الانتظار حتى تتوقف الشاحنة", "التمسك بالشاحنة من الخارج"],
    correct: [1],
    explanation:
      "في جميع الحالات التي يُمنع فيها استخدام لوح تثبيت الأقدام، يجب أن يجلس الجميع بجانب السائق داخل المركبة.",
  },
  {
    id: 5,
    type: "tf",
    emoji: "⛔",
    text: "يمكن لعمال الجمع ركوب لوح تثبيت القدم أثناء رجوع الشاحنة إلى الخلف.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. لا ينبغي لعمال الجمع ركوب لوح تثبيت القدم في حالة رجوع الشاحنة إلى الخلف، لأن ذلك يشكّل خطراً كبيراً.",
  },
  {
    id: 6,
    type: "single",
    emoji: "🤝",
    text: "لماذا يجب الإمساك بكلتا اليدين أثناء الركوب على لوح تثبيت الأقدام؟",
    options: ["لإعطاء الإشارات للسائق", "لتأمين النفس من السقوط وعدم تشتيت التركيز", "لتوازن الحمولة", "لأن ذلك أمر قانوني فقط"],
    correct: [1],
    explanation:
      "يجب الإمساك بكلتا اليدين لتأمين النفس من السقوط وعدم ترك أي شيء يشتت التركيز، وهو أول قاعدة في قواعد السلامة بالدرس.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "🏗️",
    text: "يجوز لعمال الجمع الوقوف تحت الحمولة أثناء العمل.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation: "خطأ. لا يجوز لعمال الجمع الوقوف تحت الحمولة، لأن ذلك يعرّضهم لخطر سقوطها عليهم.",
  },
  {
    id: 8,
    type: "multi",
    emoji: "🔗",
    text: "ما هي الأوضاع الصحيحة للحفاظ على ثلاث نقاط تماس بالشاحنة؟",
    options: [
      "إحدى اليدين والقدمين معاً ملتصقتان بالشاحنة",
      "اليدان وقدم واحدة ملتصقة بالشاحنة",
      "القدمان فقط على لوح التثبيت",
      "يد واحدة وقدم واحدة",
    ],
    correct: [0, 1],
    explanation:
      "ثلاث نقاط التماس تعني إما: إحدى اليدين والقدمين معاً، أو اليدين وقدم واحدة ملتصقة بالشاحنة عند الصعود والنزول.",
  },
  {
    id: 9,
    type: "single",
    emoji: "🚦",
    text: "ما السرعة القصوى التي يمكن عندها استخدام لوح تثبيت الأقدام؟",
    options: ["10 كم/ساعة", "20 كم/ساعة", "30 كم/ساعة", "50 كم/ساعة"],
    correct: [1],
    explanation:
      "يجب عدم استخدام لوح تثبيت الأقدام عندما تتحرك السيارة بسرعة أكبر من 20 كم/ساعة، أي أن السرعة القصوى المسموح بها هي 20 كم/ساعة.",
  },
  {
    id: 10,
    type: "multi",
    emoji: "✅",
    text: "ما هي قواعد السلامة الصحيحة عند ركوب لوح تثبيت الأقدام؟",
    options: [
      "الإمساك بكلتا اليدين دائماً",
      "عدم الركوب أثناء رجوع الشاحنة للخلف",
      "الوقوف تحت الحمولة لتأمينها",
      "الحفاظ على ثلاث نقاط تماس بالشاحنة",
      "شخص واحد فقط على اللوح في آنٍ واحد",
    ],
    correct: [0, 1, 3, 4],
    explanation:
      "القواعد الصحيحة: الإمساك بكلتا اليدين، عدم الركوب أثناء الرجوع للخلف، الحفاظ على ثلاث نقاط تماس، وشخص واحد فقط على اللوح. الوقوف تحت الحمولة ممنوع.",
  },
];

export function getSafeRideBehindCompactorQuestionsForClient() {
  return SAFE_RIDE_BEHIND_COMPACTOR_QUESTIONS.map(({ id, type, emoji, text, options, correct, explanation }) => ({
    id,
    type,
    emoji,
    text,
    options,
    correct,
    explanation,
  }));
}

export function scoreSafeRideBehindCompactorAnswers(answers: { questionId: number; selectedIndices: number[] }[]) {
  const total = SAFE_RIDE_BEHIND_COMPACTOR_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];
  for (const q of SAFE_RIDE_BEHIND_COMPACTOR_QUESTIONS) {
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

