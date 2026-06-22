import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft,
  Bot,
  Check,
  Copy,
  Eye,
  EyeOff,
  Info,
  Loader2,
  Mic,
  Settings,
  X,
} from "lucide-react";
import { adminApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import { adminCard, adminMuted, adminStrong } from "@/components/admin/adminClasses";
import { resolveCurrentLng } from "@/i18n/persistLanguage";

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

function StatusBadge({ meta, tested }: { meta: KeyMeta; tested: "idle" | "ok" | "fail" }) {
  const { t } = useTranslation();

  if (tested === "ok") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
        <Check className="h-4 w-4 shrink-0" aria-hidden />
        {t("admin.settings.statusConnected")}
      </span>
    );
  }
  if (tested === "fail") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-red-600 dark:text-red-400">
        <X className="h-4 w-4 shrink-0" aria-hidden />
        {t("admin.settings.statusFailed")}
      </span>
    );
  }
  if (meta.configured) {
    return (
      <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-emerald-600 dark:text-emerald-400">
        <Check className="h-4 w-4 shrink-0" aria-hidden />
        {t("admin.settings.statusConfigured")}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] font-bold text-red-600 dark:text-red-400">
      <X className="h-4 w-4 shrink-0" aria-hidden />
      {t("admin.settings.statusNotConfigured")}
    </span>
  );
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
  const { t } = useTranslation();
  const toast = useToast();
  const [value, setValue] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [tested, setTested] = useState<"idle" | "ok" | "fail">("idle");

  const ui =
    settingKey === "ANTHROPIC_API_KEY"
      ? {
          title: t("admin.settings.anthropicTitle"),
          subtitle: t("admin.settings.anthropicSubtitle"),
          placeholder: "sk-ant-api...",
          hint: undefined as string | undefined,
          Icon: Bot,
        }
      : {
          title: t("admin.settings.elevenlabsTitle"),
          subtitle: t("admin.settings.elevenlabsSubtitle"),
          placeholder: "sk_...",
          hint: t("admin.settings.elevenlabsHint"),
          Icon: Mic,
        };

  const save = async () => {
    const v = value.trim();
    if (v.length < 8) {
      toast(t("admin.settings.keyTooShort"), "error");
      return;
    }
    setSaving(true);
    try {
      await adminApi.saveSetting(settingKey, v);
      setValue("");
      setTested("idle");
      toast(t("admin.settings.keySaved"), "success");
      onSaved();
    } catch {
      toast(t("admin.settings.keySaveFailed"), "error");
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
      toast(
        ok ? t("admin.settings.testOk") : msg || t("admin.settings.testFailed"),
        ok ? "success" : "error"
      );
    } catch {
      setTested("fail");
      toast(t("admin.settings.testFailed"), "error");
    } finally {
      setTesting(false);
    }
  };

  const copyMasked = async () => {
    if (!meta.masked) return;
    try {
      await navigator.clipboard.writeText(meta.masked);
      toast(t("admin.settings.copied"), "success");
    } catch {
      toast(t("admin.settings.copyFailed"), "error");
    }
  };

  return (
    <section className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-[#161B22] ${adminCard}`}>
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-[#1e3a5f] dark:text-white">
        <ui.Icon className="h-5 w-5 shrink-0" aria-hidden />
        {ui.title}
      </h2>
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
        <div className="relative" dir="ltr">
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={ui.placeholder}
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 ps-4 pe-[4.5rem] font-mono text-sm text-slate-900 outline-none transition focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/15 dark:border-slate-600 dark:bg-[#0D1117] dark:text-white"
            dir="ltr"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="absolute end-2 top-1/2 flex -translate-y-1/2 items-center gap-0.5">
            {meta.masked ? (
              <button
                type="button"
                onClick={() => void copyMasked()}
                className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-600 dark:hover:bg-white/10"
                title={t("admin.settings.copyPreview")}
                aria-label={t("admin.settings.copyPreview")}
              >
                <Copy className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-200/80 hover:text-slate-600 dark:hover:bg-white/10"
              title={show ? t("admin.settings.hide") : t("admin.settings.show")}
              aria-label={show ? t("admin.settings.hide") : t("admin.settings.show")}
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
            {saving ? t("admin.settings.saving") : t("admin.settings.save")}
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
                {t("admin.settings.testing")}
              </span>
            ) : (
              t("admin.settings.testConnection")
            )}
          </button>
        </div>
      </div>
    </section>
  );
}

export function SettingsView({
  embedded = false,
  onBack,
}: {
  embedded?: boolean;
  onBack?: () => void;
}) {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SettingsPayload | null>(null);
  const isRTL = resolveCurrentLng(i18n.language) === "ar";
  const locale = isRTL ? "ar-MA" : i18n.language.startsWith("fr") ? "fr-FR" : "en-US";

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
    <div className="space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {embedded && onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-[#1e3a5f] shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-[#161B22] dark:text-white dark:hover:bg-[#1C2128]"
        >
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          {t("admin.settings.backToDashboard")}
        </button>
      ) : null}
      {!embedded && (
        <div>
          <h1 className={`flex items-center gap-2 text-2xl font-bold ${adminStrong}`}>
            <Settings className="h-6 w-6 shrink-0 text-[#1e3a5f] dark:text-white" aria-hidden />
            {t("admin.settings.title")}
          </h1>
          <p className={`mt-2 text-sm ${adminMuted}`}>{t("admin.settings.subtitle")}</p>
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
            <h2 className={`flex items-center gap-2 text-lg font-extrabold text-[#1e3a5f] dark:text-white`}>
              <Info className="h-5 w-5 shrink-0" aria-hidden />
              {t("admin.settings.appInfoTitle")}
            </h2>
            <dl className={`mt-4 grid gap-4 sm:grid-cols-2 ${adminMuted}`}>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">{t("admin.settings.appName")}</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>Averda Academy</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">{t("admin.settings.version")}</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>{data.appInfo.version}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">{t("admin.settings.employeeCount")}</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>{data.appInfo.employeeCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">{t("admin.settings.courseCount")}</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>{data.appInfo.courseCount}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wide">{t("admin.settings.lastSeed")}</dt>
                <dd className={`mt-1 text-base font-semibold ${adminStrong}`}>
                  {data.appInfo.lastSeedDate
                    ? new Date(data.appInfo.lastSeedDate).toLocaleDateString(locale)
                    : "—"}
                </dd>
              </div>
            </dl>
          </section>
        </>
      ) : (
        <p className={adminMuted}>{t("admin.settings.loadError")}</p>
      )}
    </div>
  );
}

/** Standalone page wrapper (dashboard embeds `SettingsView` with `embedded`). */
export function SettingsPage() {
  return <SettingsView />;
}
