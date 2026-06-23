import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/api";
import { generateCertificate } from "@/utils/generateCertificate";
import { resolveCertificateLocale } from "@/utils/certificateTemplate";
import { useToast } from "@/context/ToastContext";
import { AdminBackButton } from "@/components/admin/AdminBackButton";
import { RoleAvatar, roleAvatarKindFromCategoryCode } from "@/components/employee/ui/RoleAvatar";
import { adminCardPadded, adminMuted, adminTableWrap } from "@/components/admin/adminClasses";
import { AdminCategoryBadge } from "@/components/admin/AdminCategoryBadge";

type Emp = {
  name: string;
  employeeId: string;
  category?: { id: string; code: string; name: { fr?: string; en?: string; ar?: string } } | null;
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
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const [emp, setEmp] = useState<Emp | null>(null);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

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
    if (!emp || !certificateEligible) return;
    try {
      const scores = [
        ...(emp.attempts ?? []).map((a) => a.score),
        ...(emp.lessonQuizAttempts ?? []).map((a) => a.percentage),
      ];
      const avgScore =
        scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      const empLang = resolveCertificateLocale(emp.language);
      const roleName =
        (emp.category?.name as Record<string, string> | undefined)?.[empLang] ??
        emp.category?.code ??
        "employee";
      const programTitle =
        (emp.progress[0]?.course?.title as Record<string, string> | undefined)?.[empLang] ??
        (emp.progress[0]?.course?.title as Record<string, string> | undefined)?.en ??
        "";
      const doc = await generateCertificate({
        name: emp.name,
        role: roleName,
        programName: programTitle,
        avgScore,
        completionDate: new Date().toISOString(),
        locale: empLang,
      });
      const fileName = `certificate-${emp.name.replace(/[\\/:*?"<>|]/g, "-")}-averda.pdf`;
      doc.save(fileName);
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

  if (loading || !emp) {
    return <div className="h-64 animate-pulse rounded-xl bg-slate-200 dark:bg-[#161B22]" />;
  }

  const e = emp;

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
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
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
      </div>

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
