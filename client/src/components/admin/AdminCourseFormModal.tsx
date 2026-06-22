import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type CSSProperties, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import {
  courseCardContentStyle,
  courseCardThumbnailStyle,
  courseCardTitleStyle,
  courseCardWrapperStyle,
} from "@/components/employee/courseCardLayout";
import { CATEGORIES, categoryKeyFromCode, type CategoryKey } from "@/config/categories";
import { getColorFromEmoji } from "@/utils/getColorFromEmoji";
import { getReadTime } from "@/utils/courseReadTime";
import { resolveCourseCardVisual } from "@/data/courseSlugCardVisuals";
import { resolveCurrentLng } from "@/i18n/persistLanguage";

const NAVY = "#1e3a5f";
const CREAM = "#f8f5ef";
const SECTION_CARD =
  "rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.06)]";

type CoverColorMode = "auto" | "custom";

const ICONS = [
  "🚛", "🧹", "📦", "💼", "🌴", "🔧", "🚑", "🔥", "📋", "⚙️", "🛡️", "🏗️", "🚧", "📊", "🎯", "🧰",
  "🪣", "🧯", "🚿", "♻️", "⚠️", "🚦", "↩️", "🪑", "🚫", "💪", "🛣️", "🖐️", "🚗", "🌧️", "📵", "🚨",
  "🏋️", "🦶", "🗑️",
] as const;

/** SVG flags — emoji flags render as "GB"/"FR"/"MA" letters on Windows. */
const COURSE_FORM_LANG_FLAGS: Record<"ar" | "fr" | "en", { src: string; label: string }> = {
  ar: { src: "/flags/ma.svg", label: "AR" },
  fr: { src: "/flags/fr.svg", label: "FR" },
  en: { src: "/flags/gb.svg", label: "EN" },
};

const UNIQUE_TARGET_CATEGORY_KEYS: CategoryKey[] = [
  "driver",
  "sweeper",
  "loader",
  "teamLeader",
  "parkAgent",
  "maintenance",
];

const FORM_TARGET_CATEGORIES = UNIQUE_TARGET_CATEGORY_KEYS.map((key) => ({
  optionId: key,
  key,
  labelAr: CATEGORIES[key].label.ar,
}));

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isValidHexColor(input: string) {
  return /^#?[0-9a-fA-F]{6}$/.test(input.trim());
}

function normalizeHex(input: string) {
  const x = input.trim();
  return x.startsWith("#") ? x.toUpperCase() : `#${x.toUpperCase()}`;
}

function previewCoverStyle(coverColor: string): CSSProperties | undefined {
  const trimmed = coverColor.trim();
  if (!/^#?[0-9a-fA-F]{6}$/.test(trimmed)) return undefined;
  const raw = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  const hex = raw.toUpperCase();
  const h = hex.replace("#", "");
  const r = Math.max(0, parseInt(h.slice(0, 2), 16) - 28);
  const g = Math.max(0, parseInt(h.slice(2, 4), 16) - 28);
  const b = Math.max(0, parseInt(h.slice(4, 6), 16) - 28);
  const to = (n: number) => n.toString(16).padStart(2, "0").toUpperCase();
  return { background: `linear-gradient(135deg, ${hex}, #${to(r)}${to(g)}${to(b)})` };
}

function FormCoursePreview({
  title,
  description,
  icon,
  coverColor,
  readingMinutes,
}: {
  title: string;
  description: string;
  icon: string;
  coverColor: string;
  readingMinutes: number;
}) {
  const { t } = useTranslation();
  const coverStyle = previewCoverStyle(coverColor);
  return (
    <div className="mx-auto w-full max-w-[240px]">
      <div style={{ ...courseCardWrapperStyle, boxShadow: "0 4px 14px rgba(0,0,0,0.08)" }}>
        <div
          className={`relative flex items-center justify-center text-4xl ${coverStyle ? "" : `bg-gradient-to-br ${coverColor}`}`}
          style={{ ...courseCardThumbnailStyle, height: 96, minHeight: 96, maxHeight: 96 }}
        >
          {coverStyle ? <div className="absolute inset-0" style={coverStyle} /> : null}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0), rgba(0,0,0,0.28))" }}
          />
          <span className="relative z-[1]" style={{ filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.2))" }}>
            {icon}
          </span>
        </div>
        <div style={{ ...courseCardContentStyle, padding: "10px 12px" }}>
          <h3 style={{ ...courseCardTitleStyle, fontSize: 13 }}>{title}</h3>
          {description ? (
            <p
              style={{
                fontSize: 10,
                color: "#9ca3af",
                margin: "4px 0 0",
                lineHeight: 1.35,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                textAlign: "right",
              }}
            >
              {description}
            </p>
          ) : null}
          <p style={{ margin: "8px 0 0", fontSize: 11, color: "#9ca3af", textAlign: "right" }}>
            ⏱ {readingMinutes} {t("admin.courses.formModal.minutes")}
          </p>
        </div>
      </div>
    </div>
  );
}

