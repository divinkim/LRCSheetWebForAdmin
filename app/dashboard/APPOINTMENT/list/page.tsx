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
  faEye,
  faPlus,
  faCalendarCheck,
  faClock,
  faCalendarAlt,
  faFileDownload,
  faUser,
  faCheck,
  faTimes,
  faCalendarXmark,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { providers } from "@/index";
import { useToast } from "@/components/toast";
import { AppointmentListDto, AppointmentsResponseDto } from "@/types/global";

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

const REQUIRED_ADMIN_ROLES = ["Super_Admin_Platform", "Super_Admin_Enterprise", "Admin_Enterprise", "Reception_Admin"];
const STATUS_API_URL = "https://vps118934.serveur-vps.net:4001";
const PAGE_SIZE = 8;

/* ------------------------------------------------------------------ */
/* Statuts                                                             */
/* ------------------------------------------------------------------ */

type StatusKind = "accepted" | "pending" | "rejected" | "unknown";
type StatusFilter = "ALL" | "PENDING" | "ACCEPTED" | "REJECTED";

function statusKind(status?: string | null): StatusKind {
  const s = (status ?? "").toUpperCase();
  if (["ACCEPTED", "CONFIRMED", "CONFIRME"].includes(s)) return "accepted";
  if (["PENDING", "EN ATTENTE"].includes(s)) return "pending";
  if (["REJECTED", "CANCELLED", "ANNULE"].includes(s)) return "rejected";
  return "unknown";
}

