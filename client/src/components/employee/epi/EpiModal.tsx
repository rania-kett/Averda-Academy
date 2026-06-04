import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { epiApi, type EpiCatalogItem, type EpiPassportItem, type EpiProfile } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import { Card, PrimaryButton, SectionTitle } from "@/components/employee/ui/primitives";
import { ArrowLeft, Edit3, ShieldAlert, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { buildEpiProgress, isEpiNeedsStatus, type EpiRowStatus } from "@/utils/epiProgress";
import { getExpiryLabel } from "@/utils/epiExpiry";
import { getDisplayStatus, getStatusLabel } from "@/utils/epiStatus";

const EPI_NAVY = "#1e3a5f";

/** Off-screen input — iOS Safari ignores `capture` on `display:none` inputs. */
function mountMobileFileInput(opts: { camera: boolean }): HTMLInputElement {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  if (opts.camera) {
    input.setAttribute("capture", "environment");
  }
  input.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0.01;";
  document.body.appendChild(input);
  return input;
}

function pickImageFromDevice(camera: boolean): Promise<File | null> {
  return new Promise((resolve) => {
    const input = mountMobileFileInput({ camera });
    const finish = (file: File | null) => {
      input.remove();
      resolve(file);
    };
    input.addEventListener(
      "change",
      () => {
        finish(input.files?.[0] ?? null);
      },
      { once: true }
    );
    input.addEventListener(
      "cancel",
      () => {
        finish(null);
      },
      { once: true }
    );
    window.setTimeout(() => input.click(), 0);
  });
}

const LIFECYCLE_STEPS_AR = ["تم التعيين", "نشط", "مستهلك", "استبدال"] as const;
const LIFECYCLE_STEPS_EN = ["Assigned", "Active", "In use", "Replace"] as const;

function lifecycleStepIndex(status: EpiRowStatus, passportStatus?: string | null): number {
  if (passportStatus === "pending_renewal") return 3;
  if (status === "not_received") return 0;
  if (status === "pending") return 1;
  if (status === "received") return 2;
  if (status === "needs_renewal" || status === "needs_replacement") return 3;
  return 0;
}

function LifecycleStepIndicator({
  currentStep,
  labels,
}: {
  currentStep: number;
  labels: readonly string[];
}) {
  return (
    <div className="mt-4 px-1">
      <div className="flex items-center">
        {labels.map((label, i) => {
          const done = i < currentStep;
          const current = i === currentStep;
          const isLast = i === labels.length - 1;
          return (
            <div key={label} className={`flex flex-1 items-center ${isLast ? "flex-none" : ""}`}>
              <div className="flex flex-col items-center">
                <div
                  className={`grid h-8 w-8 place-items-center rounded-full text-[13px] font-extrabold ${
                    done
                      ? "bg-[#1e3a5f] text-white"
                      : current
                        ? "bg-[#e8a020] text-white epi-step-current"
                        : "border-2 border-[#d1d5db] bg-white text-[#9ca3af]"
                  }`}
                >
                  {done ? "✓" : current ? "●" : ""}
                </div>
                <div className="mt-2 max-w-[72px] text-center text-[11px] font-semibold leading-tight text-[#6b7280] dark:text-stone-400">
                  {label}
                </div>
              </div>
              {!isLast && (
                <div
                  className="mx-1 mb-5 h-0.5 flex-1 rounded-full"
                  style={{ background: i < currentStep ? EPI_NAVY : "#e5e7eb" }}
                />
              )}
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes epi-step-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(232, 160, 32, 0.45); }
          50% { box-shadow: 0 0 0 10px rgba(232, 160, 32, 0); }
        }
        .epi-step-current { animation: epi-step-pulse 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type Summary = {
  profileComplete: boolean;
  profile: EpiProfile | null;
  catalog: EpiCatalogItem[];
  categoryDefaults: {
    categoryId: string;
    itemCode: string;
    required: boolean;
    lifetimeDaysOverride: number | null;
    sortOrder: number;
  }[];
  passport: EpiPassportItem[];
};

export function EpiModal({ isOpen, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const { state } = useAuth();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [sizesOpen, setSizesOpen] = useState(false);
  const [sizesSaveError, setSizesSaveError] = useState<string | null>(null);
  const [selectedItemCode, setSelectedItemCode] = useState<string | null>(null);
  const [itemSheetOpen, setItemSheetOpen] = useState(false);

  const [replacementOpen, setReplacementOpen] = useState(false);
  const [replacementItemCode, setReplacementItemCode] = useState<string | null>(null);
  const [replacementReason, setReplacementReason] = useState<string | null>(null);
  const [replacementNote, setReplacementNote] = useState("");
  const [replacementSent, setReplacementSent] = useState(false);
  const [isReplacementSubmitting, setIsReplacementSubmitting] = useState(false);

  const [receptionOpen, setReceptionOpen] = useState(false);
  const [receptionFitOk, setReceptionFitOk] = useState(true);
  const [receptionNotifySupervisor, setReceptionNotifySupervisor] = useState(true);
  const [receptionSignature, setReceptionSignature] = useState("");
  const [receptionNotes, setReceptionNotes] = useState("");

  // Photo proof capture (before confirming reception)
  const [proofOpen, setProofOpen] = useState(false);
  const [proofStage, setProofStage] = useState<"capture" | "preview">("capture");
  const [proofDataUrl, setProofDataUrl] = useState<string | null>(null);
  const [proofError, setProofError] = useState<string | null>(null);
  const [cameraLive, setCameraLive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [shirtSize, setShirtSize] = useState<string | null>(null);
  const [shoeSize, setShoeSize] = useState<string | null>(null);
  const [gloveSize, setGloveSize] = useState<string | null>(null);
  const [vestSize, setVestSize] = useState<string | null>(null);
  const [pantsSize, setPantsSize] = useState<string | null>(null);

  const reset = useCallback(() => {
    setLoading(false);
    setSubmitting(false);
    setSummary(null);
    setSizesOpen(false);
    setSizesSaveError(null);
    setSelectedItemCode(null);
    setItemSheetOpen(false);
    setReplacementOpen(false);
    setReplacementItemCode(null);
    setReplacementReason(null);
    setReplacementNote("");
    setReplacementSent(false);
    setIsReplacementSubmitting(false);
    setShirtSize(null);
    setShoeSize(null);
    setGloveSize(null);
    setVestSize(null);
    setPantsSize(null);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await epiApi.summary();
      const s = data as Summary;
      setSummary(s);
      setShirtSize(s.profile?.shirtSize ?? null);
      setShoeSize(s.profile?.shoeSize ?? null);
      setGloveSize((s.profile as any)?.gloveSize ?? null);
      setVestSize(s.profile?.vestSize ?? null);
      setPantsSize(s.profile?.pantsSize ?? null);
    } catch (e: any) {
      const msg = String(e?.response?.data?.error || e?.message || "");
      if (msg.includes("DB_MIGRATION_REQUIRED")) {
        toast(t("employee.epi.errors.dbMigrationRequired"), "error");
      } else {
        toast(t("employee.epi.errors.loadFailed"), "error");
      }
    } finally {
      setLoading(false);
    }
  }, [state.kind, t, toast, state]);

  useEffect(() => {
    if (!isOpen) {
      reset();
      return;
    }
    document.body.style.overflow = "hidden";
    void refresh();
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, refresh, reset]);

  useEffect(() => {
    if (!isOpen) return;
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [isOpen, refresh]);

  const close = () => {
    if (submitting || isReplacementSubmitting) return;
    onClose();
  };

  const langKey = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const isArabic = langKey === "ar";

  const labelForItem = useCallback(
    (it: EpiCatalogItem): string => {
      const fallback =
        langKey === "ar" ? it.labelAr || it.labelFr || it.labelEn || it.code : langKey === "fr" ? it.labelFr || it.labelEn || it.labelAr || it.code : it.labelEn || it.labelFr || it.labelAr || it.code;
      return t(`employee.epi.items.codes.${it.code}`, { defaultValue: fallback });
    },
    [langKey, t]
  );

  const epiProgress = useMemo(() => buildEpiProgress(summary), [summary]);
  const items = epiProgress.items;
  const counts = epiProgress.counts;

  const replacementItem = useMemo(() => {
    if (!replacementItemCode) return null;
    return items.find((x) => x.item.code === replacementItemCode)?.item ?? null;
  }, [items, replacementItemCode]);

  const lifecycleLabels = langKey === "ar" ? LIFECYCLE_STEPS_AR : LIFECYCLE_STEPS_EN;

  const sizesComplete = Boolean(shirtSize || shoeSize || gloveSize || vestSize || pantsSize);

  const saveSizes = async () => {
    setSubmitting(true);
    setSizesSaveError(null);
    try {
      await epiApi.updateProfile({ shirtSize, shoeSize, gloveSize, vestSize, pantsSize });
      toast(t("employee.epi.toasts.sizesSaved"), "success");
      setSizesOpen(false);
      await refresh();
    } catch (e: any) {
      const msg = String(e?.response?.data?.error || e?.message || "");
      const friendly = msg.includes("DB_MIGRATION_REQUIRED")
        ? t("employee.epi.errors.dbMigrationRequired")
        : t("employee.epi.errors.saveSizesFailed");
      setSizesSaveError(friendly);
      toast(friendly, "error");
    } finally {
      setSubmitting(false);
    }
  };

  const openItem = (itemCode: string) => {
    setSelectedItemCode(itemCode);
    setItemSheetOpen(true);
  };

  const selected = useMemo(() => {
    if (!selectedItemCode) return null;
    return items.find((x) => x.item.code === selectedItemCode) ?? null;
  }, [items, selectedItemCode]);

  const stopProofStream = useCallback(() => {
    try {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {
      /* ignore */
    }
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const canUseLiveCamera =
    typeof window !== "undefined" && window.isSecureContext && Boolean(navigator.mediaDevices?.getUserMedia);

  const startLiveCamera = useCallback(async () => {
    if (!canUseLiveCamera) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stopProofStream();
        return;
      }
      video.srcObject = stream;
      await video.play();
      await new Promise<void>((resolve) => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          resolve();
          return;
        }
        const onReady = () => {
          if (video.videoWidth > 0 && video.videoHeight > 0) resolve();
        };
        video.addEventListener("loadedmetadata", onReady, { once: true });
        window.setTimeout(resolve, 2500);
      });
      if (video.videoWidth <= 0 || video.videoHeight <= 0) {
        stopProofStream();
        setCameraLive(false);
        return;
      }
      setCameraLive(true);
    } catch {
      stopProofStream();
      setCameraLive(false);
    }
  }, [canUseLiveCamera, stopProofStream]);

  useEffect(() => {
    if (!proofOpen) {
      stopProofStream();
      setCameraLive(false);
      return;
    }
    setProofError(null);
    setProofStage("capture");
    setProofDataUrl(null);
    setCameraLive(false);
    if (!canUseLiveCamera) return;
    void startLiveCamera();
    return () => stopProofStream();
  }, [canUseLiveCamera, proofOpen, startLiveCamera, stopProofStream]);

  const beginReceptionProof = () => {
    if (!selected?.passport?.id) return;
    setProofOpen(true);
  };

  const captureProofFromVideo = () => {
    const video = videoRef.current;
    const w = video?.videoWidth ?? 0;
    const h = video?.videoHeight ?? 0;
    if (cameraLive && video && w > 0 && h > 0) {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, w, h);
      setProofDataUrl(canvas.toDataURL("image/jpeg", 0.7));
      setProofStage("preview");
      return;
    }
    void pickImageFromDevice(true).then((file) => handleProofFile(file));
  };

  const pickProofFromGallery = () => {
    void pickImageFromDevice(false).then((file) => handleProofFile(file));
  };

  const handleProofFile = (file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result || "");
      if (!url.startsWith("data:image/")) {
        setProofError("تعذر قراءة الصورة");
        return;
      }
      setProofError(null);
      setProofDataUrl(url);
      setProofStage("preview");
    };
    reader.onerror = () => setProofError("تعذر قراءة الصورة");
    reader.readAsDataURL(file);
  };

  const confirmSelectedReception = async (photo?: string) => {
    const issuanceId = selected?.passport?.id;
    if (!issuanceId) return;
    setSubmitting(true);
    try {
      const fitTag = receptionFitOk ? "FIT_OK" : "FIT_NOT_OK";
      const notifyTag = receptionNotifySupervisor ? "NOTIFY_SUPERVISOR" : "NO_NOTIFY";
      const note = [fitTag, notifyTag, receptionNotes.trim()].filter(Boolean).join(" | ").slice(0, 500);
      // Use the canonical receipt endpoint so the issuance is marked received consistently.
      await epiApi.confirmReceipt({
        itemType: selected.item.code,
        issuanceId,
        signatureName: receptionSignature.trim() || undefined,
        notes: note || undefined,
        employeeId: state.kind === "employee" ? state.user.employeeId : undefined,
        itemId: selected.item.code,
        photo: photo || undefined,
      });
      toast(t("employee.epi.toasts.receptionConfirmed"), "success");
      setReceptionOpen(false);
      setReceptionSignature("");
      setReceptionNotes("");
      setProofOpen(false);
      setProofStage("capture");
      setProofDataUrl(null);
      // Optimistic update: reflect the received status immediately.
      setSummary((prev) => {
        if (!prev) return prev;
        const nowIso = new Date().toISOString();
        return {
          ...prev,
          passport: prev.passport.map((p) =>
            p.id === issuanceId ? { ...p, status: "received", lastReceptionAt: nowIso as any } : p
          ),
        };
      });
      await refresh();
    } catch {
      toast(t("employee.epi.errors.confirmReceptionFailed"), "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startReplacement = (itemCode: string) => {
    setReplacementItemCode(itemCode);
    setReplacementReason(null);
    setReplacementNote("");
    setReplacementSent(false);
    setReplacementOpen(true);
  };

  const markReplacementPending = (itemCode: string, issuanceId?: string) => {
    setSummary((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        passport: prev.passport.map((p) =>
          p.id === issuanceId || p.itemCode === itemCode
            ? { ...p, status: "pending_renewal" }
            : p
        ),
      };
    });
  };

  const sendReplacement = async () => {
    if (!replacementItemCode || !replacementReason || isReplacementSubmitting) return;
    const note = replacementNote.trim();
    const row = items.find((x) => x.item.code === replacementItemCode);
    const p = row?.passport ?? null;
    const itemLabel = row ? labelForItem(row.item) : replacementItemCode;
    setIsReplacementSubmitting(true);
    setSubmitting(true);
    try {
      await epiApi.requestRenewal({
        itemType: replacementItemCode,
        itemLabel,
        reason: replacementReason,
        note: note || undefined,
      });
      markReplacementPending(replacementItemCode, p?.id ?? undefined);
      setReplacementSent(true);
      toast(langKey === "ar" ? "تم إرسال طلب التجديد بنجاح ✅" : t("employee.epi.toasts.replacementSent"), "success");
      setItemSheetOpen(false);
      await refresh();
    } catch (e) {
      console.error("Renewal request error:", e);
      toast(langKey === "ar" ? "❌ فشل الإرسال — تحقق من الاتصال" : t("employee.epi.errors.replacementFailed"), "error");
    } finally {
      setIsReplacementSubmitting(false);
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[220] bg-[#FAFAF7] dark:bg-[#0D1117]" dir={isArabic ? "rtl" : "ltr"} role="dialog" aria-modal="true">
      <div className="mx-auto flex h-full w-full max-w-3xl flex-col">
        <div className="flex items-center justify-between gap-3 border-b border-black/5 bg-white/95 px-5 py-4 backdrop-blur-md dark:border-[#30363D] dark:bg-[#0D1117]/90">
          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
            aria-label={t("common.back")}
            style={{ direction: "ltr" }}
          >
            <ArrowLeft className="h-5 w-5" aria-hidden />
          </button>

          <div className="min-w-0 text-center">
            <div className="truncate text-[18px] font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
              {t("employee.epi.title")}
            </div>
            <div className="mt-1 text-[13px] font-semibold text-[#57534E] dark:text-stone-400">
              {t("employee.epi.subtitle")}
            </div>
          </div>

          <button
            type="button"
            onClick={close}
            className="inline-flex h-11 min-w-[44px] items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
            aria-label={t("common.close")}
          >
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 pb-[calc(env(safe-area-inset-bottom)+88px)] pt-5">
          <div
            className="rounded-2xl p-5 text-white shadow-[0_8px_24px_rgba(30,58,95,0.25)]"
            style={{ background: EPI_NAVY, borderRadius: 16 }}
          >
            <div className="text-[14px] font-semibold opacity-80">
              {langKey === "ar" ? "معدات السلامة الخاصة بك" : t("employee.epi.receipt.title")}
            </div>
            <div className="mt-1 text-[32px] font-extrabold leading-none tabular-nums">
              {counts.received} / {counts.total}
            </div>
            <div className="mt-1 text-[13px] opacity-70">
              {langKey === "ar" ? "معدات مستلمة" : t("employee.epi.receipt.progress", { received: counts.received, total: counts.total })}
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded" style={{ background: "rgba(255,255,255,0.2)", borderRadius: 4 }}>
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${counts.pct}%`, background: "#22c55e", borderRadius: 4 }}
              />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: "rgba(255,255,255,0.15)" }}>
                ✅ {counts.received} {langKey === "ar" ? "مستلم" : "received"}
              </span>
              <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: "rgba(255,255,255,0.15)" }}>
                🕐 {counts.pending} {langKey === "ar" ? "في الانتظار" : "pending"}
              </span>
              <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: "rgba(255,255,255,0.15)" }}>
                ⚠️ {counts.needs} {langKey === "ar" ? "يحتاج تجديد" : "renewal"}
              </span>
            </div>
          </div>

          <div className="mt-5">
            <SectionTitle>{t("employee.epi.sizes.title")}</SectionTitle>
            <Card className="mt-3 p-4">
              {!sizesComplete ? (
                <div>
                  <div className="text-[14px] font-semibold leading-[1.75] text-[#57534E] dark:text-stone-400">
                    {t("employee.epi.sizes.hint")}
                  </div>
                  <div className="mt-4">
                    <PrimaryButton
                      type="button"
                      className="w-full bg-[#1a3a6e] hover:bg-[#163056] active:bg-[#12284b]"
                      onClick={() => setSizesOpen(true)}
                      disabled={loading || submitting}
                    >
                      {t("employee.epi.sizes.cta")}
                    </PrimaryButton>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { emoji: "👕", label: t("employee.epi.sizes.labels.shirt"), value: shirtSize },
                      { emoji: "👖", label: t("employee.epi.sizes.labels.pantsOptional"), value: pantsSize },
                      { emoji: "👟", label: t("employee.epi.sizes.labels.shoe"), value: shoeSize },
                      { emoji: "🧤", label: t("employee.epi.sizes.labels.gloves"), value: gloveSize },
                      { emoji: "🦺", label: t("employee.epi.sizes.labels.vest"), value: vestSize },
                    ]
                      .filter((row) => row.value)
                      .map((row) => (
                        <div
                          key={row.label}
                          className="rounded-xl border border-[#E7E5E4] bg-[#f9fafb] px-3 py-3 text-center dark:border-[#30363D] dark:bg-[#161b22]"
                        >
                          <div className="text-[22px]" aria-hidden>
                            {row.emoji}
                          </div>
                          <div className="mt-1 text-[11px] font-bold text-[#6b7280] dark:text-stone-400">{row.label}</div>
                          <div className="mt-0.5 text-[18px] font-extrabold text-[#1C1917] dark:text-white">{row.value}</div>
                        </div>
                      ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSizesOpen(true)}
                    className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center gap-2 rounded-2xl border border-[#E7E5E4] bg-white px-4 text-sm font-extrabold text-[#1C1917] transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white dark:hover:bg-averda/20"
                    disabled={loading || submitting}
                  >
                    <Edit3 className="h-5 w-5 text-averda dark:text-white" aria-hidden />
                    {langKey === "ar" ? "تعديل المقاسات ✏️" : t("employee.epi.sizes.edit")}
                  </button>
                </div>
              )}
            </Card>
          </div>

          <div className="mt-6">
            <SectionTitle>{t("employee.epi.items.title")}</SectionTitle>
            <div className="mt-3 space-y-2">
              {items.map((it) => {
                const awaitingRenewal = it.passport?.status === "pending_renewal";
                const itemName = labelForItem(it.item);
                const receivedDate = it.passport?.issuedAt ?? null;
                const rowStatus =
                  it.status === "not_received"
                    ? "not_issued"
                    : it.status === "needs_replacement"
                      ? "needs_renewal"
                      : it.status;
                const displayStatus = getDisplayStatus({
                  status: rowStatus,
                  name: itemName,
                  receivedDate,
                  nextReplacementAt: it.passport?.nextReplacementAt ?? null,
                });
                const expiryHint = getExpiryLabel(itemName, receivedDate);
                const statusMeta = getStatusLabel(displayStatus);

                const isReceived = displayStatus === "received";
                const isPending = displayStatus === "pending";
                const isNeeds = displayStatus === "needs_renewal";
                const isNotReceived = displayStatus === "not_issued";

                const rowStyle = isReceived
                  ? { background: "#ffffff", borderLeft: "3px solid #22c55e" }
                  : isPending
                    ? { background: "#fff7ed", borderLeft: "3px solid #f59e0b" }
                    : isNeeds || isNotReceived
                      ? { background: "#fef2f2", borderLeft: `3px solid ${isNeeds ? "#dc2626" : "#ef4444"}` }
                      : { background: "#ffffff", borderLeft: "3px solid #e5e7eb" };

                const statusPill = (
                  <span
                    className={`shrink-0 rounded-full px-3 py-1.5 text-[12px] font-extrabold text-white ${
                      isReceived
                        ? "bg-[#22c55e]"
                        : isPending
                          ? "bg-[#f59e0b]"
                          : isNeeds
                            ? "bg-[#dc2626]"
                            : "bg-[#ef4444]"
                    }`}
                  >
                    {isReceived
                      ? `✓ ${langKey === "ar" ? statusMeta.arabic : t("employee.epi.status.received")}`
                      : isPending
                        ? `🕐 ${langKey === "ar" ? statusMeta.arabic : t("employee.epi.status.pending")}`
                        : isNeeds
                          ? `✗ ${langKey === "ar" ? statusMeta.arabic : t("employee.epi.status.needsRenewal")}`
                          : `! ${langKey === "ar" ? statusMeta.arabic : t("employee.epi.status.notIssued")}`}
                  </span>
                );

                const subline = isPending
                  ? langKey === "ar"
                    ? awaitingRenewal
                      ? "طلبك قيد المراجعة"
                      : "بانتظار تأكيد الاستلام"
                    : t("employee.epi.status.pending")
                  : it.passport?.issuedAt
                    ? t("employee.epi.items.assigned")
                    : t("employee.epi.items.notAssigned");

                return (
                  <div
                    key={it.item.code}
                    className="flex w-full items-center gap-2 rounded-xl border border-[#E7E5E4]/80 pe-3 ps-0 shadow-sm dark:border-[#30363D]"
                    style={rowStyle}
                  >
                    <button
                      type="button"
                      onClick={() => openItem(it.item.code)}
                      className="flex min-w-0 flex-1 items-center gap-3 py-4 ps-4 text-start transition active:scale-[0.99]"
                    >
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/5 text-[26px] dark:bg-white/10" aria-hidden>
                        {it.item.emoji ?? "🦺"}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-extrabold text-[#1C1917] dark:text-white">
                          {labelForItem(it.item)}
                        </div>
                        <div className="mt-1 text-[12px] font-semibold text-[#6b7280] dark:text-stone-400">{subline}</div>
                        {expiryHint.text ? (
                          <div
                            className={`mt-1 text-[11px] font-bold ${
                              expiryHint.color === "red"
                                ? "text-[#dc2626]"
                                : expiryHint.color === "orange"
                                  ? "text-[#d97706]"
                                  : "text-[#16a34a]"
                            }`}
                          >
                            {expiryHint.text}
                          </div>
                        ) : null}
                      </div>
                    </button>
                    <div className="flex shrink-0 flex-col items-end gap-2 py-2">
                      {statusPill}
                      {isNotReceived ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openItem(it.item.code);
                          }}
                          className="rounded-lg border border-[#ef4444]/30 bg-white px-2.5 py-1.5 text-[11px] font-extrabold text-[#dc2626]"
                        >
                          {langKey === "ar" ? "طلب استلام" : "Request"}
                        </button>
                      ) : null}
                      {isNeeds && !awaitingRenewal ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            startReplacement(it.item.code);
                          }}
                          disabled={submitting}
                          className="rounded-lg px-2.5 py-1.5 text-[11px] font-extrabold text-white"
                          style={{ background: EPI_NAVY }}
                        >
                          {langKey === "ar" ? "طلب تجديد 🔄" : t("employee.epi.itemSheet.requestReplacement")}
                        </button>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {items.some((x) => isEpiNeedsStatus(x.status)) && (
            <div className="mt-6">
              <SectionTitle>{t("employee.epi.renew.title")}</SectionTitle>
              <Card className="mt-3 p-4">
                <div className="text-[14px] font-semibold leading-[1.75] text-[#57534E] dark:text-stone-400">
                  {t("employee.epi.renew.hint")}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Sizes centered modal */}
      {sizesOpen && (
        <div className="fixed inset-0 z-[230] grid place-items-center px-5" dir={isArabic ? "rtl" : "ltr"} role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("common.close")} onClick={() => setSizesOpen(false)} />
          <div className="relative w-full max-w-lg rounded-3xl border border-[#E7E5E4] bg-white p-5 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[18px] font-extrabold text-[#1C1917] dark:text-white">{t("employee.epi.sizes.modalTitle")}</div>
              <button
                type="button"
                onClick={() => setSizesOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              {(
                [
                  { label: t("employee.epi.sizes.labels.shirt"), value: shirtSize, set: setShirtSize, options: ["XS", "S", "M", "L", "XL", "XXL"] },
                  { label: t("employee.epi.sizes.labels.shoe"), value: shoeSize, set: setShoeSize, options: ["38", "39", "40", "41", "42", "43", "44", "45"] },
                  { label: t("employee.epi.sizes.labels.gloves"), value: gloveSize, set: setGloveSize, options: ["XS", "S", "M", "L", "XL", "XXL"] },
                  { label: t("employee.epi.sizes.labels.vest"), value: vestSize, set: setVestSize, options: ["S", "M", "L", "XL"] },
                  { label: t("employee.epi.sizes.labels.pantsOptional"), value: pantsSize, set: setPantsSize, options: ["S", "M", "L", "XL", "XXL"] },
                ] as const
              ).map((row) => (
                <div key={row.label}>
                  <div className="text-[13px] font-extrabold text-[#1C1917] dark:text-white">{row.label}</div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {row.options.map((opt) => {
                      const selected = row.value === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => {
                            setSizesSaveError(null);
                            row.set(opt);
                          }}
                          className={`h-12 min-w-[52px] rounded-2xl border px-4 text-[14px] font-extrabold transition active:scale-[0.97] ${
                            selected
                              ? "border-[#1a3a6e] bg-[#1a3a6e] text-white"
                              : "border-[#E7E5E4] bg-white text-[#1C1917] hover:bg-averda/10 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white dark:hover:bg-averda/20"
                          }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5">
              <PrimaryButton
                type="button"
                className="w-full bg-[#1a3a6e] hover:bg-[#163056] active:bg-[#12284b]"
                onClick={() => void saveSizes()}
                disabled={submitting || loading}
              >
                {submitting ? t("common.saving") : loading ? t("common.loading") : t("employee.epi.sizes.save")}
              </PrimaryButton>
              {sizesSaveError && (
                <div className="mt-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-[13px] font-semibold text-red-800 dark:border-red-900 dark:bg-red-950/20 dark:text-red-200">
                  {sizesSaveError}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Item detail bottom sheet */}
      {itemSheetOpen && selected && (
        <div className="fixed inset-0 z-[240] flex flex-col justify-end" dir={isArabic ? "rtl" : "ltr"} role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("common.close")} onClick={() => setItemSheetOpen(false)} />
          <div className="relative w-full rounded-t-3xl border border-[#E7E5E4] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-5 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-averda/10 text-[26px]" aria-hidden>
                  {selected.item.emoji ?? "🦺"}
                </div>
                <div>
                  <div className="text-[18px] font-extrabold text-[#1C1917] dark:text-white">{labelForItem(selected.item)}</div>
                  <div className="mt-1 text-[12px] font-semibold text-[#57534E] dark:text-stone-400">
                    {selected.passport?.issuedAt ? t("employee.epi.items.assigned") : t("employee.epi.items.notAssigned")}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemSheetOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100 dark:hover:bg-averda/20"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-4">
              <div className="text-[13px] font-extrabold text-[#1C1917] dark:text-white">{t("employee.epi.itemSheet.statusTitle")}</div>
              <LifecycleStepIndicator
                currentStep={lifecycleStepIndex(selected.status, selected.passport?.status)}
                labels={lifecycleLabels}
              />
            </div>

            <div className="mt-5 space-y-3">
              {selected.status === "pending" && selected.passport?.status !== "pending_renewal" && (
                <PrimaryButton
                  type="button"
                  className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                  onClick={() => {
                    setReceptionOpen(true);
                    setReceptionFitOk(true);
                    setReceptionNotifySupervisor(true);
                    setReceptionSignature("");
                    setReceptionNotes("");
                  }}
                  disabled={submitting || !selected.passport?.id}
                >
                  {t("employee.epi.itemSheet.confirmReception")}
                </PrimaryButton>
              )}
              {isEpiNeedsStatus(selected.status) && selected.passport?.status !== "pending_renewal" && (
                <PrimaryButton
                  type="button"
                  className="w-full bg-[#1a3a6e] hover:bg-[#163056] active:bg-[#12284b]"
                  onClick={() => startReplacement(selected.item.code)}
                  disabled={submitting}
                >
                  {t("employee.epi.itemSheet.requestReplacement")}
                </PrimaryButton>
              )}
              {selected.passport?.status === "pending_renewal" && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-[13px] font-bold text-amber-900 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-200">
                  {langKey === "ar" ? "في الانتظار 🕐 — طلب التجديد قيد المراجعة" : t("employee.epi.status.pending")}
                </div>
              )}
              {selected.status === "not_received" && (
                <div className="flex items-center gap-2 rounded-2xl border border-[#E7E5E4] bg-white p-4 text-[13px] font-semibold text-[#57534E] dark:border-[#30363D] dark:bg-[#0D1117] dark:text-stone-400">
                  <ShieldAlert className="h-5 w-5 text-stone-400" aria-hidden />
                  {t("employee.epi.itemSheet.notRecorded")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reception confirmation sheet (notify supervisor + fit confirmation) */}
      {receptionOpen && selected?.passport?.id && (
        <div className="fixed inset-0 z-[260] flex flex-col justify-end" dir={isArabic ? "rtl" : "ltr"} role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("common.close")}
            onClick={() => setReceptionOpen(false)}
          />
          <div className="relative w-full rounded-t-3xl border border-[#E7E5E4] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-5 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]">
            <div
              className="flex items-center gap-3 rounded-2xl px-4 py-3"
              style={{ background: `${EPI_NAVY}12`, border: `1px solid ${EPI_NAVY}22` }}
            >
              <span className="text-[32px]" aria-hidden>
                {selected.item.emoji ?? "🦺"}
              </span>
              <div className="min-w-0 flex-1">
                <div className="text-[17px] font-extrabold text-[#1C1917] dark:text-white">{labelForItem(selected.item)}</div>
                <div className="text-[12px] font-semibold text-[#6b7280]">{t("employee.epi.reception.title")}</div>
              </div>
              <button
                type="button"
                onClick={() => setReceptionOpen(false)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 transition hover:bg-averda/10 active:scale-[0.97] dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => setReceptionNotifySupervisor((v) => !v)}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 text-[14px] font-bold transition active:scale-[0.99] ${
                  receptionNotifySupervisor
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-[#E7E5E4] bg-white text-[#1C1917]"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[13px] font-extrabold ${
                    receptionNotifySupervisor ? "bg-emerald-600 text-white" : "border-2 border-[#d1d5db] bg-white"
                  }`}
                  aria-hidden
                >
                  {receptionNotifySupervisor ? "✓" : ""}
                </span>
                <span className="flex-1 text-start">{t("employee.epi.reception.notifySupervisor")}</span>
              </button>

              <button
                type="button"
                onClick={() => setReceptionFitOk((v) => !v)}
                className={`flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-4 text-[14px] font-bold transition active:scale-[0.99] ${
                  receptionFitOk
                    ? "border-emerald-200 bg-emerald-50 text-emerald-900"
                    : "border-[#E7E5E4] bg-white text-[#1C1917]"
                }`}
              >
                <span
                  className={`grid h-6 w-6 shrink-0 place-items-center rounded-md text-[13px] font-extrabold ${
                    receptionFitOk ? "bg-emerald-600 text-white" : "border-2 border-[#d1d5db] bg-white"
                  }`}
                  aria-hidden
                >
                  {receptionFitOk ? "✓" : ""}
                </span>
                <span className="flex-1 text-start">{t("employee.epi.reception.fitOk")}</span>
              </button>

              <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 dark:border-[#30363D] dark:bg-[#0D1117]">
                <div className="text-[13px] font-extrabold text-[#1C1917] dark:text-white">
                  {t("employee.epi.reception.signatureOptional")}
                </div>
                <input
                  value={receptionSignature}
                  onChange={(e) => setReceptionSignature(e.target.value)}
                  className="mt-2 h-[52px] w-full rounded-2xl border border-[#E7E5E4] bg-white px-4 text-[15px] font-semibold text-[#1C1917] outline-none focus:ring-2 focus:ring-averda/25 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
                  placeholder={t("employee.epi.reception.signaturePlaceholder")}
                />
              </div>

              <div className="rounded-2xl border border-[#E7E5E4] bg-white p-4 dark:border-[#30363D] dark:bg-[#0D1117]">
                <div className="text-[13px] font-extrabold text-[#1C1917] dark:text-white">
                  {t("employee.epi.reception.noteOptional")}
                </div>
                <textarea
                  value={receptionNotes}
                  onChange={(e) => setReceptionNotes(e.target.value)}
                  className="mt-2 min-h-[96px] w-full resize-none rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 text-[14px] font-semibold text-[#1C1917] outline-none focus:ring-2 focus:ring-averda/25 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
                  placeholder={t("employee.epi.reception.notePlaceholder")}
                />
              </div>

              <PrimaryButton
                type="button"
                className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                onClick={() => beginReceptionProof()}
                disabled={submitting}
              >
                {langKey === "ar" ? "✅ تأكيد الاستلام" : t("employee.epi.reception.confirm")}
              </PrimaryButton>
            </div>
          </div>
        </div>
      )}

      {/* Photo proof modal (before confirming reception) */}
      {proofOpen && (
        <div className="fixed inset-0 z-[270] flex items-center justify-center" dir={isArabic ? "rtl" : "ltr"} role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label={t("common.close")}
            onClick={() => {
              if (!submitting) setProofOpen(false);
            }}
          />
          <div className="relative w-[min(520px,92vw)] rounded-2xl border border-[#E7E5E4] bg-white p-4 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]">
            <div className="flex items-center justify-between gap-3">
              <div className="text-[15px] font-extrabold text-[#1C1917] dark:text-white">📷 إثبات الاستلام</div>
              <button
                type="button"
                onClick={() => setProofOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900 dark:border-[#30363D] dark:bg-[#0D1117]/60 dark:text-slate-100"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            {proofStage === "capture" ? (
              <div className="mt-3 space-y-3">
                <div className="relative overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-[#30363D] dark:bg-black/20">
                  <video
                    ref={videoRef}
                    className={`h-[260px] w-full object-cover ${cameraLive ? "block" : "sr-only"}`}
                    playsInline
                    muted
                    autoPlay
                  />
                  {!cameraLive ? (
                    <div className="flex h-[260px] w-full flex-col items-center justify-center gap-2 bg-[#1a1a1a] px-6 text-center text-white">
                      <span className="text-4xl" aria-hidden>
                        📷
                      </span>
                      <p className="text-[13px] font-semibold leading-relaxed text-white/90">
                        {langKey === "ar"
                          ? "اضغط «التقاط الصورة» أدناه"
                          : langKey === "fr"
                            ? "Appuyez sur « Prendre la photo » pour ouvrir l'appareil photo"
                            : "Tap « Take photo » to open the camera"}
                      </p>
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-col gap-2">
                  <PrimaryButton
                    type="button"
                    className="w-full bg-[#1a3a6e] hover:bg-[#163056] active:bg-[#12284b]"
                    onClick={captureProofFromVideo}
                    disabled={submitting}
                  >
                    التقاط الصورة
                  </PrimaryButton>

                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 text-center text-[13px] font-bold text-[#1e3a5f] shadow-sm transition hover:bg-averda/10 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
                    onClick={pickProofFromGallery}
                    disabled={submitting}
                  >
                    اختيار صورة (بديل)
                  </button>
                </div>

                {proofError && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] font-semibold text-amber-900 dark:border-amber-900/40 dark:bg-amber-500/10 dark:text-amber-200">
                    {proofError}
                  </div>
                )}
              </div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="overflow-hidden rounded-2xl border border-black/10 bg-black/5 dark:border-[#30363D] dark:bg-black/20">
                  {proofDataUrl ? <img src={proofDataUrl} alt="preview" className="h-[260px] w-full object-contain bg-white" /> : null}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setProofStage("capture");
                      setProofDataUrl(null);
                      setProofError(null);
                      stopProofStream();
                      setCameraLive(false);
                      void startLiveCamera();
                    }}
                    className="rounded-2xl border border-[#E7E5E4] bg-white px-4 py-3 text-[13px] font-bold text-[#1e3a5f] transition hover:bg-averda/10 active:scale-[0.99] dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
                    disabled={submitting}
                  >
                    إعادة التقاط
                  </button>
                  <PrimaryButton
                    type="button"
                    className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800"
                    onClick={() => void confirmSelectedReception(proofDataUrl ?? undefined)}
                    disabled={submitting || !proofDataUrl}
                  >
                    تأكيد
                  </PrimaryButton>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Replacement bottom sheet */}
      {replacementOpen && replacementItemCode && (
        <div className="fixed inset-0 z-[250] flex flex-col justify-end" dir={isArabic ? "rtl" : "ltr"} role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("common.close")}
            onClick={() => {
              if (!isReplacementSubmitting) setReplacementOpen(false);
            }}
          />
          <div className="relative w-full rounded-t-3xl border border-[#E7E5E4] bg-white px-5 pb-[calc(env(safe-area-inset-bottom)+16px)] pt-5 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]">
            {replacementSent ? (
              <div
                className="flex flex-col items-center gap-4 px-5 py-8 text-center"
                style={{ textAlign: "center" }}
              >
                <span className="text-[56px]" aria-hidden>✅</span>
                <h3 className="m-0 text-[18px] font-extrabold text-emerald-800 dark:text-emerald-200">
                  {langKey === "ar" ? "تم إرسال طلبك بنجاح!" : t("employee.epi.replacement.sentTitle")}
                </h3>
                <p className="m-0 text-[14px] font-semibold leading-6 text-[#6b7280] dark:text-stone-400">
                  {langKey === "ar"
                    ? "سيتم مراجعة طلبك من قبل المسؤول وستصلك إشعار عند الموافقة"
                    : t("employee.epi.replacement.sentHint")}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setReplacementSent(false);
                    setReplacementOpen(false);
                  }}
                  className="mt-2 rounded-[10px] border-0 bg-[#1e3a5f] px-8 py-3 text-[15px] font-bold text-white transition active:scale-[0.97]"
                >
                  {langKey === "ar" ? "حسناً" : t("common.close")}
                </button>
              </div>
            ) : (
              <>
                <div
                  className="flex items-center gap-3 rounded-2xl px-4 py-3"
                  style={{ background: `${EPI_NAVY}12`, border: `1px solid ${EPI_NAVY}22` }}
                >
                  <span className="text-[32px]" aria-hidden>
                    {replacementItem?.emoji ?? "🦺"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-[17px] font-extrabold text-[#1C1917] dark:text-white">
                      {replacementItem ? labelForItem(replacementItem) : t("employee.epi.replacement.title")}
                    </div>
                    <div className="text-[12px] font-semibold text-[#6b7280]">{t("employee.epi.replacement.title")}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setReplacementOpen(false)}
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-black/10 bg-white/70 text-slate-900"
                    aria-label={t("common.close")}
                  >
                    <X className="h-5 w-5" aria-hidden />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  <div>
                    <div className="text-[13px] font-extrabold text-[#1C1917] dark:text-white">{t("employee.epi.replacement.reasonTitle")}</div>
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      {[
                        { key: "damaged", label: t("employee.epi.replacement.reasons.damaged"), icon: "🛠️" },
                        { key: "lost", label: t("employee.epi.replacement.reasons.lost"), icon: "❓" },
                        { key: "wrong_size", label: t("employee.epi.replacement.reasons.wrongSize"), icon: "📏" },
                        { key: "expired", label: t("employee.epi.replacement.reasons.expired"), icon: "⏳" },
                        { key: "other", label: t("employee.epi.replacement.reasons.other"), icon: "📝" },
                      ].map((r) => {
                        const active = replacementReason === r.label;
                        return (
                          <button
                            key={r.key}
                            type="button"
                            onClick={() => setReplacementReason(r.label)}
                            disabled={isReplacementSubmitting}
                            className={`flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border-2 px-2 py-3 text-center text-[13px] font-extrabold transition active:scale-[0.98] ${
                              active
                                ? "border-[#1e3a5f] bg-[#1e3a5f] text-white"
                                : "border-[#E7E5E4] bg-white text-[#1C1917] hover:border-[#1e3a5f]/40"
                            }`}
                          >
                            <span className="text-[22px]" aria-hidden>
                              {r.icon}
                            </span>
                            <span>{r.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-[13px] font-extrabold text-[#1C1917] dark:text-white">{t("employee.epi.replacement.noteTitle")}</div>
                      <span className="text-[12px] font-semibold text-[#6b7280]">{replacementNote.length}/200</span>
                    </div>
                    <textarea
                      value={replacementNote}
                      onChange={(e) => setReplacementNote(e.target.value)}
                      disabled={isReplacementSubmitting}
                      className="mt-2 min-h-[88px] w-full resize-none rounded-2xl border border-[#E7E5E4] bg-[#f9fafb] px-4 py-3 text-[15px] font-semibold text-[#1C1917] outline-none focus:ring-2 focus:ring-[#1e3a5f]/25 dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
                      placeholder={t("employee.epi.replacement.notePlaceholder")}
                    />
                  </div>

                  <PrimaryButton
                    type="button"
                    className="w-full hover:opacity-95 active:opacity-90"
                    onClick={() => void sendReplacement()}
                    disabled={isReplacementSubmitting || !replacementReason}
                    style={{
                      background: EPI_NAVY,
                      opacity: isReplacementSubmitting || !replacementReason ? 0.7 : 1,
                      cursor: isReplacementSubmitting || !replacementReason ? "not-allowed" : "pointer",
                    }}
                  >
                    {isReplacementSubmitting
                      ? langKey === "ar"
                        ? "جاري الإرسال..."
                        : t("common.saving")
                      : langKey === "ar"
                        ? `إرسال طلب تجديد 🔄`
                        : t("employee.epi.replacement.send")}
                  </PrimaryButton>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



