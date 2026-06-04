import { courseCardMetaRowStyle } from "@/components/employee/courseCardLayout";
import { getLastRead, getReadTime } from "@/utils/courseReadTime";

type Props = {
  titleAr: string;
  courseId: string;
  lang: "ar" | "fr" | "en";
  showLastRead: boolean;
};

export function CourseCardMeta({ titleAr, courseId, lang, showLastRead }: Props) {
  const readMins = getReadTime(titleAr);
  const lastReadLabel = showLastRead ? getLastRead(courseId) : null;

  const readLabel =
    lang === "ar"
      ? `${readMins} دقائق`
      : lang === "fr"
        ? `${readMins} min`
        : `${readMins} min read`;

  const lastReadText =
    lang === "ar"
      ? `آخر قراءة: ${lastReadLabel}`
      : lang === "fr"
        ? `Dernière lecture : ${lastReadLabel}`
        : `Last read: ${lastReadLabel}`;

  return (
    <div className="card-meta" style={courseCardMetaRowStyle}>
      <span>⏱ {readLabel}</span>
      {lastReadLabel ? (
        <>
          <span style={{ color: "#d1d5db" }}>•</span>
          <span>📖 {lastReadText}</span>
        </>
      ) : null}
    </div>
  );
}
