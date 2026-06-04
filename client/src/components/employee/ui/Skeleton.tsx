import { useMemo } from "react";

export function Skeleton({
  className = "",
  rounded = "rounded-2xl",
}: {
  className?: string;
  rounded?: string;
}) {
  const cls = useMemo(
    () =>
      `bc-skeleton ${rounded} ${className}`.trim(),
    [className, rounded]
  );
  return <div className={cls} aria-hidden />;
}

export function SkeletonText({
  lines = 3,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  const arr = useMemo(() => Array.from({ length: Math.max(1, lines) }, (_, i) => i), [lines]);
  return (
    <div className={`space-y-2 ${className}`.trim()} aria-hidden>
      {arr.map((i) => (
        <div
          key={i}
          className={`h-3 ${i === 0 ? "w-3/4" : i === arr.length - 1 ? "w-1/2" : "w-full"} rounded-md bc-skeleton`}
        />
      ))}
    </div>
  );
}

