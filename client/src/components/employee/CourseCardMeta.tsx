import { useTranslation } from "react-i18next";
import { courseCardMetaRowStyle } from "@/components/employee/courseCardLayout";
import { getLastReadRelative, getReadTime } from "@/utils/courseReadTime";

type Props = {
  titleAr: string;
  courseId: string;
  showLastRead: boolean;
};

export function CourseCardMeta({ titleAr, courseId, showLastRead }: Props) {
  const { t } = useTranslation();
  const readMins = getReadTime(titleAr);
  const lastReadRelative = showLastRead ? getLastReadRelative(courseId) : null;

  const readLabel = t("employee.courseMeta.readTime", { n: readMins });

  const lastReadWhen = lastReadRelative
    ? lastReadRelative.type === "today"
      ? t("employee.courseMeta.today")
      : lastReadRelative.type === "yesterday"
        ? t("employee.courseMeta.yesterday")
        : t("employee.courseMeta.daysAgo", { n: lastReadRelative.count })
    : null;

  return (
    <div className="card-meta" style={courseCardMetaRowStyle}>
      <span>⏱ {readLabel}</span>
      {lastReadWhen ? (
        <>
          <span className="opacity-60">•</span>
          <span>📖 {t("employee.courseMeta.lastRead", { when: lastReadWhen })}</span>
        </>
      ) : null}
    </div>
  );
}
