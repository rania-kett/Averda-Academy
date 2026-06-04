/** تجنب الاصطدام مع حركة المرور أثناء الكنس — lesson quiz (server-side validation). */

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

export const TRAFFIC_COLLISION_WHILE_SWEEPING_LESSON_QUESTIONS: LessonQuizDef[] = [
  {
    id: 1,
    type: "single",
    emoji: "⚠️",
    text: "ما الخطر الرئيسي الذي تحمله عملية الكنس وفقاً للموجز التحسيسي؟",
    options: [
      "التعب الجسدي الناتج عن العمل المتواصل",
      "إمكانية الاصطدام مع حركة المرور أثناء الكنس",
      "الإصابة باليد عند التقاط النفايات",
      "تلف أدوات الكنس",
    ],
    correct: [1],
    explanation:
      "تحمل عملية الكنس مخاطر متنوعة، وبالخص إمكانية الاصطدام مع حركة المرور أثناء الكنس، وهو ما يهدف هذا الموجز إلى الوقاية منه.",
  },
  {
    id: 2,
    type: "tf",
    emoji: "🦺",
    text: "يجب على عامل الكنس ارتداء الزي الموحد اليومي الذي يحتوي على عاكسات لزيادة الرؤية.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. الحرص على الارتداء اليومي للزي الموحد الذي يحتوي على عاكسات ضروري لزيادة رؤية العامل من قِبل السائقين وتفادي الحوادث.",
  },
  {
    id: 3,
    type: "single",
    emoji: "🛒",
    text: "أين يجب وضع العربة أثناء عملية الكنس؟",
    options: [
      "خلف العامل لتسهيل حركته",
      "على الرصيف بعيداً عن الطريق",
      "في مكان ظاهر ومناسب أمام العامل لملاحظة تدفق حركة المرور",
      "في منتصف الطريق لتنبيه السائقين",
    ],
    correct: [2],
    explanation:
      "يجب وضع العربة في مكان ظاهر ومناسب أمام العامل بحيث يمكنه ملاحظة تدفق حركة المرور اتجاهه، مما يمنحه وقتاً كافياً للتفاعل مع أي خطر.",
  },
  {
    id: 4,
    type: "tf",
    emoji: "⛔",
    text: "يمكن لعامل الكنس جمع النفايات من منتصف الطريق إذا كانت حركة المرور خفيفة.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يُمنع منعاً باتاً جمع النفايات من منتصف الطريق في جميع الأحوال، بغض النظر عن كثافة حركة المرور، لأن ذلك يعرّض العامل لخطر الاصطدام.",
  },
  {
    id: 5,
    type: "single",
    emoji: "👀",
    text: "ما الاتجاه الصحيح لعامل الكنس بالنسبة لحركة المرور؟",
    options: [
      "الكنس في نفس اتجاه حركة المرور",
      "مواجهة حركة المرور أثناء الكنس وجمع النفايات",
      "الكنس بشكل عمودي على الطريق",
      "الاتجاه غير مهم طالما العامل على الرصيف",
    ],
    correct: [1],
    explanation:
      "يجب مواجهة حركة المرور أثناء الكنس وجمع النفايات، حتى يتمكن العامل من رؤية السيارات القادمة واتخاذ الإجراء المناسب في الوقت المناسب.",
  },
  {
    id: 6,
    type: "single",
    emoji: "🚶",
    text: "ما الممرات التي يجب على عامل الكنس استخدامها عند عبور الطريق؟",
    options: [
      "أي مكان مناسب في الطريق",
      "المنطقة القريبة من العربة فقط",
      "ممرات المشاة أو معابر المشاة فقط (passage piéton)",
      "المناطق ذات الإضاءة الجيدة",
    ],
    correct: [2],
    explanation:
      "يجب استخدام ممرات المشاة أو معابر المشاة فقط عند عبور الطريق، لأنها المناطق المخصصة والآمنة للعبور والمرئية للسائقين.",
  },
  {
    id: 7,
    type: "tf",
    emoji: "🏃",
    text: "عند عبور الطريق في حالة استعجال، يمكن للعامل الركض لتقليل وقت التعرض للخطر.",
    options: ["صحيح", "خطأ"],
    correct: [1],
    explanation:
      "خطأ. يُمنع الركض عند عبور الطريق في جميع الأحوال. يجب التأكد من أن العبور آمن وعدم المخاطرة أبداً، حتى في حالات الاستعجال.",
  },
  {
    id: 8,
    type: "single",
    emoji: "🚨",
    text: "عند العمل في ممر تحت أرضي، ما الإجراء الواجب اتخاذه عند ملاحظة خطر المرور؟",
    options: [
      "الاستمرار في العمل مع زيادة التركيز",
      "الإشارة للسيارات بالتوقف",
      "القفر للرصيف فوراً",
      "التراجع نحو العربة",
    ],
    correct: [2],
    explanation:
      "عند ملاحظة خطر المرور في الممر تحت الأرضي، يجب القفر للرصيف فوراً دون تردد، وهو الإجراء الأسرع والأكثر أماناً لحماية حياة العامل.",
  },
  {
    id: 9,
    type: "tf",
    emoji: "🚇",
    text: "عند العمل في الممر تحت الأرضي، يجب استعمال عربة بأشرطة عاكسة ووضعها أمام العامل عند الكنس عكس حركة المرور.",
    options: ["صحيح", "خطأ"],
    correct: [0],
    explanation:
      "صحيح. هذه من الإجراءات المحددة للعمل في الممرات تحت الأرضية: استخدام عربة بأشرطة عاكسة ووضعها أمام العامل عند الكنس عكس حركة المرور لضمان أقصى قدر من السلامة.",
  },
  {
    id: 10,
    type: "single",
    emoji: "🚗",
    text: "ما الموقف الصحيح من المركبات المحيطة أثناء التقاط النفايات؟",
    options: [
      "تجاهلها والتركيز على العمل",
      "الانتظار حتى تمر جميع المركبات قبل الالتقاط",
      "الحذر من المركبات من حولك عند التقاط النفايات",
      "طلب من السائقين التوقف",
    ],
    correct: [2],
    explanation:
      "يجب الحذر الدائم من المركبات المحيطة عند التقاط النفايات، إذ يُعدّ هذا من أكثر اللحظات خطورة حيث ينشغل العامل بالالتقاط وقد يغفل عن حركة المرور.",
  },
];

export function getTrafficCollisionWhileSweepingQuestionsForClient() {
  return TRAFFIC_COLLISION_WHILE_SWEEPING_LESSON_QUESTIONS.map(
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

export function scoreTrafficCollisionWhileSweepingAnswers(
  answers: { questionId: number; selectedIndices: number[] }[]
) {
  const total = TRAFFIC_COLLISION_WHILE_SWEEPING_LESSON_QUESTIONS.length;
  let score = 0;
  const details: { questionId: number; selected: number[]; correct: number[]; is_correct: boolean }[] = [];

  for (const q of TRAFFIC_COLLISION_WHILE_SWEEPING_LESSON_QUESTIONS) {
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
