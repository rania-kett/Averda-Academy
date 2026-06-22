/**
 * Admin dashboard design tokens. Theme-sensitive values use CSS variables
 * from index.css (:root / html.dark) — they update when toggling dark mode
 * without a React re-render.
 */
export const COLORS = {
  /* Brand / accent — stay vivid in both themes */
  navy: "#1e3a5f",
  navyDark: "#152d4a",
  navyLight: "#2a4f7e",
  accent: "#e8a020",
  green: "#16a34a",
  red: "#dc2626",
  orange: "#ea580c",
  blue: "#2563eb",
  purple: "#4c1d95",
  gray: "#6b7280",

  /* Surfaces & text — follow active theme */
  cream: "var(--admin-dashboard-bg)",
  white: "var(--admin-card)",
  border: "var(--admin-border)",
  text: "var(--admin-fg)",
  textMuted: "var(--admin-muted)",
  grayLight: "var(--admin-surface-subtle)",
  greenLight: "var(--admin-green-soft)",
  redLight: "var(--admin-red-soft)",
  orangeLight: "var(--admin-orange-soft)",
  blueLight: "var(--admin-blue-soft)",
  purpleLight: "var(--admin-purple-soft)",
  accentLight: "var(--admin-accent-soft)",
  brand: "var(--admin-brand)",
  btnBg: "var(--admin-btn-bg)",
  btnFg: "var(--admin-btn-fg)",
  hover: "var(--admin-hover)",
  shadow: "var(--admin-shadow)",
  shadowLg: "var(--admin-shadow-lg)",
} as const;

/** Sidebar chrome — always navy regardless of theme */
export const SIDEBAR = {
  navy: "#1e3a5f",
  white: "#ffffff",
  red: "#dc2626",
  accent: "#e8a020",
  navyDark: "#152d4a",
} as const;
