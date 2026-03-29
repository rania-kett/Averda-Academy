import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Props = {
  /** Route to navigate to (preferred over browser back) */
  to?: string;
  label: string;
  className?: string;
};

/**
 * Subtle text back control; arrow mirrors in RTL (points “back” in reading direction).
 */
export function BackNavButton({ to, label, className = "" }: Props) {
  const navigate = useNavigate();
  return (
    <button
      type="button"
      onClick={() => (to ? navigate(to) : navigate(-1))}
      className={`mb-4 inline-flex items-center gap-2 text-sm text-[#57534E] transition hover:text-[#1C1917] dark:text-stone-400 dark:hover:text-[#F5F5F4] ${className}`}
    >
      <ArrowLeft className="h-4 w-4 shrink-0 rtl:rotate-180" aria-hidden />
      {label}
    </button>
  );
}
