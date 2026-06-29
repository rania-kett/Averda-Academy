import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { isAxiosError } from "axios";
import { Search, Shield, Trash2, X } from "lucide-react";
import { adminApi } from "@/api/api";
import { ConfirmDeleteModal } from "@/components/admin/ConfirmDeleteModal";
import { epiLocalApi } from "@/data/epiLocalApi";
import {
  epiStoreGetAllEmployees,
  epiStoreGetCatalog,
  epiStoreGetCategoryDefaults,
  epiStoreSetCategoryDefaults,
  epiStoreUpdateItem,
} from "@/data/epiStore";
import { useToast } from "@/context/ToastContext";
import { adminCardPadded } from "@/components/admin/adminClasses";
import { RoleAvatar, roleAvatarKindFromCategoryCode } from "@/components/employee/ui/RoleAvatar";
import { CATEGORY_ORDER, CATEGORIES, getCategoryDefByCode } from "@/config/categories";

export function EpiAdminPage() {
  const { t, i18n } = useTranslation();
  const toast = useToast();
  const lang = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";

  const [loading, setLoading] = useState(true);
  const [usingLocalEpi, setUsingLocalEpi] = useState(false);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");

  const [rows, setRows] = useState<
    {
      id: string;
      employeeId: string;
      name: string;
      avatarColor: string;
      category: { code: string; name: unknown } | null;
      profile: {
        shirtSize: string | null;
        shoeSize: string | null;
        gloveSize: string | null;
        vestSize: string | null;
        pantsSize: string | null;
        updatedAt: string;
      } | null;
      issuances: {
        id: string;
        itemCode: string;
        item: { code: string; labelAr: string; labelFr: string; labelEn: string; emoji: string | null; active: boolean } | null;
        status: string;
        issuedAt: string;
        nextReplacementAt: string | null;
        lastReceptionAt: string | null;
        dueSoon: boolean;
        overdue: boolean;
        notReceived: boolean;
      }[];
    }[]
  >([]);

  const [selected, setSelected] = useState<(typeof rows)[number] | null>(null);

  const [epiManageOpen, setEpiManageOpen] = useState(false);
  const [epiCatalog, setEpiCatalog] = useState<
    {
      code: string;
      labelAr: string;
      labelFr: string;
      labelEn: string;
      emoji: string | null;
      active: boolean;
    }[]
  >([]);
  const [epiCategories, setEpiCategories] = useState<{ id: string; code: string; name: any }[]>([]);
  const [epiSelectedCategoryId, setEpiSelectedCategoryId] = useState<string>("");
  const [epiDefaults, setEpiDefaults] = useState<
    { itemCode: string; required: boolean; lifetimeDaysOverride: number | null; sortOrder: number }[]
  >([]);
  const [epiSavingDefaults, setEpiSavingDefaults] = useState(false);

  const [epiIssueUser, setEpiIssueUser] = useState<{ id: string; name: string; employeeId: string } | null>(null);
  const [epiIssueCodes, setEpiIssueCodes] = useState<string[]>([]);
  const [epiIssuing, setEpiIssuing] = useState(false);
  const [epiDeleteTarget, setEpiDeleteTarget] = useState<{ code: string; label: string } | null>(null);
  const [epiDeleteForceMode, setEpiDeleteForceMode] = useState(false);
  const [epiDeleteLoading, setEpiDeleteLoading] = useState(false);
  const [editingIssuanceId, setEditingIssuanceId] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState("issued");
  const [editSize, setEditSize] = useState("");
  const [editIssuedAt, setEditIssuedAt] = useState("");
  const [editNextReplacementAt, setEditNextReplacementAt] = useState("");
  const [issuanceSaving, setIssuanceSaving] = useState(false);

  const EPI_SERVER_STATUSES = ["issued", "received", "replaced", "expired", "pending_renewal"] as const;

  const toDateInputValue = (iso: string | null | undefined) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  };

  const startEditIssuance = (it: (typeof rows)[number]["issuances"][number]) => {
    setEditingIssuanceId(it.id);
    setEditStatus(it.status);
    setEditSize("");
    setEditIssuedAt(toDateInputValue(it.issuedAt));
    setEditNextReplacementAt(toDateInputValue(it.nextReplacementAt));
  };

  const saveIssuanceEdit = async () => {
    if (!editingIssuanceId || usingLocalEpi) return;
    setIssuanceSaving(true);
    try {
      await adminApi.updateEpiIssuance(editingIssuanceId, {
        status: editStatus,
        size: editSize.trim() || null,
        issuedAt: editIssuedAt ? new Date(editIssuedAt).toISOString() : undefined,
        nextReplacementAt: editNextReplacementAt ? new Date(editNextReplacementAt).toISOString() : null,
      });
      toast(t("admin.epiManage.issuanceSaved"), "success");
      setEditingIssuanceId(null);
      if (selected) {
        const { data } = await adminApi.epiEmployees({ page: String(page), ...(committedSearch ? { search: committedSearch } : {}) });
        const updated = ((data as any).employees ?? []).find((e: any) => e.id === selected.id);
        if (updated) setSelected(updated);
      }
      await load();
    } catch {
      toast(t("admin.epiManage.issuanceSaveFailed"), "error");
    } finally {
      setIssuanceSaving(false);
    }
  };

  const deleteIssuance = async (issuanceId: string) => {
    if (usingLocalEpi) return;
    if (!window.confirm(t("admin.epiManage.deleteIssuanceConfirm"))) return;
    try {
      await adminApi.deleteEpiIssuance(issuanceId);
      toast(t("admin.epiManage.issuanceDeleted"), "success");
      setEditingIssuanceId(null);
      if (selected) {
        setSelected((prev) =>
          prev ? { ...prev, issuances: prev.issuances.filter((x) => x.id !== issuanceId) } : prev
        );
      }
      await load();
    } catch {
      toast(t("admin.epiManage.issuanceDeleteFailed"), "error");
    }
  };

  const epiLangKey = i18n.language.startsWith("ar") ? "ar" : i18n.language.startsWith("fr") ? "fr" : "en";
  const epiCatalogLabel = useMemo(() => {
    return (it: (typeof epiCatalog)[number]) => {
      const fallback =
        epiLangKey === "ar" ? it.labelAr : epiLangKey === "fr" ? it.labelFr : it.labelEn;
      return t(`employee.epi.items.codes.${it.code}`, { defaultValue: String(fallback || it.code) });
    };
  }, [epiLangKey, epiCatalog, t]);

  const totalPages = Math.max(1, Math.ceil(total / 20));

  const categoryLabel = (c: { code: string; name: unknown } | null | undefined) => {
    const m = (c?.name ?? {}) as Record<string, string | undefined>;
    return (m[lang] || m.fr || m.en || c?.code || "—").trim();
  };

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await adminApi.epiEmployees({
        page: String(page),
        ...(committedSearch ? { search: committedSearch } : {}),
      });
      const payload = data as any;
      const apiRows = (payload.employees ?? []) as any[];
      setRows(apiRows as any);
      setTotal(Number(payload.total ?? 0));
      setUsingLocalEpi(false);

      // If DB-backed EPI is empty (schema not migrated), fall back to local seeded EPI store
      // so admin sees the same passport list employees see (e.g. AV000002).
      if (!apiRows.length) {
        setUsingLocalEpi(true);
        const q = committedSearch.trim().toLowerCase();
        const localEmployees = epiStoreGetAllEmployees().filter((e) => {
          if (!q) return true;
          return (
            e.employee_id.toLowerCase().includes(q) ||
            e.nom.toLowerCase().includes(q) ||
            e.poste.toLowerCase().includes(q)
          );
        });
        const pageSize = 20;
        const paged = localEmployees.slice((page - 1) * pageSize, page * pageSize);
        const summaries = await Promise.all(
          paged.map(async (e) => {
            const s = (await epiLocalApi.summary(e.employee_id)).data as any;
            return { e, s };
          })
        );

        const mapped = summaries.map(({ e, s }) => {
          const issuances = (s.passport ?? []).map((x: any) => ({
            id: x.id,
            itemCode: x.itemCode,
            item: x.item ?? null,
            status: x.status,
            issuedAt: x.issuedAt,
            nextReplacementAt: x.nextReplacementAt ?? null,
            lastReceptionAt: x.lastReceptionAt ?? null,
            dueSoon: false,
            overdue: false,
            notReceived: x.status === "issued" || x.status === "pending_renewal",
          }));
          const catDef = getCategoryDefByCode(e.categoryCode);
          return {
            id: e.employee_id,
            employeeId: e.employee_id,
            name: e.nom,
            avatarColor: "#2E6198",
            category: {
              code: e.categoryCode,
              name: catDef?.label ?? { fr: e.poste, en: e.poste, ar: e.poste },
            },
            profile: s.profile ?? null,
            issuances,
          };
        });

        setRows(mapped as any);
        setTotal(localEmployees.length);
      }
    } catch {
      setRows([]);
      setTotal(0);
      setUsingLocalEpi(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, committedSearch]);

  const openEpiManage = async () => {
    setEpiManageOpen(true);
    try {
      if (usingLocalEpi) {
        const items = epiStoreGetCatalog();
        setEpiCatalog(items as any);
        const cats = CATEGORY_ORDER.map((key) => ({
          id: key,
          code: key,
          name: CATEGORIES[key].label,
        }));
        setEpiCategories(cats as any);
        if (!epiSelectedCategoryId && cats[0]?.id) setEpiSelectedCategoryId(cats[0].id);
      } else {
        const [catRes, catsRes] = await Promise.all([adminApi.epiCatalog(), adminApi.categories()]);
        setEpiCatalog((catRes.data as any).items ?? []);
        const cats = (catsRes.data as any).categories ?? [];
        setEpiCategories(cats);
        if (!epiSelectedCategoryId && cats[0]?.id) {
          setEpiSelectedCategoryId(cats[0].id);
        }
      }
    } catch {
      toast(t("admin.epiManage.loadFailed"), "error");
    }
  };

  useEffect(() => {
    if (!epiManageOpen) return;
    if (!epiSelectedCategoryId) return;
    void (async () => {
      try {
        if (usingLocalEpi) {
          const codes = epiStoreGetCategoryDefaults(epiSelectedCategoryId);
          setEpiDefaults(
            codes.map((itemCode, i) => ({
              itemCode,
              required: true,
              lifetimeDaysOverride: null,
              sortOrder: i,
            })) as any
          );
        } else {
          const { data } = await adminApi.epiCategoryDefaults(epiSelectedCategoryId);
          setEpiDefaults((data as any).defaults ?? []);
        }
      } catch {
        setEpiDefaults([]);
      }
    })();
  }, [epiManageOpen, epiSelectedCategoryId, usingLocalEpi]);

  const toggleDefaultItem = (code: string) => {
    setEpiDefaults((prev) => {
      const exists = prev.some((x) => x.itemCode === code);
      if (exists) return prev.filter((x) => x.itemCode !== code);
      return [...prev, { itemCode: code, required: true, lifetimeDaysOverride: null, sortOrder: prev.length }];
    });
  };

  const saveCategoryDefaults = async () => {
    if (!epiSelectedCategoryId) return;
    setEpiSavingDefaults(true);
    try {
      const items = epiDefaults
        .slice()
        .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
        .map((x, i) => ({ ...x, sortOrder: i }));
      if (usingLocalEpi) {
        epiStoreSetCategoryDefaults(
          epiSelectedCategoryId,
          items.map((x) => x.itemCode)
        );
        toast(t("admin.epiManage.saved"), "success");
      } else {
        await adminApi.updateEpiCategoryDefaults(epiSelectedCategoryId, { items });
        toast(t("admin.epiManage.saved"), "success");
      }
    } catch {
      toast(t("admin.epiManage.saveFailed"), "error");
    } finally {
      setEpiSavingDefaults(false);
    }
  };

  const openIssueForUser = async (userId: string, name: string, employeeId: string) => {
    setEpiIssueUser({ id: userId, name, employeeId });
    setEpiIssueCodes([]);
    setEpiManageOpen(true);
    try {
      if (!epiCatalog.length) {
        if (usingLocalEpi) {
          setEpiCatalog(epiStoreGetCatalog() as any);
          const roles = Array.from(new Set(epiStoreGetAllEmployees().map((e) => e.poste))).filter(Boolean);
          setEpiCategories(
            roles.map((r) => ({
              id: r,
              code: r,
              name: { fr: r, en: r, ar: r },
            })) as any
          );
        } else {
          const [catRes, catsRes] = await Promise.all([adminApi.epiCatalog(), adminApi.categories()]);
          setEpiCatalog((catRes.data as any).items ?? []);
          setEpiCategories(((catsRes.data as any).categories ?? []) as any);
        }
      }
      if (usingLocalEpi) {
        const catCode = rows.find((r) => r.id === userId)?.category?.code ?? "";
        if (catCode) {
          setEpiSelectedCategoryId(catCode);
          const defCodes = epiStoreGetCategoryDefaults(catCode);
          setEpiIssueCodes(defCodes);
        }
      } else {
        const { data } = await adminApi.employee(userId);
        const catId = (data as any)?.employee?.category?.id ?? "";
        if (catId) {
          setEpiSelectedCategoryId(catId);
          const defs = await adminApi.epiCategoryDefaults(catId);
          const defCodes = ((defs.data as any).defaults ?? []).map((d: any) => d.itemCode);
          setEpiIssueCodes(defCodes);
        }
      }
    } catch {
      // ignore — still usable
    }
  };

  const issueSelectedToUser = async () => {
    if (!epiIssueUser) return;
    if (!epiIssueCodes.length) {
      toast(t("admin.epiManage.selectAtLeastOne"), "error");
      return;
    }
    setEpiIssuing(true);
    try {
      if (usingLocalEpi) {
        const empId = epiIssueUser.employeeId;
        epiIssueCodes.forEach((code) => {
          const cat = epiCatalog.find((x) => x.code === code) as any;
          const nameFr = String(cat?.labelFr || "");
          if (!nameFr) return;
          epiStoreUpdateItem(empId, nameFr, { statut: "En cours", reception: false, fit: false });
        });
      } else {
        await adminApi.issueEpi({ userId: epiIssueUser.id, itemCodes: epiIssueCodes });
      }
      toast(t("admin.epiManage.issued"), "success");
      setEpiIssueUser(null);
      setEpiIssueCodes([]);
      setEpiManageOpen(false);
      await load();
    } catch {
      toast(t("admin.epiManage.issueFailed"), "error");
    } finally {
      setEpiIssuing(false);
    }
  };

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setCommittedSearch(search.trim());
  };

  const reloadEpiCatalog = async () => {
    if (usingLocalEpi) {
      setEpiCatalog(epiStoreGetCatalog() as any);
      return;
    }
    const { data } = await adminApi.epiCatalog();
    setEpiCatalog((data as any).items ?? []);
  };

  const confirmDeleteEpiItem = async (force = false) => {
    if (!epiDeleteTarget || epiDeleteLoading) return;
    setEpiDeleteLoading(true);
    try {
      await adminApi.deleteEpiItem(epiDeleteTarget.code, force);
      setEpiDeleteTarget(null);
      setEpiDeleteForceMode(false);
      await reloadEpiCatalog();
      toast(t("admin.epiManage.catalogDeleted"), "success");
    } catch (e: unknown) {
      if (!force && isAxiosError(e) && e.response?.status === 409) {
        setEpiDeleteForceMode(true);
        return;
      }
      const msg =
        isAxiosError(e) && e.response?.data?.error
          ? String(e.response.data.error)
          : t("admin.epiManage.catalogDeleteFailed");
      toast(msg, "error");
    } finally {
      setEpiDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold text-[#0F172A] dark:text-slate-100">{t("admin.epi.title")}</h1>
          <p className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400">{t("admin.epi.subtitle")}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void openEpiManage()}
            className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-extrabold text-[#111827] transition hover:bg-[#F9FAFB] dark:border-[#30363D] dark:bg-[#161B22] dark:text-white dark:hover:bg-white/5"
          >
            {t("admin.epiManage.open")}
          </button>
          <div className="rounded-xl bg-[#F9FAFB] px-3 py-2 text-[12px] font-extrabold text-[#111827] dark:bg-white/5 dark:text-white">
            {t("common.total")} <span className="tabular-nums text-averda">{total}</span>
          </div>
        </div>
      </div>

      <form onSubmit={onSearch} className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={lang === "ar" ? "بحث بالاسم أو المعرف..." : lang === "fr" ? "Rechercher..." : "Search..."}
            className="h-11 w-[min(80vw,360px)] rounded-xl border border-[#E5E7EB] bg-white ps-9 pe-3 text-sm font-semibold text-[#111827] outline-none focus:ring-2 focus:ring-[#3B6BE8]/20 dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-xl bg-averda px-4 text-[13px] font-extrabold text-white hover:bg-[#163056]"
        >
          {t("common.search")}
        </button>
      </form>

      <div className={adminCardPadded}>
        {loading ? (
          <div className="h-40 animate-pulse rounded-xl bg-slate-200 dark:bg-[#161B22]" />
        ) : (
          <>
            <div className="overflow-x-auto rounded-xl border border-[#E5E7EB] dark:border-[#30363D]">
              <table className="w-full min-w-[960px] text-sm">
                <thead>
                  <tr className="bg-[#F9FAFB] text-start text-[12px] font-semibold uppercase tracking-wide text-[#6B7280] dark:bg-white/5 dark:text-slate-400">
                    <th className="px-4 py-3">{t("admin.epi.colEmployee")}</th>
                    <th className="px-4 py-3">{t("admin.epi.colSizes")}</th>
                    <th className="px-4 py-3">{t("admin.epi.colStatus")}</th>
                    <th className="px-4 py-3">{t("admin.epi.colRenewals")}</th>
                    <th className="px-4 py-3">{t("admin.epi.colUpdated")}</th>
                    <th className="px-4 py-3">{t("common.actions")}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const code = r.category?.code ?? null;
                    const statusCounts = r.issuances.reduce(
                      (acc, x) => {
                        acc.total += 1;
                        if (x.status === "received") acc.received += 1;
                        if (x.status === "issued" || x.status === "pending_renewal") acc.issued += 1;
                        if (x.status === "expired") acc.expired += 1;
                        if (x.status === "replaced") acc.replaced += 1;
                        return acc;
                      },
                      { total: 0, issued: 0, received: 0, replaced: 0, expired: 0 }
                    );
                    const dueSoon = r.issuances.filter((x) => x.dueSoon).length;
                    const updatedAt = r.profile?.updatedAt ?? null;
                    const lastReception = r.issuances.find((x) => x.lastReceptionAt)?.lastReceptionAt ?? null;
                    const last = updatedAt && lastReception ? (updatedAt > lastReception ? updatedAt : lastReception) : updatedAt ?? lastReception;
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-[#F3F4F6] bg-white hover:bg-[#F9FAFB] dark:border-[#30363D] dark:bg-[#161B22] dark:hover:bg-white/5"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <RoleAvatar
                              categoryCode={code}
                              kind={roleAvatarKindFromCategoryCode(code, r.employeeId)}
                              className="h-9 w-9"
                              title={r.name}
                              employeeId={r.employeeId}
                            />
                            <div className="min-w-0">
                              <div className="truncate text-[13px] font-extrabold text-[#111827] dark:text-white">{r.name}</div>
                              <div className="text-[12px] font-semibold text-[#6B7280] dark:text-slate-400" dir="ltr">
                                {r.employeeId}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-2 text-[12px] font-extrabold">
                            <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-averda dark:bg-white/10 dark:text-white">
                              {t("admin.epi.sizeShirt")}: {r.profile?.shirtSize ?? "—"}
                            </span>
                            <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-averda dark:bg-white/10 dark:text-white">
                              {t("admin.epi.sizePants")}: {r.profile?.pantsSize ?? "—"}
                            </span>
                            <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-averda dark:bg-white/10 dark:text-white">
                              {t("admin.epi.sizeShoe")}: {r.profile?.shoeSize ?? "—"}
                            </span>
                            <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-averda dark:bg-white/10 dark:text-white">
                              {t("admin.epi.sizeGloves")}: {r.profile?.gloveSize ?? "—"}
                            </span>
                            <span className="rounded-full bg-[#EEF2FF] px-3 py-1 text-averda dark:bg-white/10 dark:text-white">
                              {t("admin.epi.sizeVest")}: {r.profile?.vestSize ?? "—"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {dueSoon > 0 || statusCounts.expired > 0 ? (
                            <span className="inline-flex h-[30px] items-center rounded-full bg-[#FEE2E2] px-3 text-[12px] font-extrabold text-[#991B1B] dark:bg-red-600/20 dark:text-red-200">
                              {t("admin.epi.statusNeedsFollowUp")}
                            </span>
                          ) : (
                            <span className="inline-flex h-[30px] items-center rounded-full bg-[#D1FAE5] px-3 text-[12px] font-extrabold text-[#065F46] dark:bg-emerald-600/20 dark:text-emerald-200">
                              {t("admin.epi.statusGood")}
                            </span>
                          )}
                          <div className="mt-2 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400">
                            {t("admin.epi.itemsLine", {
                              total: statusCounts.total,
                              received: statusCounts.received,
                              expired: statusCounts.expired,
                            })}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex h-[30px] items-center rounded-full bg-[#F9FAFB] px-3 text-[12px] font-extrabold text-[#111827] dark:bg-white/5 dark:text-white" dir="ltr">
                            {dueSoon}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-[13px] font-semibold text-[#6B7280] dark:text-slate-400" dir="ltr">
                          {last ? String(last).slice(0, 10) : "—"}
                        </td>
                        <td className="px-4 py-3 flex gap-2">
                          <button
                            type="button"
                            onClick={() => setSelected(r)}
                            className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-extrabold text-[#111827] hover:bg-[#F9FAFB] dark:border-[#30363D] dark:bg-[#161B22] dark:text-white dark:hover:bg-white/5"
                          >
                            {t("common.view")}
                          </button>
                          <button
                            type="button"
                            onClick={() => void openIssueForUser(r.id, r.name, r.employeeId)}
                            className="rounded-lg bg-averda px-3 py-2 text-[12px] font-extrabold text-white hover:bg-[#163056] disabled:opacity-50"
                          >
                            {t("admin.epiManage.issueBtn")}
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {!rows.length && (
                    <tr>
                      <td colSpan={6} className="py-10">
                        <div className="flex flex-col items-center justify-center gap-3 text-center">
                          <Shield className="h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden />
                          <div className="text-[14px] font-semibold text-[#9CA3AF]">{t("admin.epi.empty")}</div>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 text-xs">
              <button
                type="button"
                disabled={page <= 1}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 font-extrabold text-[#111827] disabled:opacity-40 dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                {t("common.pagination.prev")}
              </button>
              <span className="text-[12px] font-semibold text-[#6B7280] dark:text-slate-400">
                {t("common.pagination.pageOf", { current: page, total: totalPages })}
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 font-extrabold text-[#111827] disabled:opacity-40 dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
                onClick={() => setPage((p) => p + 1)}
              >
                {t("common.pagination.next")}
              </button>
            </div>
          </>
        )}
      </div>

      {/* EPI management modal (same capabilities as Dashboard) */}
      {epiManageOpen && (
        <div className="fixed inset-0 z-[210] grid place-items-center px-4" role="dialog" aria-modal="true">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label={t("common.close")}
            onClick={() => {
              if (epiIssuing || epiSavingDefaults) return;
              setEpiManageOpen(false);
              setEpiIssueUser(null);
              setEpiIssueCodes([]);
            }}
          />
          <div className="relative w-full max-w-4xl rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[16px] font-extrabold text-[#111827] dark:text-white">{t("admin.epiManage.title")}</div>
                {epiIssueUser && (
                  <div className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400" dir="ltr">
                    {epiIssueUser.name} — {epiIssueUser.employeeId}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => {
                  if (epiIssuing || epiSavingDefaults) return;
                  setEpiManageOpen(false);
                  setEpiIssueUser(null);
                  setEpiIssueCodes([]);
                }}
                className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-extrabold text-[#111827] transition hover:bg-[#F9FAFB] dark:border-[#30363D] dark:bg-[#161B22] dark:text-white dark:hover:bg-white/5"
              >
                {t("common.close")}
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-[#E5E7EB] p-4 dark:border-[#30363D]">
              <div className="text-[13px] font-extrabold text-[#111827] dark:text-white">{t("admin.epiManage.catalogTitle")}</div>
              <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {epiCatalog.map((it) => (
                  <div
                    key={it.code}
                    className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-[13px] font-semibold ${
                      it.active
                        ? "border-[#E5E7EB] bg-white text-[#111827] dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
                        : "border-dashed border-[#D1D5DB] bg-[#F9FAFB] text-[#9CA3AF] dark:border-[#30363D] dark:bg-white/5"
                    }`}
                  >
                    <span className="truncate">
                      <span className="me-2" aria-hidden>
                        {it.emoji ?? "🦺"}
                      </span>
                      {epiCatalogLabel(it)}
                      {!it.active && (
                        <span className="ms-2 text-[11px] font-bold uppercase opacity-70">({t("common.inactive")})</span>
                      )}
                    </span>
                    <button
                      type="button"
                      disabled={usingLocalEpi || epiDeleteLoading}
                      onClick={() => {
                        setEpiDeleteForceMode(false);
                        setEpiDeleteTarget({ code: it.code, label: epiCatalogLabel(it) });
                      }}
                      className="shrink-0 rounded-lg border border-red-200 bg-red-50 p-2 text-red-600 hover:bg-red-100 disabled:opacity-40 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
                      title={t("common.delete")}
                      aria-label={t("common.delete")}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-[#E5E7EB] p-4 dark:border-[#30363D]">
                <div className="text-[13px] font-extrabold text-[#111827] dark:text-white">{t("admin.epiManage.categoryDefaults")}</div>
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <select
                    value={epiSelectedCategoryId}
                    onChange={(e) => setEpiSelectedCategoryId(e.target.value)}
                    className="h-11 rounded-xl border border-[#E5E7EB] bg-white px-3 text-[13px] font-semibold text-[#111827] dark:border-[#30363D] dark:bg-[#161B22] dark:text-white"
                  >
                    {epiCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {(c.name as any)?.[epiLangKey] ?? (c.name as any)?.en ?? c.code}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => void saveCategoryDefaults()}
                    disabled={epiSavingDefaults || !epiSelectedCategoryId}
                    className="h-11 rounded-xl bg-emerald-600 px-4 text-[13px] font-extrabold text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {epiSavingDefaults ? t("common.saving") : t("common.save")}
                  </button>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {epiCatalog
                    .filter((x) => x.active)
                    .map((it) => {
                      const checked = epiDefaults.some((d) => d.itemCode === it.code);
                      return (
                        <button
                          key={it.code}
                          type="button"
                          onClick={() => toggleDefaultItem(it.code)}
                          className={`flex items-center justify-between rounded-xl border px-3 py-2 text-start text-[13px] font-semibold transition ${
                            checked
                              ? "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100"
                              : "border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB] dark:border-[#30363D] dark:bg-[#161B22] dark:text-white dark:hover:bg-white/5"
                          }`}
                        >
                          <span className="truncate">
                            <span className="me-2" aria-hidden>
                              {it.emoji ?? "🦺"}
                            </span>
                            {epiCatalogLabel(it)}
                          </span>
                          <span className="ms-3 text-[12px] font-extrabold">{checked ? "✓" : ""}</span>
                        </button>
                      );
                    })}
                </div>
              </div>

              <div className="rounded-2xl border border-[#E5E7EB] p-4 dark:border-[#30363D]">
                <div className="flex items-center justify-between gap-3">
                  <div className="text-[13px] font-extrabold text-[#111827] dark:text-white">{t("admin.epiManage.issueSection")}</div>
                  <button
                    type="button"
                    onClick={() => setEpiIssueCodes(epiDefaults.map((d) => d.itemCode))}
                    disabled={!epiIssueUser}
                    className="rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-extrabold text-[#111827] hover:bg-[#F9FAFB] disabled:opacity-50 dark:border-[#30363D] dark:bg-[#161B22] dark:text-white dark:hover:bg-white/5"
                  >
                    {t("admin.epiManage.useDefaults")}
                  </button>
                </div>

                {!epiIssueUser ? (
                  <div className="mt-3 text-[13px] font-semibold text-[#6B7280] dark:text-slate-400">{t("admin.epiManage.issueHint")}</div>
                ) : (
                  <>
                    <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {epiCatalog
                        .filter((x) => x.active)
                        .map((it) => {
                          const checked = epiIssueCodes.includes(it.code);
                          return (
                            <button
                              key={it.code}
                              type="button"
                              onClick={() =>
                                setEpiIssueCodes((prev) => (prev.includes(it.code) ? prev.filter((c) => c !== it.code) : [...prev, it.code]))
                              }
                              className={`flex items-center justify-between rounded-xl border px-3 py-2 text-start text-[13px] font-semibold transition ${
                                checked
                                  ? "border-blue-400 bg-blue-50 text-blue-900 dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-100"
                                  : "border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB] dark:border-[#30363D] dark:bg-[#161B22] dark:text-white dark:hover:bg-white/5"
                              }`}
                            >
                              <span className="truncate">
                                <span className="me-2" aria-hidden>
                                  {it.emoji ?? "🦺"}
                                </span>
                                {epiCatalogLabel(it)}
                              </span>
                              <span className="ms-3 text-[12px] font-extrabold">{checked ? "✓" : ""}</span>
                            </button>
                          );
                        })}
                    </div>
                    <div className="mt-4">
                      <button
                        type="button"
                        onClick={() => void issueSelectedToUser()}
                        disabled={epiIssuing}
                        className="h-11 w-full rounded-xl bg-averda px-4 text-[13px] font-extrabold text-white hover:bg-[#163056] disabled:opacity-50"
                      >
                        {epiIssuing ? t("common.loading") : t("admin.epiManage.issueConfirm")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Employee EPI passport modal */}
      {selected && (
        <div className="fixed inset-0 z-[220] grid place-items-center px-4" role="dialog" aria-modal="true">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label={t("common.close")} onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-3xl rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-2xl dark:border-[#30363D] dark:bg-[#0D1117]">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[16px] font-extrabold text-[#111827] dark:text-white">{selected.name}</div>
                <div className="mt-1 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400" dir="ltr">
                  {selected.employeeId} {selected.category ? `• ${categoryLabel(selected.category as any)}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="grid h-9 w-9 place-items-center rounded-xl border border-[#E5E7EB] bg-white text-[#111827] hover:bg-[#F9FAFB] dark:border-[#30363D] dark:bg-[#161B22] dark:text-white dark:hover:bg-white/5"
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" aria-hidden />
              </button>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {selected.issuances.map((it) => {
                const fallback =
                  lang === "ar"
                    ? it.item?.labelAr
                    : lang === "fr"
                      ? it.item?.labelFr
                      : it.item?.labelEn;
                const title = t(`employee.epi.items.codes.${it.itemCode}`, {
                  defaultValue: String(fallback || it.itemCode),
                });
                const status =
                  it.status === "received"
                    ? t("employee.epi.status.received")
                    : it.status === "expired"
                      ? t("employee.epi.status.expired")
                      : it.status === "replaced"
                        ? t("employee.epi.status.replaced")
                        : t("employee.epi.status.issued");
                const tone =
                  it.status === "received"
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : it.status === "expired"
                      ? "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-200"
                      : "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-200";
                return (
                  <div key={it.id} className="rounded-2xl border border-[#E5E7EB] bg-white p-4 dark:border-[#30363D] dark:bg-[#161B22]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[14px] font-extrabold text-[#111827] dark:text-white">
                          {title}
                        </div>
                        {editingIssuanceId === it.id ? (
                          <div className="mt-3 space-y-2">
                            <select
                              value={editStatus}
                              onChange={(e) => setEditStatus(e.target.value)}
                              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-semibold dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
                            >
                              {EPI_SERVER_STATUSES.map((s) => (
                                <option key={s} value={s}>
                                  {s}
                                </option>
                              ))}
                            </select>
                            <input
                              value={editSize}
                              onChange={(e) => setEditSize(e.target.value)}
                              placeholder={t("admin.page.epi.itemDetail.size", { defaultValue: "Size" })}
                              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-semibold dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
                            />
                            <input
                              type="date"
                              value={editIssuedAt}
                              onChange={(e) => setEditIssuedAt(e.target.value)}
                              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-semibold dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
                            />
                            <input
                              type="date"
                              value={editNextReplacementAt}
                              onChange={(e) => setEditNextReplacementAt(e.target.value)}
                              className="w-full rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-[12px] font-semibold dark:border-[#30363D] dark:bg-[#0D1117] dark:text-white"
                            />
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => void saveIssuanceEdit()}
                                disabled={issuanceSaving}
                                className="flex-1 rounded-lg bg-averda px-3 py-2 text-[12px] font-extrabold text-white disabled:opacity-50"
                              >
                                {issuanceSaving ? t("common.saving") : t("admin.epiManage.saveIssuance")}
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingIssuanceId(null)}
                                className="rounded-lg border border-[#E5E7EB] px-3 py-2 text-[12px] font-bold dark:border-[#30363D]"
                              >
                                {t("common.cancel")}
                              </button>
                            </div>
                          </div>
                        ) : (
                          <>
                            <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px] font-semibold text-[#6B7280] dark:text-slate-400">
                              <span className={`inline-flex h-[26px] items-center rounded-full px-3 text-[12px] font-extrabold ${tone}`}>
                                {status}
                              </span>
                              {it.lastReceptionAt ? <span dir="ltr">{String(it.lastReceptionAt).slice(0, 10)}</span> : null}
                              {it.nextReplacementAt ? <span dir="ltr">→ {String(it.nextReplacementAt).slice(0, 10)}</span> : null}
                            </div>
                            {!usingLocalEpi ? (
                              <div className="mt-3 flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => startEditIssuance(it)}
                                  className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-[11px] font-extrabold text-[#111827] hover:bg-[#F9FAFB] dark:border-[#30363D] dark:text-white dark:hover:bg-white/5"
                                >
                                  {t("admin.epiManage.editIssuance")}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void deleteIssuance(it.id)}
                                  className="rounded-lg border border-red-300 px-3 py-1.5 text-[11px] font-extrabold text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:text-red-400"
                                >
                                  {t("admin.epiManage.deleteIssuance")}
                                </button>
                              </div>
                            ) : null}
                          </>
                        )}
                      </div>
                      <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#F8FAFC] text-[18px] dark:bg-white/5" aria-hidden>
                        {it.item?.emoji ?? "🦺"}
                      </div>
                    </div>
                  </div>
                );
              })}
              {!selected.issuances.length && (
                <div className="col-span-2 py-10 text-center text-[14px] font-semibold text-[#9CA3AF]">
                  {t("admin.epi.empty")}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmDeleteModal
        open={epiDeleteTarget != null}
        title={t("admin.epiManage.catalogTitle")}
        message={
          epiDeleteForceMode
            ? t("admin.epiManage.deleteCatalogForceWarning")
            : t("admin.epiManage.deleteCatalogConfirm")
        }
        cancelLabel={t("common.cancel")}
        confirmLabel={
          epiDeleteForceMode
            ? t("admin.epiManage.deleteCatalogForceBtn")
            : t("common.delete")
        }
        loading={epiDeleteLoading}
        onCancel={() => {
          if (!epiDeleteLoading) {
            setEpiDeleteTarget(null);
            setEpiDeleteForceMode(false);
          }
        }}
        onConfirm={() => void confirmDeleteEpiItem(epiDeleteForceMode)}
      />
    </div>
  );
}

