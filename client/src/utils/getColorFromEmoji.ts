/**
 * Suggested cover gradient base color (hex) for course cards from a leading emoji.
 * Stored as hex in DB; employee UI renders a 135° gradient from this color to a darker shade.
 */
export function getColorFromEmoji(emoji: string): string {
  const key = String(emoji || "").trim();
  const map: Record<string, string> = {
    // Transport / route
    "🚗": "#1a1a2e",
    "🚌": "#1a1a2e",
    "🚛": "#2d3561",
    "🚜": "#2d3561",
    "🛻": "#1a1a2e",
    "🚐": "#2d3561",
    "🏎": "#c0392b",
    "🛣️": "#34495e",
    /** Traffic lights — dark background so red/amber/green read clearly */
    "🚦": "#1a1a1a",
    "↩️": "#2c3e50",
    // Safety / chantier
    "🦺": "#e67e22",
    "⚠️": "#f39c12",
    "🚧": "#e67e22",
    "🔴": "#c0392b",
    "🧯": "#c0392b",
    "👷": "#e67e22",
    "🪖": "#d35400",
    "🚨": "#c0392b",
    "🚫": "#7f8c8d",
    // Environment
    "♻️": "#27ae60",
    "🌿": "#2ecc71",
    "🗑️": "#16a085",
    "🌱": "#27ae60",
    "🌴": "#1e8449",
    "🌧️": "#5dade2",
    // Tools
    "🔧": "#7f8c8d",
    "⚙️": "#95a5a6",
    "🏗️": "#e74c3c",
    "🔨": "#7f8c8d",
    "🪛": "#7f8c8d",
    "🔩": "#95a5a6",
    "🧰": "#566573",
    "🪣": "#5499c7",
    // Documents / admin
    "📋": "#2980b9",
    "📊": "#3498db",
    "📝": "#2471a3",
    "📄": "#2980b9",
    "📘": "#1e3a5f",
    "📦": "#8e44ad",
    "💼": "#5d4e75",
    // Health
    "🏥": "#16a085",
    "💊": "#1abc9c",
    "🩺": "#16a085",
    "🚑": "#e74c3c",
    "🚿": "#48c9b0",
    // Cleaning / ops
    "🧹": "#ca6f1e",
    "🪑": "#a0522d",
    "🦶": "#7d6608",
    "🏋️": "#6c3483",
    "💪": "#d35400",
    "🖐️": "#e59866",
    // Distraction / misc
    "📵": "#2c3e50",
    "🎯": "#8e44ad",
  };
  return map[key] || "#2C4A8F";
}