const STATUS_STYLES: Record<StatusKind, { label: string; badge: string; dot: string }> = {
  accepted: {
    label: "Accepté",
    badge:
      "bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-400/10 dark:text-emerald-400 dark:ring-emerald-400/20",
    dot: "bg-emerald-500",
  },
  pending: {
    label: "En attente",
    badge:
      "bg-amber-50 text-amber-700 ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:ring-amber-400/20",
    dot: "bg-amber-500",
  },
  rejected: {
    label: "Refusé",
    badge:
      "bg-rose-50 text-rose-700 ring-rose-600/20 dark:bg-rose-400/10 dark:text-rose-400 dark:ring-rose-400/20",
    dot: "bg-rose-500",
  },
  unknown: {
    label: "—",
    badge:
      "bg-slate-100 text-slate-600 ring-slate-500/20 dark:bg-slate-700/40 dark:text-slate-300 dark:ring-slate-500/30",
    dot: "bg-slate-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const kind = statusKind(status);
  const style = STATUS_STYLES[kind];
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${style.badge}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
      {kind === "unknown" ? status || style.label : style.label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers d'affichage                                                 */
/* ------------------------------------------------------------------ */

function formatDate(value?: string | null) {
  if (!value) return "—";
  // "YYYY-MM-DD..." : on évite le décalage de fuseau horaire
  const m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function formatTime(value?: string | null) {
  if (!value) return null;
  const part = value.includes("T") ? value.split("T")[1] : value;
  const m = part.match(/^(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : null;
}

function initials(name?: string | null) {
  return (name ?? "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

const csvCell = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

const swalPopup = "dark:bg-slate-800 dark:text-white rounded-2xl border dark:border-slate-700";

/* ------------------------------------------------------------------ */
/* Composants                                                          */
/* ------------------------------------------------------------------ */

function KpiCard({
  label,
  value,
  loading,
  icon,
  tone,
}: {
  label: string;
  value: number;
  loading: boolean;
  icon: typeof faCalendarAlt;
  tone: string;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
      <div>
        <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
        {loading ? (
          <div className="mt-2 h-8 w-16 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        ) : (
          <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-slate-50">
            {value}
          </p>
        )}
      </div>
      <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg ${tone}`}>
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  );
}

function ActionButton({
  label,
  onClick,
  disabled,
  icon,
  className,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  icon: typeof faEye;
  className: string;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-lg p-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-30 ${className}`}
    >
      <FontAwesomeIcon icon={icon} className="h-4 w-4" />
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AppointmentsList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>("ALL");
  const [appointmentsList, setAppointmentsList] = useState<AppointmentListDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const userRole = (session?.user as any)?.adminRole ?? "";
  const hasAdminAccess = REQUIRED_ADMIN_ROLES.includes(userRole);

  /* ---------- Chargement ---------- */
  useEffect(() => {
    async function fetchAppointments() {
      if (status !== "authenticated" || !session?.user) return;

      try {
        setLoading(true);
        const res = await providers.API.getAll<AppointmentsResponseDto>(providers.APIUrl, "appointments", null);
        setAppointmentsList(res.data);
      } catch (error) {
        toast.error("Erreur", "Erreur lors de la récupération des rendez-vous");
        console.error("Erreur fetchAppointments:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppointments();
  }, [session, status]);

  /* ---------- Indicateurs ---------- */
  const stats = useMemo(() => {
    const counts = { total: appointmentsList.length, accepted: 0, pending: 0, rejected: 0 };
    appointmentsList.forEach((a) => {
      const k = statusKind(a.status);
      if (k !== "unknown") counts[k] += 1;
    });
    return counts;
  }, [appointmentsList]);

  /* ---------- Filtrage ---------- */
  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();
    return appointmentsList.filter((item) => {
      const matchesSearch =
        !query ||
        item.fullName?.toLowerCase().includes(query) ||
        item.email?.toLowerCase().includes(query) ||
        item.phone?.toLowerCase().includes(query) ||
        item.reason?.toLowerCase().includes(query) ||
        `${item.User?.firstname} ${item.User?.lastname}`.toLowerCase().includes(query);

      const kind = statusKind(item.status);
      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "PENDING" && kind === "pending") ||
        (selectedStatus === "ACCEPTED" && kind === "accepted") ||
        (selectedStatus === "REJECTED" && kind === "rejected");

      return matchesSearch && matchesStatus;
    });
  }, [appointmentsList, search, selectedStatus]);

  /* ---------- Pagination ---------- */
  const maxPage = Math.max(1, Math.ceil(filteredAppointments.length / PAGE_SIZE));
  const currentData = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredAppointments.slice(start, start + PAGE_SIZE);
  }, [filteredAppointments, page]);

  // Si la dernière page se vide (suppression), on revient en arrière
  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [page, maxPage]);

  const rangeStart = filteredAppointments.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(page * PAGE_SIZE, filteredAppointments.length);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: StatusFilter) => {
    setSelectedStatus(value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedStatus("ALL");
    setPage(1);
  };

  const filtersActive = search.trim() !== "" || selectedStatus !== "ALL";

  /* ---------- Droits ---------- */
  const checkAccessAndExecute = (action: () => void) => {
    if (!hasAdminAccess) {
      Swal.fire({
        icon: "warning",
        title: "Accès restreint",
        text: "Vous n'avez pas les droits nécessaires pour effectuer cette action.",
        customClass: {
          popup: swalPopup,
          confirmButton:
            "bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg px-5 py-2.5 shadow-sm transition-colors",
        },
      });
      return;
    }
    action();
  };

  /* ---------- Export CSV ---------- */
  const exportToCSV = useCallback(() => {
    const headers = ["Nom complet", "Email", "Téléphone", "Date", "Heure", "Motif", "Statut", "Collaborateur assigné"];
    const rows = filteredAppointments.map((apt) => [
      apt.fullName,
      apt.email,
      apt.phone,
      apt.date,
      formatTime(apt.time) ?? "",
      apt.reason,
      STATUS_STYLES[statusKind(apt.status)].label === "—" ? apt.status : STATUS_STYLES[statusKind(apt.status)].label,
      apt.User ? `${apt.User.firstname} ${apt.User.lastname}` : "N/A",
    ]);

    // BOM UTF-8 + séparateur ";" pour une ouverture correcte dans Excel (accents)
    const csv =
      "\uFEFF" + [headers, ...rows].map((r) => r.map(csvCell).join(";")).join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `rendez_vous_export_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredAppointments]);

  /* ---------- Changement de statut ---------- */
  const handleUpdateStatus = (id?: number, newStatus?: "ACCEPTED" | "REJECTED") => {
    if (!id || !newStatus) return;

    const actionText = newStatus === "ACCEPTED" ? "accepter" : "rejeter";

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
        customClass: { popup: swalPopup },
      }).then(async (confirmed) => {
        if (!confirmed.isConfirmed) return;
        try {
          const response = await providers.API.update(
            STATUS_API_URL,
            "updateAppointmentStatus",
            null,
            { status: newStatus },
            id
          );

          if (response) {
            toast.success("Bravo", "Opération réussie");
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
      });
    });
  };

  /* ---------- Suppression ---------- */
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
        customClass: { popup: swalPopup },
      }).then(async (confirmed) => {
        if (!confirmed.isConfirmed) return;
        try {
          await providers.API.delete(providers.APIUrl, "appointments", id, {});
          toast.success("Succès", "Rendez-vous supprimé avec succès");
          setAppointmentsList((prev) => prev.filter((a) => a.id !== id));
        } catch (err) {
          toast.error("Erreur", err instanceof Error ? err.message : "Erreur réseau");
        }
      });
    });
  };

  /* ---------- Onglets de filtre ---------- */
  const tabs: { value: StatusFilter; label: string; count: number }[] = [
    { value: "ALL", label: "Tous", count: stats.total },
    { value: "PENDING", label: "En attente", count: stats.pending },
    { value: "ACCEPTED", label: "Acceptés", count: stats.accepted },
    { value: "REJECTED", label: "Refusés", count: stats.rejected },
  ];

  return (
    <div className="min-h-screen w-full bg-slate-50/50 p-4 transition-colors dark:bg-slate-950 sm:p-6 lg:p-8">
      <main className="mx-auto max-w-7xl space-y-6">
        {/* En-tête */}
        <header className="flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-lg text-white shadow-sm shadow-blue-600/20">
              <FontAwesomeIcon icon={faCalendarAlt} />
            </span>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
                Gestion des rendez-vous
              </h1>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                Planification, suivi et consultation des demandes de rendez-vous.
              </p>
            </div>
          </div>

          <Link
            href="/dashboard/APPOINTMENT/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] active:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 dark:hover:bg-blue-500 dark:focus-visible:ring-offset-slate-950"
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
            Nouveau RDV
          </Link>
        </header>

        {/* Indicateurs */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <KpiCard
            label="Total rendez-vous"
            value={stats.total}
            loading={loading}
            icon={faCalendarAlt}
            tone="bg-blue-50 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400"
          />
          <KpiCard
            label="Acceptés / confirmés"
            value={stats.accepted}
            loading={loading}
            icon={faCalendarCheck}
            tone="bg-emerald-50 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400"
          />
          <KpiCard
            label="En attente"
            value={stats.pending}
            loading={loading}
            icon={faClock}
            tone="bg-amber-50 text-amber-600 dark:bg-amber-400/10 dark:text-amber-400"
          />
        </div>

        {/* Tableau */}
        <section className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/* Barre d'outils */}
          <div className="space-y-4 border-b border-slate-200/80 p-4 dark:border-slate-800">
            <div className="flex flex-col items-stretch justify-between gap-3 lg:flex-row lg:items-center">
              <div className="relative w-full lg:max-w-md">
                <FontAwesomeIcon
                  icon={faSearch}
                  className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                />
                <input
                  type="search"
                  placeholder="Rechercher par nom, motif, collaborateur…"
                  value={search}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                />
              </div>

              <button
                onClick={exportToCSV}
                disabled={filteredAppointments.length === 0}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
                title="Exporter au format CSV"
              >
                <FontAwesomeIcon icon={faFileDownload} className="text-slate-400" />
                Exporter
              </button>
            </div>

            {/* Filtres par statut */}
            <div role="tablist" aria-label="Filtrer par statut" className="flex flex-wrap gap-1.5">
              {tabs.map((tab) => {
                const active = selectedStatus === tab.value;
                return (
                  <button
                    key={tab.value}
                    role="tab"
                    aria-selected={active}
                    onClick={() => handleStatusFilterChange(tab.value)}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                      active
                        ? "bg-blue-600 text-white shadow-sm shadow-blue-600/20"
                        : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    {tab.label}
                    <span
                      className={`rounded-full px-1.5 text-xs tabular-nums ${
                        active
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Client</th>
                  <th scope="col" className="px-6 py-3.5">Contact</th>
                  <th scope="col" className="px-6 py-3.5">Collaborateur</th>
                  <th scope="col" className="px-6 py-3.5">Date & heure</th>
                  <th scope="col" className="px-6 py-3.5">Motif</th>
                  <th scope="col" className="px-6 py-3.5">Statut</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {loading ? (
                  Array.from({ length: PAGE_SIZE }).map((_, index) => (
                    <tr key={index} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />
                          <div className="h-4 w-28 rounded-md bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </td>
                      <td className="px-6 py-4"><div className="h-4 w-28 rounded-md bg-slate-200 dark:bg-slate-800" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-28 rounded-md bg-slate-200 dark:bg-slate-800" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-24 rounded-md bg-slate-200 dark:bg-slate-800" /></td>
                      <td className="px-6 py-4"><div className="h-4 w-36 rounded-md bg-slate-200 dark:bg-slate-800" /></td>
                      <td className="px-6 py-4"><div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800" /></td>
                      <td className="px-6 py-4"><div className="ml-auto h-8 w-24 rounded-lg bg-slate-200 dark:bg-slate-800" /></td>
                    </tr>
                  ))
                ) : currentData.length > 0 ? (
                  currentData.map((item, idx) => {
                    const kind = statusKind(item.status);
                    const time = formatTime(item.time);
                    return (
                      <tr
                        key={item.id ?? idx}
                        className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                      >
                        {/* Client */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              aria-hidden="true"
                              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-semibold text-blue-700 dark:bg-blue-400/10 dark:text-blue-300"
                            >
                              {initials(item.fullName) || <FontAwesomeIcon icon={faUser} className="h-3 w-3" />}
                            </span>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{item.fullName}</span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.phone}</span>
                            <span className="text-xs text-slate-400">{item.email || "—"}</span>
                          </div>
                        </td>

                        {/* Collaborateur */}
                        <td className="whitespace-nowrap px-6 py-4">
                          {item.User ? (
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              {item.User.firstname} {item.User.lastname}
                            </span>
                          ) : (
                            <span className="text-slate-400">Non assigné</span>
                          )}
                        </td>

                        {/* Date & heure */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800 dark:text-slate-200">
                              {formatDate(item.date)}
                            </span>
                            <span className="text-xs tabular-nums text-slate-400">{time ?? "Heure non définie"}</span>
                          </div>
                        </td>

                        {/* Motif */}
                        <td className="max-w-[14rem] px-6 py-4">
                          <p className="truncate" title={item.reason || undefined}>
                            {item.reason || <span className="text-slate-400">—</span>}
                          </p>
                        </td>

                        {/* Statut */}
                        <td className="whitespace-nowrap px-6 py-4">
                          <StatusBadge status={item.status} />
                        </td>

                        {/* Actions */}
                        <td className="whitespace-nowrap px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-0.5">
                            <ActionButton
                              label="Consulter"
                              icon={faEye}
                              onClick={() =>
                                checkAccessAndExecute(() => {
                                  router.push(`/dashboard/APPOINTMENT/view/${item.id}`);
                                })
                              }
                              className="text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                            />
                            <ActionButton
                              label="Accepter"
                              icon={faCheck}
                              disabled={kind === "accepted"}
                              onClick={() => handleUpdateStatus(item.id, "ACCEPTED")}
                              className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-950/40"
                            />
                            <ActionButton
                              label="Rejeter"
                              icon={faTimes}
                              disabled={kind === "rejected"}
                              onClick={() => handleUpdateStatus(item.id, "REJECTED")}
                              className="text-amber-600 hover:bg-amber-50 hover:text-amber-700 dark:hover:bg-amber-950/40"
                            />
                            <ActionButton
                              label="Supprimer"
                              icon={faTrashAlt}
                              onClick={() => handleDeleteAppointment(item.id)}
                              className="text-rose-500 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-16">
                      <div className="flex flex-col items-center text-center">
                        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl text-slate-400 dark:bg-slate-800">
                          <FontAwesomeIcon icon={faCalendarXmark} />
                        </span>
                        <p className="mt-4 font-semibold text-slate-900 dark:text-slate-100">
                          Aucun rendez-vous trouvé
                        </p>
                        <p className="mt-1 max-w-xs text-sm text-slate-500 dark:text-slate-400">
                          {filtersActive
                            ? "Aucun résultat ne correspond à vos critères de recherche."
                            : "Les nouvelles demandes apparaîtront ici."}
                        </p>
                        {filtersActive && (
                          <button
                            onClick={resetFilters}
                            className="mt-4 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-blue-600 transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-slate-700 dark:text-blue-400 dark:hover:bg-slate-800"
                          >
                            Réinitialiser les filtres
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-4 border-t border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {filteredAppointments.length > 0 ? (
                <>
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {rangeStart}–{rangeEnd}
                  </span>{" "}
                  sur{" "}
                  <span className="font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                    {filteredAppointments.length}
                  </span>{" "}
                  rendez-vous
                </>
              ) : (
                "0 rendez-vous"
              )}
            </p>

            <div className="flex items-center gap-2">
              <span className="mr-1 text-sm tabular-nums text-slate-500 dark:text-slate-400">
                Page {page} / {maxPage}
              </span>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                Précédent
              </button>
              <button
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                disabled={page === maxPage}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
              >
                Suivant
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
