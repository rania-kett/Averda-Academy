import { motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import { adminMuted } from "@/components/admin/adminClasses";
import { CATEGORY_ORDER, categoryKeyFromCode, getCategoryDefByCode, type CategoryKey } from "@/config/categories";
import { getColorFromEmoji } from "@/utils/getColorFromEmoji";

type CoverColorMode = "auto" | "custom";
import { PenLine, Trash2, X } from "lucide-react";

const btnSecondary =
  "rounded-lg border border-[#E2E8F0] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] shadow-sm hover:bg-slate-50 disabled:opacity-50 dark:border-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15";

const ICONS = [
  "🚛",
  "🧹",
  "📦",
  "💼",
  "🌴",
  "🔧",
  "🚑",
  "🔥",
  "📋",
  "⚙️",
  "🛡️",
  "🏗️",
  "🚧",
  "📊",
  "🎯",
  "🧰",
  "🪣",
  "🧯",
  "🚿",
  "♻️",
  "⚠️",
  "🚦",
  "↩️",
  "🪑",
  "🚫",
  "💪",
  "🛣️",
  "🖐️",
  "🚗",
  "🌧️",
  "📵",
  "🚨",
  "🏋️",
  "🦶",
  "🗑️",

] as const;

/** SVG flags — emoji flags render as "GB"/"FR"/"MA" letters on Windows. */
const COURSE_FORM_LANG_FLAGS: Record<"ar" | "fr" | "en", { src: string; label: string }> = {
  ar: { src: "/flags/ma.svg", label: "AR" },
  fr: { src: "/flags/fr.svg", label: "FR" },
  en: { src: "/flags/gb.svg", label: "EN" },
};

function isValidHexColor(input: string) {
  return /^#?[0-9a-fA-F]{6}$/.test(input.trim());
}

function normalizeHex(input: string) {
  const x = input.trim();
  return x.startsWith("#") ? x.toUpperCase() : `#${x.toUpperCase()}`;
}

function darkenHex(hex: string, amt = 24) {
  const h = hex.replace("#", "");
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - amt);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - amt);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - amt);
  const to = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return `#${to(r)}${to(g)}${to(b)}`;
}

function gradientStyleFromHex(hex: string) {
  const from = normalizeHex(hex);
  const to = darkenHex(from, 28);
  return { background: `linear-gradient(135deg, ${from}, ${to})` };
}

