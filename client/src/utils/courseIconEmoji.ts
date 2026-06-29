export const FALLBACK_COURSE_ICON = "📘";

export const COURSE_EMOJI_FONT_FAMILY =
  '"Segoe UI Emoji", "Segoe UI Symbol", "Apple Color Emoji", "Noto Color Emoji", sans-serif';

/** First grapheme cluster — supports multi-codepoint emoji (flags, skin tones, etc.). */
export function extractCourseIconEmoji(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    const seg = new Intl.Segmenter(undefined, { granularity: "grapheme" });
    const first = [...seg.segment(trimmed)][0]?.segment;
    return first?.trim() ?? "";
  }

  return [...trimmed][0] ?? trimmed;
}
