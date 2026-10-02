"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import { providers } from "@/index";
import { tablesModal } from "@/components/Tables/tablesModal";
import { UsersPlanningsDto, UsersPlanningsResponseDto } from "@/types/global";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faChevronLeft,
  faChevronRight,
  faTrashAlt,
  faCalendarAlt,
  faClock,
  faBuilding,
  faUserGroup,
  faFolderOpen,
  faFileDownload,
  faFilter,
  faLayerGroup,
} from "@fortawesome/free-solid-svg-icons";

// Roles autorisés à supprimer un planning
const REQUIRED_ADMIN_ROLES = ["Super_Admin_Platform", "Supervisor-Admin"];

// Mapping des couleurs pour les jours de la semaine
const WEEKDAY_COLORS: Record<string, string> = {
  Lundi: "bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400",
  Mardi: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400",
  Mercredi: "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400",
  Jeudi: "bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-400/10 dark:text-purple-400",
  Vendredi: "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-400/10 dark:text-rose-400",
  Samedi: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-400/10 dark:text-indigo-400",
  Dimanche: "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-400/10 dark:text-slate-400",
};

export default function WeekDaysPlanningsList() {
  const { data: session, status } = useSession();

  // États principaux
  const [weekDaysPlannings, setWeekDaysPlannings] = useState<UsersPlanningsDto[]>([]);
  const [loading, setIsLoading] = useState(true);

  // Filtres & Recherche
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>("ALL");

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 8;

  // Fetch initial des données
  useEffect(() => {
    let isMounted = true;

    const fetchPlannings = async () => {
      if (status !== "authenticated" || !session?.user) return;
      setIsLoading(true);

      try {
        const userEnterpriseId = Number((session.user as { EnterpriseId?: number | string })?.EnterpriseId);
        const response = await providers.API.getAll<UsersPlanningsResponseDto>(
          providers.APIUrl,
          "users-plannings",
          null
        );

        if (!isMounted) return;

        const rawData = response?.data || [];
        const filteredData = rawData.filter((item: { EnterpriseId: number | null }) => {
          if (userEnterpriseId === 1) {
            return [1, 2, 3, 4, null].includes(item.EnterpriseId);
          }
          return item.EnterpriseId === userEnterpriseId;
        });

        setWeekDaysPlannings(filteredData);
      } catch (err) {
        console.error("[Planning Error] Chargement impossible:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchPlannings();

    return () => {
      isMounted = false;
    };
  }, [session, status]);

  // Jours uniques disponibles pour le filtre
  const availableDays = useMemo(() => {
    const days = new Set<string>();
    weekDaysPlannings.forEach((item) => {
      if (item.WeekDay?.name) days.add(item.WeekDay.name);
    });
    return Array.from(days);
  }, [weekDaysPlannings]);

  // Calcul des métriques KPI
  const stats = useMemo(() => {
    const totalCollaborators = new Set(weekDaysPlannings.map((p) => p.UserId)).size;
    const totalTypes = new Set(weekDaysPlannings.map((p) => p.PlanningTypeId)).size;
    return {
      totalPlannings: weekDaysPlannings.length,
      totalCollaborators,
      totalTypes,
    };
  }, [weekDaysPlannings]);

  // Filtrage combiné (Recherche texte & Jour)
  const filteredPlannings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return weekDaysPlannings.filter((item) => {
      const firstname = item?.User?.firstname?.toLowerCase() || "";
      const lastname = item?.User?.lastname?.toLowerCase() || "";
      const dayName = item?.WeekDay?.name?.toLowerCase() || "";

      const matchesSearch =
        !query ||
        firstname.includes(query) ||
        lastname.includes(query) ||
        dayName.includes(query);

      const matchesDay = selectedDay === "ALL" || item?.WeekDay?.name === selectedDay;

      return matchesSearch && matchesDay;
    });
  }, [weekDaysPlannings, search, selectedDay]);

  // Calculs pour la pagination
  const maxPage = Math.max(1, Math.ceil(filteredPlannings.length / limit));
  const currentData = useMemo(() => {
    const startIdx = (page - 1) * limit;
    return filteredPlannings.slice(startIdx, startIdx + limit);
  }, [filteredPlannings, page, limit]);

  // Handlers pour les filtres
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDayFilterChange = (day: string) => {
    setSelectedDay(day);
    setPage(1);
  };

  // Exportation CSV
  const exportToCSV = useCallback(() => {
    if (!filteredPlannings.length) return;

    const headers = ["Collaborateur", "Jour", "Type", "Début", "Fin", "Entreprise"];
    const rows = filteredPlannings.map((item) => [
      `"${item.User?.firstname || ""} ${item.User?.lastname || ""}"`,
      `"${item.WeekDay?.name || ""}"`,
      `"${item.PlanningType?.title || ""}"`,
      `"${item.Planning?.startTime?.split("T")[1]?.slice(0, 5) || ""}"`,
      `"${item.Planning?.endTime?.split("T")[1]?.slice(0, 5) || ""}"`,
      `"${item.Enterprise?.name || ""}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8,\uFEFF" +
      [headers.join(","), ...rows.map((row) => row.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `export_planning_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredPlannings]);

  // Suppression d'un item du planning
  const handleDelete = async (id: number) => {
    const userRole = (session?.user as { adminRole?: string })?.adminRole || "";

    if (!REQUIRED_ADMIN_ROLES.includes(userRole)) {
      return Swal.fire({
        icon: "warning",
        title: "Accès restreint",
        text: "Vous n'avez pas les privilèges nécessaires pour effectuer cette suppression.",
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl px-5 py-2.5 shadow-sm transition-colors",
        },
      });
    }

    const result = await Swal.fire({
      icon: "warning",
      title: "Retirer du planning ?",
      text: "Cette action est irréversible et supprimera le collaborateur de la plage horaire.",
      showCancelButton: true,
      cancelButtonText: "Annuler",
      confirmButtonText: "Oui, supprimer",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "dark:bg-slate-900 dark:text-white rounded-2xl border dark:border-slate-800",
        confirmButton: "rounded-xl font-medium px-5 py-2.5",
        cancelButton: "rounded-xl font-medium px-5 py-2.5",
      },
    });

    if (result.isConfirmed) {
      try {
        await providers.API.delete(providers.APIUrl, "users-plannings", id, {});
        // Mise à jour de l'état local sans rechargement de page
        setWeekDaysPlannings((prev) => prev.filter((item) => item.id !== id));

        Swal.fire({
          icon: "success",
          title: "Supprimé !",
          text: "Le planning a été mis à jour avec succès.",
          timer: 2000,
          showConfirmButton: false,
          customClass: {
            popup: "dark:bg-slate-900 dark:text-white rounded-2xl border dark:border-slate-800",
          },
        });
      } catch (error) {
        console.error("[Planning Error] Échec de suppression:", error);
        Swal.fire({
          icon: "error",
          title: "Erreur",
          text: "Impossible de supprimer cet enregistrement.",
        });
      }
    }
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Header Section */}
        {tablesModal.map((modal, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-lg" />
                </span>
                {modal.weekDaysPlanningList.pageTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Vue d'ensemble et orchestration du temps de travail des équipes.
              </p>
            </div>
          </div>
        ))}

        {/* Dashboard KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <KpiCard
            title="Total Plannings"
            value={stats.totalPlannings}
            loading={loading}
            icon={faCalendarAlt}
            color="blue"
          />
          <KpiCard
            title="Collaborateurs"
            value={stats.totalCollaborators}
            loading={loading}
            icon={faUserGroup}
            color="emerald"
          />
          <KpiCard
            title="Types de Service"
            value={stats.totalTypes}
            loading={loading}
            icon={faLayerGroup}
            color="purple"
          />
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm backdrop-blur-md">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Champ de recherche */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher un nom, prénom ou jour..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              />
            </div>

            {/* Filtre par Jour */}
            <div className="relative min-w-[170px]">
              <select
                value={selectedDay}
                onChange={(e) => handleDayFilterChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-200"
              >
                <option value="ALL">Tous les jours</option>
                {availableDays.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
              <FontAwesomeIcon
                icon={faFilter}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Export & Redirections */}
          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={exportToCSV}
              disabled={filteredPlannings.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all active:scale-[0.98]"
              title="Exporter au format CSV"
            >
              <FontAwesomeIcon icon={faFileDownload} className="text-slate-400" />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            {tablesModal.flatMap((modal) =>
              modal.weekDaysPlanningList.links.map((link) => (
                <Link
                  key={link.title}
                  href={link.href || "#"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:scale-[0.98] transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <FontAwesomeIcon icon={link.icon} className="text-sm" />
                  <span>{link.title}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Dynamic Table Card */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Collaborateur</th>
                  <th scope="col" className="px-6 py-4">Jour</th>
                  <th scope="col" className="px-6 py-4">Service / Type</th>
                  <th scope="col" className="px-6 py-4">Plage Horaire</th>
                  <th scope="col" className="px-6 py-4">Entreprise</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  <SkeletonRows />
                ) : currentData.length > 0 ? (
                  currentData.map((item) => {
                    const formatTime = (isoString?: string | null) =>
                      isoString ? isoString.split("T")[1]?.slice(0, 5) || null : null;

                    const startTime = formatTime(item.Planning?.startTime);
                    const breakStart = formatTime(item.Planning?.breakingStartTime);
                    const resume = formatTime(item.Planning?.resumeEndTime);
                    const endTime = formatTime(item.Planning?.endTime);
                    const hasBreak = Boolean(breakStart && resume);

                    const dayBadgeColor =
                      WEEKDAY_COLORS[item.WeekDay?.name] ||
                      "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-400/10 dark:text-slate-400";

                    const firstname = item.User?.firstname || "";
                    const lastname = item.User?.lastname || "";
                    const userInitials =
                      `${firstname[0] || ""}${lastname[0] || ""}`.toUpperCase() || "U";

                    return (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-slate-50/70 dark:hover:bg-slate-800/40"
                      >
                        {/* User Avatar & Identity */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {item.User?.photo ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700 shadow-sm">
                                <img
                                  src={`${providers.ImageUrl}/${item.User.photo}`}
                                  alt={`${firstname} ${lastname}`}
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-xs text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                {userInitials}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">
                                {firstname} {lastname}
                              </p>
                            </div>
                          </div>
                        </td>

                        {/* Weekday Badge */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${dayBadgeColor}`}
                          >
                            {item.WeekDay?.name || "Non spécifié"}
                          </span>
                        </td>

                        {/* Service Type */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {item.PlanningType?.title || "Standard"}
                          </span>
                        </td>

                        {/* Schedule Slot */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 text-xs font-semibold text-slate-700 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                            <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                            <span>
                              {startTime || "--:--"} - {hasBreak ? breakStart : endTime || "--:--"}
                            </span>
                            {hasBreak && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <span>
                                  {resume} - {endTime || "--:--"}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Enterprise Details */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {item.Enterprise?.logo ? (
                              <div className="relative h-6 w-6 shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                <Image
                                  src={`${providers.APIUrl}/images/${item.Enterprise.logo}`}
                                  alt={item.Enterprise?.name || "Logo"}
                                  fill
                                  sizes="24px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <FontAwesomeIcon icon={faBuilding} className="text-slate-400 text-xs" />
                            )}
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              {item.Enterprise?.name || "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors"
                            title="Retirer du planning"
                          >
                            <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  /* Zero State View */
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                          <FontAwesomeIcon icon={faFolderOpen} className="text-xl" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          Aucun résultat trouvé
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Ajustez vos filtres ou la recherche pour trouver vos informations.
                        </p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Footer & Pagination */}
          <div className="px-6 py-4 flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 bg-slate-50/30 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row">
            <div className="text-sm text-slate-500 dark:text-slate-400">
              Affichage de{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {filteredPlannings.length === 0 ? 0 : (page - 1) * limit + 1}
              </span>{" "}
              à{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {Math.min(page * limit, filteredPlannings.length)}
              </span>{" "}
              sur{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">
                {filteredPlannings.length}
              </span>{" "}
              résultats
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
                <span>Précédent</span>
              </button>

              <button
                disabled={page >= maxPage}
                onClick={() => setPage((prev) => Math.min(prev + 1, maxPage))}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
              >
                <span>Suivant</span>
                <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Composant KPI interne
function KpiCard({
  title,
  value,
  loading,
  icon,
  color,
}: {
  title: string;
  value: number;
  loading: boolean;
  icon: any;
  color: "blue" | "emerald" | "purple";
}) {
  const colorMap = {
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
    emerald: "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400",
    purple: "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400",
  };

  return (
    <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
          {loading ? "-" : value}
        </p>
      </div>
      <div
        className={`h-12 w-12 rounded-xl ${colorMap[color]} flex items-center justify-center text-lg`}
      >
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  );
}

// Skeletons de chargement
function SkeletonRows() {
  return (
    <>
      {Array.from({ length: 5 }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
            </div>
          </td>
          <td className="px-6 py-4">
            <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </td>
          <td className="px-6 py-4">
            <div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </td>
          <td className="px-6 py-4">
            <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
          </td>
          <td className="px-6 py-4 text-right">
            <div className="h-8 w-8 ml-auto bg-slate-200 dark:bg-slate-800 rounded-lg" />
          </td>
        </tr>
      ))}
    </>
  );
}