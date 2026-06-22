const COURSE_READ_TIMES: Record<string, number> = {
  "احترام قانون السير": 5,
  "القيادة إلى الخلف": 4,
  "بعض الاحتياطات أثناء السياقة": 4,
  "تعليمات للسائق قبل بداية العمل": 6,
  "توصيات للحد من مخاطر الجلوس": 5,
  "عادات القيادة الخطرة": 4,
};

export function getReadTime(title: string): number {
  const t = title.trim();
  if (!t) return 5;
  if (COURSE_READ_TIMES[t] != null) return COURSE_READ_TIMES[t];
  const hit = Object.entries(COURSE_READ_TIMES).find(([key]) => t.includes(key) || key.includes(t));
  return hit ? hit[1] : 5;
}

export type LastReadRelative =
  | { type: "today" }
  | { type: "yesterday" }
  | { type: "days"; count: number };

export function getLastReadRelative(courseId: string): LastReadRelative | null {
  try {
    const stored = localStorage.getItem(`lastRead_${courseId}`);
    if (!stored) return null;
    const date = new Date(stored);
    if (Number.isNaN(date.getTime())) return null;
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return { type: "today" };
    if (diffDays === 1) return { type: "yesterday" };
    return { type: "days", count: diffDays };
  } catch {
    return null;
  }
}
