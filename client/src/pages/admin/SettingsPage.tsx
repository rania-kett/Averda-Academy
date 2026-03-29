import { useTranslation } from "react-i18next";
import { useToast } from "@/context/ToastContext";
import { adminCard, adminMuted, adminStrong } from "@/components/admin/adminClasses";

export function SettingsPage() {
  const { t } = useTranslation();
  const toast = useToast();
  return (
    <div>
      <h1 className={`mb-4 text-2xl font-bold ${adminStrong}`}>{t("admin.settings.title")}</h1>
      <p className={`mb-6 ${adminMuted}`}>{t("admin.settings.body")}</p>
      <button
        type="button"
        onClick={() => toast(t("common.featureComingSoon"), "info")}
        className={`rounded-lg px-4 py-3 text-sm transition hover:bg-slate-50 dark:hover:bg-white/5 ${adminCard} ${adminStrong}`}
      >
        {t("common.save")}
      </button>
    </div>
  );
}
