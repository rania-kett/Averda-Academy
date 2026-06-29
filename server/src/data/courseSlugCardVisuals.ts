/** Canonical card icon + cover color per course slug (hex). Mirrors client courseSlugCardVisuals. */
export const COURSE_SLUG_CARD_VISUALS: Record<string, { icon: string; coverColor: string }> = {
  "traffic-law-respect": { icon: "🚦", coverColor: "#1A1A1A" },
  "reverse-driving": { icon: "↩️", coverColor: "#2563EB" },
  "driving-precautions": { icon: "⚠️", coverColor: "#F39C12" },
  "driver-prework-instructions": { icon: "🔧", coverColor: "#7F8C8D" },
  "long-sitting-driving": { icon: "🪑", coverColor: "#A0522D" },
  "dangerous-driving-habits": { icon: "🚫", coverColor: "#C0392B" },
  "footrest-fault-report": { icon: "🦶", coverColor: "#7D6608" },
  "safe-ride-behind-compactor": { icon: "🚛", coverColor: "#2D3561" },
  "collection-safety-process": { icon: "♻️", coverColor: "#27AE60" },
  "loading-lifting-safety": { icon: "📦", coverColor: "#8E44AD" },
  "collection-behavior": { icon: "📋", coverColor: "#2980B9" },
  "collection-traffic-accidents-2": { icon: "🚦", coverColor: "#1A1A1A" },
  "footrest-safety-instructions": { icon: "🪜", coverColor: "#2C4A8F" },
  "collection-instructions-2": { icon: "📝", coverColor: "#2471A3" },
  "compaction-containers": { icon: "🗜️", coverColor: "#2C4A8F" },
  "hand-injury-avoidance": { icon: "✋", coverColor: "#2C4A8F" },
  "distraction-devices-risks": { icon: "📵", coverColor: "#2C3E50" },
  "street-sweeping-safety": { icon: "🧹", coverColor: "#CA6F1E" },
  "sweeping-equipment-order": { icon: "🧰", coverColor: "#566573" },
  "body-preservation-plus": { icon: "💪", coverColor: "#D35400" },
  "roundabout-sweeping-safety": { icon: "🔄", coverColor: "#2C4A8F" },
  "sweeping-cones-main-streets": { icon: "🚧", coverColor: "#E67E22" },
  "sweeping-process-plus": { icon: "🧹", coverColor: "#CA6F1E" },
  "empty-cart-procedure": { icon: "🗑️", coverColor: "#16A085" },
  "sweeping-against-traffic": { icon: "↔️", coverColor: "#2C4A8F" },
  "traffic-collision-while-sweeping": { icon: "⚠️", coverColor: "#F39C12" },
  "bad-weather-sweeping-plus": { icon: "🌧️", coverColor: "#5DADE2" },
  "stay-safe-on-roads": { icon: "🛣️", coverColor: "#34495E" },
  "serious-sweeping-accidents-awareness": { icon: "🚨", coverColor: "#C0392B" },
  "general-first-aid": { icon: "🚑", coverColor: "#E74C3C" },
  "general-fire-safety": { icon: "🔥", coverColor: "#2C4A8F" },
  "general-ppe": { icon: "🦺", coverColor: "#E67E22" },
  "general-site-safety": { icon: "🏗️", coverColor: "#E74C3C" },
  "general-emergency": { icon: "🚨", coverColor: "#C0392B" },
  "general-team-safety": { icon: "👷", coverColor: "#E67E22" },
};

export function resolveSeedVisual(slug: string, fallbackIcon: string, fallbackCover: string) {
  const canonical = COURSE_SLUG_CARD_VISUALS[slug];
  if (canonical) return canonical;
  const cover = fallbackCover.startsWith("#") ? fallbackCover : "#2C4A8F";
  return { icon: fallbackIcon, coverColor: cover };
}
