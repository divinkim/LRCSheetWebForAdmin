"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSearch,
  faChevronLeft,
  faChevronRight,
  faTrashAlt,
  faEye,
  faPlus,
  faCalendarCheck,
  faClock,
  faCalendarAlt,
  faFileDownload,
  faFilter,
  faUser,
  faCheck,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { providers } from "@/index";
import { tablesModal } from "@/components/Tables/tablesModal";
import { useToast } from "@/components/toast";

export type AppointmentData = {
  id?: number;
  fullName: string;
  email?: string | null;
  phone: string;
  UserId: number;
  date: string;
  time?: string | null;
  status: string;
  reason: string;
  User: {
    id: number;
    lastname: string;
    firstname: string;
  };
};

const REQUIRED_ADMIN_ROLES = ["Super-Admin", "Supervisor-Admin"];

export default function AppointmentsList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [appointmentsList, setAppointmentsList] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const [page, setPage] = useState(1);
  const limit = 8;

  // Droits d'accès
  const userRole = (session?.user as any)?.adminRole ?? "";
  const hasAdminAccess = REQUIRED_ADMIN_ROLES.includes(userRole);

  // 1. Chargement des données
  useEffect(() => {
    async function fetchAppointments() {
      if (status !== "authenticated" || !session?.user) return;

      try {
        setLoading(true);
        const data = await providers.API.getAll(
          "https://vps118934.serveur-vps.net:4001",
          "appointments",
          null
        );
        setAppointmentsList(data || []);
      } catch (error) {
        toast.error("Erreur", "Erreur lors de la récupération des rendez-vous");
        console.error("Erreur fetchAppointments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [session, status]);

  // 2. Métriques KPI Top Dashboard
  const stats = useMemo(() => {
    const totalAppointments = appointmentsList.length;
    const confirmedAppointments = appointmentsList.filter(
      (a) =>
        a.status?.toUpperCase() === "ACCEPTED" ||
        a.status?.toUpperCase() === "CONFIRMED" ||
        a.status?.toUpperCase() === "CONFIRME"
    ).length;
    const pendingAppointments = appointmentsList.filter(
      (a) =>
        a.status?.toUpperCase() === "PENDING" ||
        a.status?.toUpperCase() === "EN ATTENTE"
    ).length;

    return {
      totalAppointments,
      confirmedAppointments,
      pendingAppointments,
    };
  }, [appointmentsList]);

  // 3. Filtrage & Recherche
  const filteredAppointments = useMemo(() => {
    return appointmentsList.filter((item) => {
      const query = search.trim().toLowerCase();
      const matchesSearch =
        !query ||
        item.fullName?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.phone?.toLowerCase().includes(query) ||
        item.reason?.toLowerCase().includes(query) ||
        `${item.User?.firstname} ${item.User?.lastname}`.toLowerCase().includes(query);

      const itemStatus = item.status?.toUpperCase() || "";
      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "PENDING" &&
          (itemStatus === "PENDING" || itemStatus === "EN ATTENTE")) ||
        (selectedStatus === "ACCEPTED" &&
          (itemStatus === "ACCEPTED" || itemStatus === "CONFIRMED" || itemStatus === "CONFIRME")) ||
        (selectedStatus === "REJECTED" &&
          (itemStatus === "REJECTED" || itemStatus === "CANCELLED" || itemStatus === "ANNULE"));

      return matchesSearch && matchesStatus;
    });
  }, [appointmentsList, search, selectedStatus]);

  // 4. Calculs de Pagination
  const maxPage = Math.max(1, Math.ceil(filteredAppointments.length / limit));
  const currentData = useMemo(() => {
    const startIdx = (page - 1) * limit;
    return filteredAppointments.slice(startIdx, startIdx + limit);
  }, [filteredAppointments, page, limit]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (statusValue: string) => {
    setSelectedStatus(statusValue);
    setPage(1);
  };

  // Contrôle des accès
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
      "Nom complet",
      "Email",
      "Téléphone",
      "Date",
      "Heure",
      "Motif",
      "Statut",
      "Collaborateur Assigné",
    ];
    const rows = filteredAppointments.map((apt) => [
      `"${apt.fullName || ""}"`,
      `"${apt.email || ""}"`,
      `"${apt.phone || ""}"`,
      `"${apt.date || ""}"`,
      `"${apt.time || ""}"`,
      `"${apt.reason || ""}"`,
      `"${apt.status || ""}"`,
      `"${apt.User ? `${apt.User.firstname} ${apt.User.lastname}` : "N/A"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `rendez_vous_export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [filteredAppointments]);

  // Fonction pour changer le statut (ACCEPTED / REJECTED)
  const handleUpdateStatus = (id?: number, newStatus?: "ACCEPTED" | "REJECTED") => {
    if (!id || !newStatus) return;

    const actionText = newStatus === "ACCEPTED" ? "activer (accepter)" : "désactiver (rejeter)";

    checkAccessAndExecute(() => {
      Swal.fire({
        icon: "question",
        title: "Changement de statut",
        text: `Voulez-vous vraiment ${actionText} ce rendez-vous ?`,
        showCancelButton: true,
        cancelButtonText: "Annuler",
        confirmButtonText: "Oui, confirmer",
        confirmButtonColor: newStatus === "ACCEPTED" ? "#10b981" : "#ef4444",
        cancelButtonColor: "#64748b",
        customClass: {
          popup: "dark:bg-slate-800 dark:text-white rounded-xl border dark:border-slate-700",
        },
      }).then(async (confirmed) => {
        if (confirmed.isConfirmed) {
          try {
            const response = await providers.API.update(
              "https://vps118934.serveur-vps.net:4001",
              "updateAppointmentStatus",
              null,
              { status: newStatus },
              id
            );

            if (response) {
              toast.success("Bravo", `Opération réussie`);
              setAppointmentsList((prev) =>
                prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
              );
            }
          } catch (err) {
            toast.error(
              "Erreur",
              err instanceof Error ? err.message : "Erreur lors de la mise à jour du statut"
            );
          }
        }
      });
    });
  };

  // Suppression d'un rendez-vous
  const handleDeleteAppointment = (id?: number) => {
    if (!id) return;
    checkAccessAndExecute(() => {
      Swal.fire({
        icon: "warning",
        title: "Confirmer la suppression",
        text: "Êtes-vous sûr de vouloir supprimer ce rendez-vous ?",
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
            const response = await providers.API.delete(
              "https://vps118934.serveur-vps.net:4001",
              "deleteAppointment",
              id,
              {}
            );

            if (response.status) {
              toast.success("Succès", "Rendez-vous supprimé avec succès");
              setAppointmentsList((prev) => prev.filter((a) => a.id !== id));
            }
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

  // Helper de badge de statut (Vert = ACCEPTED/CONFIRMED, Rouge = REJECTED/CANCELLED, Jaune = PENDING)
  const renderStatusBadge = (status: string) => {
    const formatted = status?.toUpperCase() || "";
    let badgeStyle = "bg-slate-500/10 text-slate-600 border-slate-500/20";
    let dotStyle = "bg-slate-500";

    if (formatted === "ACCEPTED" || formatted === "CONFIRMED" || formatted === "CONFIRME") {
      badgeStyle = "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400";
      dotStyle = "bg-emerald-500";
    } else if (formatted === "PENDING" || formatted === "EN ATTENTE") {
      badgeStyle = "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-400/10 dark:text-amber-400";
      dotStyle = "bg-amber-500";
    } else if (formatted === "REJECTED" || formatted === "CANCELLED" || formatted === "ANNULE") {
      badgeStyle = "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:bg-rose-400/10 dark:text-rose-400";
      dotStyle = "bg-rose-500";
    }

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badgeStyle}`}>
        <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotStyle}`} />
        {status === "ACCEPTED" ? "Accepté" : status === "REJECTED" ? "Rejeté" : "En attente"}
      </span>
    );
  };

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Header & Title */}
        <div className="flex flex-col gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
              <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400">
                <FontAwesomeIcon icon={faCalendarAlt} className="text-lg" />
              </span>
              Gestion des Rendez-vous
            </h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Planification, suivi et consultation des demandes de rendez-vous.
            </p>
          </div>
        </div>

        {/* Cartes d'Indicateurs (KPI Top Dashboard) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Total Rendez-vous
              </p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
              ) : (
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.totalAppointments}
                </p>
              )}
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Acceptés / Confirmés
              </p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
              ) : (
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.confirmedAppointments}
                </p>
              )}
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-lg">
              <FontAwesomeIcon icon={faCalendarCheck} />
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                En Attente
              </p>
              {loading ? (
                <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 animate-pulse rounded-md mt-1" />
              ) : (
                <p className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                  {stats.pendingAppointments}
                </p>
              )}
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-lg">
              <FontAwesomeIcon icon={faClock} />
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
                placeholder="Rechercher par nom, motif, collaborateur..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              />
            </div>

            {/* Filtre par Statut */}
            <div className="relative min-w-[160px]">
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-200"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="PENDING">En attente</option>
                <option value="ACCEPTED">Acceptés</option>
                <option value="REJECTED">Refusés / Annulés</option>
              </select>
              <FontAwesomeIcon
                icon={faFilter}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Boutons d'Action */}
          <div className="flex items-center gap-2.5 justify-end">
            <button
              onClick={exportToCSV}
              disabled={filteredAppointments.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all"
              title="Exporter au format CSV"
            >
              <FontAwesomeIcon
                icon={faFileDownload}
                className="text-slate-400"
              />
              <span className="hidden sm:inline">Exporter</span>
            </button>

            <Link
              href="/dashboard/APPOINTMENT/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <FontAwesomeIcon icon={faPlus} className="text-sm" />
              <span>Nouveau RDV</span>
            </Link>
          </div>
        </div>

        {/* Tableau Master */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Client</th>
                  <th scope="col" className="px-6 py-4">Contact</th>
                  <th scope="col" className="px-6 py-4">Collaborateur</th>
                  <th scope="col" className="px-6 py-4">Date & Heure</th>
                  <th scope="col" className="px-6 py-4">Motif</th>
                  <th scope="col" className="px-6 py-4">Statut</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: limit }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4"><div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded-md" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" /></td>
                      <td className="px-6 py-4"><div className="h-8 w-20 bg-slate-200 dark:bg-slate-800 rounded-lg ml-auto" /></td>
                    </tr>
                  ))
                ) : currentData.length > 0 ? (
                  currentData.map((item, idx) => (
                    <tr
                      key={item.id ?? idx}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Client */}
                      <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {item.fullName}
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-slate-800 dark:text-slate-200 font-medium">{item.phone}</span>
                          <span className="text-xs text-slate-400">{item.email || "-"}</span>
                        </div>
                      </td>

                      {/* Collaborateur */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500">
                            <FontAwesomeIcon icon={faUser} className="w-3 h-3" />
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {item.User ? `${item.User.firstname} ${item.User.lastname}` : "Non assigné"}
                          </span>
                        </div>
                      </td>

                      {/* Date & Heure */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800 dark:text-slate-200">{item.date}</span>
                          <span className="text-xs text-slate-400">{item.time?.split('T').slice(0, 5) || "Non définie"}</span>
                        </div>
                      </td>

                      {/* Motif */}
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {item.reason}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderStatusBadge(item.status)}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Consulter */}
                          <button
                            title="Consulter"
                            onClick={() =>
                              checkAccessAndExecute(() => {
                                router.push(`/dashboard/appointments/view/${item.id}`);
                              })
                            }
                            className="p-2 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-all"
                          >
                            <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                          </button>

                          {/* Activer (ACCEPTED) */}
                          <button
                            title="Activer (Accepter)"
                            onClick={() => handleUpdateStatus(item.id, "ACCEPTED")}
                            className="p-2 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-all"
                          >
                            <FontAwesomeIcon icon={faCheck} className="w-4 h-4" />
                          </button>

                          {/* Désactiver (REJECTED) */}
                          <button
                            title="Désactiver (Rejeter)"
                            onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                            className="p-2 rounded-lg text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                          >
                            <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                          </button>

                          {/* Supprimer */}
                          <button
                            title="Supprimer"
                            onClick={() => handleDeleteAppointment(item.id)}
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
                      Aucun rendez-vous trouvé.
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