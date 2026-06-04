export const NEW_BADGE_KEYS = {
  // Learning
  safety_starter: "safety_starter",
  quiz_master: "quiz_master",
  consistent_learner: "consistent_learner",

  // Safety / EPI
  fully_equipped: "fully_equipped",
  perfect_fit: "perfect_fit",
  safety_compliant: "safety_compliant",
  detail_oriented: "detail_oriented",

  // Engagement
  active_user: "active_user",
  quick_responder: "quick_responder",

  // Advanced
  safety_champion: "safety_champion",
  top_performer: "top_performer",

  // Challenges
  challenge_trifecta: "challenge_trifecta",
} as const;

export type NewBadgeKey = (typeof NEW_BADGE_KEYS)[keyof typeof NEW_BADGE_KEYS];

export const NEW_BADGES: Array<{
  key: NewBadgeKey;
  icon: string;
  title: { ar: string; fr: string; en: string };
  description: { ar: string; fr: string; en: string };
}> = [
  {
    key: NEW_BADGE_KEYS.safety_starter,
    icon: "🎓",
    title: { ar: "Safety Starter", fr: "Safety Starter", en: "Safety Starter" },
    description: { ar: "أكمل أول دورة", fr: "Terminer la première formation", en: "Complete your first course" },
  },
  {
    key: NEW_BADGE_KEYS.quiz_master,
    icon: "🧠",
    title: { ar: "Quiz Master", fr: "Quiz Master", en: "Quiz Master" },
    description: { ar: "احصل على 100% في اختبار", fr: "Obtenir 100% à un quiz", en: "Score 100% in a quiz" },
  },
  {
    key: NEW_BADGE_KEYS.consistent_learner,
    icon: "🔁",
    title: { ar: "Consistent Learner", fr: "Apprenant régulier", en: "Consistent Learner" },
    description: { ar: "أكمل 5 دورات", fr: "Terminer 5 formations", en: "Complete 5 courses" },
  },
  {
    key: NEW_BADGE_KEYS.fully_equipped,
    icon: "🦺",
    title: { ar: "Fully Equipped", fr: "Entièrement équipé", en: "Fully Equipped" },
    description: { ar: "كل معدات الوقاية المطلوبة مستلمة", fr: "Tous les EPI requis sont reçus", en: "All required PPE received" },
  },
  {
    key: NEW_BADGE_KEYS.perfect_fit,
    icon: "✅",
    title: { ar: "Perfect Fit", fr: "Ajustement parfait", en: "Perfect Fit" },
    description: { ar: "كل معدات الوقاية fit مؤكد", fr: "Fit confirmé pour tous les EPI", en: "Fit confirmed for all PPE" },
  },
  {
    key: NEW_BADGE_KEYS.safety_compliant,
    icon: "🛡️",
    title: { ar: "Safety Compliant", fr: "Conforme sécurité", en: "Safety Compliant" },
    description: { ar: "لا يوجد EPI ناقص", fr: "Aucun équipement manquant", en: "No missing equipment" },
  },
  {
    key: NEW_BADGE_KEYS.detail_oriented,
    icon: "🔍",
    title: { ar: "Detail Oriented", fr: "Soucieux du détail", en: "Detail Oriented" },
    description: { ar: "كل المقاسات مُدخلة", fr: "Toutes les tailles sont renseignées", en: "All sizes are filled in" },
  },
  {
    key: NEW_BADGE_KEYS.active_user,
    icon: "🔥",
    title: { ar: "Active User", fr: "Utilisateur actif", en: "Active User" },
    description: { ar: "تسجيل الدخول 5 أيام متتالية", fr: "Connexion 5 jours d’affilée", en: "Login 5 days in a row" },
  },
  {
    key: NEW_BADGE_KEYS.quick_responder,
    icon: "⚡",
    title: { ar: "Quick Responder", fr: "Réponse rapide", en: "Quick Responder" },
    description: { ar: "تأكيد الاستلام خلال 24 ساعة", fr: "Confirmer sous 24h", en: "Confirm reception within 24h" },
  },
  {
    key: NEW_BADGE_KEYS.safety_champion,
    icon: "👑",
    title: { ar: "Safety Champion", fr: "Champion sécurité", en: "Safety Champion" },
    description: { ar: "امتثال 100% + كل الاختبارات ناجحة", fr: "Conformité 100% + tous les quiz réussis", en: "100% compliance + all quizzes passed" },
  },
  {
    key: NEW_BADGE_KEYS.top_performer,
    icon: "💎",
    title: { ar: "Top Performer", fr: "Top Performer", en: "Top Performer" },
    description: { ar: "كل الشارات مفتوحة", fr: "Tous les badges débloqués", en: "All badges unlocked" },
  },
  {
    key: NEW_BADGE_KEYS.challenge_trifecta,
    icon: "🧩",
    title: { ar: "مُنجز التحديات", fr: "Triathlon des défis", en: "Challenge Trifecta" },
    description: {
      ar: "أكمل 3 تحديات",
      fr: "Terminer 3 défis",
      en: "Complete 3 challenges",
    },
  },
];

