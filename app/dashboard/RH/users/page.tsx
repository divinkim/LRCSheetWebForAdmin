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
  faPen,
  faUserPlus,
  faUserGroup,
  faUserCheck,
  faBuilding,
  faFileDownload,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { dateFormat, providers } from "@/index";
import { tablesModal } from "@/components/Tables/tablesModal";
import { useToast } from "@/components/toast";
import { User, UsersResponseDto } from "@/types/global";

const REQUIRED_ADMIN_ROLES = [
  "Super_Admin_Platform",
  "Super_Admin_Enterprise",
  "Enterprise_Admin",
];
const CREATE_ROLES = ["Super_Admin_Platform", "Super_Admin_Enterprise"];

const LIMIT = 8;

// Formate une date en toute sécurité
const safeDate = (value?: string | null) =>
  value ? dateFormat(String(value)) ?? "-" : "-";

/* -------------------------------------------------------------------------- */
/*  Petits composants                                                         */
/* -------------------------------------------------------------------------- */

type KpiProps = {
  label: string;
  value: number;
  loading: boolean;
  icon: any;
  tone: "blue" | "emerald" | "purple";
};

const KPI_TONES: Record<KpiProps["tone"], string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
  emerald:
    "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  purple:
    "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400",
};

function KpiCard({ label, value, loading, icon, tone }: KpiProps) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-5">
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {label}
        </p>
        {loading ? (
          <div className="mt-1.5 h-7 w-14 animate-pulse rounded-md bg-slate-200 dark:bg-slate-800" />
        ) : (
          <p className="mt-1 text-2xl font-bold text-slate-900 dark:text-slate-100">
            {value}
          </p>
        )}
      </div>
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-base ${KPI_TONES[tone]}`}
      >
        <FontAwesomeIcon icon={icon} />
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${
        active
          ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-400"
          : "border-rose-500/20 bg-rose-500/10 text-rose-600 dark:bg-rose-400/10 dark:text-rose-400"
      }`}
    >
      <span
        className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
          active ? "bg-emerald-500" : "bg-rose-500"
        }`}
      />
      {active ? "Actif" : "Inactif"}
    </span>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default function UsersList() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast();

  // Données de session
  const sessionUser = session?.user as any;
  const adminRole: string = sessionUser?.adminRole ?? "";
  const mainEnterpriseId = Number(sessionUser?.MainEnterpriseId || 0);
  const enterpriseId = Number(sessionUser?.EnterpriseId || 0);
  const hasAdminAccess = REQUIRED_ADMIN_ROLES.includes(adminRole);
  const canCreate = CREATE_ROLES.includes(adminRole);

  // États
  const [usersList, setUsersList] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  const pageTitle = tablesModal?.[0]?.usersList?.pageTitle ?? "Collaborateurs";

  // Récupération des utilisateurs
  useEffect(() => {
    async function fetchUsers() {
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
        const users = await providers.API.getAll<UsersResponseDto>(
          providers.APIUrl,
          "users",
          null
        );
        const rawUsers: User[] = users.data;

        let filtered: User[] = [];
        if (adminRole === "Super_Admin_Platform") {
          filtered = rawUsers;
        } else if (adminRole === "Super_Admin_Enterprise") {
          filtered = rawUsers.filter(
            (u) => u.Enterprise?.MainEnterpriseId === mainEnterpriseId
          );
        } else if (adminRole === "Enterprise_Admin") {
          filtered = rawUsers.filter((u) => u.EnterpriseId === enterpriseId);
        }

        setUsersList(filtered);
      } catch (error) {
        toast.error(
          "Erreur",
          "Erreur lors de la récupération des collaborateurs"
        );
        console.error("Erreur fetchUsers:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, adminRole, mainEnterpriseId, enterpriseId]);

  // KPI
  const stats = useMemo(() => {
    const totalUsers = usersList.length;
    const activeUsers = usersList.filter((u) => u.status === true).length;
    const totalEnterprises = new Set(
      usersList.map((u) => u.Enterprise?.name).filter(Boolean)
    ).size;
    return { totalUsers, activeUsers, totalEnterprises };
  }, [usersList]);

  // Filtrage & recherche
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();

    return usersList.filter((u) => {
      const matchesSearch =
        !query ||
        u.firstname?.toLowerCase().includes(query) ||
        u.lastname?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.phone?.toLowerCase().includes(query);

      const matchesStatus =
        selectedStatus === "ALL" ||
        (selectedStatus === "ACTIVE" && u.status === true) ||
        (selectedStatus === "INACTIVE" && u.status === false);

      return matchesSearch && matchesStatus;
    });
  }, [usersList, search, selectedStatus]);

  // Pagination
  const maxPage = Math.max(1, Math.ceil(filteredUsers.length / LIMIT));

  const currentData = useMemo(() => {
    const startIdx = (page - 1) * LIMIT;
    return filteredUsers.slice(startIdx, startIdx + LIMIT);
  }, [filteredUsers, page]);

  // Sécurité : si la page courante dépasse le max (ex: après suppression)
  useEffect(() => {
    if (page > maxPage) setPage(maxPage);
  }, [page, maxPage]);

  // Handlers
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusFilterChange = (value: string) => {
    setSelectedStatus(value);
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
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = ["Nom", "Prénom", "Email", "Genre", "Entreprise", "Statut"];
    const rows = filteredUsers.map((u) =>
      [
        esc(u.lastname),
        esc(u.firstname),
        esc(u.email),
        esc(u.gender),
        esc(u.Enterprise?.name || "N/A"),
        esc(u.status ? "Actif" : "Inactif"),
      ].join(",")
    );

    // BOM pour un affichage correct des accents dans Excel
    const csv = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `collaborateurs_export_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [filteredUsers]);

  // Suppression
  const handleDeleteUser = (id: number) => {
    checkAccessAndExecute(() => {
      Swal.fire({
        icon: "warning",
        title: "Confirmer la suppression",
        text: "Êtes-vous sûr de vouloir supprimer ce collaborateur ?",
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
        if (!confirmed.isConfirmed) return;
        try {
          await providers.API.delete(providers.APIUrl, "deleteUser", id, {});
          toast.success("Bravo", "Collaborateur supprimé avec succès");
          setUsersList((prev) => prev.filter((u) => u.id !== id));
        } catch (err) {
          toast.error(
            "Erreur",
            err instanceof Error ? err.message : "Erreur réseau"
          );
        }
      });
    });
  };

  const firstItem = filteredUsers.length === 0 ? 0 : (page - 1) * LIMIT + 1;
  const lastItem = Math.min(page * LIMIT, filteredUsers.length);

  // Largeurs de colonnes (table-fixed => plus aucun débordement horizontal)
  const th = "px-3 py-3 font-semibold";

  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-slate-50/50 p-3 transition-colors dark:bg-slate-950 sm:p-6 lg:p-8">
      <main className="mx-auto w-full max-w-7xl space-y-5">
        {/* En-tête */}
        <div className="flex flex-col gap-1 border-b border-slate-200/80 pb-4 dark:border-slate-800">
          <h1 className="flex items-center gap-3 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-50 sm:text-2xl">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-blue-500/20 bg-blue-500/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400">
              <FontAwesomeIcon icon={faUserGroup} className="text-base" />
            </span>
            <span className="min-w-0 truncate">{pageTitle}</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Gestion centralisée et suivi des profils collaborateurs.
          </p>
        </div>

        {/* KPI */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
          <KpiCard
            label="Total collaborateurs"
            value={stats.totalUsers}
            loading={loading}
            icon={faUserGroup}
            tone="blue"
          />
          <KpiCard
            label="Comptes actifs"
            value={stats.activeUsers}
            loading={loading}
            icon={faUserCheck}
            tone="emerald"
          />
          <KpiCard
            label="Entreprises"
            value={stats.totalEnterprises}
            loading={loading}
            icon={faBuilding}
            tone="purple"
          />
        </div>

        {/* Barre d'outils */}
        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-slate-900 sm:p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-center">
            {/* Recherche */}
            <div className="relative min-w-0 flex-1 sm:max-w-md">
              <input
                type="text"
                placeholder="Rechercher par nom, email, téléphone..."
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
              />
              <FontAwesomeIcon
                icon={faSearch}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              />
            </div>

            {/* Filtre statut */}
            <div className="relative w-full sm:w-52">
              <select
                value={selectedStatus}
                onChange={(e) => handleStatusFilterChange(e.target.value)}
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-9 pr-8 text-sm font-medium text-slate-700 outline-none transition-all focus:border-blue-500 focus:bg-white dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-200"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actifs uniquement</option>
                <option value="INACTIVE">Inactifs uniquement</option>
              </select>
              <FontAwesomeIcon
                icon={faFilter}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2.5 sm:justify-end">
            <button
              onClick={exportToCSV}
              disabled={filteredUsers.length === 0}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60 sm:flex-none"
              title="Exporter au format CSV"
            >
              <FontAwesomeIcon
                icon={faFileDownload}
                className="text-slate-400"
              />
              <span>Exporter</span>
            </button>

            {canCreate && (
              <Link
                href="/dashboard/RH/user/new"
                className="inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 active:bg-blue-800 dark:hover:bg-blue-500 sm:flex-none"
              >
                <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
                <span>Ajouter un collaborateur</span>
              </Link>
            )}
          </div>
        </div>

        {/* Tableau */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          {/*
            table-fixed + truncate : le tableau s'adapte à la largeur de l'écran.
            Les colonnes secondaires se masquent progressivement quand l'espace
            diminue (leurs infos restent visibles sous le nom sur mobile).
          */}
          <table className="w-full table-fixed text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="border-b border-slate-200/80 bg-slate-50/80 text-xs uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-800/40 dark:text-slate-400">
              <tr>
                <th scope="col" className={`${th} pl-4`}>
                  Collaborateur
                </th>
                <th scope="col" className={`${th} hidden w-24 md:table-cell`}>
                  Genre
                </th>
                <th scope="col" className={`${th} hidden w-48 lg:table-cell`}>
                  Contrat
                </th>
                <th scope="col" className={`${th} hidden w-24 xl:table-cell`}>
                  Jours
                </th>
                <th scope="col" className={`${th} hidden w-32 sm:table-cell`}>
                  Entreprise
                </th>
                <th scope="col" className={`${th} w-24`}>
                  Statut
                </th>
                <th
                  scope="col"
                  className={`${th} w-[104px] pr-4 text-right sm:w-[120px]`}
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {loading ? (
                Array.from({ length: LIMIT }).map((_, index) => (
                  <tr key={index} className="animate-pulse">
                    <td className="px-3 py-3 pl-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 dark:bg-slate-800" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-3.5 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
                          <div className="h-3 w-1/2 rounded bg-slate-200 dark:bg-slate-800" />
                        </div>
                      </div>
                    </td>
                    <td className="hidden px-3 py-3 md:table-cell">
                      <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-3 py-3 lg:table-cell">
                      <div className="h-4 w-32 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-3 py-3 xl:table-cell">
                      <div className="h-4 w-12 rounded bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="hidden px-3 py-3 sm:table-cell">
                      <div className="h-6 w-20 rounded-md bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-3 py-3">
                      <div className="h-5 w-16 rounded-full bg-slate-200 dark:bg-slate-800" />
                    </td>
                    <td className="px-3 py-3 pr-4">
                      <div className="flex justify-end gap-1">
                        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : currentData.length > 0 ? (
                currentData.map((u) => {
                  const fullName =
                    `${u.firstname ?? ""} ${u.lastname ?? ""}`.trim() || "-";
                  const contract = `${safeDate(
                    u.Contract?.startDate
                  )} → ${safeDate(u.Contract?.endDate)}`;

                  return (
                    <tr
                      key={u.id}
                      className="transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      {/* Photo + nom + email (+ entreprise sur mobile) */}
                      <td className="px-3 py-3 pl-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                            <img
                              src={
                                u.photo
                                  ? `${providers.ImageUrl}/${u.photo}`
                                  : "/images/clientProfile.png"
                              }
                              alt={u.lastname || "Profil"}
                              className="h-full w-full object-cover"
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="truncate font-semibold text-slate-900 dark:text-slate-100"
                              title={fullName}
                            >
                              {fullName}
                            </p>
                            <p
                              className="truncate text-xs text-slate-500 dark:text-slate-400"
                              title={u.email ?? ""}
                            >
                              {u.email ?? "-"}
                            </p>
                            <p className="truncate text-xs text-slate-400 sm:hidden">
                              {u.Enterprise?.name || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Genre */}
                      <td className="hidden truncate px-3 py-3 text-slate-600 dark:text-slate-400 md:table-cell">
                        {u.gender ?? "-"}
                      </td>

                      {/* Contrat */}
                      <td
                        className="hidden truncate px-3 py-3 text-slate-600 dark:text-slate-400 lg:table-cell"
                        title={contract}
                      >
                        {contract}
                      </td>

                      {/* Jours */}
                      <td className="hidden truncate px-3 py-3 text-slate-600 dark:text-slate-400 xl:table-cell">
                        {u?.working_days_count ?? "0"} j
                      </td>

                      {/* Entreprise */}
                      <td className="hidden px-3 py-3 sm:table-cell">
                        {u.Enterprise?.logo ? (
                          <div
                            className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700"
                            title={u.Enterprise.name || "Entreprise"}
                          >
                            <img
                              src={`${providers.ImageUrl}/${u.Enterprise.logo}`}
                              alt={u.Enterprise.name || "Entreprise"}
                              className="h-full w-full object-cover"
                            />
                          </div>
                        ) : (
                          <span
                            className="block truncate rounded-md bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            title={u.Enterprise?.name || "N/A"}
                          >
                            {u.Enterprise?.name || "N/A"}
                          </span>
                        )}
                      </td>

                      {/* Statut */}
                      <td className="px-3 py-3">
                        <StatusBadge active={!!u.status} />
                      </td>

                      {/* Actions */}
                      <td className="px-3 py-3 pr-4">
                        <div className="flex items-center justify-end gap-0.5">
                          <button
                            title="Consulter le profil"
                            onClick={() =>
                              checkAccessAndExecute(() =>
                                router.push(`/dashboard/RH/user/view/${u.id}`)
                              )
                            }
                            className="rounded-lg p-2 text-slate-400 transition-all hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                          >
                            <FontAwesomeIcon icon={faEye} className="h-4 w-4" />
                          </button>

                          <button
                            title="Modifier"
                            onClick={() =>
                              checkAccessAndExecute(() =>
                                router.push(`/dashboard/RH/user/edit/${u.id}`)
                              )
                            }
                            className="rounded-lg p-2 text-amber-500 transition-all hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950/40"
                          >
                            <FontAwesomeIcon icon={faPen} className="h-4 w-4" />
                          </button>

                          <button
                            title="Supprimer"
                            onClick={() => handleDeleteUser(u.id)}
                            className="rounded-lg p-2 text-rose-500 transition-all hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40"
                          >
                            <FontAwesomeIcon
                              icon={faTrashAlt}
                              className="h-4 w-4"
                            />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Aucun collaborateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200/80 bg-slate-50/50 p-3 dark:border-slate-800 dark:bg-slate-900/50 sm:flex-row sm:p-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {firstItem}-{lastItem}
              </span>{" "}
              sur{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {filteredUsers.length}
              </span>{" "}
              · Page{" "}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {page}
              </span>
              /{maxPage}
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
              >
                <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
                <span>Précédent</span>
              </button>

              <button
                onClick={() => setPage((p) => Math.min(maxPage, p + 1))}
                disabled={page === maxPage}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition-all hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/60"
              >
                <span>Suivant</span>
                <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