export type AdminCourseFormEdit = {
  id: string;
  slug?: string;
  title: Record<string, string>;
  description?: Record<string, string>;
  icon: string;
  coverColor: string;
  categoryCodes: CategoryKey[];
  isActive?: boolean;
  hasQuiz?: boolean;
};

type Props = {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editingCourse?: AdminCourseFormEdit | null;
  /** Pre-select categories when opening «إضافة دورة» from a filtered role. */
  defaultCategoryCodes?: CategoryKey[];
};

export function AdminCourseFormModal({
  open,
  onClose,
  onSaved,
  editingCourse = null,
  defaultCategoryCodes,
}: Props) {
  const { t, i18n } = useTranslation();
  const lng = resolveCurrentLng(i18n.language);
  const categoryLang: "ar" | "fr" | "en" = lng === "ar" ? "ar" : lng === "fr" ? "fr" : "en";
  const isRTL = lng === "ar";
  const fm = (key: string, opts?: Record<string, unknown>) => t(`admin.courses.formModal.${key}`, opts);
  const toast = useToast();

  const [categories, setCategories] = useState<{ id: string; code: string; key: CategoryKey | null }[]>([]);
  const [existingIcons, setExistingIcons] = useState<string[]>([]);
  const [selectedCodes, setSelectedCodes] = useState<CategoryKey[]>(["driver"]);
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
  const [isActive, setIsActive] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [readingMinutes, setReadingMinutes] = useState(5);
  const [readingTouched, setReadingTouched] = useState(false);
  const [savedCourseId, setSavedCourseId] = useState<string | null>(null);
  const [hasQuiz, setHasQuiz] = useState(false);
  const [generatingQuiz, setGeneratingQuiz] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const courseId = editingCourse?.id ?? savedCourseId;
  const isPersisted = Boolean(courseId);
  const editing = Boolean(editingCourse?.id);

  const resetForm = (categoryDefaults?: CategoryKey[]) => {
    const defaults =
      categoryDefaults?.length ? [...new Set(categoryDefaults)] : defaultCategoryCodes?.length
        ? [...new Set(defaultCategoryCodes)]
        : (["driver"] as CategoryKey[]);
    setSelectedCodes(defaults);
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
    setActiveLangTab("ar");
    setAiNote(null);
    setIsActive(true);
    setReadingMinutes(5);
    setReadingTouched(false);
    setSavedCourseId(null);
    setHasQuiz(false);
    setGeneratingQuiz(false);
  };

  useEffect(() => {
    if (readingTouched) return;
    setReadingMinutes(getReadTime(titleAr.trim() || fm("previewReadFallback")));
  }, [titleAr, readingTouched]);

  useEffect(() => {
    if (!open) return;
    if (editingCourse) {
      const c = editingCourse;
      setSelectedCodes(c.categoryCodes.length ? c.categoryCodes : ["driver"]);
      setTitleAr(c.title.ar ?? "");
      setTitleFr(c.title.fr ?? "");
      setTitleEn(c.title.en ?? "");
      setDescAr(c.description?.ar ?? "");
      setDescFr(c.description?.fr ?? "");
      setDescEn(c.description?.en ?? "");
      const { icon: ic, coverColor: cov } = resolveCourseCardVisual(c.slug, c.icon, c.coverColor);
      setIconChoice(ic);
      if (isValidHexColor(cov)) {
        const n = normalizeHex(cov);
        setCoverColor(n);
        setCoverColorMode(n === normalizeHex(getColorFromEmoji(ic)) ? "auto" : "custom");
      } else {
        setCoverColorMode("auto");
        setCoverColor(normalizeHex(getColorFromEmoji(ic)));
      }
      setFile(null);
      setIsActive(c.isActive !== false);
      setHasQuiz(c.hasQuiz === true);
      setSavedCourseId(null);
      setActiveLangTab("ar");
      setAiNote(null);
      return;
    }
    resetForm(defaultCategoryCodes);
  }, [open, editingCourse, defaultCategoryCodes]);

  useEffect(() => {
    if (!open) return;
    void (async () => {
      try {
        const [cr, cat] = await Promise.all([adminApi.courses(), adminApi.categories()]);
        const courses = (cr.data as { courses: { icon?: string }[] }).courses ?? [];
        setExistingIcons(courses.map((c) => String(c.icon ?? "").trim()).filter(Boolean));
        const rows = (cat.data as { categories: { id: string; code: string }[] }).categories;
        setCategories(rows.map((c) => ({ id: c.id, code: c.code, key: categoryKeyFromCode(c.code) })));
      } catch {
        toast(t("common.error"), "error");
      }
    })();
  }, [open, t, toast]);

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
      };

      setTitleAr(String(data.name?.ar ?? "").trim());
      setTitleFr(String(data.name?.fr ?? "").trim());
      setTitleEn(String(data.name?.en ?? "").trim());
      setDescAr(String(data.description?.ar ?? "").trim());
      setDescFr(String(data.description?.fr ?? "").trim());
      setDescEn(String(data.description?.en ?? "").trim());

      const suggested = String(data.emoji || "").trim();
      const used = new Set(existingIcons);
      if (suggested && used.has(suggested)) {
        const replacement = String(ICONS.find((x) => !used.has(String(x))) ?? suggested);
        setIconChoice(replacement);
        setAiNote(fm("aiIconTaken", { suggested, replacement }));
      } else if (suggested) {
        setIconChoice(suggested);
      }
    } catch {
      toast(t("admin.courses.aiFillUnavailable"), "error");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (saving) return;

    if (!titleAr.trim() || !descAr.trim()) {
      toast(t("common.error"), "error");
      return;
    }
    if (!isPersisted && !file) {
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

    try {
      setSaving(true);
      if (isPersisted && courseId) {
        await adminApi.updateCourse(courseId, {
          title: { ar: titleAr.trim(), fr: titleFr.trim(), en: titleEn.trim() },
          description: { ar: descAr.trim(), fr: descFr.trim(), en: descEn.trim() },
          icon: iconChoice,
          coverColor: normalizeHex(coverColor),
          categoryIds: ids,
          isActive,
        });
        toast(t("common.saved"), "success");
        onSaved();
        if (editing) {
          resetForm();
          onClose();
        }
      } else {
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
        const { data } = await adminApi.createCourse(fd);
        const createdId = (data as { course?: { id: string } })?.course?.id;
        if (!createdId) throw new Error("Missing course id");
        setSavedCourseId(createdId);
        setHasQuiz(false);
        toast(t("common.saved"), "success");
        onSaved();
        await runGenerateQuiz(createdId);
      }
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

  const allSelected = UNIQUE_TARGET_CATEGORY_KEYS.every((k) => selectedCodes.includes(k));
  const canSubmit =
    Boolean(titleAr.trim()) && selectedCodes.length > 0 && (isPersisted ? true : Boolean(file));

  const runGenerateQuiz = async (targetId?: string): Promise<boolean> => {
    const id = targetId ?? courseId;
    if (!id) return false;
    setGeneratingQuiz(true);
    try {
      await adminApi.aiGenerateQuiz({ courseId: id });
      setHasQuiz(true);
      toast(t("common.quizGenOk"), "success");
      onSaved();
      return true;
    } catch (err: unknown) {
      const ax = err as { response?: { status?: number; data?: { error?: string } } };
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
      return false;
    } finally {
      setGeneratingQuiz(false);
    }
  };

  const previewHex = useMemo(() => {
    return isValidHexColor(coverColor) ? normalizeHex(coverColor) : normalizeHex(getColorFromEmoji(iconChoice));
  }, [coverColor, iconChoice]);

  const previewTitle = titleAr.trim() || fm("previewTitle");
  const previewDescription = descAr.trim() || fm("previewDesc");

  const applyPdfFile = (f: File | null) => {
    setFile(f);
    if (f) void analyzePdf(f);
  };

  const onPdfInputChange = (ev: ChangeEvent<HTMLInputElement>) => {
    applyPdfFile(ev.target.files?.[0] ?? null);
  };

  const onPdfDrop = (ev: DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    setDragOver(false);
    const f = ev.dataTransfer.files?.[0];
    if (f && (f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"))) {
      applyPdfFile(f);
    }
  };

  if (!open) return null;

  const fieldInput =
    "w-full rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-2.5 text-sm font-medium text-[#111827] outline-none transition focus:border-[#1e3a5f] focus:bg-white focus:ring-2 focus:ring-[#1e3a5f]/15";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4" dir={isRTL ? "rtl" : "ltr"}>
      <button
        type="button"
        className="absolute inset-0 bg-black/50"
        aria-label={t("admin.page.actions.close")}
        onClick={handleClose}
      />
      <motion.form
        initial={{ opacity: 0, y: 12, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.2 }}
        onSubmit={(e) => void submit(e)}
        className="relative z-[1] flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_64px_rgba(0,0,0,0.22)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <header className="shrink-0 px-5 py-4 text-white" style={{ background: NAVY }}>
          <div className="flex items-start justify-between gap-4">
            <div className={`min-w-0 ${isRTL ? "text-right" : "text-left"}`}>
              <h2 className="text-lg font-extrabold leading-tight">
                {editing ? `✏️ ${t("admin.courses.editTitle")}` : `✚ ${fm("newTitle")}`}
              </h2>
              <p className="mt-1 text-xs font-medium text-white/70">
                {editing ? fm("editSubtitle") : fm("newSubtitle")}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg text-white transition hover:bg-white/25"
              aria-label={t("admin.page.actions.close")}
            >
              ✕
            </button>
          </div>
        </header>

        {/* BODY */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5" style={{ background: CREAM }}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            {/* LEFT — معلومات الدورة */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-extrabold" style={{ color: NAVY }}>
                {fm("sectionInfo")}
              </h3>

              <div className={SECTION_CARD}>
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#6b7280]">{fm("langsAndText")}</span>
                  <div className="inline-flex rounded-lg border border-[#e5e7eb] bg-[#f3f4f6] p-0.5">
                    {(["ar", "fr", "en"] as const).map((k) => {
                      const active = activeLangTab === k;
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setActiveLangTab(k)}
                          className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[11px] font-bold transition ${
                            active ? "bg-white text-[#1e3a5f] shadow-sm" : "text-[#6b7280]"
                          }`}
                        >
                          <img
                            src={COURSE_FORM_LANG_FLAGS[k].src}
                            width={18}
                            height={12}
                            alt=""
                            aria-hidden
                            className="h-3 w-[18px] shrink-0 rounded-[2px] object-cover"
                          />
                          {COURSE_FORM_LANG_FLAGS[k].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#374151]">{fm("titleLabel")}</label>
                    <input
                      required={activeLangTab === "ar"}
                      value={activeLangTab === "ar" ? titleAr : activeLangTab === "fr" ? titleFr : titleEn}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (activeLangTab === "ar") setTitleAr(v);
                        else if (activeLangTab === "fr") setTitleFr(v);
                        else setTitleEn(v);
                      }}
                      placeholder={
                        activeLangTab === "ar"
                          ? fm("titlePlaceholderAr")
                          : activeLangTab === "fr"
                            ? fm("titlePlaceholderFr")
                            : fm("titlePlaceholderEn")
                      }
                      className={fieldInput}
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-bold text-[#374151]">{fm("descLabel")}</label>
                    <textarea
                      required={activeLangTab === "ar"}
                      value={activeLangTab === "ar" ? descAr : activeLangTab === "fr" ? descFr : descEn}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (activeLangTab === "ar") setDescAr(v);
                        else if (activeLangTab === "fr") setDescFr(v);
                        else setDescEn(v);
                      }}
                      placeholder={
                        activeLangTab === "ar"
                          ? fm("descPlaceholderAr")
                          : activeLangTab === "fr"
                            ? fm("descPlaceholderFr")
                            : fm("descPlaceholderEn")
                      }
                      className={`${fieldInput} min-h-[88px] resize-y`}
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              <div className={SECTION_CARD}>
                <div className="mb-3 text-xs font-bold text-[#6b7280]">{fm("targetCategories")}</div>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedCodes(allSelected ? [] : [...UNIQUE_TARGET_CATEGORY_KEYS])}
                    className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-2 text-xs font-bold transition"
                    style={{
                      borderColor: allSelected ? "#2563EB" : "#e5e7eb",
                      background: allSelected ? "#2563EB" : "#f9fafb",
                      color: allSelected ? "white" : "#374151",
                    }}
                  >
                    <span className="text-base">✓</span>
                    <span>{fm("all")}</span>
                  </button>
                  {FORM_TARGET_CATEGORIES.map((opt) => {
                    const meta = CATEGORIES[opt.key];
                    const active = selectedCodes.includes(opt.key);
                    return (
                      <button
                        key={opt.optionId}
                        type="button"
                        onClick={() =>
                          setSelectedCodes((prev) =>
                            prev.includes(opt.key) ? prev.filter((x) => x !== opt.key) : [...prev, opt.key]
                          )
                        }
                        className="flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-2 text-[11px] font-bold transition"
                        style={{
                          borderColor: active ? meta.color : "#e5e7eb",
                          background: active ? meta.bgColor : "#f9fafb",
                          color: active ? meta.color : "#374151",
                        }}
                      >
                        <meta.icon className="h-4 w-4 shrink-0" aria-hidden strokeWidth={2.6} />
                        <span className="text-center leading-tight">{CATEGORIES[opt.key].label[categoryLang]}</span>
                      </button>
                    );
                  })}
                </div>
                {selectedCodes.length === 0 && (
                  <p className="mt-2 text-xs font-semibold text-red-600">{t("admin.courses.pickCategory")}</p>
                )}
              </div>
            </div>

            {/* RIGHT — الهوية البصرية والمحتوى */}
            <div className="flex flex-col gap-4">
              <h3 className="text-sm font-extrabold" style={{ color: NAVY }}>
                {fm("sectionVisual")}
              </h3>

              <div className={SECTION_CARD}>
                <div className="mb-3 text-center text-xs font-bold text-[#6b7280]">{fm("cardPreview")}</div>
                <FormCoursePreview
                  title={previewTitle}
                  description={previewDescription}
                  icon={iconChoice}
                  coverColor={previewHex}
                  readingMinutes={readingMinutes}
                />
                <div className="mt-4 flex items-center justify-center gap-2 border-t border-[#f3f4f6] pt-4">
                  <label className="text-xs font-bold text-[#374151]">{fm("readingTime")}</label>
                  <input
                    type="number"
                    min={1}
                    max={120}
                    value={readingMinutes}
                    onChange={(e) => {
                      setReadingTouched(true);
                      setReadingMinutes(Math.max(1, Number(e.target.value) || 1));
                    }}
                    className="w-16 rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-2 py-1.5 text-center text-sm font-bold text-[#111827]"
                  />
                  <span className="text-xs font-semibold text-[#6b7280]">{fm("minutes")}</span>
                </div>
              </div>

              <div className={SECTION_CARD}>
                <div className="mb-3 text-xs font-bold text-[#6b7280]">{fm("coverColor")}</div>
                <div className="flex flex-wrap gap-4 text-sm font-semibold text-[#374151]">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="coverColorMode"
                      checked={coverColorMode === "auto"}
                      onChange={() => {
                        setCoverColorMode("auto");
                        setCoverColor(normalizeHex(getColorFromEmoji(iconChoice)));
                      }}
                      className="h-4 w-4 accent-[#1e3a5f]"
                    />
                    <span>{fm("auto")}</span>
                  </label>
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="coverColorMode"
                      checked={coverColorMode === "custom"}
                      onChange={() => setCoverColorMode("custom")}
                      className="h-4 w-4 accent-[#1e3a5f]"
                    />
                    <span>{fm("custom")}</span>
                  </label>
                </div>
                {coverColorMode === "custom" ? (
                  <div className="mt-3 flex flex-wrap items-end gap-3">
                    <input
                      type="color"
                      value={isValidHexColor(coverColor) ? normalizeHex(coverColor) : "#2C4A8F"}
                      onChange={(e) => setCoverColor(normalizeHex(e.target.value))}
                      className="h-10 w-14 cursor-pointer rounded-lg border border-[#e5e7eb] bg-white p-1"
                      aria-label={fm("colorPicker")}
                    />
                    <input
                      value={coverColor}
                      onChange={(e) => setCoverColor(e.target.value.trim())}
                      placeholder="#1A1A1A"
                      className="min-w-[120px] flex-1 rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-2 font-mono text-sm"
                    />
                  </div>
                ) : (
                  <div
                    className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-[#6b7280]"
                    style={{ background: `${previewHex}22`, border: `1px solid ${previewHex}44` }}
                  >
                    <span
                      className="h-4 w-4 rounded-full border border-black/10"
                      style={{ background: previewHex }}
                    />
                    {previewHex}
                  </div>
                )}
                {!isValidHexColor(coverColor) && (
                  <p className="mt-2 text-[11px] font-semibold text-red-600">{fm("invalidHex")}</p>
                )}
                {aiNote && <p className="mt-2 text-xs font-semibold text-amber-700">{aiNote}</p>}
              </div>

              <div className={SECTION_CARD}>
                <div className="mb-3 text-xs font-bold text-[#6b7280]">{fm("pickIcon")}</div>
                <div className="grid grid-cols-5 gap-2">
                  {ICONS.map((ic) => {
                    const active = iconChoice === ic;
                    return (
                      <button
                        key={ic}
                        type="button"
                        onClick={() => setIconChoice(ic)}
                        className={`flex h-11 w-full items-center justify-center rounded-xl border-2 bg-white text-xl transition active:scale-[0.96] ${
                          active
                            ? "border-[#1e3a5f] bg-[#eff6ff] ring-2 ring-[#1e3a5f]/20"
                            : "border-[#e5e7eb] hover:border-[#1e3a5f]/40 hover:bg-[#f9fafb]"
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
                  <label className="mb-1 block text-[11px] font-bold text-[#6b7280]">{fm("customEmoji")}</label>
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
                    className="w-full max-w-[120px] rounded-lg border border-[#e5e7eb] bg-[#fafafa] px-3 py-2 text-center text-2xl leading-none"
                  />
                </div>
              </div>

              <div className={SECTION_CARD}>
                {!isPersisted ? (
                  <>
                    <div className="mb-3 text-xs font-bold text-[#6b7280]">{fm("uploadPdf")}</div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={onPdfInputChange}
                      required
                      className="hidden"
                    />
                    {file ? (
                      <div className="flex items-center justify-between gap-3 rounded-xl border border-[#1e3a5f]/25 bg-[#eff6ff] px-4 py-3">
                        <div className="min-w-0 text-right">
                          <div className="truncate text-sm font-bold text-[#111827]">{file.name}</div>
                          <div className="mt-0.5 text-xs font-medium text-[#6b7280]">{formatFileSize(file.size)}</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = "";
                          }}
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#e5e7eb] bg-white text-lg font-bold text-[#6b7280] transition hover:bg-red-50 hover:text-red-600"
                          aria-label={fm("removeFile")}
                        >
                          ✕
                        </button>
                      </div>
                    ) : (
                      <div
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") fileInputRef.current?.click();
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={(e) => {
                          e.preventDefault();
                          setDragOver(true);
                        }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={onPdfDrop}
                        className={`cursor-pointer rounded-xl border-2 border-dashed px-4 py-10 text-center transition ${
                          dragOver
                            ? "border-[#1e3a5f] bg-[#eff6ff]"
                            : "border-[#d1d5db] bg-[#fafafa] hover:border-[#1e3a5f]/50 hover:bg-white"
                        }`}
                      >
                        <div className="text-3xl">📄</div>
                        <div className="mt-3 text-sm font-extrabold text-[#111827]">{fm("dropPdf")}</div>
                        <div className="mt-1 text-xs font-medium text-[#6b7280]">
                          {fm("dropPdfHint")}
                        </div>
                      </div>
                    )}
                    {analyzing && (
                      <p className="mt-2 text-center text-xs font-semibold text-[#2563eb]">
                        {fm("analyzing")}
                      </p>
                    )}
                  </>
                ) : (
                  <label className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-[#374151]">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 accent-[#1e3a5f]"
                    />
                    {t("admin.courses.active")}
                  </label>
                )}
              </div>
            </div>
          </div>

          <div className={`mt-5 ${SECTION_CARD}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className={isRTL ? "text-right" : "text-left"}>
                <h3 className="text-sm font-extrabold" style={{ color: NAVY }}>
                  📝 {fm("sectionQuiz")}
                </h3>
                <p className="mt-1 text-xs font-medium text-[#6b7280]">{fm("quizHint")}</p>
              </div>
              {isPersisted ? (
                <span
                  className={`inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-bold ${
                    hasQuiz ? "bg-emerald-50 text-emerald-700" : "bg-orange-50 text-orange-700"
                  }`}
                >
                  {hasQuiz ? fm("quizStatusYes") : fm("quizStatusNo")}
                </span>
              ) : null}
            </div>
            <button
              type="button"
              disabled={!isPersisted || generatingQuiz || saving}
              onClick={() => void runGenerateQuiz()}
              className="mt-3 w-full rounded-xl border border-[#1e3a5f]/20 bg-[#eff6ff] px-4 py-3 text-sm font-extrabold text-[#1e3a5f] transition hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto"
              style={!isPersisted ? { background: "#f3f4f6", color: "#9ca3af", borderColor: "#e5e7eb" } : undefined}
            >
              {generatingQuiz
                ? t("common.generating")
                : hasQuiz
                  ? fm("regenerateQuiz")
                  : fm("generateQuiz")}
            </button>
            {!isPersisted ? (
              <p className="mt-2 text-xs font-semibold text-[#6b7280]">{fm("quizSaveFirst")}</p>
            ) : null}
          </div>
        </div>

        {/* FOOTER */}
        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] bg-white px-5 py-4">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-xl border border-[#e5e7eb] bg-transparent px-5 py-2.5 text-sm font-bold text-[#374151] transition hover:bg-[#f9fafb]"
          >
            {t("common.cancel")}
          </button>
          {!canSubmit && !saving && (
            <span className="text-center text-xs font-semibold text-[#ea580c]">
              ⚠️ {fm("fillRequired")}{" "}
              {              [
                !titleAr.trim() && fm("fieldTitle"),
                selectedCodes.length === 0 && fm("fieldCategory"),
                !isPersisted && !file && fm("fieldFile"),
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
          )}
          <button
            type="submit"
            disabled={!canSubmit || saving}
            className="rounded-xl px-6 py-2.5 text-sm font-extrabold text-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-45"
            style={{ background: NAVY }}
          >
            {saving ? fm("saving") : isPersisted && !editing ? fm("saveUpdates") : `💾 ${fm("save")}`}
          </button>
        </footer>
      </motion.form>
    </div>
  );
}
