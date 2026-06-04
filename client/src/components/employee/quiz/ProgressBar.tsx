import { motion } from "framer-motion";

export function ProgressBar({ valuePct }: { valuePct: number }) {
  const pct = Number.isFinite(valuePct) ? Math.max(0, Math.min(100, valuePct)) : 0;
  return (
    <div className="h-2 overflow-hidden rounded bg-gray-200 dark:bg-[#44403C]">
      <motion.div
        className="h-2 rounded bg-[#1e3a5f]"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
}

