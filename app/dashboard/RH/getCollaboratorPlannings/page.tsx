"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { providers } from "@/index";
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
  faLayerGroup
} from "@fortawesome/free-solid-svg-icons";
import { tablesModal } from "@/components/Tables/tablesModal";
import Swal from "sweetalert2";
import { useSession } from "next-auth/react";

type WeekDaysPlannings = {
  id: number;
  WeekDaysId: number;
  PlanningTypeId: number;
  PlanningId: number;
  EnterpriseId: number;
  Enterprise: {
    name: string | null;
    logo: string | null;
  };
  WeekDays: {
    name: string;
  };
  PlanningType: {
    title: string;
  };
  Planning: {
    startTime: string;
    breakingStartTime: string;
    resumeEndTime: string;
    endTime: string;
  };
  UserId: number;
  User: {
    firstname: string;
    lastname: string;
    photo: string | null;
  };
};

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
  const [search, setSearch] = useState("");
  const [selectedDay, setSelectedDay] = useState<string>("ALL");
  const [weekDaysPlannings, setWeekDaysPlannings] = useState<WeekDaysPlannings[]>([]);
  const [loading, setIsLoading] = useState(true);
  
  const requireAdminRoles = ["Super-Admin", "Supervisor-Admin"];
  const { data: session, status } = useSession();

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 8;

  useEffect(() => {
    (async () => {
      if (status !== "authenticated" || !session?.user) return;
      setIsLoading(true);
      try {
        const EnterpriseId = Number((session.user as any).EnterpriseId);
        const request = await providers.API.getAll(
          "https://vps118934.serveur-vps.net:4001",
          "getAllCollaboratorPlannings",
          null
        );

        let filteredData = [];
        if (Number(EnterpriseId) === 1) {
          filteredData = request.filter((item: { EnterpriseId: number }) =>
            [1, 2, 3, 4, null].includes(item.EnterpriseId)
          );
        } else {
          filteredData = request.filter(
            (item: { EnterpriseId: number }) => item.EnterpriseId === Number(EnterpriseId)
          );
        }

        setWeekDaysPlannings(filteredData);
      } catch (err) {
        console.error("Erreur de chargement des plannings:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [session, status]);

  // Jours uniques pour le filtre
  const availableDays = useMemo(() => {
    const days = new Set<string>();
    weekDaysPlannings.forEach((item) => {
      if (item.WeekDays?.name) days.add(item.WeekDays.name);
    });
    return Array.from(days);
  }, [weekDaysPlannings]);

  // Métriques KPI
  const stats = useMemo(() => {
    const totalCollaborators = new Set(weekDaysPlannings.map((p) => p.UserId)).size;
    const totalTypes = new Set(weekDaysPlannings.map((p) => p.PlanningTypeId)).size;
    return {
      totalPlannings: weekDaysPlannings.length,
      totalCollaborators,
      totalTypes,
    };
  }, [weekDaysPlannings]);

  // Recherche & Filtrage
  const filteredPlannings = useMemo(() => {
    return weekDaysPlannings.filter((item) => {
      const matchesSearch =
        !search.trim() ||
        item?.User?.lastname?.toLowerCase().includes(search.toLowerCase()) ||
        item?.User?.firstname?.toLowerCase().includes(search.toLowerCase()) ||
        item?.WeekDays?.name?.toLowerCase().includes(search.toLowerCase());

      const matchesDay = selectedDay === "ALL" || item?.WeekDays?.name === selectedDay;

      return matchesSearch && matchesDay;
    });
  }, [weekDaysPlannings, search, selectedDay]);

  // Calculs Pagination
  const maxPage = Math.max(1, Math.ceil(filteredPlannings.length / limit));
  const currentData = useMemo(() => {
    const startIdx = (page - 1) * limit;
    return filteredPlannings.slice(startIdx, startIdx + limit);
  }, [filteredPlannings, page, limit]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleDayFilterChange = (day: string) => {
    setSelectedDay(day);
    setPage(1);
  };

  // Export CSV
  const exportToCSV = useCallback(() => {
    const headers = ["Collaborateur", "Jour", "Type", "Début", "Fin", "Entreprise"];
    const rows = filteredPlannings.map((item) => [
      `"${item.User?.firstname || ""} ${item.User?.lastname || ""}"`,
      `"${item.WeekDays?.name || ""}"`,
      `"${item.PlanningType?.title || ""}"`,
      `"${item.Planning?.startTime?.split("T")[1]?.slice(0, 5) || ""}"`,
      `"${item.Planning?.endTime?.split("T")[1]?.slice(0, 5) || ""}"`,
      `"${item.Enterprise?.name || ""}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `planning_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredPlannings]);

  // Suppression
  const handleDelete = async (id: number) => {
    const userRole = (session?.user as any)?.adminRole || "";
    if (!requireAdminRoles.includes(userRole)) {
      return Swal.fire({
        icon: "warning",
        title: "Accès restreint",
        text: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
        customClass: {
          confirmButton: "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 shadow-sm transition-colors",
        },
      });
    }

    Swal.fire({
      icon: "warning",
      title: "Confirmer la suppression",
      text: "Voulez-vous vraiment retirer ce collaborateur du planning ?",
      showCancelButton: true,
      cancelButtonText: "Annuler",
      confirmButtonText: "Oui, supprimer",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "dark:bg-slate-800 dark:text-white rounded-xl border dark:border-slate-700",
      }
    }).then(async (confirmed) => {
      if (confirmed.isConfirmed) {
        try {
          const response = await providers.API.delete(
            providers.APIUrl,
            "deleteUserInPlanningOfWeek",
            id,
            {}
          );
          providers.alertMessage(
            response.status,
            response.title,
            response.message,
            "/dashboard/RH/getUsersInPlanningOfWeek"
          );
          setWeekDaysPlannings((prev) => prev.filter((item) => item.id !== id));
        } catch (error) {
          console.error("Erreur suppression:", error);
        }
      }
    });
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <main className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Fil d'Ariane */}
        {tablesModal.map((e, index) => (
          <div
            key={index}
            className="flex flex-col gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                  <FontAwesomeIcon icon={faCalendarAlt} className="text-lg" />
                </span>
                {e.weekDaysPlanningList.pageTitle}
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Vue d'ensemble et orchestration du temps de travail des équipes.
              </p>
            </div>
          </div>
        ))}

        {/* Cartes d'Indicateurs (KPI Top Dashboard) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Plannings
              </p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {loading ? "-" : stats.totalPlannings}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Collaborateurs
              </p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {loading ? "-" : stats.totalCollaborators}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              <FontAwesomeIcon icon={faUserGroup} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Types de Service
              </p>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {loading ? "-" : stats.totalTypes}
              </p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-lg">
              <FontAwesomeIcon icon={faLayerGroup} />
            </div>
          </div>
        </div>

        {/* Toolbar (Filtres, Recherche, Actions) */}
        <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            {/* Champ de recherche */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou jour..."
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
            <div className="relative min-w-[160px]">
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

          {/* Boutons d'Action & Links */}
          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={exportToCSV}
              disabled={filteredPlannings.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all"
              title="Exporter au format CSV"
            >
              <FontAwesomeIcon icon={faFileDownload} className="text-slate-400" />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            {tablesModal.flatMap((e) =>
              e.weekDaysPlanningList.links.map((item) => (
                <Link
                  key={item.title}
                  href={item.href || "#"}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <FontAwesomeIcon icon={item.icon} className="text-sm" />
                  <span>{item.title}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Tableau Master */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              {/* Entête */}
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

              {/* Corps */}
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-7 w-36 bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4 text-right"><div className="h-8 w-8 ml-auto bg-slate-200 dark:bg-slate-800 rounded-lg" /></td>
                    </tr>
                  ))
                ) : currentData.length > 0 ? (
                  currentData.map((u) => {
                    const formatTime = (isoString?: string | null) => {
                      if (!isoString) return null;
                      return isoString.split("T")[1]?.slice(0, 5) || null;
                    };

                    const startTime = formatTime(u.Planning?.startTime);
                    const breakStart = formatTime(u.Planning?.breakingStartTime);
                    const resume = formatTime(u.Planning?.resumeEndTime);
                    const endTime = formatTime(u.Planning?.endTime);
                    const hasBreak = Boolean(breakStart && resume);

                    const dayBadgeColor =
                      WEEKDAY_COLORS[u.WeekDays?.name] ||
                      "bg-slate-500/10 text-slate-600 border-slate-500/20 dark:bg-slate-400/10 dark:text-slate-400";

                    const userInitials =
                      `${u.User?.firstname?.[0] || ""}${u.User?.lastname?.[0] || ""}`.toUpperCase() || "U";

                    return (
                      <tr
                        key={u.id}
                        className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/30"
                      >
                        {/* Avatar & Identité */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            {u.User?.photo ? (
                              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 dark:border-slate-700">
                                <Image
                                  src={`${providers.APIUrl}/images/${u.User.photo}`}
                                  alt=""
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 font-bold text-sm text-slate-600 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700">
                                {userInitials}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-slate-900 dark:text-slate-100">
                                {u.User?.firstname} {u.User?.lastname}
                              </p>
                              {/* <p className="text-sm text-slate-400 font-mono">ID: #{u.UserId}</p> */}
                            </div>
                          </div>
                        </td>

                        {/* Jour de la semaine (Color-coded) */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-lg text-sm font-semibold border ${dayBadgeColor}`}
                          >
                            {u.WeekDays?.name || "Non spécifié"}
                          </span>
                        </td>

                        {/* Type de planning */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {u.PlanningType?.title || "Standard"}
                          </span>
                        </td>

                        {/* Horaires */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100/80 text-sm font-semibold text-slate-700 border border-slate-200/60 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700">
                            <FontAwesomeIcon icon={faClock} className="text-blue-500" />
                            <span>
                              {startTime} - {hasBreak ? breakStart : endTime}
                            </span>
                            {hasBreak && (
                              <>
                                <span className="text-slate-300 dark:text-slate-600">|</span>
                                <span>
                                  {resume} - {endTime}
                                </span>
                              </>
                            )}
                          </div>
                        </td>

                        {/* Entreprise */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {u.Enterprise?.logo ? (
                              <div className="relative h-6 w-6 shrink-0 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
                                <Image
                                  src={`${providers.APIUrl}/images/${u.Enterprise.logo}`}
                                  alt=""
                                  fill
                                  sizes="24px"
                                  className="object-cover"
                                />
                              </div>
                            ) : (
                              <FontAwesomeIcon icon={faBuilding} className="text-slate-400 text-sm" />
                            )}
                            <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                              {u.Enterprise?.name || "N/A"}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                          <button
                            type="button"
                            onClick={() => handleDelete(u.id)}
                            className="inline-flex items-center justify-center h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                            title="Retirer du planning"
                          >
                            <FontAwesomeIcon icon={faTrashAlt} className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  /* Zero State */
                  <tr>
                    <td colSpan={6} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                        <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4 shadow-inner">
                          <FontAwesomeIcon icon={faFolderOpen} className="text-2xl" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                          Aucun résultat trouvé
                        </h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                          Essayez de réinitialiser la recherche ou de modifier votre filtre par jour.
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
              Affichage de <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPlannings.length === 0 ? 0 : (page - 1) * limit + 1}</span> à{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">{Math.min(page * limit, filteredPlannings.length)}</span> sur{" "}
              <span className="font-bold text-slate-800 dark:text-slate-200">{filteredPlannings.length}</span> résultats
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