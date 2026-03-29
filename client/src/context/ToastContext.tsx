import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";

type Toast = { id: number; message: string; type: "success" | "error" | "info" };

const ToastCtx = createContext<(msg: string, type?: Toast["type"]) => void>(
  () => {}
);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [list, setList] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Date.now();
    setList((l) => [...l, { id, message, type }]);
    setTimeout(() => {
      setList((l) => l.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 end-4 z-[200] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {list.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`pointer-events-auto rounded-lg px-4 py-3 shadow-lg text-sm max-w-sm ${
                t.type === "error"
                  ? "bg-red-900 text-white border border-red-700"
                  : t.type === "success"
                    ? "bg-emerald-900 text-white border border-emerald-700"
                    : "border border-slate-200 bg-white text-slate-900 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
              }`}
            >
              {t.message}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast(): (msg: string, type?: Toast["type"]) => void {
  return useContext(ToastCtx);
}