export function CoursesAdminPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [courses, setCourses] = useState<
    {
      id: string;
      title: unknown;
      description?: unknown;
      icon?: string;
      coverColor?: string;
      pdfPageCount: number;
      quiz: { questionCount: number } | null;
      completionRate: number;
      updatedAt: string;
      isActive: boolean;
      order?: number;
      categories?: { id: string; code: string; name?: { fr?: string; en?: string; ar?: string } }[];
    }[]
  >([]);
  const [categories, setCategories] = useState<{ id: string; code: string; key: CategoryKey | null }[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(false);
  const [genId, setGenId] = useState<string | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<CategoryKey[]>(["driver"]);
  const [filter, setFilter] = useState<"all" | CategoryKey>("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const isAr = lang === "ar";
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [activeLangTab, setActiveLangTab] = useState<"ar" | "fr" | "en">("ar");
  const [titleAr, setTitleAr] = useState("");
  const [titleFr, setTitleFr] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [descAr, setDescAr] = useState("");
  const [descFr, setDescFr] = useState("");
  const [descEn, setDescEn] = useState("");
  const [iconChoice, setIconChoice] = useState<string>("🚛");
  const [coverColor, setCoverColor] = useState<string>(normalizeHex(getColorFromEmoji("🚛")));
  const [coverColorMode, setCoverColorMode] = useState<CoverColorMode>("auto");
  const [analyzing, setAnalyzing] = useState(false);
  const [aiNote, setAiNote] = useState<string | null>(null);

  const load = async () => {
    const [cr, cat] = await Promise.all([adminApi.courses(), adminApi.categories()]);
    setCourses((cr.data as { courses: typeof courses }).courses);
    const rows = (cat.data as { categories: { id: string; code: string }[] }).categories;
    setCategories(rows.map((c) => ({ id: c.id, code: c.code, key: categoryKeyFromCode(c.code) })));
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

  useEffect(() => {
    if (coverColorMode !== "auto") return;
    setCoverColor(normalizeHex(getColorFromEmoji(iconChoice)));
  }, [iconChoice, coverColorMode]);

  const analyzePdf = async (pdf: File) => {
    setAiNote(null);
    setAnalyzing(true);
    try {
      const fd = new FormData();
      fd.append("pdf", pdf);
      const r = await adminApi.aiAnalyzeCourse(fd);
      const data = r.data as {
        name: { ar: string; fr: string; en: string };
        description: { ar: string; fr: string; en: string };
        emoji: string;
        quiz_topics: string[];
      };

      setTitleAr(String(data.name?.ar ?? "").trim());
      setTitleFr(String(data.name?.fr ?? "").trim());
      setTitleEn(String(data.name?.en ?? "").trim());
      setDescAr(String(data.description?.ar ?? "").trim());
      setDescFr(String(data.description?.fr ?? "").trim());
      setDescEn(String(data.description?.en ?? "").trim());

      const suggested = String(data.emoji || "").trim();
      const used = new Set(courses.map((c) => String(c.icon ?? "").trim()).filter(Boolean));
      if (suggested && used.has(suggested)) {
        const replacement = String(ICONS.find((x) => !used.has(String(x))) ?? suggested);
        setIconChoice(replacement);
        const by = courses.find((c) => String(c.icon ?? "").trim() === suggested);
        const byTitle = String((by?.title as any)?.ar ?? (by?.title as any)?.fr ?? (by?.title as any)?.en ?? "").trim();
        setAiNote(`"${suggested}" déjà utilisé${byTitle ? ` par "${byTitle}"` : ""} — on a choisi "${replacement}" à la place`);
      } else if (suggested) {
        setIconChoice(suggested);
      }
    } catch {
      toast(t("admin.courses.aiFillUnavailable"), "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;
    const editing = Boolean(editingId);

    if (!titleAr.trim() || !descAr.trim()) {
      toast(t("common.error"), "error");
      return;
    }
    if (!editing && !file) {
      toast(t("common.error"), "error");
      return;
    }

    const ids = selectedCodes
      .map((code) => categories.find((c) => c.key === code)?.id)
      .filter(Boolean) as string[];
    if (!ids.length) {
      toast(t("common.error"), "error");
      return;
    }

    const raw = new FormData(e.currentTarget);
    const isActiveRaw = raw.get("isActive");
    const isActive = isActiveRaw === null ? true : Boolean(isActiveRaw);

    try {
      setSaving(true);
      if (!editing) {
        const fd = new FormData();
        fd.append("titleAr", titleAr.trim());
        fd.append("titleFr", titleFr.trim());
        fd.append("titleEn", titleEn.trim());
        fd.append("descAr", descAr.trim());
        fd.append("descFr", descFr.trim());
        fd.append("descEn", descEn.trim());
        fd.append("icon", iconChoice);
        fd.append("coverColor", normalizeHex(coverColor));
        fd.append("categoryIds", JSON.stringify(ids));
        fd.append("pdf", file!);
        await adminApi.createCourse(fd);
      } else {
        await adminApi.updateCourse(editingId!, {
          title: { ar: titleAr.trim(), fr: titleFr.trim(), en: titleEn.trim() },
          description: { ar: descAr.trim(), fr: descFr.trim(), en: descEn.trim() },
          icon: iconChoice,
          coverColor: normalizeHex(coverColor),
          categoryIds: ids,
          isActive,
        });
      }
      toast(t("common.saved"), "success");
      setForm(false);
      setEditingId(null);
      setSelectedCodes(["driver"]);
      setTitleAr("");
      setTitleFr("");
      setTitleEn("");
      setDescAr("");
      setDescFr("");
      setDescEn("");
      setIconChoice("🚛");
      setCoverColorMode("auto");
      setCoverColor(normalizeHex(getColorFromEmoji("🚛")));
      setFile(null);
      await load();
    } catch (err: unknown) {
      const ax = err as {
        message?: string;
        response?: { data?: { error?: string; message?: string }; status?: number };
      };
      const serverMsg = String(ax.response?.data?.error ?? ax.response?.data?.message ?? "").trim();
      const fallback = String(ax.message ?? "").trim();
      const status = ax.response?.status;
      const msg =
        serverMsg ||
        (fallback ? `${fallback}${status ? ` (HTTP ${status})` : ""}` : "") ||
        (status ? `HTTP ${status}` : "") ||
        t("common.error");
      toast(msg, "error");
    } finally {
      setSaving(false);
    }
  };

  const genQuiz = async (id: string, regenerate: boolean) => {
    setGenId(id);
    try {
      // New AI quiz generation: 20 questions mixed types stored server-side.
      // (regenerate flag kept for UI compatibility)
      if (regenerate) {
        // If you want strict regenerate semantics later, we can add it to /api/ai/generate-quiz.
      }
      await adminApi.aiGenerateQuiz({ courseId: id });
      toast("✅ 20 questions générées avec succès", "success");
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

  const visibleCourses =
    filter === "all"
      ? courses
      : courses.filter((c) =>
          (c.categories ?? []).some((k) => {
            const key = categoryKeyFromCode(k.code);
            return key === filter;
          })
        );

  const editingCourse = editingId ? visibleCourses.find((c) => c.id === editingId) ?? null : null;
  const allSelected = selectedCodes.length === CATEGORY_ORDER.length;
  const canSubmit =
    Boolean(titleAr.trim()) &&
    Boolean(descAr.trim()) &&
    selectedCodes.length > 0 &&
    Boolean(iconChoice?.trim()) &&
    isValidHexColor(coverColor) &&
    (editingId ? true : Boolean(file));

  const closeForm = useCallback(() => {
    setForm(false);
    setEditingId(null);
  }, []);

  useEffect(() => {
    if (!form) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [form, closeForm]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">{t("admin.courses.title")}</h1>
        <button
          type="button"
          onClick={() => {
            setEditingId(null);
            // Default categories follow current filter (more convenient).
            setSelectedCodes(filter === "all" ? ["driver"] : [filter]);
            setTitleAr("");
            setTitleFr("");
            setTitleEn("");
            setDescAr("");
            setDescFr("");
            setDescEn("");
            setIconChoice("🚛");
            setCoverColorMode("auto");
            setCoverColor(normalizeHex(getColorFromEmoji("🚛")));
            setFile(null);
            setForm(true);
          }}
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

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`rounded-full border px-3 py-2 text-sm font-semibold transition ${
            filter === "all"
              ? "border-accent-indigo bg-accent-indigo text-white"
              : "border-[#E2E8F0] bg-white text-[#0F172A] hover:bg-slate-50 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
          }`}
        >
          الكل
        </button>
        {CATEGORY_ORDER.map((key) => {
          const meta = getCategoryDefByCode(key);
          if (!meta) return null;
          const active = filter === key;
          const Icon = meta.icon;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(key)}
              className="inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm font-extrabold transition"
              style={{
                borderColor: active ? meta.color : "rgba(226,232,240,1)",
                backgroundColor: active ? meta.color : meta.bgColor,
                color: active ? "white" : meta.color,
              }}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {meta.label[lang as "ar" | "fr" | "en"]}
            </button>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {visibleCourses.map((c) => (
          <motion.div
            key={c.id}
            layout
            className={`relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-[12px] border border-[#E2E8F0] bg-white text-[#0F172A] shadow-[0_2px_10px_rgba(0,0,0,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(0,0,0,0.10)] dark:border-[#30363D] dark:bg-[#161B22] dark:text-slate-100 dark:shadow-[0_10px_30px_rgba(0,0,0,0.30)]`}
            style={{
              borderInlineStartWidth: 4,
              borderInlineStartStyle: "solid",
              borderInlineStartColor: (() => {
                const codes = (c.categories ?? []).map((x) => x.code).filter(Boolean);
                if (!codes.length) return "rgba(226,232,240,1)";
                const visibleCategoryCode =
                  filter !== "all" && codes.some((code) => categoryKeyFromCode(code) === filter)
                    ? filter
                    : codes[0];
                const meta = getCategoryDefByCode(visibleCategoryCode);
                return meta?.color ?? "rgba(226,232,240,1)";
              })(),
            }}
          >
            {/* Cover (admin-selected icon + color) */}
            <div
              className={`relative flex h-[96px] items-center justify-center text-[36px] ${
                typeof c.coverColor === "string" && isValidHexColor(c.coverColor)
                  ? ""
                  : `bg-gradient-to-br ${String(c.coverColor || "")}`
              }`}
              style={
                typeof c.coverColor === "string" && isValidHexColor(c.coverColor)
                  ? gradientStyleFromHex(c.coverColor)
                  : undefined
              }
            >
              <span className="drop-shadow-sm">{String(c.icon || "📘")}</span>

              {/* Floating actions over banner */}
              <div className="absolute start-3 top-3 z-10 flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const codes = ((c.categories ?? []).map((x) => x.code).filter(Boolean) as CategoryKey[]).filter(
                      (x) => CATEGORY_ORDER.includes(x)
                    );
                    setSelectedCodes(codes.length ? codes : ["driver"]);
                    setEditingId(c.id);
                    setTitleAr(String((c.title as Record<string, string> | undefined)?.ar ?? ""));
                    setTitleFr(String((c.title as Record<string, string> | undefined)?.fr ?? ""));
                    setTitleEn(String((c.title as Record<string, string> | undefined)?.en ?? ""));
                    setDescAr(String((c.description as Record<string, string> | undefined)?.ar ?? ""));
                    setDescFr(String((c.description as Record<string, string> | undefined)?.fr ?? ""));
                    setDescEn(String((c.description as Record<string, string> | undefined)?.en ?? ""));
                    const ic = String((c.icon as string | undefined) ?? "🚛");
                    setIconChoice(ic);
                    const stored = String(c.coverColor ?? "").trim();
                    if (isValidHexColor(stored)) {
                      const n = normalizeHex(stored);
                      setCoverColor(n);
                      const auto = normalizeHex(getColorFromEmoji(ic));
                      setCoverColorMode(n === auto ? "auto" : "custom");
                    } else {
                      setCoverColorMode("auto");
                      setCoverColor(normalizeHex(getColorFromEmoji(ic)));
                    }
                    setFile(null);
                    setForm(true);
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/40 bg-white/70 text-slate-800 shadow-sm backdrop-blur-md transition hover:bg-white/85 active:scale-[0.97] dark:border-white/15 dark:bg-white/10 dark:text-white dark:hover:bg-white/15"
                  aria-label={t("common.edit")}
                  title={t("common.edit")}
                >
                  <PenLine className="h-4 w-4" aria-hidden />
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const ok = window.confirm(t("admin.courses.confirmDelete") || "Delete this course?");
                    if (!ok) return;
                    try {
                      await adminApi.deleteCourse(c.id);
                      toast(t("common.saved"), "success");
                      await load();
                    } catch {
                      toast(t("common.error"), "error");
                    }
                  }}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/40 bg-white/70 text-red-700 shadow-sm backdrop-blur-md transition hover:bg-white/85 active:scale-[0.97] dark:border-white/15 dark:bg-white/10 dark:text-red-200 dark:hover:bg-white/15"
                  aria-label={t("common.delete")}
                  title={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col p-5 pt-4">
              {/* Title */}
              <h2
                className={`w-full text-start text-[18px] font-extrabold leading-snug ${
                  c.isActive ? "text-[#0F172A] dark:text-slate-100" : "text-slate-400 line-through dark:text-slate-500"
                }`}
              >
                {(c.title as Record<string, string>)[lang] || (c.title as Record<string, string>).en}
              </h2>

              {/* Categories: single-row scroll, compact chips */}
              <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {(c.categories ?? []).map((cat) => {
                  const meta = getCategoryDefByCode(cat.code);
                  if (!meta) return null;
                  return (
                    <span
                      key={cat.id}
                      className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold"
                      style={{ backgroundColor: meta.bgColor, color: meta.color }}
                      title={meta.label[lang as "ar" | "fr" | "en"]}
                    >
                      <meta.icon className="h-3.5 w-3.5" aria-hidden strokeWidth={2.6} />
                      <span className="max-w-[140px] truncate">{meta.label[lang as "ar" | "fr" | "en"]}</span>
                    </span>
                  );
                })}
              </div>

              {/* Metadata row */}
              <div className={`mt-3 text-[12px] font-semibold ${adminMuted}`}>
                <span>
                  PDF: {c.pdfPageCount}
                </span>{" "}
                <span className="mx-2 opacity-60">|</span>
                <span>
                  الاختبار:{" "}
                  <span className={c.quiz ? "text-emerald-600 dark:text-emerald-300" : "text-red-600 dark:text-red-300"}>
                    {c.quiz ? "✅" : "❌"}
                  </span>
                </span>{" "}
                <span className="mx-2 opacity-60">|</span>
                <span>
                  نسبة الإكمال:{" "}
                  <span className="text-[#0F172A] dark:text-slate-100">{c.completionRate}%</span>
                </span>
              </div>

              {/* Bottom-right generate/regenerate */}
              <div className="mt-auto pt-4">
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    disabled={genId === c.id}
                    onClick={() => void genQuiz(c.id, !!c.quiz)}
                    className={btnSecondary}
                  >
                    {genId === c.id ? t("common.generating") : c.quiz ? "إعادة التوليد" : "إنشاء اختبار"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {form && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" dir={isAr ? "rtl" : "ltr"}>
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("common.close")}
            onClick={closeForm}
          />
          <motion.form
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            onSubmit={(e) => void submit(e)}
            className="relative z-[1] flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#E2E8F0] px-6 py-4 dark:border-[#30363D]">
              <h2 className="text-xl font-bold">
                {editingId ? t("admin.courses.editTitle") || t("common.edit") : t("admin.courses.formTitle")}
              </h2>
              <button
                type="button"
                onClick={closeForm}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[#E2E8F0] text-[#374151] transition hover:bg-slate-50 dark:border-[#30363D] dark:text-white dark:hover:bg-white/10"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-6">
          <div className="grid max-w-2xl gap-6">
            {/* معلومات الدورة */}
            <div className="rounded-2xl border border-admin-border bg-admin-input p-4 text-admin-fg">
              <div className="mb-3 text-sm font-extrabold opacity-90">معلومات الدورة</div>
              <div className="grid gap-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex items-center rounded-xl border border-admin-border bg-white p-1 dark:bg-[#0D1117]">
                    {(["ar", "fr", "en"] as const).map((k) => {
                      const active = activeLangTab === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setActiveLangTab(k)}
                          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-extrabold transition ${
                            active ? "bg-[#2563EB] text-white" : "text-[#0F172A] opacity-70 dark:text-white"
                          }`}
                        >
                          <img
                            src={COURSE_FORM_LANG_FLAGS[k].src}
                            width={20}
                            height={14}
                            alt=""
                            aria-hidden
                            className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover"
                          />
                          <span>{COURSE_FORM_LANG_FLAGS[k].label}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="text-xs font-semibold opacity-70">
                    {activeLangTab === "ar" ? "عربي" : activeLangTab === "fr" ? "Français" : "English"}
                  </div>
                </div>

                <div>
                  <div className="mb-1.5 text-xs font-extrabold opacity-80">العنوان</div>
                  <input
                    required={activeLangTab === "ar"}
                    value={activeLangTab === "ar" ? titleAr : activeLangTab === "fr" ? titleFr : titleEn}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (activeLangTab === "ar") setTitleAr(v);
                      else if (activeLangTab === "fr") setTitleFr(v);
                      else setTitleEn(v);
                    }}
                    placeholder={activeLangTab === "ar" ? "اكتب عنوان الدورة..." : activeLangTab === "fr" ? "Titre du cours..." : "Course title..."}
                    className="w-full rounded-xl border border-admin-border bg-white px-3 py-3 text-sm font-semibold text-[#0F172A] dark:bg-[#0D1117] dark:text-white"
                  />
                </div>
                <div>
                  <div className="mb-1.5 text-xs font-extrabold opacity-80">الوصف</div>
                  <textarea
                    required={activeLangTab === "ar"}
                    value={activeLangTab === "ar" ? descAr : activeLangTab === "fr" ? descFr : descEn}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (activeLangTab === "ar") setDescAr(v);
                      else if (activeLangTab === "fr") setDescFr(v);
                      else setDescEn(v);
                    }}
                    placeholder={activeLangTab === "ar" ? "اكتب وصفًا مختصرًا..." : activeLangTab === "fr" ? "Description courte..." : "Short description..."}
                    className="w-full rounded-xl border border-admin-border bg-white px-3 py-3 text-sm font-semibold text-[#0F172A] dark:bg-[#0D1117] dark:text-white"
                    rows={3}
                  />
                </div>
              </div>
            </div>

            {/* الفئات المستهدفة */}
            <div className="rounded-2xl border border-admin-border bg-admin-input p-4 text-admin-fg">
              <div className="mb-3 text-sm font-extrabold opacity-90">الفئات المستهدفة</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCodes(allSelected ? [] : [...CATEGORY_ORDER])}
                  className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-extrabold transition"
                  style={{
                    backgroundColor: allSelected ? "#2563EB" : "#F3F4F6",
                    color: allSelected ? "white" : "#111827",
                    border: "1px solid rgba(226,232,240,1)",
                  }}
                >
                  الكل
                </button>
                {CATEGORY_ORDER.map((key) => {
                  const meta = getCategoryDefByCode(key);
                  if (!meta) return null;
                  const active = selectedCodes.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setSelectedCodes((prev) => {
                          const next = prev.includes(key) ? prev.filter((x) => x !== key) : [...prev, key];
                          return next;
                        })
                      }
                      className="inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-extrabold transition"
                      style={{
                        backgroundColor: active ? meta.color : "#F3F4F6",
                        color: active ? "white" : "#111827",
                        border: "1px solid rgba(226,232,240,1)",
                      }}
                    >
                      <meta.icon className="h-4 w-4" aria-hidden strokeWidth={2.6} />
                      {meta.label.ar}
                    </button>
                  );
                })}
              </div>
              {selectedCodes.length === 0 && (
                <div className="mt-3 text-xs font-semibold text-red-600">يجب اختيار فئة واحدة على الأقل.</div>
              )}
            </div>

            {/* الهوية البصرية */}
            <div className="rounded-2xl border border-admin-border bg-admin-input p-4 text-admin-fg">
              <div className="mb-3 text-sm font-extrabold opacity-90">الهوية البصرية</div>

              {/* Live preview */}
              <div className="mb-4 overflow-hidden rounded-2xl border border-admin-border bg-white shadow-sm dark:bg-[#0D1117]">
                <div
                  className={`flex h-20 items-center justify-center text-4xl ${
                    isValidHexColor(coverColor) ? "" : `bg-gradient-to-br ${coverColor}`
                  }`}
                  style={isValidHexColor(coverColor) ? gradientStyleFromHex(coverColor) : undefined}
                >
                  {iconChoice}
                </div>
                <div className="p-4">
                  <div className="line-clamp-2 text-sm font-extrabold text-[#0F172A] dark:text-white">
                    {titleAr.trim() || "معاينة عنوان الدورة"}
                  </div>
                  <div className="mt-1 line-clamp-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
                    {descAr.trim() || "معاينة وصف الدورة"}
                  </div>
                </div>
              </div>

              <div className="mb-3 flex flex-col gap-2 text-xs font-semibold">
                <div className="font-extrabold opacity-90">لون الغلاف</div>
                <div className="flex flex-wrap gap-4">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="coverColorMode"
                      checked={coverColorMode === "auto"}
                      onChange={() => {
                        setCoverColorMode("auto");
                        setCoverColor(normalizeHex(getColorFromEmoji(iconChoice)));
                      }}
                      className="h-4 w-4"
                    />
                    <span>تلقائي حسب الإيموجي</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="coverColorMode"
                      checked={coverColorMode === "custom"}
                      onChange={() => setCoverColorMode("custom")}
                      className="h-4 w-4"
                    />
                    <span>لون مخصص</span>
                  </label>
                </div>
                {coverColorMode === "custom" ? (
                  <div className="flex flex-wrap items-end gap-3 pt-1">
                    <div>
                      <div className="mb-1 text-[11px] font-extrabold opacity-75">منتقى الألوان</div>
                      <input
                        type="color"
                        value={isValidHexColor(coverColor) ? normalizeHex(coverColor) : "#2C4A8F"}
                        onChange={(e) => setCoverColor(normalizeHex(e.target.value))}
                        className="h-10 w-[72px] cursor-pointer rounded-lg border border-admin-border bg-white p-1 dark:bg-[#0D1117]"
                        aria-label="Color picker"
                      />
                    </div>
                    <div className="min-w-[160px] flex-1">
                      <div className="mb-1 text-[11px] font-extrabold opacity-75">Hex (#RRGGBB)</div>
                      <input
                        value={coverColor}
                        onChange={(e) => setCoverColor(e.target.value.trim())}
                        placeholder="#1A1A1A"
                        className="w-full rounded-lg border border-admin-border bg-white px-3 py-2 font-mono text-sm text-[#0F172A] dark:bg-[#0D1117] dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => setCoverColor(normalizeHex(getColorFromEmoji(iconChoice)))}
                      className="rounded-lg border border-admin-border bg-white px-3 py-2 text-[11px] font-extrabold text-[#0F172A] hover:bg-slate-50 dark:bg-[#0D1117] dark:text-white dark:hover:bg-white/10"
                    >
                      استخدام لون الإيموجي كقيمة
                    </button>
                  </div>
                ) : null}
                {!isValidHexColor(coverColor) && (
                  <p className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                    أدخل لونًا بصيغة #RRGGBB (مثل #1A1A1A).
                  </p>
                )}
              </div>
              {aiNote && <div className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300">{aiNote}</div>}

              {/* Icon picker */}
              <div className="mt-5">
                <div className="mb-2 text-xs font-extrabold opacity-80">اختيار الأيقونة</div>
                <div className="grid grid-cols-8 gap-2 sm:grid-cols-10">
                  {ICONS.map((ic) => {
                    const active = iconChoice === ic;
                    return (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIconChoice(ic)}
                        className={`grid h-10 w-10 place-items-center rounded-xl border bg-white text-xl transition active:scale-[0.97] dark:bg-[#0D1117] ${
                          active ? "border-[#2563EB] ring-2 ring-[#2563EB]/30" : "border-black/10 dark:border-white/10"
                        }`}
                        aria-label={ic}
                        title={ic}
                      >
                        {ic}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-3">
                  <div className="mb-1 text-[11px] font-extrabold opacity-75">إيموجي آخر (لصق حرف واحد)</div>
                  <input
                    value={iconChoice}
                    onChange={(e) => {
                      const v = e.target.value;
                      const g = v.length ? [...v].pop() ?? v : "";
                      setIconChoice(g || "📘");
                      if (coverColorMode === "auto" && g) setCoverColor(normalizeHex(getColorFromEmoji(g)));
                    }}
                    placeholder="🚦"
                    maxLength={8}
                    className="w-full max-w-xs rounded-lg border border-admin-border bg-white px-3 py-2 text-2xl leading-none dark:bg-[#0D1117]"
                  />
                </div>
              </div>
            </div>

            {/* المحتوى */}
            <div className="rounded-2xl border border-admin-border bg-admin-input p-4 text-admin-fg">
              <div className="mb-3 text-sm font-extrabold opacity-90">المحتوى</div>
              <div className="grid gap-3">
                {!editingId && (
                  <>
                    <div className="grid gap-2">
                      <div>
                        <div className="mb-2 text-xs font-extrabold opacity-80">رفع ملف PDF</div>
                        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-admin-border bg-white px-4 py-3 text-sm font-extrabold text-[#0F172A] shadow-sm transition hover:bg-slate-50 dark:bg-[#0D1117] dark:text-white dark:hover:bg-white/5">
                          <span className="truncate">{file?.name ? file.name : "اختر ملفًا"}</span>
                          <span className="shrink-0 rounded-lg bg-[#2563EB] px-3 py-2 text-xs font-extrabold text-white">
                            رفع
                          </span>
                          <input
                            type="file"
                            accept="application/pdf"
                            onChange={(ev) => {
                              const f = ev.target.files?.[0] ?? null;
                              setFile(f);
                              if (f) void analyzePdf(f);
                            }}
                            required
                            className="hidden"
                          />
                        </label>
                        {analyzing && (
                          <div className="mt-2 text-xs font-semibold text-[#2563EB]">Analyse du document en cours...</div>
                        )}
                      </div>
                    </div>
                  </>
                )}
                {editingId && (
                  <label className="flex items-center gap-2 text-sm text-admin-fg">
                    <input
                      type="checkbox"
                      name="isActive"
                      defaultChecked={editingCourse?.isActive ?? true}
                      className="h-4 w-4"
                    />
                    {t("admin.courses.active")}
                  </label>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className={`flex gap-3 ${isAr ? "justify-start" : "justify-end"}`}>
              <button
                type="submit"
                disabled={!canSubmit || saving}
                className="rounded-xl bg-[#2563EB] px-6 py-3 text-sm font-extrabold text-white shadow-sm transition disabled:opacity-40"
              >
                {saving ? "جارٍ الحفظ..." : "حفظ"}
              </button>
              <button
                type="button"
                onClick={closeForm}
                className="rounded-xl border border-admin-border bg-transparent px-6 py-3 text-sm font-extrabold text-[#0F172A] transition hover:bg-slate-50 dark:text-white dark:hover:bg-white/10"
              >
                إلغاء
              </button>
            </div>
          </div>
            </div>
          </motion.form>
        </div>
      )}
    </div>
  );
}
