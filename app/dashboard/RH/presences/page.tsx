"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faSearch,
  faTimes,
  faUserCheck,
  faClock,
  faUserXmark,
  faUsers,
  faEye,
  faTrashAlt,
  faFileDownload,
  faPlus
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { providers } from "@/index";
import { tablesModal } from "@/components/Tables/tablesModal";
import { PresencesListHookModal } from "./hook";
import AddPresenceModal from "./addPresenceModal/page";
import UpdatePresenceModal from "./updatePresenceModal/page";
import { useToast } from "@/components/toast";

const REQUIRED_ADMIN_ROLES = ["Super_Admin_Platform", "Super_Admin_Enterprise"];

export default function PresencesList() {
  const { presencesListCloned = [], adminRole, onSearch, isLoading } = PresencesListHookModal();
  const toast = useToast();

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 8;
  const [pagination, setPagination] = useState(0);

  // Modals
  const [showAddPresenceModal, setShowAddPresenceModal] = useState(false);
  const [showUpdatePresenceModal, setShowUpdatePresenceModal] = useState(false);

  // Calcul du nombre de pages
  const totalPages = Math.max(1, Math.ceil(presencesListCloned.length / limit));

  // Recalcul du découpage actuel des données
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return presencesListCloned.slice(start, start + limit);
  }, [presencesListCloned, currentPage, limit]);

  // Réinitialiser la page à 1 quand les données changent (recherche/filtre)
  useEffect(() => {
    setCurrentPage(1);
  }, [presencesListCloned.length]);

  // Statistiques
  const stats = useMemo(() => {
    const total = presencesListCloned.length;
    const onTime = presencesListCloned.filter((p) => p.status === "A temps").length;
    const late = presencesListCloned.filter((p) => p.status === "En retard").length;
    const absent = total - (onTime + late);
    return { total, onTime, late, absent };
  }, [presencesListCloned]);

  // Contrôle des accès d'administration
  const hasAdminAccess = useCallback(() => {
    if (!REQUIRED_ADMIN_ROLES.includes(adminRole ?? "")) {
      Swal.fire({
        icon: "warning",
        title: "Accès restreint",
        text: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
        customClass: {
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 shadow-sm transition-colors",
        },
      });
      return false;
    }
    return true;
  }, [adminRole]);

  // Export CSV
  const exportToCSV = useCallback(() => {
    const headers = ["Collaborateur", "Arrivée", "Pause", "Reprise", "Départ", "Date", "Entreprise", "Statut"];
    const rows = presencesListCloned.map((item) => [
      `"${item.User?.lastname || ""} ${item.User?.firstname || ""}"`,
      `"${item.arrivalTime || "--:--"}"`,
      `"${item.breakStartTime || "--:--"}"`,
      `"${item.resumeTime || "--:--"}"`,
      `"${item.departureTime || "--:--"}"`,
      `"${item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : ""}"`,
      `"${item.Enterprise?.name || "N/A"}"`,
      `"${item.status || "N/A"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `presences_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [presencesListCloned]);

  // Suppression
  const handleDelete = (userId: number, createdAt: string) => {
    if (!hasAdminAccess()) return;

    Swal.fire({
      icon: "warning",
      title: "Confirmer la suppression",
      text: "Êtes-vous sûr de vouloir supprimer cet enregistrement de présence ?",
      showCancelButton: true,
      cancelButtonText: "Annuler",
      confirmButtonText: "Oui, supprimer",
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#64748b",
      customClass: {
        popup: "dark:bg-slate-800 dark:text-white rounded-xl border dark:border-slate-700",
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const response = await providers.API.delete(
            providers.APIUrl,
            "deleteUserAttendance",
            userId,
            { createdAt }
          );

          if (response.status) {
            toast.success("Succès", response.message || "Présence supprimée avec succès.");
            window.location.reload();
          } else {
            toast.error("Erreur", response.message || "Échec de la suppression.");
          }
        } catch (err) {
          toast.error("Erreur", "Une erreur est survenue lors de la suppression.");
        }
      }
    });
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Overlay Modales */}
        {(showAddPresenceModal || showUpdatePresenceModal) && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
            <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-900 border dark:border-slate-800 p-6">
              <button
                onClick={() => {
                  setShowAddPresenceModal(false);
                  setShowUpdatePresenceModal(false);
                }}
                className="absolute right-4 top-4 flex h-10 w-10 z-50 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
              >
                <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
              </button>
              {showAddPresenceModal && <AddPresenceModal />}
              {showUpdatePresenceModal && <UpdatePresenceModal />}
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400">
                <FontAwesomeIcon icon={faUsers} className="text-lg" />
              </span>
              {tablesModal[0]?.presencesList?.pageTitle || "Présences au poste"}
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Suivi en temps réel des pointages et de la ponctualité des équipes.
            </p>
          </div>
        </div>

        {/* Cartes KPI */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between animate-pulse"
              >
                <div className="space-y-2 w-full">
                  <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-7 w-12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="h-12 w-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex-shrink-0"></div>
              </div>
            ))
          ) : (
            <>
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Total Enregistrés
                  </p>
                  <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                    {stats.total}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
                  <FontAwesomeIcon icon={faUsers} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    À temps
                  </p>
                  <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                    {stats.onTime}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
                  <FontAwesomeIcon icon={faUserCheck} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    En retard
                  </p>
                  <p className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-1">
                    {stats.late}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
                  <FontAwesomeIcon icon={faClock} />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Absences / Autre
                  </p>
                  <p className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-1">
                    {stats.absent}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-lg">
                  <FontAwesomeIcon icon={faUserXmark} />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Rechercher un collaborateur..."
              onChange={(e) => onSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
            />
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
            />
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center gap-2.5 lg:justify-end">
            <button
              onClick={exportToCSV}
              disabled={isLoading || presencesListCloned.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all"
              title="Exporter au format CSV"
            >
              <FontAwesomeIcon icon={faFileDownload} className="text-slate-400" />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            {tablesModal.flatMap((e) =>
              e.presencesList.links.map((item) => (
                <button
                  key={item.title}
                  onClick={() => {
                    if (!hasAdminAccess()) return;
                    if (!item.href) {
                      item.modal === "addPresenceModal"
                        ? setShowAddPresenceModal(true)
                        : setShowUpdatePresenceModal(true);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
                >
                  <FontAwesomeIcon icon={item.icon || faPlus} className="text-sm" />
                  <span>{item.title}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 text-sm font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Collaborateur</th>
                  <th scope="col" className="px-6 py-4">Arrivée / Pause</th>
                  <th scope="col" className="px-6 py-4">Reprise / Départ</th>
                  <th scope="col" className="px-6 py-4">Date</th>
                  <th scope="col" className="px-6 py-4 text-center">Entreprise</th>
                  <th scope="col" className="px-6 py-4 text-center">Statut</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: limit }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
                          <div className="space-y-1.5">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800 mx-auto"></div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto"></div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedData.length > 0 ? (
                  paginatedData.map((u) => (
                    <tr
                      key={`${u.UserId}-${u.createdAt}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 flex-shrink-0">
                            <Image
                              src={
                                u.User?.photo
                                  ? `${providers.APIUrl}/images/${u.User.photo}`
                                  : "/images/clientProfile.png"
                              }
                              alt={u.User?.lastname || "Avatar"}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {u.User?.firstname}
                            </div>
                            <p className="text-sm text-slate-400">Collaborateur</p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-sm font-medium">
                          <span className="text-slate-800 dark:text-slate-200">
                            <span className="text-slate-400 font-normal">Arrivée :</span>{" "}
                            {["00:00:00", "00:00"].includes(String(u.arrivalTime))
                              ? "--:--"
                              : u.arrivalTime}
                          </span>
                          <span className="text-slate-400">
                            Pause : {u.breakStartTime ?? "--:--"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-sm font-medium">
                          <span className="text-slate-800 dark:text-slate-200">
                            <span className="text-slate-400 font-normal">Reprise :</span>{" "}
                            {u.resumeTime ?? "--:--"}
                          </span>
                          <span className="text-slate-400">
                            Départ : {u.departureTime ?? "--:--"}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
                        {u.createdAt
                          ? new Date(u.createdAt).toLocaleDateString("fr-FR", {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })
                          : "-"}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {u.Enterprise?.logo ? (
                          <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 mx-auto">
                            <Image
                              src={`${providers.APIUrl}/images/${u.Enterprise.logo}`}
                              alt={u.Enterprise.name || "Logo"}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-sm font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {u.Enterprise?.name || "N/A"}
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${u.status === "A temps"
                            ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400"
                            : u.status === "En retard"
                              ? "bg-amber-500/10 text-amber-600 border border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400"
                              : "bg-rose-500/10 text-rose-600 border border-rose-500/20 dark:bg-rose-400/10 dark:text-rose-400"
                            }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${u.status === "A temps"
                              ? "bg-emerald-500"
                              : u.status === "En retard"
                                ? "bg-amber-500"
                                : "bg-rose-500"
                              }`}
                          />
                          {u.status}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/RH/user/presences/${u.UserId}`}
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all"
                            title="Voir l'historique"
                          >
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(u.UserId, String(u.createdAt))}
                            className="p-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                            title="Supprimer"
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
                      <div className="mx-auto flex max-w-xs flex-col items-center justify-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
                          <FontAwesomeIcon icon={faSearch} className="text-lg" />
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          Aucune présence trouvée
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          Ajustez votre recherche ou enregistrez une nouvelle présence.
                        </p>
                      </div>
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
                {currentPage === 1 ? totalPages : (totalPages - currentPage) + 1}
              </span>{" "}
              sur{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {totalPages}
              </span>
            </p>

            <div className="flex items-center gap-2">
              {/* Bouton Précédent (Retourne aux données plus récentes, désactivé à la page 1) */}
              <button
                disabled={currentPage === totalPages || isLoading}
                onClick={() => setCurrentPage((prev) => Math.max(prev + 1, 1))}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
                <span>Précédent</span>
              </button>

              {/* Bouton Suivant (Avance vers les données plus anciennes, désactivé à la dernière page) */}
              <button
                disabled={currentPage === 1 || isLoading}
                onClick={() => setCurrentPage((prev) => Math.min(prev - 1, totalPages))}
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