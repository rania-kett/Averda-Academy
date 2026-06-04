export type QuizLang = "ar" | "fr" | "en";

export type ResultFeedbackAction = "continue" | "retry" | "retry_required";
export type ResultFeedbackColor = "bg-green-500" | "bg-orange-500" | "bg-red-500";

export type ResultFeedback = {
  message: Record<QuizLang, string>;
  color: ResultFeedbackColor;
  action: ResultFeedbackAction;
};

export function getResultFeedback(score: number): ResultFeedback {
  const s = Number.isFinite(score) ? score : 0;
  if (s >= 70) {
    return {
      message: {
        ar: "👏 عمل رائع! لقد اجتزت هذا الاختبار بنجاح 👍 استمر في العمل الجيد 🚀",
        fr: "👏 Excellent travail ! Vous avez réussi ce test. Continuez comme ça 🚀",
        en: "👏 Great job! You passed the quiz successfully. Keep it up 🚀",
      },
      color: "bg-green-500",
      action: "continue",
    };
  }

  if (s >= 30) {
    return {
      message: {
        ar: "🙂 نتيجة جيدة، لكن يمكنك التحسن أكثر. حاول مرة أخرى 💪",
        fr: "🙂 Bon résultat, mais vous pouvez faire mieux. Réessayez 💪",
        en: "🙂 Good result, but you can do better. Try again 💪",
      },
      color: "bg-orange-500",
      action: "retry",
    };
  }

  return {
    message: {
      ar: "⚠️ تحتاج إلى إعادة المحاولة. راجع الدرس ثم أعد الاختبار 📘",
      fr: "⚠️ Vous devez réessayer. Revoyez le cours 📘",
      en: "⚠️ You need to retry. Review the lesson 📘",
    },
    color: "bg-red-500",
    action: "retry_required",
  };
}

