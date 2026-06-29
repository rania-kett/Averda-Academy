import { useEffect, useState, type CSSProperties } from "react";
import { Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/api";
import { COLORS } from "@/components/admin/adminThemeTokens";
import { categoryKeyFromCode } from "@/config/categories";

export type EditEmployeeTarget = {
  id: string;
  name: string;
  categoryId?: string | null;
  categoryCode?: string | null;
  isActive?: boolean;
  truckNumber?: string | null;
};

type CategoryRow = { id: string; code: string; name: { ar?: string; fr?: string; en?: string } };

type Props = {
  open: boolean;
  employee: EditEmployeeTarget | null;
  onClose: () => void;
  onSuccess: () => void;
  onError: (message: string) => void;
};

export function EditEmployeeModal({ open, employee, onClose, onSuccess, onError }: Props) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [pin, setPin] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [truckNumber, setTruckNumber] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open || !employee) return;
    setName(employee.name);
    setCategoryId(employee.categoryId ?? "");
    setPin("");
    setIsActive(employee.isActive ?? true);
    setTruckNumber(employee.truckNumber ?? "");
    setSubmitting(false);
    void adminApi.categories().then(({ data }) => {
      const rows = (data as { categories?: CategoryRow[] }).categories ?? (data as CategoryRow[]);
      setCategories(Array.isArray(rows) ? rows : []);
    });
  }, [open, employee]);

  if (!open || !employee) return null;

  const selectedCat = categories.find((c) => c.id === categoryId);
  const isDriver =
    categoryKeyFromCode(selectedCat?.code ?? employee.categoryCode) === "driver" ||
    employee.categoryCode === "driver";

  const fieldLabel: CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.text,
    marginBottom: 6,
  };
  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 12px",
    borderRadius: 8,
    border: `1.5px solid ${COLORS.border}`,
    fontSize: 14,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
    background: COLORS.btnBg,
    color: COLORS.text,
  };

  const handleSubmit = async () => {
    if (submitting || !name.trim()) return;
    setSubmitting(true);
    try {
      const payload: {
        name: string;
        categoryId?: string;
        pin?: string;
        isActive: boolean;
        truckNumber?: string | null;
      } = {
        name: name.trim(),
        isActive,
      };
      if (categoryId) payload.categoryId = categoryId;
      if (pin.trim()) payload.pin = pin.trim();
      if (isDriver) payload.truckNumber = truckNumber.trim() || null;
      await adminApi.updateEmployee(employee.id, payload);
      onSuccess();
      onClose();
    } catch (e: unknown) {
      const msg =
        e && typeof e === "object" && "response" in e
          ? String((e as { response?: { data?: { error?: string } } }).response?.data?.error ?? t("common.error"))
          : t("common.error");
      onError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
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
      onClick={submitting ? undefined : onClose}
    >
      <div
        style={{
          background: COLORS.white,
          borderRadius: 16,
          width: "100%",
          maxWidth: 480,
          overflow: "hidden",
          boxShadow: COLORS.shadowLg,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            background: COLORS.navy,
            padding: "16px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: COLORS.white }}>
            {t("admin.employees.editTitle")}
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label={t("common.close")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              color: COLORS.white,
              width: 32,
              height: 32,
              borderRadius: "50%",
              cursor: submitting ? "not-allowed" : "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: "20px 24px" }}>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>{t("admin.empForm.name")}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>{t("admin.empForm.group")}</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={inputStyle}
            >
              <option value="">{t("admin.page.employees.allRoles")}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {(c.name as Record<string, string>)?.[lang] ?? c.code}
                </option>
              ))}
            </select>
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={fieldLabel}>{t("admin.empForm.pin")}</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
              placeholder={t("admin.employees.pinPlaceholder")}
              style={inputStyle}
            />
          </div>
          <label
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              fontSize: 14,
              fontWeight: 600,
              color: COLORS.text,
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              style={{ width: 18, height: 18 }}
            />
            {t("admin.employees.activeStatus")}
          </label>
          {isDriver && (
            <div style={{ marginBottom: 16 }}>
              <label style={fieldLabel}>{t("admin.employees.truckNumber")}</label>
              <input
                type="text"
                value={truckNumber}
                onChange={(e) => setTruckNumber(e.target.value)}
                placeholder={t("admin.employees.truckNumberPlaceholder")}
                style={inputStyle}
              />
            </div>
          )}
        </div>
        <div
          style={{
            padding: "16px 24px",
            borderTop: `1px solid ${COLORS.border}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "10px 18px",
              borderRadius: 8,
              border: `1.5px solid ${COLORS.border}`,
              background: COLORS.btnBg,
              fontSize: 14,
              fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {t("common.cancel")}
          </button>
          <button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={submitting || !name.trim()}
            style={{
              padding: "10px 20px",
              borderRadius: 8,
              border: "none",
              background: submitting ? COLORS.gray : COLORS.navy,
              color: COLORS.white,
              fontSize: 14,
              fontWeight: 700,
              cursor: submitting || !name.trim() ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
            {submitting ? t("common.saving") : t("common.save")}
          </button>
        </div>
      </div>
    </div>
  );
}
