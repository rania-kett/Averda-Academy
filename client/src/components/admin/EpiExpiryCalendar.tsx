import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import type { DashboardEpiEmployee, DashboardEpiItem } from "@/utils/mapEpiSummaryToDashboard";
import { getExpiryDate } from "@/utils/epiExpiry";
import { CATEGORIES, type CategoryKey } from "@/config/categories";
import { Briefcase } from "lucide-react";
import { useDashboardI18n } from "@/pages/admin/dashboardI18n";
import { resolveCurrentLng } from "@/i18n/persistLanguage";

type Props = {
  epiData: DashboardEpiEmployee[];
  onIssueEpi: (emp: DashboardEpiEmployee, itemCode?: string) => void;
};

type CalendarEvent = {
  key: string;
  dateKey: string;
  date: Date;
  expiryDate: Date;
  daysDiff: number;
  employee: DashboardEpiEmployee;
  item: DashboardEpiItem;
  urgency: "expired" | "within7" | "within30" | "later";
};

type UrgencyFilter = "expired" | "within7" | "within30" | null;
type ViewMode = "calendar" | "list";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function localDateKey(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function resolveExpiryDate(item: DashboardEpiItem): Date | null {
  if (item.nextReplacementAt) {
    const d = new Date(item.nextReplacementAt);
    if (!Number.isNaN(d.getTime())) return startOfDay(d);
  }
  if (item.lastIssued) {
    const fallback = getExpiryDate(item.label, new Date(item.lastIssued));
    if (fallback) return startOfDay(fallback);
  }
  return null;
}

function eventUrgency(daysDiff: number): CalendarEvent["urgency"] {
  if (daysDiff < 0) return "expired";
  if (daysDiff <= 7) return "within7";
  if (daysDiff <= 30) return "within30";
  return "later";
}

function urgencyColor(u: CalendarEvent["urgency"]) {
  if (u === "expired") return "#E53935";
  if (u === "within7") return "#FB8C00";
  if (u === "within30") return "#FBC02D";
  return "#43A047";
}

function urgencySortOrder(u: CalendarEvent["urgency"]) {
  if (u === "expired") return 0;
  if (u === "within7") return 1;
  if (u === "within30") return 2;
  return 3;
}

function roleAvatarFromLabel(roleLabel: string) {
  for (const key of Object.keys(CATEGORIES) as CategoryKey[]) {
    if (CATEGORIES[key].label.ar === roleLabel) {
      const c = CATEGORIES[key];
      return { Icon: c.icon, color: c.color };
    }
  }
  return { Icon: Briefcase, color: "#6B7280" };
}

function urgencyBadge(daysDiff: number, t: TFunction) {
  if (daysDiff < 0) return { text: t("admin.page.epi.expiryCalendar.expiredBadge"), color: "#DC2626" };
  if (daysDiff === 0) return { text: t("admin.page.epi.expiryCalendar.todayBadge"), color: "#EA580C" };
  if (daysDiff <= 7) return { text: t("admin.page.epi.expiryCalendar.withinDaysBadge", { n: daysDiff }), color: "#EA580C" };
  return { text: t("admin.page.epi.expiryCalendar.withinDayBadge", { n: daysDiff }), color: "#16A34A" };
}

function hasAnyIssuedEpi(epiData: DashboardEpiEmployee[]) {
  return epiData.some((emp) => emp.items.some((it) => it.status !== "not_issued"));
}

function EventRow({
  ev,
  onIssueEpi,
  locale,
  nameOf,
  roleOf,
  epiOf,
  t,
}: {
  ev: CalendarEvent;
  onIssueEpi: (emp: DashboardEpiEmployee, itemCode?: string) => void;
  locale: string;
  nameOf: (name: string) => string;
  roleOf: (role: string, categoryKey?: CategoryKey | null) => string;
  epiOf: (code: string, fallback: string) => string;
  t: TFunction;
}) {
  const { Icon, color } = roleAvatarFromLabel(ev.employee.role);
  const badge = urgencyBadge(ev.daysDiff, t);
  const expiryFormatted = ev.expiryDate.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[#EEF0F3] bg-[#F9FAFB] p-3">
      <div className="flex min-w-0 flex-1 items-start gap-2.5">
        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-white" style={{ background: color }}>
          <Icon size={16} color="#fff" strokeWidth={2.75} aria-hidden />
        </div>
        <div className="min-w-0">
          <div className="truncate text-[13px] font-extrabold text-[#111827]">{nameOf(ev.employee.name)}</div>
          <div className="text-[11px] font-semibold text-[#6B7280]">{roleOf(ev.employee.role, ev.employee.categoryKey)}</div>
          <div className="mt-1 text-[12px] font-bold text-[#374151]">
            {ev.item.emoji} {epiOf(ev.item.type, ev.item.label)}
          </div>
          <div className="mt-1 text-[11px] font-semibold text-[#6B7280]">
            {t("admin.page.epi.expiryCalendar.expiresOn")} {expiryFormatted}
          </div>
          <span
            className="mt-1 inline-flex rounded-full px-2 py-0.5 text-[11px] font-extrabold"
            style={{ color: badge.color, background: `${badge.color}14` }}
          >
            {badge.text}
          </span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => onIssueEpi(ev.employee, ev.item.type)}
        className="shrink-0 rounded-lg px-3 py-2 text-[11px] font-extrabold text-white"
        style={{ background: "#1A3C5E" }}
      >
        {t("admin.page.epi.expiryCalendar.issueRenewal")}
      </button>
    </div>
  );
}

