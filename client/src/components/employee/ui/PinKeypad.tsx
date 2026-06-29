import { Delete } from "lucide-react";
import { useTranslation } from "react-i18next";

type Props = {
  value: string;
  maxLength?: number;
  label: string;
  active?: boolean;
  onFocus?: () => void;
};

export function PinDots({ value, maxLength = 4, label, active = false, onFocus }: Props) {
  return (
    <button
      type="button"
      onClick={onFocus}
      className="w-full text-start"
    >
      <div
        className={`text-[13px] font-semibold ${
          active ? "text-[#1C1917] dark:text-[#F5F5F4]" : "text-[#57534E] dark:text-stone-400"
        }`}
      >
        {label}
      </div>
      <div
        className={`mt-2 flex h-[52px] items-center justify-center gap-4 rounded-[14px] border bg-white px-4 text-2xl dark:bg-[#292524] ${
          active
            ? "border-averda/40 ring-2 ring-averda/15"
            : "border-[#E7E5E4] dark:border-[#44403C]"
        }`}
        dir="ltr"
      >
        {Array.from({ length: maxLength }).map((_, i) => (
          <span key={i} className="text-[26px] leading-none text-[#111827] dark:text-white">
            {value[i] ? "●" : " "}
          </span>
        ))}
      </div>
    </button>
  );
}

type KeypadProps = {
  value: string;
  onChange: (next: string) => void;
  maxLength?: number;
};

export function PinKeypad({ value, onChange, maxLength = 4 }: KeypadProps) {
  const { t } = useTranslation();

  const append = (digit: string) => {
    if (value.length >= maxLength) return;
    onChange(value + digit);
  };

  const backspace = () => onChange(value.slice(0, -1));

  return (
    <div className="grid grid-cols-3 gap-2" dir="ltr">
      {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((k) =>
        k === "" ? (
          <span key="spacer" />
        ) : (
          <button
            key={k}
            type="button"
            onClick={() => (k === "⌫" ? backspace() : append(k))}
            className="flex h-12 items-center justify-center rounded-2xl bg-[#F0F2F5] text-[18px] font-extrabold text-slate-900 transition-all duration-150 hover:bg-[#E7EBF0] active:scale-[0.98] dark:bg-[#3a4157] dark:text-white dark:hover:bg-[#444c64]"
            aria-label={k === "⌫" ? t("login.backspace") : k}
          >
            {k === "⌫" ? <Delete className="h-5 w-5" aria-hidden /> : k}
          </button>
        )
      )}
    </div>
  );
}
