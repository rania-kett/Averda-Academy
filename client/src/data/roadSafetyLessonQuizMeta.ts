/** Instant feedback (must match server grading). Arabic only. */
export const ROAD_SAFETY_FEEDBACK: { id: number; correct: number; explanation: string }[] = [
  {
    id: 1,
    correct: 1,
    explanation:
      "قوانين السير تهدف إلى: تأمين التنقل الآمن في الأحياء، منع الفوضى، وحماية جميع مستخدمي الطريق.",
  },
  {
    id: 2,
    correct: 2,
    explanation: "المربع = معلومات. المثلث = انتباه لوجود خطر. الدائرة = منع فوري وإلزامي.",
  },
  {
    id: 3,
    correct: 1,
    explanation: "الأصفر = استعد للتوقف. الأحمر = توقف تام. الأخضر = الطريق آمن للعبور.",
  },
  {
    id: 4,
    correct: 1,
    explanation: "المتقطع = مسموح. المتصل = ممنوع. المختلط = مسموح من جهة اليمين فقط.",
  },
  {
    id: 5,
    correct: 2,
    explanation: "20 كلم/ساعة في الأحياء السكنية. 60 كلم/ساعة في الطريق العادي.",
  },
  {
    id: 6,
    correct: 1,
    explanation: "خطأ. احترام ممر الراجلين التزام أخلاقي وقانوني. المشاة لهم أولوية المرور.",
  },
  {
    id: 7,
    correct: 1,
    explanation:
      "الممنوعات الأربعة: تناول الممنوعات، التكلم على الهاتف، القيادة عكس السير، الإضاءة السيئة.",
  },
  {
    id: 8,
    correct: 1,
    explanation: "خطأ تماماً. القيادة عكس السير خطأ قاتل ومباشر في جميع الأحوال بلا أي استثناء.",
  },
  {
    id: 9,
    correct: 1,
    explanation: "الطريق الآمن = معرفة علامات المنع + احترام الخطوط + تجنب المشتتات.",
  },
  {
    id: 10,
    correct: 1,
    explanation:
      "الإضاءة السيئة تعمي السائقين القادمين أو تخفي المخاطر — لذا هي من الممنوعات الأربعة.",
  },
];

export function roadSafetyFeedbackFor(
  id: number | string
): { correct: number; explanation: string } | undefined {
  const n = Number(id);
  if (!Number.isFinite(n)) return undefined;
  const row = ROAD_SAFETY_FEEDBACK.find((x) => x.id === n);
  if (!row) return undefined;
  return { correct: row.correct, explanation: row.explanation };
}
