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
  faBuilding,
  faFileDownload,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { providers } from "@/index";
import { tablesModal } from "@/components/Tables/tablesModal";
import { useToast } from "@/components/toast";
import { DepartmentPost, DepartmentsPostResponseDto } from "@/types/global";

const REQUIRED_ADMIN_ROLES = ["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"];

export default function DepartmentsList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  // Configuration & Constantes
  const limit = 8;

  // 1. Déstructuration sécurisée des données de session
  const user = session?.user as any;
  const adminRole = user?.adminRole ?? "";
  const mainEnterpriseId = Number(user?.MainEnterpriseId || 0);
  const enterpriseId = Number(user?.EnterpriseId || 0);
  const hasAdminAccess = REQUIRED_ADMIN_ROLES.includes(adminRole);

  // 2. États locaux
  const [departmentsList, setDepartmentsList] = useState<DepartmentPost[]>([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // 3. Récupération des données des départements
  useEffect(() => {
    async function fetchDepartments() {
      if (status === "loading") return;

      if (status !== "authenticated" || !session?.user) {
        setLoading(false);
        return;
      }

      if (!REQUIRED_ADMIN_ROLES.includes(adminRole)) {
        window.location.href = "/home";
        return;
      }

      try {
        setLoading(true);
        // Utilisation de la réponse typée DepartmentsPostResponseDto
        const response = await providers.API.getAll<DepartmentsPostResponseDto>(providers.APIUrl, "departments", null);
        const rawDepartments: DepartmentPost[] = response.data;

        let filtered: DepartmentPost[] = [];

        if (adminRole === "Super_Admin_Platform") {
          filtered = rawDepartments;
        } else if (adminRole === "Enterprise_Admin" || adminRole === "Super_Admin_Enterprise") {
          // Filtrage par EnterpriseId si nécessaire selon votre logique métier
          filtered = rawDepartments.filter(
            (dept) => dept.EnterpriseId === enterpriseId || adminRole === "Super_Admin_Enterprise"
          );
        }

        setDepartmentsList(filtered);
      } catch (error) {
        toast.error("Erreur", "Erreur lors de la récupération des départements");
        console.error("Erreur fetchDepartments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDepartments();
  }, [status, session, adminRole, enterpriseId]);

  // 4. Filtrage & Recherche
  const filteredDepartments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return departmentsList.filter((dept) => {
      const matchesSearch =
        !query ||
        dept.name?.toLowerCase().includes(query) ||
        dept.description?.toLowerCase().includes(query);
      return matchesSearch;
    });
  }, [departmentsList, search]);

  // Pagination & Découpage des données
  const maxPage = Math.max(1, Math.ceil(filteredDepartments.length / limit));

  const currentData = useMemo(() => {
    const startIdx = (page - 1) * limit;
    return filteredDepartments.slice(startIdx, startIdx + limit);
  }, [filteredDepartments, page, limit]);

  // Gestionnaires d'événements
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
    const headers = ["ID", "Nom", "Description", "Entreprise", "Créé le"];
    const rows = filteredDepartments.map((dept) => [
      dept.id,
      `"${dept.name || ""}"`,
      `"${dept.description || ""}"`,
      dept.EnterpriseId,
      `"${dept.createdAt || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `departements_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredDepartments]);

  // Suppression d'un département
  const handleDeleteDepartment = (id: number) => {
    checkAccessAndExecute(() => {
      Swal.fire({
        icon: "warning",
        title: "Confirmer la suppression",
        text: "Êtes-vous sûr de vouloir supprimer ce département ?",
        showCancelButton: true,
        cancelButtonText: "Annuler",
        confirmButtonText: "Oui, supprimer",
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#64748b",
        customClass: {
          popup:
            "dark:bg-slate-800 dark:text-white rounded-xl border dark:border-slate-700",
        },
      }).then(async (confirmed) => {
        if (confirmed.isConfirmed) {
          try {
            await providers.API.delete(
              providers.APIUrl,
              "departments",
              id,
              {}
            );
            toast.success("Bravo", "Département supprimé avec succès");
            setDepartmentsList((prev) => prev.filter((dept) => dept.id !== id));
          } catch (err) {
            toast.error(
              "Erreur",
              err instanceof Error ? err.message : "Erreur réseau"
            );
          }
        }
      });
    });
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Header & Fil d'Ariane */}
        <div className="flex flex-col gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400">
                <FontAwesomeIcon icon={faBuilding} className="text-lg" />
              </span>
              Gestion des Départements
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Gestion centralisée et suivi des départements de postes.
            </p>
          </div>
        </div>

        {/* Toolbar (Filtres, Recherche, Actions) */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Champ de recherche */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher par le nom...."
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

          {/* Boutons d'Action & Links */}
          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={exportToCSV}
              disabled={filteredDepartments.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all"
              title="Exporter au format CSV"
            >
              <FontAwesomeIcon icon={faFileDownload} className="text-slate-400" />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            <Link
              href="/dashboard/ADMIN/department/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <span className="text-sm">+</span>
              <span>Ajouter un département</span>
            </Link>
          </div>
        </div>

        {/* Tableau Master */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Nom</th>
                  <th scope="col" className="px-6 py-4">Description</th>
                  <th scope="col" className="px-6 py-4">Entreprise</th>
                  <th scope="col" className="px-6 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: limit }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="h-4 w-16 bg-slate-200 dark:bg-slate-800 rounded-md" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                          <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : currentData.length > 0 ? (
                  currentData.map((dept) => (
                    <tr
                      key={dept.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Nom */}
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {dept.name ?? ""}
                      </td>

                      {/* Description */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                        {dept.description ? `${dept.description.slice(0, 30)}...` : "-"}
                      </td>

                      {/* Entreprise ID */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {dept.Enterprise?.name ?? "-"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          <button
                            title="Modifier"
                            onClick={() =>
                              checkAccessAndExecute(() => {
                                router.push(
                                  `/dashboard/ADMIN/departments/edit/${dept.id}`
                                );
                              })
                            }
                            className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                          >
                            <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                          </button>

                          <button
                            title="Supprimer"
                            onClick={() => handleDeleteDepartment(dept.id)}
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
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      Aucun département trouvé.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {page}
              </span>{" "}
              sur{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {maxPage}
              </span>
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