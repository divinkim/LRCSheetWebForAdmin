"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faChevronLeft,
  faChevronRight,
  faTrashAlt,
  faPen,
  faMoneyBillWave,
  faFileDownload,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { providers } from "@/index";
import { useToast } from "@/components/toast";
import { SalariesResponseDto, Salary } from "@/types/global";

const REQUIRED_ADMIN_ROLES = ["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"];

// Modifiez la devise selon votre contexte
const CURRENCY = "FCFA";

// Les montants arrivent sous forme de string : on les convertit pour l'affichage
const formatAmount = (value: string | number | null | undefined) => {
  if (value === null || value === undefined || value === "") return "-";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  return `${new Intl.NumberFormat("fr-FR").format(num)} ${CURRENCY}`;
};

const escapeCSV = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;

export default function SalariesList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const limit = 8;

  // Données de session
  const user = session?.user as any;
  const adminRole = user?.adminRole ?? "";
  const enterpriseId = Number(user?.EnterpriseId || 0);
  const hasAdminAccess = REQUIRED_ADMIN_ROLES.includes(adminRole);

  // États locaux
  const [salariesList, setSalariesList] = useState<Salary[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Récupération des salaires
  useEffect(() => {
    async function fetchSalaries() {
      if (status === "loading") return;

      if (status !== "authenticated" || !session?.user) {
        setLoading(false);
        return;
      }

      if (!REQUIRED_ADMIN_ROLES.includes(adminRole)) {
        router.replace("/home");
        return;
      }

      try {
        setLoading(true);
        const response = await providers.API.getAll<SalariesResponseDto>(providers.APIUrl, "salaries", null);
        const rawSalaries: Salary[] = response.data;

        let filtered: Salary[] = [];

        if (adminRole === "Super_Admin_Platform" || adminRole === "Super_Admin_Enterprise") {
          filtered = rawSalaries;
        } else if (adminRole === "Enterprise_Admin") {
          filtered = rawSalaries.filter((salary) => salary.EnterpriseId === enterpriseId);
        }

        setSalariesList(filtered);
      } catch (error) {
        toast.error("Erreur", "Erreur lors de la récupération des salaires");
        console.error("Erreur fetchSalaries:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchSalaries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, adminRole, enterpriseId]);

  // Filtrage & recherche (poste, entreprise, montants)
  const filteredSalaries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return salariesList;

    return salariesList.filter((salary) => {
      return (
        salary.Post?.title?.toLowerCase().includes(query) ||
        salary.Enterprise?.name?.toLowerCase().includes(query) ||
        String(salary.grossSalary ?? "").includes(query) ||
        String(salary.netSalary ?? "").includes(query)
      );
    });
  }, [salariesList, search]);

  // Pagination
  const maxPage = Math.max(1, Math.ceil(filteredSalaries.length / limit));

  const currentData = useMemo(() => {
    const startIdx = (page - 1) * limit;
    return filteredSalaries.slice(startIdx, startIdx + limit);
  }, [filteredSalaries, page, limit]);

  // Si la liste rétrécit (suppression), on évite de rester sur une page vide
  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [page, maxPage]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const checkAccessAndExecute = (action: () => void) => {
    if (!hasAdminAccess) {
      Swal.fire({
        icon: "warning",
        title: "Accès restreint",
        text: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 shadow-sm transition-colors",
        },
      });
      return;
    }
    action();
  };

  // Export CSV
  const exportToCSV = useCallback(() => {
    const headers = [
      "ID",
      "Poste",
      "Entreprise",
      `Salaire brut (${CURRENCY})`,
      `Salaire journalier (${CURRENCY})`,
      `Salaire net (${CURRENCY})`,
      "Employés",
      "Créé le",
    ];

    const rows = filteredSalaries.map((salary) => [
      salary.id,
      escapeCSV(salary.Post?.title),
      escapeCSV(salary.Enterprise?.name),
      salary.grossSalary ?? "",
      salary.dailySalary ?? "",
      salary.netSalary ?? "",
      salary.User?.length ?? 0,
      escapeCSV(salary.createdAt),
    ]);

    const csvContent = [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    // BOM pour un affichage correct des accents dans Excel
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `salaires_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredSalaries]);

  // Suppression d'un salaire
  const handleDeleteSalary = (id: number) => {
    checkAccessAndExecute(() => {
      Swal.fire({
        icon: "warning",
        title: "Confirmer la suppression",
        text: "Êtes-vous sûr de vouloir supprimer ce salaire ?",
        showCancelButton: true,
        cancelButtonText: "Annuler",
        confirmButtonText: "Oui, supprimer",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        customClass: {
          popup: "dark:bg-slate-800 dark:text-white rounded-xl border dark:border-slate-700",
        },
      }).then(async (confirmed) => {
        if (confirmed.isConfirmed) {
          try {
            await providers.API.delete(providers.APIUrl, "salaries", id, {});
            toast.success("Bravo", "Salaire supprimé avec succès");
            setSalariesList((prev) => prev.filter((salary) => salary.id !== id));
          } catch (err) {
            toast.error("Erreur", err instanceof Error ? err.message : "Erreur réseau");
          }
        }
      });
    });
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400">
                <FontAwesomeIcon icon={faMoneyBillWave} className="text-lg" />
              </span>
              Gestion des Salaires
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Grille des salaires par poste et par entreprise.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher par poste ou entreprise..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={exportToCSV}
              disabled={filteredSalaries.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all"
              title="Exporter au format CSV"
            >
              <FontAwesomeIcon icon={faFileDownload} className="text-slate-400" />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            <Link
              href="/dashboard/ADMIN/salary/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <span className="text-sm">+</span>
              <span>Ajouter un salaire</span>
            </Link>
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Poste</th>
                  <th scope="col" className="px-6 py-4">Entreprise</th>
                  <th scope="col" className="px-6 py-4 text-right">Salaire brut</th>
                  <th scope="col" className="px-6 py-4 text-right">Salaire journalier</th>
                  <th scope="col" className="px-6 py-4 text-right">Salaire net</th>
                  <th scope="col" className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: limit }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="ml-auto h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="ml-auto h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="ml-auto h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                     
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : currentData.length > 0 ? (
                  currentData.map((salary) => (
                    <tr
                      key={salary.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Poste */}
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {salary.Post?.title ?? "-"}
                      </td>

                      {/* Entreprise */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {salary.Enterprise?.name ?? "-"}
                      </td>

                      {/* Salaire brut */}
                      <td className="px-6 py-4 text-right tabular-nums whitespace-nowrap">
                        {formatAmount(salary.grossSalary)}
                      </td>

                      {/* Salaire journalier */}
                      <td className="px-6 py-4 text-right tabular-nums whitespace-nowrap">
                        {formatAmount(salary.dailySalary)}
                      </td>

                      {/* Salaire net */}
                      <td className="px-6 py-4 text-right tabular-nums font-semibold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatAmount(salary.netSalary)}
                      </td>

                      {/* Nombre d'employés rattachés */}
                      

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            title="Modifier"
                            onClick={() =>
                              checkAccessAndExecute(() => {
                                router.push(`/dashboard/ADMIN/salaries/edit/${salary.id}`);
                              })
                            }
                            className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                          >
                            <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                          </button>

                          <button
                            title="Supprimer"
                            onClick={() => handleDeleteSalary(salary.id)}
                            className="p-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                          >
                            <FontAwesomeIcon icon={faTrashAlt} className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      Aucun salaire trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{page}</span>{" "}
              sur{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">{maxPage}</span>
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                <span>Précédent</span>
              </button>

              <button
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                disabled={page === maxPage}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <span>Suivant</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
