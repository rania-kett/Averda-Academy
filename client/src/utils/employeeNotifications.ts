/** Must match server ACTIVITY_NOTIFICATION_MARKER — internal badge streak tracking only. */
const ACTIVITY_NOTIFICATION_MARKER = "__activity__";

export function isActivityNotification(row: {
  title?: Record<string, string> | null;
}): boolean {
  const title = row.title;
  if (!title) return false;
  return (
    title.en === ACTIVITY_NOTIFICATION_MARKER ||
    title.ar === ACTIVITY_NOTIFICATION_MARKER ||
    title.fr === ACTIVITY_NOTIFICATION_MARKER
  );
}

export function filterVisibleEmployeeNotifications<
  T extends { title?: Record<string, string> | null },
>(rows: T[]): T[] {
  return rows.filter((r) => !isActivityNotification(r));
}
