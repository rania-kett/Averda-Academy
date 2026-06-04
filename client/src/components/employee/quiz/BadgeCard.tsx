import { motion } from "framer-motion";

export function BadgeCard({ title }: { title: string }) {
  return (
    <motion.div
      initial={{ scale: 0.96, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm dark:border-emerald-800/60 dark:bg-emerald-900/20 dark:text-emerald-100"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-600 text-[22px] text-white" aria-hidden>
          🏅
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-extrabold">{title}</div>
          <div className="mt-1 text-[12px] font-semibold opacity-90">Certificate / badge</div>
        </div>
      </div>
    </motion.div>
  );
}

