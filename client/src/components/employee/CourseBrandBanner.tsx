import AverdaCourseLockup from "@/assets/averda_course_lockup.png";
import type { QuizLang } from "@/components/employee/quiz/getResultFeedback";

const safetyLabel = (lang: QuizLang) =>
  lang === "ar" ? "السلامة أولاً" : lang === "fr" ? "La sécurité d'abord" : "Safety first";

const logoImgClass =
  "h-[clamp(26px,7vw,40px)] w-auto max-w-[min(58%,260px)] shrink-0 object-contain object-left brightness-0 invert contrast-105";

/**
 * Training-deck header: trimmed AVERDA lockup (from the same master as `averda_logo.png`) as white on brand blue.
 * Used on course PDF overlay and course cards so the mark matches everywhere.
 */
export function CourseBrandBanner(props: {
  lang: QuizLang;
  variant: "pdfOverlay" | "courseCard";
  className?: string;
}) {
  const { lang, variant, className = "" } = props;
  const safety = safetyLabel(lang);

  if (variant === "pdfOverlay") {
    return (
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 z-10 flex h-[clamp(56px,12vw,92px)] items-center justify-between gap-2 bg-averda px-3 py-2 shadow-[0_1px_0_rgba(0,0,0,0.08)] max-[768px]:px-2 ${className}`.trim()}
        aria-hidden
      >
        <img src={AverdaCourseLockup} alt="" className={logoImgClass} />
        <span
          className="max-w-[42%] text-end text-[10px] font-extrabold leading-snug text-white sm:text-[11px]"
          dir="rtl"
        >
          {safety}
        </span>
      </div>
    );
  }

  return (
    <div
      className={`relative mb-4 flex h-[88px] items-center justify-between gap-2 rounded-xl bg-averda px-3 py-2 shadow-[0_1px_0_rgba(0,0,0,0.06)] ${className}`.trim()}
    >
      <img src={AverdaCourseLockup} alt="Averda" className={logoImgClass} />
      <span
        className="max-w-[42%] text-end text-[10px] font-extrabold leading-snug text-white sm:text-[11px]"
        dir="rtl"
      >
        {safety}
      </span>
    </div>
  );
}
