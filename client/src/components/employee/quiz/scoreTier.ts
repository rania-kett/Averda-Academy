import type { QuizLang } from "./getResultFeedback";

export type ScoreTier = {
  label: string;
  color: string;
  bg: string;
  extraConfetti: boolean;
};

const labels: Record<QuizLang, string[]> = {
  ar: [
    "مثالي! إنجاز استثنائي! 🎯",
    "ممتازاً! أنت متميز! 🏆",
    "عمل رائع! 🌟",
    "جيد، واصل! 👍",
    "حاول مرة أخرى 💪",
  ],
  fr: [
    "Parfait ! Réussite exceptionnelle ! 🎯",
    "Excellent ! Vous êtes remarquable ! 🏆",
    "Très beau travail ! 🌟",
    "Bien, continuez ! 👍",
    "Réessayez 💪",
  ],
  en: [
    "Perfect! Exceptional work! 🎯",
    "Excellent! Outstanding! 🏆",
    "Great work! 🌟",
    "Good, keep going! 👍",
    "Try again 💪",
  ],
};

export function getScoreTier(percentage: number, lang: QuizLang = "ar"): ScoreTier {
  const pct = Number.isFinite(percentage) ? Math.round(percentage) : 0;
  const l = labels[lang] ?? labels.ar;
  if (pct === 100) return { label: l[0], color: "#f59e0b", bg: "#fef3c7", extraConfetti: true };
  if (pct >= 90) return { label: l[1], color: "#7c3aed", bg: "#ede9fe", extraConfetti: false };
  if (pct >= 80) return { label: l[2], color: "#2563eb", bg: "#dbeafe", extraConfetti: false };
  if (pct >= 70) return { label: l[3], color: "#059669", bg: "#d1fae5", extraConfetti: false };
  return { label: l[4], color: "#dc2626", bg: "#fee2e2", extraConfetti: false };
}
