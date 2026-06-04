import { Volume2 } from "lucide-react";

export function SoundButton({
  onClick,
  disabled,
  ariaLabel,
  title,
  className,
}: {
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel: string;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      title={title ?? ariaLabel}
      className={[
        "inline-flex items-center justify-center rounded-full bg-white transition active:scale-[0.97] disabled:opacity-40",
        className ?? "",
      ].join(" ")}
      style={{
        width: 38,
        height: 38,
        border: "1.5px solid #CBD5E1",
      }}
    >
      <Volume2 className="h-[18px] w-[18px]" aria-hidden color="#64748B" strokeWidth={2.2} />
    </button>
  );
}

