import type { ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { COLORS } from "@/components/admin/adminThemeTokens";

type Props = {
  open: boolean;
  title: string;
  message: ReactNode;
  cancelLabel: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export function ConfirmDeleteModal({
  open,
  title,
  message,
  cancelLabel,
  confirmLabel,
  onCancel,
  onConfirm,
  loading = false,
}: Props) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        zIndex: 1100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
      onClick={loading ? undefined : onCancel}
    >
      <div
        style={{
          background: COLORS.white,
          borderRadius: 16,
          width: "100%",
          maxWidth: 440,
          padding: "24px",
          boxShadow: COLORS.shadowLg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: "0 0 12px", fontSize: 18, fontWeight: 800, color: COLORS.text }}>{title}</h2>
        <div style={{ fontSize: 14, color: COLORS.textMuted, lineHeight: 1.55, marginBottom: 24 }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: `1.5px solid ${COLORS.border}`,
              background: COLORS.btnBg,
              color: COLORS.text,
              fontSize: 14,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.6 : 1,
            }}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: "none",
              background: COLORS.red,
              color: COLORS.white,
              fontSize: 14,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {loading && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
