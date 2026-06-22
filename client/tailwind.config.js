/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["DM Sans", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
        employee: ["Nunito", "IBM Plex Sans Arabic", "system-ui", "sans-serif"],
      },
      colors: {
        admin: {
          sidebar: "#1E293B",
          main: "var(--admin-main-bg)",
          card: "var(--admin-card)",
          border: "var(--admin-border)",
          fg: "var(--admin-fg)",
          muted: "var(--admin-muted)",
          input: "var(--admin-input-bg)",
          modal: "var(--admin-modal-bg)",
          toast: "var(--admin-toast-bg)",
        },
        accent: {
          indigo: "#6366F1",
          emerald: "#10B981",
        },
        averda: {
          DEFAULT: "#1e3a5f",
          dark: "#163056",
          light: "#2d5a9e",
          /** Lighter blue for links on dark backgrounds (e.g. « Voir tout ») */
          soft: "#B8DCFF",
        },
        employee: {
          bg: "var(--employee-bg)",
          card: "var(--employee-card)",
          border: "var(--employee-border)",
          fg: "var(--employee-fg)",
          muted: "var(--employee-muted)",
          header: "var(--employee-header-bg)",
          nav: "var(--employee-nav-bg)",
          hover: "var(--employee-hover)",
          surface: "var(--employee-surface)",
          track: "var(--employee-track)",
          keypad: "var(--employee-keypad)",
          progressWell: "var(--employee-progress-well)",
          continueBg: "var(--employee-continue-bg)",
          amber: "#F59E0B",
          teal: "#14B8A6",
        },
      },
    },
  },
  plugins: [],
};
