import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { Pencil } from "lucide-react";
import { adminApi } from "@/api/api";
import { useToast } from "@/context/ToastContext";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { EditEmployeeModal, type EditEmployeeTarget } from "@/components/admin/EditEmployeeModal";
import { RoleAvatar, roleAvatarKindFromCategoryCode } from "@/components/employee/ui/RoleAvatar";
import { adminCardPadded, adminMuted, adminTableWrap } from "@/components/admin/adminClasses";
import { AdminCategoryBadge } from "@/components/admin/AdminCategoryBadge";

type Emp = {
  id?: string;
  name: string;
  employeeId: string;
  category?: { id: string; code: string; name: { fr?: string; en?: string; ar?: string } } | null;
  categoryId?: string | null;
  truckNumber?: string | null;
  isActive?: boolean;
  language: string;
  avatarColor: string;
  createdAt: string;
  progress: { course: { title: unknown; id: string }; completionPct: number; isCompleted: boolean }[];
  attempts: {
    score: number;
    passed: boolean;
    timeSpent: number;
    attemptedAt: string;
    quiz: { course: { id: string; title: unknown } };
  }[];
  lessonQuizAttempts?: {
    percentage: number;
    score: number;
    total: number;
    attemptNumber: number;
    takenAt: string;
    course: { id: string; slug: string; title: unknown };
  }[];
  badges: { badge: { icon: string; title: unknown } }[];
};

