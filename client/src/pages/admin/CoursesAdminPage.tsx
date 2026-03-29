import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import { adminCardPadded, adminMuted } from "@/components/admin/adminClasses";

const btnSecondary =
  "rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15";

const PRESETS = [
  "from-red-500 to-rose-600",
  "from-indigo-500 to-violet-600",
  "from-emerald-500 to-teal-600",
  "from-orange-500 to-red-600",
  "from-amber-500 to-yellow-600",
  "from-slate-600 to-slate-800",
];

const EMOJIS = ["📘", "🚛", "⛑️", "🔥", "♻️", "🏢", "🚨"];

export function CoursesAdminPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [courses, setCourses] = useState<
    {
      id: string;
      title: unknown;
      pdfPageCount: number;
      quiz: { questionCount: number } | null;
      completionRate: number;
      updatedAt: string;
      isActive: boolean;
    }[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  const [genId, setGenId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const load = async () => {
    const { data } = await adminApi.courses();
    setCourses((data as { courses: typeof courses }).courses);
  };

  useEffect(() => {
    void (async () => {
      try {
        await load();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    if (!file) {
      toast(t("common.error"), "error");
      return;
    }
    fd.append("pdf", file);
    try {
      await adminApi.createCourse(fd);
      toast(t("common.saved"), "success");
      setForm(false);
      setFile(null);
      await load();
    } catch {
      toast(t("common.error"), "error");
    }
  };

  const genQuiz = async (id: string, regenerate: boolean) => {
    setGenId(id);
    try {
      await adminApi.generateQuiz(id, regenerate);
      toast(t("common.quizGenOk"), "success");
      await load();
    } catch (err: unknown) {
      const ax = err as {
        response?: { status?: number; data?: { error?: string } };
      };
      const msg = String(ax.response?.data?.error ?? "");
      const st = ax.response?.status;
      if (
        st === 500 ||
        st === 401 ||
        st === 403 ||
        /anthropic|api\s*key|unauthorized|ANTHROPIC/i.test(msg)
      ) {
        toast(t("common.apiKeyRequired"), "error");
      } else {
        toast(msg || t("admin.courses.genError"), "error");
      }
    } finally {
      setGenId(null);
    }
  };

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-[#161B22]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">{t("admin.courses.title")}</h1>
        <button
          type="button"
          onClick={() => setForm(true)}
          className="rounded-lg bg-accent-indigo px-4 py-3 font-semibold text-white"
        >
          {t("admin.courses.add")}
        </button>
      </div>

      {!courses.length && (
        <div className={`rounded-xl border border-dashed border-[#E2E8F0] p-12 text-center dark:border-[#30363D] ${adminMuted}`}>
          {t("admin.courses.empty")}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {courses.map((c) => (
          <motion.div
            key={c.id}
            layout
            className={`${adminCardPadded} transition hover:-translate-y-0.5 hover:shadow-xl dark:hover:shadow-2xl`}
          >
            <h2 className="text-lg font-semibold line-clamp-2 text-[#0F172A] dark:text-slate-100">
              {(c.title as Record<string, string>)[lang] || (c.title as Record<string, string>).en}
            </h2>
            <p className={`mt-2 text-xs ${adminMuted}`}>
              {t("admin.courses.pdfStatus")}: {c.pdfPageCount}
            </p>
            <p className={`text-sm ${adminMuted}`}>
              {t("admin.courses.quizStatus")}:{" "}
              {c.quiz ? t("common.quizReady") : t("common.noQuiz")}
            </p>
            <p className="text-sm text-[#0F172A] dark:text-slate-100">
              {t("admin.courses.completion")}: {c.completionRate}%
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={genId === c.id}
                onClick={() => void genQuiz(c.id, !!c.quiz)}
                className={btnSecondary}
              >
                {genId === c.id ? t("common.generating") : c.quiz ? t("common.regenerate") : t("admin.courses.genQuiz")}
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {form && (
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onSubmit={(e) => void submit(e)}
          className="fixed inset-8 z-[90] overflow-y-auto rounded-2xl border border-[#E2E8F0] bg-white p-8 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]"
        >
          <h2 className="mb-6 text-xl font-bold">{t("admin.courses.formTitle")}</h2>
          <div className="grid max-w-xl gap-4">
            <input name="titleAr" required placeholder={t("admin.courses.titleAr")} className="rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg" />
            <input name="titleFr" placeholder={t("admin.courses.titleFr")} className="rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg" />
            <input name="titleEn" placeholder={t("admin.courses.titleEn")} className="rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg" />
            <textarea name="descAr" placeholder={t("admin.courses.descAr")} className="rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg" rows={2} />
            <select name="targetGroup" className="rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg">
              <option value="BOTH">{t("admin.courses.targetBoth")}</option>
              <option value="DRIVER">{t("group.DRIVER")}</option>
              <option value="WORKER">{t("group.WORKER")}</option>
            </select>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <label key={e} className="cursor-pointer text-2xl">
                  <input type="radio" name="icon" value={e} defaultChecked={e === "📘"} className="sr-only" />
                  {e}
                </label>
              ))}
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <label key={p} className="cursor-pointer">
                  <input type="radio" name="coverColor" value={p} defaultChecked={p === PRESETS[0]} className="sr-only" />
                  <span className={`block h-10 w-16 rounded bg-gradient-to-br ${p}`} />
                </label>
              ))}
            </div>
            <input
              type="file"
              accept="application/pdf"
              onChange={(ev) => setFile(ev.target.files?.[0] ?? null)}
              required
              className="text-sm"
            />
            <div className="flex gap-3">
              <button type="submit" className="rounded-lg bg-accent-indigo px-6 py-3 font-semibold text-white">
                {t("common.save")}
              </button>
              <button type="button" onClick={() => setForm(false)} className="rounded-lg bg-white/10 px-6 py-3">
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </motion.form>
      )}
    </div>
  );
}
