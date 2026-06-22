import { LanguageSwitcherCompact } from "@/components/LanguageSwitcherCompact";
import { ThemeToggle } from "@/components/ThemeToggle";

/** Language + theme controls for admin sidebar footer (compact dropdown avoids clipping). */
export function AdminShellControls({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`} dir="ltr">
      <LanguageSwitcherCompact tone="onDark" />
      <ThemeToggle tone="onDark" />
    </div>
  );
}
