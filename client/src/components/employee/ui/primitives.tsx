import { type ReactNode } from "react";

function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export const BC = {
  /** Locked mobile horizontal padding */
  pageX: "px-5", // 20px
  /** Between major sections */
  sectionGap: "space-y-7", // ~28px
  /** Grid gaps between cards */
  gridGap: "gap-[14px]",
  /** Card padding */
  cardP: "p-[18px]",
  /** Focus ring */
  focusRing:
    "focus-visible:outline-none focus-visible:ring-[2.5px] focus-visible:ring-averda focus-visible:ring-offset-[3px] focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#1C1917]",
  /** Pressed state */
  pressed:
    "active:scale-[0.97] active:opacity-90 transition-all duration-200 ease-out",
};

export function PageTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <h1 className="text-[26px] font-extrabold tracking-[-0.6px] leading-[1.15] text-[#1C1917] dark:text-[#F5F5F4]">
        {children}
      </h1>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[20px] font-extrabold tracking-[-0.4px] text-[#1C1917] dark:text-[#F5F5F4]">
        {children}
      </h2>
      {right ? <div className="shrink-0">{right}</div> : null}
    </div>
  );
}

export function Card({
  children,
  className,
  tint,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
  className?: string;
  /** optional subtle tint background */
  tint?: "none" | "accent5" | "accent10";
}) {
  const tintCls =
    tint === "accent5"
      ? "bg-averda/[0.05] dark:bg-white/5"
      : tint === "accent10"
        ? "bg-averda/10 dark:bg-white/5"
        : "bg-white dark:bg-[#292524]";

  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border border-[#E7E5E4] dark:border-[#44403C]",
        BC.cardP,
        tintCls,
        "md:shadow-[0_4px_16px_rgba(0,0,0,0.07)]",
        "md:hover:-translate-y-[3px] md:hover:shadow-[0_8px_24px_rgba(0,0,0,0.10)] md:transition md:duration-180 md:ease-out",
        className
      )}
    >
      {children}
    </div>
  );
}

export function Pill({
  children,
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  children: ReactNode;
  tone?: "neutral" | "accent" | "success" | "warning";
  className?: string;
}) {
  const toneCls =
    tone === "accent"
      ? "bg-averda/10 text-averda dark:bg-white/10 dark:text-white"
      : tone === "success"
        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-600/20 dark:text-emerald-200"
        : tone === "warning"
          ? "bg-amber-100 text-amber-900 dark:bg-amber-500/15 dark:text-amber-200"
          : "bg-[#F5F5F4] text-[#1C1917] dark:bg-white/5 dark:text-[#F5F5F4]";

  return (
    <span
      {...props}
      className={cn(
        "inline-flex h-[34px] items-center rounded-[10px] px-[14px] text-[13px] font-semibold",
        toneCls,
        className
      )}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-[54px] w-full items-center justify-center rounded-[14px] bg-averda px-5 text-[16px] font-bold text-white",
        "hover:bg-averda-dark disabled:opacity-50",
        BC.pressed,
        BC.focusRing,
        className
      )}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex h-[54px] w-full items-center justify-center rounded-[14px] border border-[#E7E5E4] bg-white px-5 text-[16px] font-bold text-[#1C1917] dark:border-[#44403C] dark:bg-[#292524] dark:text-[#F5F5F4]",
        "hover:bg-averda/10 dark:hover:bg-averda/20",
        BC.pressed,
        BC.focusRing,
        className
      )}
    >
      {children}
    </button>
  );
}

