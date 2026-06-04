import { useEffect, useState } from "react";
import { CourseCardMeta } from "@/components/employee/CourseCardMeta";
import { Pill } from "@/components/employee/ui/primitives";
import {
  courseCardContentStyle,
  courseCardHsseqSlotStyle,
  courseCardStatusStyle,
  courseCardThumbnailStyle,
  courseCardTitleStyle,
} from "@/components/employee/courseCardLayout";

type Props = {
  title: string;
  description?: string;
  titleAr: string;
  courseId: string;
  lang: "ar" | "fr" | "en";
  showLastRead: boolean;
  requiredHsseq: boolean;
  hsseqPillLabel: string;
  status: "locked" | "not_started" | "in_progress" | "completed";
  lastPct: number | null;
  retryLabel: string;
  showQuizNotReady: boolean;
  completedLabel: string;
  quizLockedLabel: string;
  notStartedLabel: string;
  lessonQuizLatestLabel: string;
  coverColor: string;
  icon: string;
};

function useMobileCourseCard() {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && window.matchMedia("(max-width: 768px)").matches
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);
  return isMobile;
}

export function EmployeeCourseCardContent({
  title,
  description = "",
  titleAr,
  courseId,
  lang,
  showLastRead,
  requiredHsseq,
  hsseqPillLabel,
  status,
  lastPct,
  retryLabel,
  showQuizNotReady,
  completedLabel,
  quizLockedLabel,
  notStartedLabel,
  lessonQuizLatestLabel,
  coverColor,
  icon,
}: Props) {
  const isMobile = useMobileCourseCard();
  const showSeparateQuizScore = status === "completed" && lastPct != null && !isMobile;

  const mainStatusBadgeText = (() => {
    if (status === "completed") {
      if (isMobile && lastPct != null) {
        const scoreLabel =
          lang === "ar" ? "نتيجة:" : lang === "fr" ? "Résultat :" : "Score:";
        return `✓ ${completedLabel} • ${scoreLabel} ${lastPct}%`;
      }
      return `✓ ${completedLabel}`;
    }
    if (status === "in_progress") return `↺ ${retryLabel}`;
    if (showQuizNotReady || status === "locked") return `🔒 ${quizLockedLabel}`;
    return `◌ ${notStartedLabel}`;
  })();

  const coverStyle =
    typeof coverColor === "string" && /^#?[0-9a-fA-F]{6}$/.test(coverColor.trim())
      ? (() => {
          const raw = coverColor.trim().startsWith("#") ? coverColor.trim() : `#${coverColor.trim()}`;
          const hex = raw.toUpperCase();
          const h = hex.replace("#", "");
          const r = Math.max(0, parseInt(h.slice(0, 2), 16) - 28);
          const g = Math.max(0, parseInt(h.slice(2, 4), 16) - 28);
          const b = Math.max(0, parseInt(h.slice(4, 6), 16) - 28);
          const to = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
          const darker = `#${to(r)}${to(g)}${to(b)}`;
          return { background: `linear-gradient(135deg, ${hex}, ${darker})` };
        })()
      : undefined;

  return (
    <>
      <div
        className={`card-thumbnail group relative text-5xl ${coverStyle ? "" : `bg-gradient-to-br ${coverColor}`}`}
        style={{ ...courseCardThumbnailStyle, ...coverStyle }}
      >
        <div
          className="pointer-events-none absolute inset-0"
          style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.30))" }}
        />
        <span
          className="relative z-[1] transition-transform duration-300 ease-out group-hover:scale-[1.12]"
          style={{ filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.25))" }}
        >
          {icon}
        </span>
      </div>
      <div className="card-content" style={courseCardContentStyle}>
        <div className="min-h-0">
          <h3 className="card-title" style={courseCardTitleStyle}>
            {title}
          </h3>
          {description ? (
            <p
              className="card-description"
              style={{
                fontSize: "11px",
                color: "#9ca3af",
                margin: "2px 0 4px 0",
                lineHeight: "1.4",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textOverflow: "ellipsis",
                textAlign: lang === "ar" ? "right" : "left",
              }}
            >
              {description}
            </p>
          ) : null}
          <CourseCardMeta
            titleAr={titleAr}
            courseId={courseId}
            lang={lang}
            showLastRead={showLastRead}
          />
          {requiredHsseq ? (
            <div style={courseCardHsseqSlotStyle}>
              <Pill tone="warning">{hsseqPillLabel}</Pill>
            </div>
          ) : null}
        </div>
        <div style={courseCardStatusStyle}>
          <div className="flex max-w-full flex-nowrap items-center justify-end gap-2">
            <span
              className={[
                "card-badge inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1 text-[12px] font-bold",
                status === "completed"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : status === "in_progress"
                    ? "border-amber-200 bg-amber-50 text-amber-800"
                    : "border-black/10 bg-black/5 text-[#57534E]",
              ].join(" ")}
            >
              {mainStatusBadgeText}
            </span>
            <span
              className={[
                "quiz-score-badge card-badge inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-bold text-emerald-800",
                showSeparateQuizScore ? "" : "hidden",
              ].join(" ")}
              aria-hidden={!showSeparateQuizScore}
            >
              {lessonQuizLatestLabel}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
