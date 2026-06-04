import { Link } from "react-router-dom";

export function EmptyState({
  title,
  description,
  ctaLabel,
  ctaTo,
}: {
  title: string;
  description?: string;
  ctaLabel?: string;
  ctaTo?: string;
}) {
  return (
    <div className="rounded-2xl border border-[#E7E5E4] bg-white p-6 text-center shadow-sm dark:border-[#44403C] dark:bg-[#292524]">
      <div className="text-lg font-extrabold text-[#1C1917] dark:text-[#F5F5F4]">{title}</div>
      {description && (
        <p className="mt-1 text-sm text-[#57534E] dark:text-stone-400">{description}</p>
      )}
      {ctaLabel && ctaTo && (
        <div className="mt-4">
          <Link
            to={ctaTo}
            className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-averda px-5 text-sm font-semibold text-white transition active:scale-[0.97] hover:bg-averda-dark"
          >
            {ctaLabel}
          </Link>
        </div>
      )}
    </div>
  );
}

