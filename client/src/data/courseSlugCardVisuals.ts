import { getColorFromEmoji } from "@/utils/getColorFromEmoji";

export type CourseCardVisual = { icon: string; coverColor: string };

function v(icon: string, coverColor?: string): CourseCardVisual {
  return { icon, coverColor: coverColor ?? getColorFromEmoji(icon) };
}

/**
 * Canonical card icon + cover color per course slug (hex).
 * Matches employee تدريبي — overrides DB seed defaults (shared ♻️/🧹/🛡️ + tailwind).
 */
export const COURSE_SLUG_CARD_VISUALS: Record<string, CourseCardVisual> = {
  // Driver (6 modules)
  "traffic-law-respect": { icon: "🚦", coverColor: "#1A1A1A" },
  "reverse-driving": { icon: "↩️", coverColor: "#2563EB" },
  "driving-precautions": { icon: "⚠️", coverColor: "#F39C12" },
  "driver-prework-instructions": { icon: "🔧", coverColor: "#7F8C8D" },
  "long-sitting-driving": { icon: "🪑", coverColor: "#A0522D" },
  "dangerous-driving-habits": { icon: "🚫", coverColor: "#C0392B" },

  // Loader / collecte
  "footrest-fault-report": v("🦶"),
  "safe-ride-behind-compactor": v("🚛"),
  "collection-safety-process": v("♻️"),
  "loading-lifting-safety": v("📦"),
  "collection-behavior": v("📋"),
  "collection-traffic-accidents-2": v("🚦"),
  "footrest-safety-instructions": v("🪜"),
  "collection-instructions-2": v("📝"),
  "compaction-containers": v("🗜️"),

  // Shared loader + sweeper
  "hand-injury-avoidance": v("✋"),
  "distraction-devices-risks": v("📵"),

  // Sweeper / balayage
  "street-sweeping-safety": v("🧹"),
  "sweeping-equipment-order": v("🧰"),
  "body-preservation-plus": v("💪"),
  "roundabout-sweeping-safety": v("🔄"),
  "sweeping-cones-main-streets": v("🚧"),
  "sweeping-process-plus": v("🧹", "#CA6F1E"),
  "empty-cart-procedure": v("🗑️"),
  "sweeping-against-traffic": v("↔️"),
  "traffic-collision-while-sweeping": v("⚠️"),
  "bad-weather-sweeping-plus": v("🌧️"),
  "stay-safe-on-roads": v("🛣️"),
  "serious-sweeping-accidents-awareness": v("🚨"),

  // Park / maintenance — general modules
  "general-first-aid": v("🚑"),
  "general-fire-safety": v("🔥"),
  "general-ppe": v("🦺"),
  "general-site-safety": v("🏗️"),
  "general-emergency": v("🚨"),
  "general-team-safety": v("👷"),
};

/** Driver training modules only (matches employee تدريبي when HSSEQ hidden). */
export const DRIVER_TRAINING_SLUGS = new Set([
  "traffic-law-respect",
  "reverse-driving",
  "driving-precautions",
  "driver-prework-instructions",
  "long-sitting-driving",
  "dangerous-driving-habits",
]);

function isTailwindGradient(value: string) {
  return /^from-[\w-]+(\s+to-[\w-]+)?$/i.test(value.trim());
}

/** Prefer slug canonical visuals; otherwise DB hex; otherwise emoji-derived hex. */
export function resolveCourseCardVisual(
  slug: string | undefined,
  icon: string,
  coverColor: string
): { icon: string; coverColor: string } {
  const key = (slug ?? "").trim().toLowerCase();
  const canonical = key ? COURSE_SLUG_CARD_VISUALS[key] : undefined;
  if (canonical) return { ...canonical };

  const ic = String(icon ?? "📘").trim() || "📘";
  const raw = String(coverColor ?? "").trim();
  if (raw && !isTailwindGradient(raw)) {
    const hex = raw.startsWith("#") ? raw : `#${raw}`;
    return { icon: ic, coverColor: hex.toUpperCase() };
  }
  return { icon: ic, coverColor: getColorFromEmoji(ic) };
}
