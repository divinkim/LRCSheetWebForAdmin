"use client";

import { useEffect, useState, useMemo } from "react";
import { providers } from "@/index";
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
  faTrashAlt
} from "@fortawesome/free-solid-svg-icons";
import { tablesModal } from "@/components/Tables/tablesModal";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { PresencesListHookModal } from "./hook";
import AddPresenceModal from "./addPresenceModal/page";
import UpdatePresenceModal from "./updatePresenceModal/page";
import { useToast } from "@/components/toast";

export default function PresencesList() {
  const { presencesListCloned = [], adminRole, onSearch } = PresencesListHookModal();
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 6; // Nombre d'éléments par page

  // Modals
  const [showAddPresenceModal, setShowAddPresenceModal] = useState(false);
  const [showUpdatePresenceModal, setShowUpdatePresenceModal] = useState(false);

  const requireAdminRoles = ["Super-Admin", "Supervisor-Admin"];
  const toast = useToast();

  // Calcul du nombre de pages
  const totalPages = Math.max(1, Math.ceil(presencesListCloned.length / limit));

  // Recalcul du découpage actuel des données
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * limit;
    return presencesListCloned.slice(start, start + limit);
  }, [presencesListCloned, currentPage, limit]);

  // Réinitialiser la page à 1 quand la recherche change
  useEffect(() => {
    setCurrentPage(1);
  }, [presencesListCloned.length]);

  // Statistiques calculées à la volée pour les KPI cards
  const stats = useMemo(() => {
    const total = presencesListCloned.length;
    const onTime = presencesListCloned.filter(p => p.status === "A temps").length;
    const late = presencesListCloned.filter(p => p.status === "En retard").length;
    const absent = total - (onTime + late);
    return { total, onTime, late, absent };
  }, [presencesListCloned]);

  const hasAdminAccess = () => {
    if (!requireAdminRoles.includes(adminRole ?? "")) {
      toast.error("Violation d'accès", "Vous n'avez pas le droit d'effectuer cette action.");
      return false;
    }
    return true;
  };

  const handleDelete = async (userId: string, createdAt: string) => {
    if (!hasAdminAccess()) return;

    try {
      const response = await providers.API.delete(
        providers.APIUrl,
        "deleteUserAttendance",
        userId,
        { createdAt }
      );
      providers.alertMessage(
        response.status,
        response.title,
        response.message,
        response.status ? "/dashboard/RH/presencesList" : null
      );
    } catch (err) {
      toast.error("Erreur", "Une erreur est survenue lors de la suppression.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 dark:bg-slate-900/50 sm:p-6 lg:p-8">
      {/* OVERLAY MODALES (UI/UX Moderne) */}
      {(showAddPresenceModal || showUpdatePresenceModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 transition-all">
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl dark:bg-slate-800 p-6">
            <button
              onClick={() => {
                setShowAddPresenceModal(false);
                setShowUpdatePresenceModal(false);
              }}
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600"
            >
              <FontAwesomeIcon icon={faTimes} className="h-4 w-4" />
            </button>
            {showAddPresenceModal && <AddPresenceModal />}
            {showUpdatePresenceModal && <UpdatePresenceModal />}
          </div>
        </div>
      )}

      {/* 📌 HEADER & BREADCRUMB */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-white">
            {tablesModal[0]?.presencesList?.pageTitle || "Présences au poste"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Suivi en temps réel des pointages et de la ponctualité des équipes.
          </p>
        </div>

        <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
          <span className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Dashboard</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">RH</span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="rounded-md bg-blue-50 px-2 py-1 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
            Présences
          </span>
        </nav>
      </div>

      {/* 📊 CARTE KPI (Ajout UX Super Pro) */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
            <FontAwesomeIcon icon={faUsers} className="text-xl" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Enregistrés</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.total}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
            <FontAwesomeIcon icon={faUserCheck} className="text-xl" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">À temps</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.onTime}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
            <FontAwesomeIcon icon={faClock} className="text-xl" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">En retard</p>
            <p className="text-xl font-bold text-amber-600 dark:text-amber-400">{stats.late}</p>
          </div>
        </div>

        <div className="flex items-center gap-4 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-800">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400">
            <FontAwesomeIcon icon={faUserXmark} className="text-xl" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Absences / Autre</p>
            <p className="text-xl font-bold text-slate-800 dark:text-white">{stats.absent}</p>
          </div>
        </div>
      </div>

      {/* 🔍 BARRE DE RECHERCHE ET ACTIONS */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Rechercher un collaborateur..."
            onChange={(e) => onSearch(e.target.value, "")}
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:ring-blue-900/30"
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
        </div>

        <div className="flex items-center gap-3">
          {tablesModal.flatMap((e) =>
            e.presencesList.links.map((item) => (
              <button
                key={item.title}
                onClick={(e) => {
                  if (!hasAdminAccess()) return;
                  if (!item.href) {
                    item.modal === "addPresenceModal"
                      ? setShowAddPresenceModal(true)
                      : setShowUpdatePresenceModal(true);
                  }
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                <FontAwesomeIcon icon={item.icon} className="text-sm" />
                <span>{item.title}</span>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 🧾 TABLEAU PRO */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200 bg-slate-50/50 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-700/60 dark:bg-slate-800/80 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4">Collaborateur</th>
                <th className="px-6 py-4">Arrivée / Pause</th>
                <th className="px-6 py-4">Reprise / Départ</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4 text-center">Entreprise</th>
                <th className="px-6 py-4 text-center">Statut</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {paginatedData.length > 0 ? (
                paginatedData.map((u) => (
                  <tr
                    key={`${u.UserId}-${u.createdAt}`}
                    className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-700/30"
                  >
                    {/* Collaborateur (Photo + Nom) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        <img
                          src={
                            u.User?.photo
                              ? `${providers.APIUrl}/images/${u.User.photo}`
                              : "/images/clientProfile.png"
                          }
                          className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                          alt="Avatar"
                        />
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white">
                            {u.User?.lastname} {u.User?.firstname}
                          </div>
                          <p className="text-sm text-slate-400">Collaborateur</p>
                        </div>
                      </div>
                    </td>

                    {/* Arrivée / Pause */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5 text-sm font-medium">
                        <span className="text-slate-700 dark:text-slate-200">
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

                    {/* Reprise / Départ */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col gap-0.5 text-sm font-medium">
                        <span className="text-slate-700 dark:text-slate-200">
                          <span className="text-slate-400 font-normal">Reprise :</span>{" "}
                          {u.resumeTime ?? "--:--"}
                        </span>
                        <span className="text-slate-400">
                          Départ : {u.departureTime ?? "--:--"}
                        </span>
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
                      {new Date(u.createdAt ?? "").toLocaleDateString("fr-FR", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>

                    {/* Entreprise */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      {u.Enterprise?.logo ? (
                        <img
                          src={`${providers.APIUrl}/images/${u.Enterprise.logo}`}
                          className="mx-auto h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                          alt="Logo"
                        />
                      ) : (
                        <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                          {u.Enterprise?.name || "N/A"}
                        </span>
                      )}
                    </td>

                    {/* Statut Badge */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-sm font-semibold ${
                          u.status === "A temps"
                            ? "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/20 dark:bg-emerald-950/40 dark:text-emerald-400"
                            : u.status === "En retard"
                            ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-400"
                            : "bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/20 dark:bg-rose-950/40 dark:text-rose-400"
                        }`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            u.status === "A temps"
                              ? "bg-emerald-500"
                              : u.status === "En retard"
                              ? "bg-amber-500"
                              : "bg-rose-500"
                          }`}
                        />
                        {u.status}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/dashboard/RH/getAllPresencesOfUser/${u.UserId}`}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-blue-600 dark:hover:bg-slate-700 dark:hover:text-blue-400 transition-colors"
                          title="Voir les détails"
                        >
                          <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(u.UserId, u.createdAt)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30 dark:hover:text-rose-400 transition-colors"
                          title="Supprimer"
                        >
                          <FontAwesomeIcon icon={faTrashAlt} className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <div className="mx-auto flex max-w-xs flex-col items-center justify-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500">
                        <FontAwesomeIcon icon={faSearch} className="text-lg" />
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                        Aucune présence trouvée
                      </h3>
                      <p className="mt-1 text-sm text-slate-400">
                        Essayez de modifier votre recherche ou ajoutez un nouvel enregistrement.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* 🔄 PAGINATION PRO */}
        <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 bg-slate-50/50 px-6 py-4 dark:border-slate-700/60 dark:bg-slate-800/50 sm:flex-row">
          <div className="text-sm text-slate-500 dark:text-slate-400">
            Page <span className="font-semibold text-slate-700 dark:text-slate-200">{currentPage}</span> sur{" "}
            <span className="font-semibold text-slate-700 dark:text-slate-200">{totalPages}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-[10px]" />
              <span>Suivant</span>
            </button>

            <button
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <span>Précédent</span>
              <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}