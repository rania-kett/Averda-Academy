import type { ReactNode } from "react";

/** Shared course card list layout — identical on Home and Courses (تدريبي). */
export const courseCardCellClassName =
  "relative h-full w-full min-w-[280px] shrink-0 md:min-w-0";

type Props = {
  children: ReactNode;
  lastReadTick?: number;
  className?: string;
};

export function CourseCardGrid({ children, lastReadTick, className = "" }: Props) {
  return (
    <div
      className={[
        "-mx-4 flex items-stretch gap-4 overflow-x-auto px-4 pb-2",
        "md:mx-0 md:grid md:grid-cols-3 md:gap-4 md:overflow-visible md:px-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ alignItems: "stretch", gap: "16px" }}
      data-lastread={lastReadTick}
    >
      {children}
    </div>
  );
}
