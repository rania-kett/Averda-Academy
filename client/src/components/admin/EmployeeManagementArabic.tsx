import { useMemo, useState } from "react";
import {
  Bell,
  BookOpen,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Users,
} from "lucide-react";
import AverdaLogo from "@/assets/averda_logo.png";

const FLAGS: Record<"ar" | "fr" | "en", { label: string; src: string }> = {
  ar: {
    label: "AR",
    src: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1f2-1f1e6.svg",
  },
  fr: {
    label: "FR",
    src: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1eb-1f1f7.svg",
  },
  en: {
    label: "EN",
    src: "https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ec-1f1e7.svg",
  },
};

type Row = {
  name: string;
  id: string;
  group: string;
  courses: string;
  avg: string;
  last: string;
  status: string;
};

const ROWS: Row[] = [
  { name: "محمد الشرقاوي", id: "AV000010", group: "محفّل", courses: "0/11", avg: "0%", last: "4/3/2026", status: "لم يبدأ" },
  { name: "رشيد الظاهري", id: "AV000009", group: "كنّاس", courses: "0/14", avg: "0%", last: "4/3/2026", status: "لم يبدأ" },
  { name: "سفيان المختاري", id: "AV000008", group: "الإدارة / مسؤول فريق / مشرف", courses: "0/0", avg: "0%", last: "4/3/2026", status: "لم يبدأ" },
  { name: "زكرياء الوزاني", id: "AV000007", group: "عامل صيانة", courses: "0/0", avg: "0%", last: "4/3/2026", status: "لم يبدأ" },
  { name: "أنس القاسي", id: "AV000006", group: "وكيل الساحة", courses: "0/0", avg: "0%", last: "4/3/2026", status: "لم يبدأ" },
  { name: "مهدي العمراني", id: "AV000005", group: "محفّل", courses: "0/11", avg: "0%", last: "4/3/2026", status: "لم يبدأ" },
];

const NAV = [
  { label: "لوحة التحكم", Icon: LayoutDashboard, active: false },
  { label: "الموظفون", Icon: Users, active: true },
  { label: "الدورات", Icon: BookOpen, active: false },
  { label: "التحليلات", Icon: LayoutDashboard, active: false },
  { label: "الإعدادات", Icon: Settings, active: false },
] as const;

function initialsArabic(name: string): string {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "؟";
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : "";
  return (first + last).trim() || first || "؟";
}

function avatarTone(name: string): string {
  const tones = [
    "bg-blue-600",
    "bg-emerald-600",
    "bg-amber-600",
    "bg-purple-600",
    "bg-rose-600",
    "bg-teal-600",
  ];
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return tones[h % tones.length]!;
}

