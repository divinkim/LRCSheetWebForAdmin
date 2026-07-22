"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChevronLeft,
  faChevronRight,
  faSearch,
  faEye,
  faPen,
  faTrash,
  faUserPlus,
  faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { providers } from "@/index";
import { tablesModal } from "@/components/Tables/tablesModal";

type UserData = {
  id: number;
  firstname: string | null;
  lastname: string | null;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  email: string | null;
  status: boolean | null;
  gender: string | null;
  photo: string | null;
  Enterprise?: {
    name: string | null;
    logo: string | null;
  };
};

const REQUIRED_ADMIN_ROLES = ["Super-Admin", "Supervisor-Admin"];
const ITEMS_PER_PAGE = 5;

export default function UsersList() {
  const { data: session, status } = useSession();
  
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [usersList, setUsersList] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);

  // Rôle de l'utilisateur connecté
  const userRole = session?.user?.adminRole ?? "";
  const hasAdminAccess = REQUIRED_ADMIN_ROLES.includes(userRole);

  // 1. Chargement des données
  useEffect(() => {
    async function fetchUsers() {
      if (status !== "authenticated" || !session?.user) return;

      try {
        setLoading(true);
        const enterpriseId = session.user.EnterpriseId;
        const data = await providers.API.getAll(providers.APIUrl, "getUsers", null);

        if (enterpriseId === 1) {
          setUsersList(data || []);
        } else {
          const filtered = (data || []).filter(
            (user: any) => user.EnterpriseId === enterpriseId
          );
          setUsersList(filtered);
        }
      } catch (error) {
        console.error("Erreur lors de la récupération des utilisateurs:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [session, status]);

  // 2. Filtrage réactif des utilisateurs
  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return usersList;

    return usersList.filter(
      (user) =>
        user.firstname?.toLowerCase().includes(query) ||
        user.lastname?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
    );
  }, [search, usersList]);

  // 3. Calculs de la pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, page]);

  // Réinitialiser la page sur nouvelle recherche
  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Action Vérification Accès
  const checkAccessAndExecute = (action: () => void) => {
    if (!hasAdminAccess) {
      Swal.fire({
        icon: "warning",
        title: "Accès refusé !",
        text: "Vous n'avez pas les droits nécessaires pour effectuer cette action. Contactez votre administrateur.",
        confirmButtonColor: "#2563eb",
      });
      return;
    }
    action();
  };

  // Suppression d'un utilisateur
  const handleDeleteUser = (id: number) => {
    checkAccessAndExecute(() => {
      Swal.fire({
        icon: "warning",
        title: "Supprimer le collaborateur ?",
        text: "Cette action est irréversible.",
        showCancelButton: true,
        confirmButtonText: "Oui, supprimer",
        cancelButtonText: "Annuler",
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#64748b",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const response = await providers.API.delete(
              providers.APIUrl,
              "deleteUser",
              id,
              {}
            );
            providers.alertMessage(
              response.status,
              response.title,
              response.message,
              "/dashboard/RH/usersList"
            );
            setUsersList((prev) => prev.filter((u) => u.id !== id));
          } catch (err) {
            console.error("Erreur de suppression:", err);
          }
        }
      });
    });
  };

  return (
    <div className="w-full p-4 sm:p-6 text-slate-700 dark:text-slate-300">
      {/* En-tête */}
      {tablesModal.map((e, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 mb-6 border-b border-slate-200 dark:border-slate-800"
        >
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {e.usersList.pageTitle}
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gestion et suivi des profils collaborateurs
            </p>
          </div>
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-2 sm:mt-0">
            {e.usersList.path}
          </p>
        </div>
      ))}

      {/* Barre d'actions (Recherche + Boutons d'ajout) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Rechercher un collaborateur..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
          <FontAwesomeIcon
            icon={faSearch}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {tablesModal.map((e) =>
            e.usersList.links.map((item, idx) => (
              <Link
                key={idx}
                href={item.href}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm transition-colors shadow-sm w-full sm:w-auto"
              >
                <FontAwesomeIcon icon={item.icon || faUserPlus} />
                <span>{item.title}</span>
              </Link>
            ))
          )}
        </div>
      </div>

      {/* Tableau des utilisateurs */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
              {tablesModal.map((e) =>
                e.usersList.table.titles.map((item, idx) => (
                  <th key={idx} className="px-4 py-3.5 whitespace-nowrap">
                    {item.title}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-500">
                  <FontAwesomeIcon icon={faSpinner} className="animate-spin text-2xl text-blue-600 mb-2" />
                  <p>Chargement des données...</p>
                </td>
              </tr>
            ) : paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  {/* Photo */}
                  <td className="px-4 py-3">
                    <img
                      src={
                        user.photo
                          ? `${providers.APIUrl}/images/${user.photo}`
                          : "/images/clientProfile.png"
                      }
                      alt={user.lastname || "Profil"}
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                  </td>

                  {/* Nom & Prénom */}
                  <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                    {user.lastname ?? "-"} {user.firstname ?? ""}
                  </td>

                  {/* Téléphone */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {user.phone ?? "-"}
                  </td>

                  {/* Email */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {user.email ?? "-"}
                  </td>

                  {/* Genre */}
                  <td className="px-4 py-3 text-slate-600 dark:text-slate-400">
                    {user.gender ?? "-"}
                  </td>

                  {/* Entreprise */}
                  <td className="px-4 py-3">
                    {user.Enterprise?.logo ? (
                      <img
                        src={`${providers.APIUrl}/images/${user.Enterprise.logo}`}
                        alt={user.Enterprise.name || "Entreprise"}
                        className="w-8 h-8 rounded-md object-cover border border-slate-200"
                      />
                    ) : (
                      <span className="text-sm font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {user.Enterprise?.name || "N/A"}
                      </span>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-semibold ${
                        user.status
                          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400"
                          : "bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400"
                      }`}
                    >
                      {user.status ? "Actif" : "Inactif"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        title="Consulter le profil"
                        onClick={() =>
                          checkAccessAndExecute(() => {
                            window.location.href = `/dashboard/RH/getUserProfile/${user.id}`;
                          })
                        }
                        className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors"
                      >
                        <FontAwesomeIcon icon={faEye} />
                      </button>

                      <button
                        title="Modifier"
                        onClick={() =>
                          checkAccessAndExecute(() => {
                            window.location.href = `/dashboard/RH/updateUser/${user.id}`;
                          })
                        }
                        className="p-2 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-600 dark:text-amber-400 transition-colors"
                      >
                        <FontAwesomeIcon icon={faPen} />
                      </button>

                      <button
                        title="Supprimer"
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 rounded-lg bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-400 transition-colors"
                      >
                        <FontAwesomeIcon icon={faTrash} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-8 text-center text-slate-500">
                  Aucun collaborateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Page <span className="font-semibold text-slate-700 dark:text-slate-200">{page}</span> sur{" "}
          <span className="font-semibold text-slate-700 dark:text-slate-200">{totalPages}</span>
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
            <span>Précédent</span>
          </button>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <span>Suivant</span>
            <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}