type AdminCourse = {
  id: string;
  categories: { id: string; code: string; name: { fr?: string; en?: string; ar?: string } }[];
  quiz: { id: string } | null;
};

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [emp, setEmp] = useState<Emp | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EditEmployeeTarget | null>(null);
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const reloadEmployee = async () => {
    if (!id) return;
    const { data } = await adminApi.employee(id);
    setEmp((data as { employee: Emp }).employee);
  };

  const attemptRows = useMemo(() => {
    if (!emp) return [];
    const rows: {
      courseTitle: unknown;
      at: string;
      pct: number;
      passed: boolean;
    }[] = [];
    for (const a of emp.attempts ?? []) {
      rows.push({
        courseTitle: a.quiz?.course?.title,
        at: a.attemptedAt,
        pct: a.score,
        passed: Boolean(a.passed),
      });
    }
    for (const a of emp.lessonQuizAttempts ?? []) {
      rows.push({
        courseTitle: a.course?.title,
        at: a.takenAt,
        pct: a.percentage,
        passed: a.percentage >= 70,
      });
    }
    return rows.sort((aa, bb) => new Date(bb.at).getTime() - new Date(aa.at).getTime());
  }, [emp]);

  useEffect(() => {
    if (!id) return;
    void (async () => {
      try {
        const [er, cr] = await Promise.all([
          adminApi.employee(id),
          adminApi.courses(),
        ]);
        setEmp((er.data as { employee: Emp }).employee);
        setCourses((cr.data as { courses: AdminCourse[] }).courses);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const certificateEligible = useMemo(() => {
    if (!emp || !courses.length) return false;
    if (!emp.category?.id) return false;
    const visible = courses.filter((c) => c.categories.some((k) => k.id === emp.category!.id));
    if (!visible.length) return false;
    for (const c of visible) {
      if (!c.quiz) return false;
      const pass = emp.attempts.some(
        (a) => a.passed && a.quiz?.course?.id === c.id
      );
      if (!pass) return false;
    }
    return true;
  }, [emp, courses]);

  const downloadCert = async () => {
    if (!emp || !certificateEligible || !id) return;
    try {
      const { data } = await adminApi.certificate(id);
      const fileName = `certificate-${emp.name.replace(/[\\/:*?"<>|]/g, "-").trim()}-averda.pdf`;
      const url = URL.createObjectURL(data as Blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast(t("common.saved"), "success");
    } catch {
      toast(t("common.error"), "error");
    }
  };

  const reset = async () => {
    if (!id || !confirm(t("admin.employees.resetConfirm"))) return;
    try {
      await adminApi.resetProgress(id);
      toast(t("common.saved"), "success");
      const { data } = await adminApi.employee(id);
      setEmp((data as { employee: Emp }).employee);
    } catch {
      toast(t("common.error"), "error");
    }
  };

  const removeEmployee = async () => {
    if (!id || deleteLoading) return;
    setDeleteLoading(true);
    try {
      await adminApi.deleteEmployee(id);
      toast(t("admin.epiManage.employeeDeleted"), "success");
      navigate("/admin");
    } catch (e: unknown) {
      const msg =
        isAxiosError(e) && e.response?.data?.error
          ? String(e.response.data.error)
          : t("admin.epiManage.employeeDeleteFailed");
      toast(msg, "error");
    } finally {
      setDeleteLoading(false);
      setDeleteOpen(false);
    }
  };

  if (loading || !emp) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-[#161B22]" />;
  }

  const e = emp;
  const isDriver = e.category?.code === "driver";

  return (
    <div className="space-y-8">
      <AdminBackButton to="/admin/employees" label={t("nav.backEmployees")} />
      <div className="flex flex-wrap items-start gap-6">
        <RoleAvatar
          categoryCode={(e.category as any)?.code ?? null}
          kind={roleAvatarKindFromCategoryCode((e.category as any)?.code, e.employeeId)}
          className="h-20 w-20"
          title={e.name}
          employeeId={e.employeeId}
        />
        <div>
          <h1 className="text-2xl font-bold">{e.name}</h1>
          <p className={adminMuted}>
            {e.employeeId} ·{" "}
            <span className="inline-flex align-middle">
              <AdminCategoryBadge code={(e.category as any)?.code ?? null} lang={lang as "ar" | "fr" | "en"} />
            </span>{" "}
            · {t("admin.employees.joinDate")}:{" "}
            {new Date(e.createdAt).toLocaleDateString()}
          </p>
          <p className={`text-sm ${adminMuted}`}>
            {t("admin.employees.langPref")}: {t(`langNames.${e.language}`, { defaultValue: e.language })}
          </p>
          {isDriver && (
            <p className={`text-sm ${adminMuted}`}>
              {t("admin.employees.truckNumber")}:{" "}
              <span className="font-semibold text-[#0F172A] dark:text-slate-100">
                {e.truckNumber?.trim() || t("admin.employees.truckNotAssigned")}
              </span>
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            setEditingEmployee({
              id: id!,
              name: e.name,
              categoryId: e.categoryId ?? e.category?.id,
              categoryCode: e.category?.code ?? null,
              isActive: e.isActive,
              truckNumber: e.truckNumber,
            })
          }
          className="inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] px-4 py-3 font-semibold dark:border-[#30363D]"
        >
          <Pencil size={16} />
          {t("admin.employees.edit")}
        </button>
        <button
          type="button"
          disabled={!certificateEligible}
          title={!certificateEligible ? t("admin.employees.certTooltip") : undefined}
          onClick={() => void downloadCert()}
          className="rounded-lg bg-accent-emerald px-4 py-3 font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-40"
        >
          {t("admin.employees.downloadCert")}
        </button>
        <button
          type="button"
          onClick={() => void reset()}
          className="rounded-lg border border-red-500/50 px-4 py-3 text-red-400"
        >
          {t("admin.employees.reset")}
        </button>
        <button
          type="button"
          onClick={() => setDeleteOpen(true)}
          className="rounded-lg border border-red-600 bg-red-600/10 px-4 py-3 font-semibold text-red-500 transition hover:bg-red-600/20"
        >
          {t("admin.employees.delete")}
        </button>
      </div>

      <EditEmployeeModal
        open={editingEmployee != null}
        employee={editingEmployee}
        onClose={() => setEditingEmployee(null)}
        onSuccess={() => {
          void reloadEmployee();
          toast(t("admin.employees.updated"), "success");
        }}
        onError={(msg) => toast(msg, "error")}
      />

      <ConfirmDeleteModal
        open={deleteOpen}
        title={t("admin.employees.deleteModalTitle")}
        message={t("admin.employees.deleteModalMessage", { name: e.name })}
        cancelLabel={t("common.cancel")}
        confirmLabel={t("admin.employees.deleteConfirmBtn")}
        loading={deleteLoading}
        onCancel={() => {
          if (!deleteLoading) setDeleteOpen(false);
        }}
        onConfirm={() => void removeEmployee()}
      />

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("admin.employees.progressSec")}</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {e.progress.map((p) => (
            <motion.div
              key={p.course.id}
              className={adminCardPadded}
            >
              <p className="font-medium text-[#0F172A] dark:text-slate-100">
                {(p.course.title as Record<string, string>)[lang] ||
                  (p.course.title as Record<string, string>).en}
              </p>
              <div className="mt-2 h-2 rounded-full bg-slate-200 dark:bg-stone-700">
                <div
                  className="h-full rounded-full bg-accent-indigo"
                  style={{ width: `${p.completionPct}%` }}
                />
              </div>
              <p className={`mt-2 text-xs ${adminMuted}`}>
                {p.isCompleted ? t("status.completed") : t("status.in_progress")}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("admin.employees.quizHistory")}</h2>
        <div className={adminTableWrap}>
          <table className="w-full text-sm text-[#0F172A] dark:text-slate-100">
            <thead className="border-b border-[#E2E8F0] text-start text-slate-600 dark:border-[#30363D] dark:text-slate-400">
              <tr>
                <th className="p-3 text-start">{t("common.courses")}</th>
                <th className="p-3 text-start">{t("common.date")}</th>
                <th className="p-3 text-start">{t("common.score")}</th>
                <th className="p-3 text-start">{t("common.status")}</th>
              </tr>
            </thead>
            <tbody>
              {attemptRows.map((a, i) => (
                <tr key={`${a.at}-${i}`} className="border-t border-[#E2E8F0] dark:border-[#30363D]">
                  <td className="p-3">{(a.courseTitle as Record<string, string>)?.[lang] ?? "—"}</td>
                  <td className="p-3">{new Date(a.at).toLocaleString()}</td>
                  <td className="p-3 tabular-nums">{a.pct}%</td>
                  <td className="p-3">{a.passed ? t("common.pass") : t("common.fail")}</td>
                </tr>
              ))}
              {!attemptRows.length && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-sm text-slate-500 dark:text-slate-400">
                    {t("common.noData")}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("employee.badges")}</h2>
        <div className="flex flex-wrap gap-3">
          {e.badges?.map((b, i) => (
            <span key={i} className="text-3xl" title={JSON.stringify(b.badge.title)}>
              {b.badge.icon}
            </span>
          ))}
          {!e.badges?.length && <p className={adminMuted}>{t("common.noData")}</p>}
        </div>
      </section>
    </div>
  );
}
