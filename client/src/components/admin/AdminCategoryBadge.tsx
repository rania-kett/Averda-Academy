import { getCategoryDefByCode } from "@/config/categories";

export function AdminCategoryBadge({
  code,
  lang,
  className = "",
}: {
  code?: string | null;
  lang: "ar" | "fr" | "en";
  className?: string;
}) {
  const meta = getCategoryDefByCode(code || "");
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <span
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-extrabold",
        className,
      ].join(" ")}
      style={{ backgroundColor: meta.bgColor, color: meta.color }}
      title={meta.label[lang]}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden strokeWidth={2.6} />
      <span className="truncate">{meta.label[lang]}</span>
    </span>
  );
}

