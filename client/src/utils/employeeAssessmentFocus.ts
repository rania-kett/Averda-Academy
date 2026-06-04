/** DOM id for the baseline assessment card on the employee home page. */
export const EMPLOYEE_ASSESSMENT_QUIZ_ID = "employee-assessment-quiz";

/** Dispatched when the employee is already on /home — avoids route/search churn. */
export const FOCUS_ASSESSMENT_EVENT = "employee:focus-assessment";

export type FocusAssessmentLocationState = {
  focusAssessment?: boolean;
};

export function isAssessmentNotification(n: {
  title: Record<string, string>;
  message: Record<string, string>;
}): boolean {
  const blob = [
    n.title?.ar,
    n.title?.en,
    n.title?.fr,
    n.message?.ar,
    n.message?.en,
    n.message?.fr,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return (
    blob.includes("تقييم") ||
    blob.includes("assessment") ||
    blob.includes("évaluation") ||
    blob.includes("اختبار التقييم")
  );
}

export function dispatchFocusAssessmentQuiz(): void {
  window.dispatchEvent(new CustomEvent(FOCUS_ASSESSMENT_EVENT));
}

/** Scroll the app main container to the assessment card and highlight it briefly. */
export function scrollToAssessmentQuizCard(): boolean {
  const el = document.getElementById(EMPLOYEE_ASSESSMENT_QUIZ_ID);
  if (!el) return false;

  const main = document.querySelector<HTMLElement>("[data-employee-main-scroll]");
  if (main) {
    const mainRect = main.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = elRect.top - mainRect.top + main.scrollTop - 24;
    main.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  el.classList.add("ring-2", "ring-[#2E6198]", "ring-offset-2");
  window.setTimeout(() => {
    el.classList.remove("ring-2", "ring-[#2E6198]", "ring-offset-2");
  }, 2400);
  return true;
}
