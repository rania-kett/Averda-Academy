import { ACTIVITY_NOTIFICATION_MARKER } from "../services/badgeService.js";

/** Internal login-day rows — kept in DB for badge streaks, hidden from the employee feed. */
export function isActivityNotification(row: { title: unknown }): boolean {
  const title = row.title as Record<string, string> | null | undefined;
  if (!title || typeof title !== "object") return false;
  return (
    title.en === ACTIVITY_NOTIFICATION_MARKER ||
    title.ar === ACTIVITY_NOTIFICATION_MARKER ||
    title.fr === ACTIVITY_NOTIFICATION_MARKER
  );
}

export function filterVisibleEmployeeNotifications<T extends { title: unknown }>(rows: T[]): T[] {
  return rows.filter((r) => !isActivityNotification(r));
}
