"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
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
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";

import { providers } from "@/index";
import { tablesModal } from "@/components/Tables/tablesModal";
import { useToast } from "@/components/toast"; // Importation du hook personnalisé

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
  const router = useRouter();
  const { data: session, status } = useSession();
  const toast = useToast(); // Initialisation de toast via useToast()

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
        toast.error("Erreur lors de la récupération des collaborateurs");
        console.error("Erreur fetchUsers:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [session, status]);

  // 2. Filtrage réactif
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

  // 3. Calculs de pagination
  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) || 1;
  const paginatedUsers = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, page]);

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  // Contrôle des accès avec Toast
  const checkAccessAndExecute = (action: () => void) => {
    if (!hasAdminAccess) {
      toast.error("Accès refusé : Droits insuffisants.");
      return;
    }
    action();
  };

  // Suppression d'un utilisateur
  const handleDeleteUser = (id: number) => {
    checkAccessAndExecute(async () => {
      // Si ton useToast prend un toast personnalisé ou gère les promesses / confirmations :
      if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce collaborateur ?")) {
        return;
      }

      try {
        const response = await providers.API.delete(
          providers.APIUrl,
          "deleteUser",
          id,
          {}
        );

        if (response.status) {
          toast.success("Bravo", "Collaborateur supprimé avec succès");
          setUsersList((prev) => prev.filter((u) => u.id !== id));
        }
      } catch (err) {
        toast.error("Erreur", err instanceof Error ? err.message : "Erreur réseau");
      }
    });
  };

  return (
    <div className="w-full p-4 sm:p-6 text-slate-700 dark:text-slate-300">
      {/* En-tête de page */}
      {tablesModal.map((e, index) => (
        <div
          key={index}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-5 mb-6 border-b border-slate-200 dark:border-slate-800"
        >
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
              {e.usersList.pageTitle}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5">
              Gestion centralisée et suivi des profils collaborateurs
            </p>
          </div>
          <p className="text-sm font-semibold px-3 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 text-blue-600 dark:text-blue-400 mt-3 sm:mt-0">
            {e.usersList.path}
          </p>
        </div>
      ))}

      {/* Barre d'actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Rechercher un collaborateur..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent shadow-sm transition-all placeholder:text-slate-400"
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
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm transition-all shadow-sm hover:shadow active:scale-[0.98] w-full sm:w-auto"
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
            <tr className="bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase text-sm tracking-wider">
              {tablesModal.map((e) =>
                e.usersList.table.titles.map((item, idx) => (
                  <th key={idx} className="px-5 py-4 whitespace-nowrap">
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
                  <FontAwesomeIcon
                    icon={faSpinner}
                    className="animate-spin text-2xl text-blue-600 mb-3"
                  />
                  <p className="font-medium">Chargement des données...</p>
                </td>
              </tr>
            ) : paginatedUsers.length > 0 ? (
              paginatedUsers.map((user) => (
                <tr
                  key={user.id}
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors duration-150"
                >
                  {/* Photo */}
                  <td className="px-5 py-3.5">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                      <Image
                        src={
                          user.photo
                            ? `${providers.APIUrl}/images/${user.photo}`
                            : "/images/clientProfile.png"
                        }
                        alt={user.lastname || "Profil"}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    </div>
                  </td>

                  {/* Nom & Prénom */}
                  <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                    {user.lastname ?? "-"} {user.firstname ?? ""}
                  </td>

                  {/* Téléphone */}
                  {/* <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 font-medium whitespace-nowrap">
                    {user.phone ?? "-"}
                  </td> */}

                  {/* Email */}
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                    {user.email ?? "-"}
                  </td>

                  {/* Genre */}
                  <td className="px-5 py-3.5 text-slate-600 dark:text-slate-400">
                    {user.gender ?? "-"}
                  </td>

                  {/* Entreprise */}
                  <td className="px-5 py-3.5">
                    {user.Enterprise?.logo ? (
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                        <Image
                          src={`${providers.APIUrl}/images/${user.Enterprise.logo}`}
                          alt={user.Enterprise.name || "Entreprise"}
                          fill
                          sizes="32px"
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-sm font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {user.Enterprise?.name || "N/A"}
                      </span>
                    )}
                  </td>

                  {/* Statut */}
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-full text-sm font-bold ${user.status
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-400"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-400"
                        }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${user.status ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                      />
                      {user.status ? "Actif" : "Inactif"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <button
                        title="Consulter le profil"
                        onClick={() =>
                          checkAccessAndExecute(() => {
                            router.push(`/dashboard/RH/getUserProfile/${user.id}`);
                          })
                        }
                        className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-all"
                      >
                        <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                      </button>

                      <button
                        title="Modifier"
                        onClick={() =>
                          checkAccessAndExecute(() => {
                            router.push(`/dashboard/RH/updateUser/${user.id}`);
                          })
                        }
                        className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                      >
                        <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                      </button>

                      <button
                        title="Supprimer"
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-all"
                      >
                        <FontAwesomeIcon icon={faTrash} className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-slate-500">
                  Aucun collaborateur trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Page{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {page}
          </span>{" "}
          sur{" "}
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            {totalPages}
          </span>
        </p>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
            <span>Suivant</span>
          </button>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            <span>Précédent</span>
            <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
          </button>
        </div>
      </div>
    </div>
  );
}