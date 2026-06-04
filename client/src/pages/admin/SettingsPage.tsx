import { useCallback, useEffect, useState } from "react";
import { Copy, Eye, EyeOff, Loader2 } from "lucide-react";
import { adminApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import { adminCard, adminMuted, adminStrong } from "@/components/admin/adminClasses";

type SettingKey = "ANTHROPIC_API_KEY" | "ELEVENLABS_API_KEY";

type KeyMeta = {
  configured: boolean;
  masked: string | null;
  source: "db" | "env" | null;
};

type SettingsPayload = {
  keys: Record<SettingKey, KeyMeta>;
  appInfo: {
    version: string;
    employeeCount: number;
    courseCount: number;
    lastSeedDate: string | null;
  };
};

const KEY_UI: Record<
  SettingKey,
  { title: string; subtitle: string; placeholder: string; hint?: string }
> = {
  ANTHROPIC_API_KEY: {
    title: "مفتاح الذكاء الاصطناعي 🤖",
    subtitle: "لتوليد أسئلة الاختبارات تلقائياً وترجمة المحتوى",
    placeholder: "sk-ant-api...",
  },
  ELEVENLABS_API_KEY: {
    title: "مفتاح الصوت والنطق 🎙️",
    subtitle: "لتحويل نص الدورات والأسئلة إلى صوت مسموع",
    placeholder: "sk_...",
    hint: "المفتاح يبدأ بـ: sk_...",
  },
};

function StatusBadge({ meta, tested }: { meta: KeyMeta; tested: "idle" | "ok" | "fail" }) {
  if (tested === "ok") {
    return <span className="text-[13px] font-bold text-emerald-600">✅ متصل ويعمل</span>;
  }
  if (tested === "fail") {
    return <span className="text-[13px] font-bold text-red-600">❌ فشل الاتصال</span>;
  }
  if (meta.configured) {
    return <span className="text-[13px] font-bold text-emerald-600">✅ مُفعَّل</span>;
  }
  return <span className="text-[13px] font-bold text-red-600">❌ غير مُعيَّن</span>;
}

function KeySection({
  settingKey,
  meta,
  onSaved,
}: {
  settingKey: SettingKey;
  meta: KeyMeta;
  onSaved: () => void;
}) {
  const toast = useToast();
  const ui = KEY_UI[settingKey];
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState<"idle" | "ok" | "fail">("idle");

  const save = async () => {
    const v = value.trim();
    if (v.length < 8) {
      toast("أدخل مفتاحاً صالحاً (8 أحرف على الأقل)", "error");
      return;
    }
    setSaving(true);
    try {
      await adminApi.saveSetting(settingKey, v);
      setValue("");
      setTested("idle");
      toast("تم حفظ المفتاح بنجاح ✅", "success");
      onSaved();
    } catch {
      toast("تعذر حفظ المفتاح", "error");
    } finally {
      setSaving(false);
    }
  };

  const test = async () => {
    setTesting(true);
    setTested("idle");
    try {
      const { data } = await adminApi.testSetting(settingKey);
      const ok = Boolean((data as { success?: boolean }).success);
      setTested(ok ? "ok" : "fail");
      const msg = String((data as { message?: string }).message ?? "");
      toast(ok ? "✅ الاتصال ناجح" : `❌ ${msg || "فشل الاتصال"}`, ok ? "success" : "error");
    } catch {
      setTested("fail");
      toast("❌ فشل اختبار الاتصال", "error");
    } finally {
      setTesting(false);
    }
  };

  const copyMasked = async () => {
    if (!meta.masked) return;
    try {
      await navigator.clipboard.writeText(meta.masked);
      toast("تم النسخ", "success");
    } catch {
      toast("تعذر النسخ", "error");
    }
  };

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#161B22] ${adminCard}`}>
      <h2 className={`text-lg font-extrabold text-[#1e3a5f] dark:text-white`}>{ui.title}</h2>
      <p className={`mt-1 text-sm ${adminMuted}`}>{ui.subtitle}</p>
      {ui.hint ? <p className={`mt-1 text-xs ${adminMuted}`}>{ui.hint}</p> : null}

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusBadge meta={meta} tested={tested} />
        {meta.masked ? (
          <span className={`font-mono text-xs ${adminMuted}`} dir="ltr">
            {meta.masked}
            {meta.source === "env" ? " · .env" : ""}
          </span>
        ) : null}
      </div>

      <div className="mt-4 space-y-3">
        <div className="relative">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={ui.placeholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-4 pr-[4.5rem] font-mono text-sm text-slate-900 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 dark:border-slate-600 dark:bg-[#0D1117] dark:text-white"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            {meta.masked ? (
              <button
                type="button"
                onClick={() => void copyMasked()}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-600 dark:hover:bg-white/10"
                title="نسخ المعاينة"
                aria-label="نسخ المعاينة"
              >
                <Copy className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-600 dark:hover:bg-white/10"
              title={show ? "إخفاء" : "إظهار"}
              aria-label={show ? "إخفاء" : "إظهار"}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving || !value.trim()}
            className="rounded-xl bg-[#1e3a5f] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#163056] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? "جاري الحفظ…" : "حفظ"}
          </button>
          <button
            type="button"
            onClick={() => void test()}
            disabled={testing || !meta.configured}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-[#1e3a5f] transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-white dark:hover:bg-white/5"
          >
            {testing ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                اختبار…
              </span>
            ) : (
              "اختبار الاتصال"
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export function SettingsView({ embedded = false }: { embedded?: boolean }) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SettingsPayload | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: res } = await adminApi.getSettings();
      setData(res as SettingsPayload);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#1e3a5f]" />
      </div>
    );
  }

  return (
    <div className="space-y-6" dir="rtl">
      {!embedded && (
        <div>
          <h1 className={`text-2xl font-bold ${adminStrong}`}>⚙️ الإعدادات</h1>
          <p className={`mt-2 text-sm ${adminMuted}`}>إدارة مفاتيح التكامل دون تعديل الكود</p>
        </div>
      )}

      {data ? (
        <>
          <KeySection
            settingKey="ANTHROPIC_API_KEY"
            meta={data.keys.ANTHROPIC_API_KEY}
            onSaved={() => void load()}
          />
          <KeySection
            settingKey="ELEVENLABS_API_KEY"
            meta={data.keys.ELEVENLABS_API_KEY}
            onSaved={() => void load()}
          />

          <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#161B22] ${adminCard}`}>
            <h2 className={`text-lg font-extrabold text-[#1e3a5f] dark:text-white`}>معلومات التطبيق ℹ️</h2>
            <dl className={`mt-4 grid gap-4 sm:grid-cols-2 ${adminMuted}`}>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">اسم التطبيق</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>Averda Academy</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">الإصدار</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>{data.appInfo.version}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">عدد الموظفين</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>{data.appInfo.employeeCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">عدد الدورات</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>{data.appInfo.courseCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">آخر seed</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>
                  {data.appInfo.lastSeedDate
                    ? new Date(data.appInfo.lastSeedDate).toLocaleDateString("ar-MA")
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>
        </>
      ) : (
        <p className={adminMuted}>تعذر تحميل الإعدادات. تأكد أن الخادم يعمل.</p>
      )}
    </div>
  );
}

/** Standalone page wrapper (dashboard embeds `SettingsView` with `embedded`). */
export function SettingsPage() {
  return <SettingsView />;
}