export function EmployeeManagementArabic() {
  const [lng, setLng] = useState<"ar" | "fr" | "en">("ar");
  const [mobileOpen, setMobileOpen] = useState(false);

  const rows = useMemo(() => ROWS, []);

  return (
    <div dir="rtl" className="min-h-screen bg-[#F3F5F8] text-[#0F172A]">
      {/* Navbar */}
      <header className="sticky top-0 z-40 bg-[#1a2340] text-white shadow-[0_10px_30px_-18px_rgba(0,0,0,0.6)]">
        <div className="mx-auto flex min-h-[64px] max-w-7xl items-center justify-between gap-3 px-3 sm:px-6">
          {/* Left side (in RTL this is visually left): actions */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 transition hover:bg-white/15 active:scale-[0.97] lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="فتح القائمة"
            >
              <Menu className="h-6 w-6" aria-hidden />
            </button>
            <div
              className="inline-flex items-center rounded-full border border-white/20 bg-white/10 p-0.5"
              role="group"
              aria-label="اللغة"
            >
              {(["en", "fr", "ar"] as const).map((code) => {
                const active = lng === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => setLng(code)}
                    className={`inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-[11px] font-extrabold transition sm:px-2.5 ${
                      active ? "bg-white text-[#1a2340]" : "text-white hover:bg-white/15"
                    }`}
                    aria-pressed={active}
                  >
                    <img src={FLAGS[code].src} alt="" className="h-4 w-4" aria-hidden loading="eager" />
                    <span>{FLAGS[code].label}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 transition hover:bg-white/15 active:scale-[0.97]"
              aria-label="الإشعارات"
            >
              <Bell className="h-6 w-6" aria-hidden />
            </button>
            <button
              type="button"
              className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 transition hover:bg-white/15 active:scale-[0.97]"
              aria-label="الإعدادات"
            >
              <Settings className="h-6 w-6" aria-hidden />
            </button>
          </div>

          {/* Right side: logo + name */}
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/95">
              <img src={AverdaLogo} alt="Averda" className="h-7 w-auto" />
            </div>
            <div className="min-w-0">
              <div className="truncate text-[14px] font-extrabold sm:text-[15px]">Averda Academy</div>
              <div className="truncate text-[12px] font-semibold text-white/80">لوحة الإدارة</div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="إغلاق"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar (left, fixed) */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col bg-[#1a2340] text-white shadow-2xl transition-transform duration-200 ease-out lg:translate-x-0 lg:shadow-none ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="التنقل الإداري"
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white/95">
            <img src={AverdaLogo} alt="Averda" className="h-7 w-auto" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-[14px] font-extrabold">Averda Academy</p>
            <p className="truncate text-[12px] font-semibold text-white/80">الإدارة</p>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {NAV.map(({ label, Icon, active }) => (
            <button
              key={label}
              type="button"
              className={`flex w-full items-center gap-3 rounded-[12px] px-4 py-3 text-sm font-extrabold transition ${
                active ? "bg-[#2E6198] text-white" : "text-white/80 hover:bg-white/10 hover:text-white"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" aria-hidden />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-extrabold">
              AA
            </div>
            <p className="min-w-0 flex-1 truncate text-sm font-semibold">Averda Admin</p>
          </div>
          <button
            type="button"
            className="flex w-full items-center justify-between gap-2 rounded-[12px] bg-white/10 px-4 py-3 text-sm font-extrabold text-red-200 transition hover:bg-white/15"
          >
            <span>تسجيل الخروج</span>
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="mx-auto max-w-7xl px-3 py-6 lg:ps-[304px] lg:pe-6">
        {/* Title + CTA */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-[22px] font-extrabold">الموظفون</h1>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-xl bg-[#2E6198] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#25507c] active:scale-[0.98]"
          >
            <span>إضافة موظف</span>
            <span aria-hidden>+</span>
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 grid gap-3 rounded-2xl border border-[#E5E7EB] bg-white p-3 shadow-sm sm:grid-cols-2 lg:grid-cols-4">
          <select className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827]">
            <option>الكل</option>
          </select>
          <select className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827]">
            <option>الكل</option>
          </select>
          <input
            className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF]"
            placeholder="بحث"
          />
          <input
            className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-sm font-semibold text-[#111827] placeholder:text-[#9CA3AF]"
            placeholder="بحث"
          />
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="bg-[#F9FAFB] text-right text-[12px] font-extrabold text-[#6B7280]">
                  <th className="px-4 py-3">الاسم</th>
                  <th className="px-4 py-3">المعرّف</th>
                  <th className="px-4 py-3">المجموعة</th>
                  <th className="px-4 py-3">الدورات</th>
                  <th className="px-4 py-3">متوسط النتيجة</th>
                  <th className="px-4 py-3">آخر نشاط</th>
                  <th className="px-4 py-3">الحالة</th>
                  <th className="px-4 py-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-[#F3F4F6] hover:bg-[#2E6198]/5">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-[12px] font-extrabold text-white ${avatarTone(
                            r.name
                          )}`}
                          aria-hidden
                        >
                          {initialsArabic(r.name)}
                        </div>
                        <span className="font-extrabold text-[#111827]">{r.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-extrabold text-[#111827]" dir="ltr">
                      {r.id}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#111827]">{r.group}</td>
                    <td className="px-4 py-3 font-extrabold tabular-nums text-[#111827]" dir="ltr">
                      {r.courses}
                    </td>
                    <td className="px-4 py-3 font-extrabold tabular-nums text-[#111827]" dir="ltr">
                      {r.avg}
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#6B7280]" dir="ltr">
                      {r.last}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-3 py-1 text-[12px] font-extrabold text-[#6B7280]">
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        className="inline-flex h-9 items-center justify-center rounded-xl border border-[#CBD5E1] bg-white px-3 text-[12px] font-extrabold text-[#1a2340] transition hover:bg-[#F8FAFC] active:scale-[0.98]"
                      >
                        عرض
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

