/** Profile page section wrapping the EPI summary card. */
export const EMPLOYEE_EPI_SECTION_ID = "employee-epi-section";

/** Dispatched when the employee is already on /profile — opens the EPI modal. */
export const FOCUS_EPI_EVENT = "employee:focus-epi";

export type FocusEpiLocationState = {
  focusEpi?: boolean;
};

export function isEpiNotification(n: {
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
    blob.includes("epi") ||
    blob.includes("معدات") ||
    blob.includes("équipement") ||
    blob.includes("equipement") ||
    blob.includes("ppe") ||
    blob.includes("protection") ||
    blob.includes("في الطريق") ||
    blob.includes("on the way") ||
    blob.includes("en route") ||
    blob.includes("تأكيد الاستلام") ||
    n.title?.ar?.includes("🦺") === true ||
    n.title?.en?.includes("🦺") === true ||
    n.title?.fr?.includes("🦺") === true
  );
}

export function dispatchFocusEpi(): void {
  window.dispatchEvent(new CustomEvent(FOCUS_EPI_EVENT));
}

/** Scroll the main container to the EPI summary card (optional highlight). */
export function scrollToEpiSection(): boolean {
  const el = document.getElementById(EMPLOYEE_EPI_SECTION_ID);
  if (!el) return false;

  const main = document.querySelector<HTMLElement>("[data-employee-main-scroll]");
  if (main) {
    const mainRect = main.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const offset = elRect.top - mainRect.top + main.scrollTop - 24;
    main.scrollTo({ top: Math.max(0, offset), behavior: "smooth" });
  } else {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  el.classList.add("ring-2", "ring-[#2E6198]", "ring-offset-2");
  window.setTimeout(() => {
    el.classList.remove("ring-2", "ring-[#2E6198]", "ring-offset-2");
  }, 2400);
  return true;
}
