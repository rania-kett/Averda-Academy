import { motion } from "framer-motion";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const NAVY = "#0d1b2e";
const CYAN = "#00AADC";

/**
 * Shown at `/` before employee login — auto-continues after 2s.
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
    <div
      className="flex min-h-screen flex-col items-center justify-center px-6"
      style={{ background: NAVY }}
    >
      <motion.div
        className="flex flex-col items-center text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      >
        <div className="relative flex flex-col items-center">
          <div
            className="relative grid place-items-center px-8 py-6"
            style={{
              background: "radial-gradient(circle at center, rgba(0,170,220,0.08) 0%, transparent 70%)",
            }}
          >
            <img
              src="/averda_logo.png"
              alt="Averda"
              className="h-[120px] w-auto object-contain"
              height={120}
            />
          </div>
          <div
            className="mt-4 h-0.5 w-14 rounded-full opacity-80"
            style={{ background: CYAN }}
            aria-hidden
          />
        </div>

        <h1 className="mt-8 text-3xl font-bold tracking-tight" style={{ color: "#FFFFFF" }}>
          Averda Academy
        </h1>

        <p className="mt-3 max-w-sm text-[15px] font-light leading-relaxed" style={{ color: CYAN }} dir="rtl">
          منصة التدريب والسلامة المهنية
        </p>
      </motion.div>

      <div className="mt-14 flex items-center gap-2" aria-label="Loading" role="status">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="splash-dot h-2 w-2 rounded-full"
            style={{
              background: CYAN,
              animationDelay: `${i * 0.18}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes splash-dot-pulse {
          0%, 80%, 100% { opacity: 0.25; transform: scale(0.85); }
          40% { opacity: 1; transform: scale(1); }
        }
        .splash-dot {
          animation: splash-dot-pulse 1.2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
