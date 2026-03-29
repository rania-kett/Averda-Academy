import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Truck } from "lucide-react";

/**
 * Shown at `/` before employee login — auto-continues after 2s for a polished first open.
 */
export function SplashPage() {
  const nav = useNavigate();

  useEffect(() => {
    const t = window.setTimeout(() => {
      nav("/login", { replace: true });
    }, 2000);
    return () => window.clearTimeout(t);
  }, [nav]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0f172a] px-6 text-white">
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="flex items-center gap-3">
          <Truck className="h-14 w-14 text-[#6366F1]" strokeWidth={2} aria-hidden />
          <span className="text-3xl font-bold tracking-tight">FleetLearn</span>
        </div>
        <div className="max-w-md space-y-1 text-center text-sm leading-relaxed text-slate-300">
          <p className="font-medium text-white" dir="rtl">
            منصة التدريب
          </p>
          <p className="text-slate-400">Plateforme de Formation</p>
          <p className="text-slate-400">Training Platform</p>
        </div>
      </div>

      <div className="relative h-1.5 w-56 max-w-full overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="absolute inset-y-0 start-0 w-full origin-left rounded-full bg-[#6366F1]"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  );
}