export function EpiExpiryCalendar({ epiData, onIssueEpi }: Props) {
  const { t, i18n } = useTranslation();
  const { locale, nameOf, roleOf, epiOf } = useDashboardI18n();
  const isRTL = resolveCurrentLng(i18n.language) === "ar";
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null);
  const [urgencyFilter, setUrgencyFilter] = useState<UrgencyFilter>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [popoverExpanded, setPopoverExpanded] = useState(false);

  const issued = hasAnyIssuedEpi(epiData);

  const { eventsByDay, allEvents, stats } = useMemo(() => {
    const today = startOfDay(new Date()).getTime();
    const byDay = new Map<string, CalendarEvent[]>();
    const all: CalendarEvent[] = [];

    for (const emp of epiData) {
      for (const item of emp.items) {
        if (item.status !== "received" && item.status !== "needs_renewal") continue;

        const expiryDate = resolveExpiryDate(item);
        if (!expiryDate) continue;

        const d = startOfDay(expiryDate);
        if (Number.isNaN(d.getTime())) continue;

        const daysDiff = Math.floor((d.getTime() - today) / (24 * 60 * 60 * 1000));
        const urgency = eventUrgency(daysDiff);
        const dateKey = localDateKey(d);
        const ev: CalendarEvent = {
          key: `${emp.id}:${item.type}:${dateKey}`,
          dateKey,
          date: d,
          expiryDate: d,
          daysDiff,
          employee: emp,
          item,
          urgency,
        };
        all.push(ev);
        byDay.set(dateKey, [...(byDay.get(dateKey) ?? []), ev]);
      }
    }

    for (const [k, list] of byDay.entries()) {
      list.sort((a, b) => {
        const u = urgencySortOrder(a.urgency) - urgencySortOrder(b.urgency);
        if (u !== 0) return u;
        return a.employee.name.localeCompare(b.employee.name, locale);
      });
      byDay.set(k, list);
    }

    all.sort(
      (a, b) => a.date.getTime() - b.date.getTime() || urgencySortOrder(a.urgency) - urgencySortOrder(b.urgency)
    );

    const expired = all.filter((e) => e.daysDiff < 0).length;
    const within7 = all.filter((e) => e.daysDiff >= 0 && e.daysDiff <= 7).length;
    const within30 = all.filter((e) => e.daysDiff > 7 && e.daysDiff <= 30).length;

    return { eventsByDay: byDay, allEvents: all, stats: { expired, within7, within30 } };
  }, [epiData, locale]);

  const filteredEvents = useMemo(() => {
    if (!urgencyFilter) return allEvents;
    if (urgencyFilter === "expired") return allEvents.filter((e) => e.urgency === "expired");
    if (urgencyFilter === "within7") return allEvents.filter((e) => e.urgency === "within7");
    return allEvents.filter((e) => e.urgency === "within30");
  }, [allEvents, urgencyFilter]);

  const filteredByDay = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    for (const ev of filteredEvents) {
      map.set(ev.dateKey, [...(map.get(ev.dateKey) ?? []), ev]);
    }
    return map;
  }, [filteredEvents]);

  const headerLabel = month.toLocaleDateString(locale, { month: "long", year: "numeric" });

  const weekDays = useMemo(() => {
    const base = new Date(2026, 0, 5);
    return Array.from({ length: 7 }, (_, i) =>
      new Date(base.getFullYear(), base.getMonth(), base.getDate() + i).toLocaleDateString(locale, { weekday: "short" })
    );
  }, [locale]);

  const days = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    const jsDay = first.getDay();
    const offset = (jsDay + 6) % 7;
    const totalCells = Math.ceil((offset + last.getDate()) / 7) * 7;

    const cells: { date: Date | null; key: string }[] = [];
    for (let i = 0; i < totalCells; i++) {
      const dayNum = i - offset + 1;
      if (dayNum < 1 || dayNum > last.getDate()) {
        cells.push({ date: null, key: `empty-${i}` });
      } else {
        const d = new Date(month.getFullYear(), month.getMonth(), dayNum);
        cells.push({ date: d, key: localDateKey(d) });
      }
    }
    return cells;
  }, [month]);

  const selectedEvents = selectedDayKey
    ? (filteredByDay.get(selectedDayKey) ?? (urgencyFilter ? [] : eventsByDay.get(selectedDayKey) ?? []))
    : [];
  const visiblePopover = popoverExpanded ? selectedEvents : selectedEvents.slice(0, 3);
  const hiddenPopoverCount = Math.max(0, selectedEvents.length - 3);

  const statCards = [
    { id: "expired" as const, label: t("admin.page.epi.expiryCalendar.statExpired"), count: stats.expired, color: "#DC2626", bg: "#FEF2F2", icon: "⛔" },
    { id: "within7" as const, label: t("admin.page.epi.expiryCalendar.statWithin7"), count: stats.within7, color: "#EA580C", bg: "#FFF7ED", icon: "⚠️" },
    { id: "within30" as const, label: t("admin.page.epi.expiryCalendar.statWithin30"), count: stats.within30, color: "#CA8A04", bg: "#FEFCE8", icon: "📅" },
  ];

  if (!issued) {
    return (
      <div className="overflow-hidden rounded-2xl border border-[#E6E6E6] bg-white shadow-sm">
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
          <div className="text-5xl" aria-hidden>
            📅
          </div>
          <h3 className="mt-4 text-[17px] font-extrabold text-[#1A3C5E]">{t("admin.page.epi.expiryCalendar.emptyTitle")}</h3>
          <p className="mt-2 max-w-md text-[13px] font-semibold leading-relaxed text-[#6B7280]">
            {t("admin.page.epi.expiryCalendar.emptySubtitle")}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#E6E6E6] bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6E6E6] bg-[#F7F8FA] px-4 py-3">
        <div className="inline-flex rounded-xl border border-[#E6E6E6] bg-white p-1">
          <button
            type="button"
            onClick={() => setViewMode("calendar")}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-extrabold transition ${viewMode === "calendar" ? "bg-[#1A3C5E] text-white" : "text-[#1A3C5E]"}`}
          >
            {t("admin.page.epi.expiryCalendar.viewCalendar")}
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`rounded-lg px-3 py-1.5 text-[12px] font-extrabold transition ${viewMode === "list" ? "bg-[#1A3C5E] text-white" : "text-[#1A3C5E]"}`}
          >
            {t("admin.page.epi.expiryCalendar.viewList")}
          </button>
        </div>
        {viewMode === "calendar" ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
              className="rounded-lg border border-[#E6E6E6] bg-white px-2.5 py-1.5 text-[14px] font-extrabold"
            >
              ‹
            </button>
            <div className="text-[14px] font-extrabold text-[#1A3C5E]">{headerLabel}</div>
            <button
              type="button"
              onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
              className="rounded-lg border border-[#E6E6E6] bg-white px-2.5 py-1.5 text-[14px] font-extrabold"
            >
              ›
            </button>
          </div>
        ) : (
          <div className="text-[13px] font-bold text-[#6B7280]">{t("admin.page.epi.expiryCalendar.appointmentCount", { n: filteredEvents.length })}</div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 p-4 md:grid-cols-3">
        {statCards.map((card) => {
          const active = urgencyFilter === card.id;
          return (
            <button
              key={card.id}
              type="button"
              onClick={() => setUrgencyFilter((cur) => (cur === card.id ? null : card.id))}
              className="flex items-center gap-3 rounded-xl border p-3 text-start transition hover:shadow-md"
              style={{
                borderColor: active ? card.color : "#E6E6E6",
                background: active ? card.bg : "#fff",
                boxShadow: active ? `0 0 0 2px ${card.color}33` : undefined,
              }}
            >
              <span className="text-2xl" aria-hidden>
                {card.icon}
              </span>
              <div>
                <div className="text-[24px] font-extrabold leading-none" style={{ color: card.color }}>
                  {card.count}
                </div>
                <div className="mt-1 text-[12px] font-bold text-[#374151]">{card.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {viewMode === "list" ? (
        <div className="overflow-x-auto px-4 pb-4" dir={isRTL ? "rtl" : "ltr"}>
          <table className="w-full min-w-[640px] border-collapse text-[13px]">
            <thead>
              <tr className="border-b border-[#E6E6E6] text-[12px] font-extrabold text-[#6B7280]">
                <th className="px-3 py-2 text-start">{t("admin.page.epi.expiryCalendar.tableEmployee")}</th>
                <th className="px-3 py-2 text-start">{t("admin.page.epi.expiryCalendar.tableEquipment")}</th>
                <th className="px-3 py-2 text-start">{t("admin.page.epi.expiryCalendar.tableExpiryDate")}</th>
                <th className="px-3 py-2 text-start">{t("admin.page.epi.expiryCalendar.tableDaysLeft")}</th>
                <th className="px-3 py-2 text-start">{t("admin.page.epi.expiryCalendar.tableAction")}</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center font-semibold text-[#6B7280]">
                    {t("admin.page.epi.expiryCalendar.noFilterMatch")}
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const badge = urgencyBadge(ev.daysDiff, t);
                  return (
                    <tr key={ev.key} className="border-b border-[#F3F4F6]">
                      <td className="px-3 py-3">
                        <div className="font-extrabold text-[#111827]">{nameOf(ev.employee.name)}</div>
                        <div className="text-[11px] text-[#6B7280]">{roleOf(ev.employee.role, ev.employee.categoryKey)}</div>
                      </td>
                      <td className="px-3 py-3 font-bold">
                        {ev.item.emoji} {epiOf(ev.item.type, ev.item.label)}
                      </td>
                      <td className="px-3 py-3 font-semibold">
                        {ev.expiryDate.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                      </td>
                      <td className="px-3 py-3 font-extrabold" style={{ color: badge.color }}>
                        {ev.daysDiff < 0
                          ? t("admin.page.epi.expiryCalendar.daysLeftExpired", { n: Math.abs(ev.daysDiff) })
                          : t("admin.page.epi.expiryCalendar.daysLeft", { n: ev.daysDiff })}
                      </td>
                      <td className="px-3 py-3">
                        <button
                          type="button"
                          onClick={() => onIssueEpi(ev.employee, ev.item.type)}
                          className="rounded-lg px-3 py-1.5 text-[11px] font-extrabold text-white"
                          style={{ background: "#1A3C5E" }}
                        >
                          {t("admin.page.epi.expiryCalendar.issueRenewal")}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <div dir={isRTL ? "rtl" : "ltr"} className="px-4 pb-4">
          <div className="mb-2 grid grid-cols-7 gap-2">
            {weekDays.map((d, i) => (
              <div key={i} className="py-1 text-center text-[12px] font-extrabold text-[#5B6673]">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-2">
            {days.map((cell) => {
              const k = cell.date ? localDateKey(cell.date) : cell.key;
              const list = cell.date ? (filteredByDay.get(k) ?? (urgencyFilter ? [] : eventsByDay.get(k) ?? [])) : [];
              const uniqUrgencies: CalendarEvent["urgency"][] = [];
              for (const ev of list) {
                if (!uniqUrgencies.includes(ev.urgency)) uniqUrgencies.push(ev.urgency);
              }
              uniqUrgencies.sort((a, b) => urgencySortOrder(a) - urgencySortOrder(b));
              const isSelected = selectedDayKey === k;

              return (
                <button
                  key={k}
                  type="button"
                  disabled={!cell.date}
                  onClick={() => {
                    setSelectedDayKey((cur) => (cur === k ? null : k));
                    setPopoverExpanded(false);
                  }}
                  className="flex h-[78px] flex-col items-start justify-between rounded-xl border p-2.5 transition"
                  style={{
                    borderColor: isSelected ? "#1A3C5E" : "#E6E6E6",
                    background: cell.date ? "#fff" : "#FAFAFA",
                    cursor: cell.date ? "pointer" : "default",
                    boxShadow: isSelected ? "0 4px 14px rgba(26,60,94,0.15)" : undefined,
                  }}
                >
                  <div className="text-[12px] font-extrabold text-[#1F2937]">{cell.date ? cell.date.getDate() : ""}</div>
                  <div className="flex gap-1.5">
                    {uniqUrgencies.slice(0, 4).map((u) => (
                      <span key={u} className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: urgencyColor(u) }} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-3 flex flex-wrap gap-4 text-[12px] font-bold text-[#5B6673]">
            <span>{t("admin.page.epi.expiryCalendar.legendExpired")}</span>
            <span>{t("admin.page.epi.expiryCalendar.legendWithin7")}</span>
            <span>{t("admin.page.epi.expiryCalendar.legendWithin30")}</span>
            <span>{t("admin.page.epi.expiryCalendar.legendLater")}</span>
            {urgencyFilter ? (
              <button type="button" onClick={() => setUrgencyFilter(null)} className="text-[#1A3C5E] underline">
                {t("admin.page.epi.expiryCalendar.clearFilter")}
              </button>
            ) : null}
          </div>

          {selectedDayKey ? (
            <div className="mt-4 rounded-xl border border-[#E6E6E6] bg-white p-3">
              <div className="mb-3 text-[13px] font-extrabold text-[#1A3C5E]">
                {new Date(selectedDayKey).toLocaleDateString(locale, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              {selectedEvents.length === 0 ? (
                <div className="text-[12px] font-bold text-[#6B7280]">{t("admin.page.epi.expiryCalendar.noItemsThisDay")}</div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {visiblePopover.map((ev) => (
                    <EventRow
                      key={ev.key}
                      ev={ev}
                      onIssueEpi={onIssueEpi}
                      locale={locale}
                      nameOf={nameOf}
                      roleOf={roleOf}
                      epiOf={epiOf}
                      t={t}
                    />
                  ))}
                  {!popoverExpanded && hiddenPopoverCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => setPopoverExpanded(true)}
                      className="rounded-lg bg-[#F3F4F6] px-3 py-2 text-[12px] font-extrabold text-[#374151]"
                    >
                      {t("admin.page.epi.expiryCalendar.andMore", { n: hiddenPopoverCount })}
                    </button>
                  ) : null}
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
