import { useEffect, useState } from "react";
import {
  COURSE_EMOJI_FONT_FAMILY,
  extractCourseIconEmoji,
  FALLBACK_COURSE_ICON,
} from "@/utils/courseIconEmoji";

type CourseCustomEmojiInputProps = {
  value: string;
  onChange: (emoji: string) => void;
  label: string;
  hint?: string;
  placeholder?: string;
  className?: string;
};

export function CourseCustomEmojiInput({
  value,
  onChange,
  label,
  hint,
  placeholder = "🚦",
  className = "",
}: CourseCustomEmojiInputProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const apply = (raw: string) => {
    const emoji = extractCourseIconEmoji(raw);
    const next = emoji || FALLBACK_COURSE_ICON;
    onChange(next);
    setDraft(next);
  };

  return (
    <div className={className}>
      <label className="mb-1 block text-[11px] font-bold text-[#6b7280] dark:text-slate-400">{label}</label>
      <div className="flex items-center gap-3">
        <div
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-[#e5e7eb] bg-white text-3xl leading-none dark:border-white/10 dark:bg-[#0D1117]"
          style={{ fontFamily: COURSE_EMOJI_FONT_FAMILY }}
          aria-hidden
        >
          {value || FALLBACK_COURSE_ICON}
        </div>
        <input
          value={draft}
          onChange={(e) => {
            const next = e.target.value;
            setDraft(next);
            if (next.trim()) apply(next);
          }}
          onPaste={(e) => {
            const pasted = e.clipboardData.getData("text");
            if (!pasted.trim()) return;
            e.preventDefault();
            apply(pasted);
          }}
          onBlur={() => {
            if (draft.trim()) apply(draft);
            else setDraft(value || FALLBACK_COURSE_ICON);
          }}
          placeholder={placeholder}
          inputMode="text"
          autoComplete="off"
          spellCheck={false}
          className="min-w-0 flex-1 rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-2 text-sm text-[#111827] dark:border-admin-border dark:bg-[#0D1117] dark:text-white"
          style={{ fontFamily: COURSE_EMOJI_FONT_FAMILY }}
          aria-label={label}
        />
      </div>
      {hint ? <p className="mt-1.5 text-[10px] font-semibold text-[#9ca3af] dark:text-slate-500">{hint}</p> : null}
    </div>
  );
}
