import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { adminApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import { Plus, X } from "lucide-react";
import { adminMuted, adminTableWrap } from "@/components/admin/adminClasses";

const btnSecondary =
  "rounded-lg border border-[#E2E8F0] bg-white px-4 py-2 text-sm font-medium text-[#0F172A] shadow-sm hover:bg-slate-50 dark:border-transparent dark:bg-white/10 dark:text-white dark:shadow-none dark:hover:bg-white/15";

const schema = z.object({
  employeeId: z.string().min(3),
  name: z.string().min(2),
  pin: z.string().length(4),
  group: z.enum(["DRIVER", "WORKER"]),
  language: z.enum(["AR", "FR", "EN"]).optional(),
});

type EmpRow = {
  id: string;
  employeeId: string;
  name: string;
  group: string;
  avatarColor: string;
  coursesDone: number;
  coursesTotal: number;
  avgScore: number;
  lastActiveAt: string;
  status: string;
};

export function EmployeesPage() {
  const { t } = useTranslation();
  const toast = useToast();
  const [rows, setRows] = useState<EmpRow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [group, setGroup] = useState("ALL");
  const [status, setStatus] = useState("all");
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState(false);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: { employeeId: "", name: "", pin: "1234", group: "DRIVER" as const, language: "AR" as const },
  });

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.employees({
        page: String(page),
        search,
        group,
        status,
      });
      setRows((data as { employees: EmpRow[] }).employees);
      setTotal((data as { pagination: { total: number } }).pagination.total);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [page, group, status]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    void load();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">{t("admin.employees.title")}</h1>
        <button
          type="button"
          onClick={() => setPanel(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-accent-indigo px-4 py-3 font-semibold text-white transition hover:opacity-90 active:scale-[0.97]"
        >
          <Plus className="h-5 w-5" /> {t("admin.employees.add")}
        </button>
      </div>

      <form onSubmit={onSearch} className="flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("common.search")}
          className="rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg"
        />
        <select
          value={group}
          onChange={(e) => setGroup(e.target.value)}
          className="rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg"
        >
          <option value="ALL">{t("common.all")}</option>
          <option value="DRIVER">{t("admin.employees.driver")}</option>
          <option value="WORKER">{t("admin.employees.worker")}</option>
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg"
        >
          <option value="all">{t("common.all")}</option>
          <option value="completed">{t("status.completed")}</option>
          <option value="incomplete">{t("status.in_progress")}</option>
        </select>
        <button type="submit" className={btnSecondary}>
          {t("common.search")}
        </button>
      </form>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-200 dark:bg-[#161B22]" />
          ))}
        </div>
      ) : !rows.length ? (
        <div className={`rounded-xl border border-dashed border-[#E2E8F0] p-12 text-center dark:border-[#30363D] ${adminMuted}`}>
          {t("admin.employees.empty")}
        </div>
      ) : (
        <div className={adminTableWrap}>
          <table className="w-full min-w-[800px] text-sm text-[#0F172A] dark:text-slate-100">
            <thead className="border-b border-[#E2E8F0] text-start text-slate-600 dark:border-[#30363D] dark:text-slate-400">
              <tr>
                <th className="p-3">{t("admin.employees.colName")}</th>
                <th className="p-3">{t("admin.employees.colId")}</th>
                <th className="p-3">{t("admin.employees.colGroup")}</th>
                <th className="p-3">{t("admin.employees.colProgress")}</th>
                <th className="p-3">{t("admin.employees.colAvg")}</th>
                <th className="p-3">{t("admin.employees.colLast")}</th>
                <th className="p-3">{t("admin.employees.colStatus")}</th>
                <th className="p-3">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <motion.tr
                  key={r.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="border-b border-[#E2E8F0]/80 hover:bg-slate-50 dark:border-[#30363D]/50 dark:hover:bg-white/5"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="h-9 w-9 rounded-full text-center text-sm leading-9 text-white"
                        style={{ backgroundColor: r.avatarColor }}
                      >
                        {r.name.slice(0, 2)}
                      </div>
                      {r.name}
                    </div>
                  </td>
                  <td className="p-3 font-mono">{r.employeeId}</td>
                  <td className="p-3">{t(`group.${r.group}` as "group.DRIVER")}</td>
                  <td className="p-3 tabular-nums">
                    {r.coursesDone}/{r.coursesTotal}
                  </td>
                  <td className="p-3 tabular-nums">{r.avgScore}%</td>
                  <td className="p-3 text-xs text-admin-muted">
                    {new Date(r.lastActiveAt).toLocaleDateString()}
                  </td>
                  <td className="p-3">
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-[#0F172A] dark:bg-white/10 dark:text-white">
                      {t(`status.${r.status}` as "status.completed" | "status.in_progress" | "status.not_started")}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      to={`/admin/employees/${r.id}`}
                      className="text-accent-indigo hover:underline"
                    >
                      {t("common.view")}
                    </Link>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex justify-center gap-2">
        <button
          type="button"
          disabled={page <= 1}
          onClick={() => setPage((p) => p - 1)}
          className={`${btnSecondary} disabled:opacity-30`}
        >
          {t("common.back")}
        </button>
        <span className={`px-4 py-2 ${adminMuted}`}>
          {page} / {Math.max(1, Math.ceil(total / 20))}
        </span>
        <button
          type="button"
          disabled={page >= Math.ceil(total / 20)}
          onClick={() => setPage((p) => p + 1)}
          className={`${btnSecondary} disabled:opacity-30`}
        >
          {t("common.next")}
        </button>
      </div>

      <AnimatePresence>
        {panel && (
          <motion.div
            className="fixed inset-0 z-[100] flex justify-end bg-black/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPanel(false)}
          >
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              onClick={(e) => e.stopPropagation()}
              className="h-full w-full max-w-md overflow-y-auto border-s border-[#E2E8F0] bg-white p-6 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold">{t("admin.empForm.title")}</h2>
                <button type="button" onClick={() => setPanel(false)} aria-label={t("common.close")}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <form
                className="space-y-4"
                onSubmit={form.handleSubmit(async (vals) => {
                  try {
                    await adminApi.addEmployee(vals);
                    toast(t("common.added"), "success");
                    setPanel(false);
                    void load();
                  } catch {
                    toast(t("common.error"), "error");
                  }
                })}
              >
                <div>
                  <label className="text-sm text-admin-muted">{t("admin.empForm.employeeId")}</label>
                  <input
                    {...form.register("employeeId")}
                    className="mt-1 w-full rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg"
                  />
                  {form.formState.errors.employeeId && (
                    <p className="text-xs text-red-400">{form.formState.errors.employeeId.message}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm text-admin-muted">{t("admin.empForm.name")}</label>
                  <input
                    {...form.register("name")}
                    className="mt-1 w-full rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg"
                  />
                </div>
                <div>
                  <label className="text-sm text-admin-muted">{t("admin.empForm.pin")}</label>
                  <input
                    {...form.register("pin")}
                    className="mt-1 w-full rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg"
                  />
                </div>
                <div>
                  <label className="text-sm text-admin-muted">{t("admin.empForm.group")}</label>
                  <select {...form.register("group")} className="mt-1 w-full rounded-lg border border-admin-border bg-admin-input px-3 py-2 text-admin-fg">
                    <option value="DRIVER">{t("group.DRIVER")}</option>
                    <option value="WORKER">{t("group.WORKER")}</option>
                  </select>
                </div>
                <button
                  type="submit"
                  className="w-full rounded-lg bg-accent-indigo py-3 font-semibold text-white"
                >
                  {t("common.save")}
                </button>
              </form>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
