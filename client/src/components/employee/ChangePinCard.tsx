import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { userApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import { Card, PrimaryButton } from "@/components/employee/ui/primitives";
import { PinDots, PinKeypad } from "@/components/employee/ui/PinKeypad";

type PinField = "current" | "new" | "confirm";

export function ChangePinCard() {
  const { t } = useTranslation();
  const toast = useToast();
  const [activeField, setActiveField] = useState<PinField>("current");
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeValue =
    activeField === "current" ? currentPin : activeField === "new" ? newPin : confirmPin;

  const setActiveValue = (v: string) => {
    setError(null);
    if (activeField === "current") {
      setCurrentPin(v);
      if (v.length === 4) setActiveField("new");
      return;
    }
    if (activeField === "new") {
      setNewPin(v);
      if (v.length === 4) setActiveField("confirm");
      return;
    }
    setConfirmPin(v);
  };

  const canSubmit =
    currentPin.length === 4 && newPin.length === 4 && confirmPin.length === 4 && !submitting;

  const fieldError = useMemo(() => {
    if (error) return error;
    if (confirmPin.length === 4 && newPin !== confirmPin) {
      return t("employee.profile.pinMismatch");
    }
    return null;
  }, [confirmPin, newPin, error, t]);

  const resetForm = () => {
    setCurrentPin("");
    setNewPin("");
    setConfirmPin("");
    setActiveField("current");
    setError(null);
  };

  const submit = async () => {
    if (!canSubmit) return;
    if (newPin !== confirmPin) {
      setError(t("employee.profile.pinMismatch"));
      setActiveField("confirm");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await userApi.changePin({ currentPin, newPin });
      resetForm();
      toast(t("employee.profile.pinChanged"), "success");
    } catch (e: unknown) {
      let msg = t("employee.profile.pinChangeFailed");
      if (isAxiosError(e) && e.response?.data?.error) {
        const serverMsg = String(e.response.data.error);
        if (serverMsg.includes("Invalid current PIN")) msg = t("employee.profile.pinInvalid");
        else if (serverMsg.includes("different")) msg = t("employee.profile.pinSame");
        else msg = serverMsg;
      }
      setError(msg);
      if (isAxiosError(e) && e.response?.status === 401) {
        setCurrentPin("");
        setActiveField("current");
      }
      toast(msg, "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <div className="flex items-start gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-[#F0F2F5] text-[22px] dark:bg-white/10"
          aria-hidden
        >
          🔐
        </div>
        <div className="min-w-0">
          <div className="text-[16px] font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">
            {t("employee.profile.changePinTitle")}
          </div>
          <div className="mt-1 text-[13px] font-semibold text-[#57534E] dark:text-stone-400">
            {t("employee.profile.changePinSubtitle")}
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <PinDots
          label={t("employee.profile.currentPin")}
          value={currentPin}
          active={activeField === "current"}
          onFocus={() => setActiveField("current")}
        />
        <PinDots
          label={t("employee.profile.newPin")}
          value={newPin}
          active={activeField === "new"}
          onFocus={() => setActiveField("new")}
        />
        <PinDots
          label={t("employee.profile.confirmPin")}
          value={confirmPin}
          active={activeField === "confirm"}
          onFocus={() => setActiveField("confirm")}
        />

        {fieldError ? (
          <p className="text-center text-sm font-semibold text-red-500 dark:text-red-400" role="alert">
            {fieldError}
          </p>
        ) : null}

        <PinKeypad value={activeValue} onChange={setActiveValue} />

        <PrimaryButton
          type="button"
          disabled={!canSubmit || Boolean(fieldError && confirmPin.length === 4)}
          onClick={() => void submit()}
          className="w-full bg-[#1a3a6e] hover:bg-[#163056] active:bg-[#12284b]"
        >
          {submitting ? t("common.loading") : t("employee.profile.savePin")}
        </PrimaryButton>
      </div>
    </Card>
  );
}
