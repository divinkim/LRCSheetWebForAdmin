"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Swal from "sweetalert2";
import { useToast } from "@/components/toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faPlus,
  faSearch,
  faEye,
  faPen,
  faTrash,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faChevronLeft,
  faChevronRight,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";
import { EnterprisesResponseDto } from "@/types/global";

// --- TYPES ---
type City = { id?: number; name: string; [key: string]: any };
type Country = { id?: number; name: string; [key: string]: any };

export type Enterprise = {
  id: number;
  CityId: number;
  CountryId: number;
  createdAt: string;
  updatedAt: string;
  name: string;
  description: string;
  logo: string;
  activityDomain: string;
  phone: string;
  email: string;
  address: string;
  website: string;
  latitude: string;
  longitude: string;
  legalForm: string;
  rccm: string;
  nui: string | null;
  subscriptionType: string | "STARTER" | "PREMIUM" | "PRO";
  paymentFrequency: string | "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL";
  subscriptionStatus: string | "ACTIVE" | "INACTIVE" | "WAITING";
  EnterpriseId: number | null;
  toleranceTime: string;
  pourcentageOfHourlyDeduction: string;
  maxToleranceTime: string;
  maxPourcentageOfHourlyDeduction: string;
  MainEnterpriseId: number | null;
  subscriptionExpiresAt: string | null;
  City: City;
  Country: Country;
  [key: string]: any;
};

// --- CONSTANTES D'AFFICHAGE ---
const STATUS_CONFIG: Record<
  string,
  { label: string; classes: string; icon: typeof faCheckCircle }
> = {
  ACTIVE: {
    label: "Actif",
    icon: faCheckCircle,
    classes:
      "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900",
  },
  WAITING: {
    label: "En attente",
    icon: faHourglassHalf,
    classes:
      "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900",
  },
  INACTIVE: {
    label: "Inactif",
    icon: faTimesCircle,
    classes:
      "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900",
  },
};

const FREQUENCY_LABELS: Record<string, string> = {
  MONTHLY: "Mensuel",
  QUARTERLY: "Trimestriel",
  SEMI_ANNUAL: "Semestriel",
  ANNUAL: "Annuel",
};

const PLAN_CLASSES: Record<string, string> = {
  STARTER:
    "bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700",
  PREMIUM:
    "bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900",
  PRO: "bg-violet-50 text-violet-600 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-900",
};

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// Retourne le nombre de jours restants (négatif si expiré, null si pas de date)
const getDaysLeft = (value?: string | null): number | null => {
  if (!value) return null;
  const date = new Date(value);
  if (isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
};

export default function ListEnterprise() {
  const { data: session, status } = useSession();
  const toast = useToast();

  // Déstructuration sécurisée des données de session
  const user = session?.user as any;
  const adminRole = user?.adminRole ?? "";
  const mainEnterpriseId = Number(user?.MainEnterpriseId || 0);
  const enterpriseId = Number(user?.EnterpriseId || 0);

  // États locaux
  const [enterprises, setEnterprises] = useState<Enterprise[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Récupération et filtrage des entreprises selon le rôle
  const fetchEnterprises = async () => {
    if (status === "loading") return;

    if (status !== "authenticated" || !session?.user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await providers.API.getAll<EnterprisesResponseDto>(
        providers.APIUrl,
        "enterprises",
        null
      );
      const rawEnterprises: Enterprise[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.data)
          ? res.data
          : [];

      let filtered: Enterprise[] = [];

      if (adminRole === "Super_Admin_Platform") {
        filtered = rawEnterprises;
      } else if (adminRole === "Super_Admin_Enterprise") {
        filtered = rawEnterprises.filter(
          (emp) =>
            emp.MainEnterpriseId === mainEnterpriseId ||
            emp.id === mainEnterpriseId
        );
      } else if (adminRole === "Enterprise_Admin") {
        filtered = rawEnterprises.filter((emp) => emp.id === enterpriseId);
      }

      setEnterprises(filtered);
    } catch (error) {
      console.error("Erreur lors du chargement des entreprises:", error);
      toast.error("Erreur", "Impossible de charger les entreprises");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, session, adminRole, mainEnterpriseId, enterpriseId]);

  // Suppression
  const handleDelete = async (id?: number) => {
    if (!id) return;

    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Cette action est irréversible et supprimera l'entreprise.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await providers.API.delete(providers.APIUrl, "enterprises", id);
        setEnterprises((prev) => prev.filter((item) => item.id !== id));
        toast.success("Bravo", "Entreprise supprimée avec succès.");
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error(
          "Erreur",
          error instanceof Error ? error.message : "Erreur inconnue."
        );
      }
    }
  };

  // Filtrage
  const filteredEnterprises = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return enterprises.filter((ent) => {
      const matchesSearch =
        ent.name?.toLowerCase().includes(q) ||
        ent.activityDomain?.toLowerCase().includes(q) ||
        ent.City?.name?.toLowerCase().includes(q) ||
        ent.email?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "ALL" ||
        ent.subscriptionStatus?.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enterprises, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.max(
    1,
    Math.ceil(filteredEnterprises.length / itemsPerPage)
  );
  const paginatedEnterprises = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEnterprises.slice(start, start + itemsPerPage);
  }, [filteredEnterprises, currentPage, itemsPerPage]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors overflow-x-hidden">
      <main className="max-w-7xl mx-auto space-y-6 font-sans">
        {/* En-tête Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <FontAwesomeIcon icon={faBuilding} className="text-blue-600" />
              Gestion des Entreprises
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gérez vos entreprises clientes, leurs abonnements et leurs
              paramètres.
            </p>
          </div>

          <Link
            href="/dashboard/OTHERS/enterprise/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all shrink-0"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Nouvelle Entreprise</span>
          </Link>
        </div>

        {/* Barre de Recherche & Filtres */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          {/* Recherche */}
          <div className="relative w-full md:w-96">
            <FontAwesomeIcon
              icon={faSearch}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
            />
            <input
              type="text"
              placeholder="Rechercher par nom, secteur, ville..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-slate-200"
            />
          </div>

          {/* Filtre Statut */}
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-2 rounded-xl text-sm w-full md:w-auto">
            <FontAwesomeIcon
              icon={faFilter}
              className="text-slate-400 text-xs"
            />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 font-medium cursor-pointer w-full md:w-auto"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actif</option>
              <option value="WAITING">En attente</option>
              <option value="INACTIVE">Inactif</option>
            </select>
          </div>
        </div>

        {/* DATA TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <table className="w-full table-fixed text-left text-sm text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800">
              <tr>
                <th scope="col" className="px-3 sm:px-4 py-4">
                  Entreprise
                </th>
                <th
                  scope="col"
                  className="hidden lg:table-cell px-3 sm:px-4 py-4 w-[12%]"
                >
                  Secteur
                </th>
                <th
                  scope="col"
                  className="hidden md:table-cell px-3 sm:px-4 py-4 w-[22%]"
                >
                  Contact
                </th>
                <th
                  scope="col"
                  className="hidden sm:table-cell px-3 sm:px-4 py-4 w-[22%] md:w-[17%]"
                >
                  Abonnement
                </th>
                <th
                  scope="col"
                  className="hidden md:table-cell px-3 sm:px-4 py-4 w-[13%]"
                >
                  Expiration
                </th>
                <th
                  scope="col"
                  className="px-3 sm:px-4 py-4 text-center w-[112px] sm:w-[120px]"
                >
                  Statut
                </th>
                <th
                  scope="col"
                  className="px-3 sm:px-4 py-4 text-right w-[104px]"
                >
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: itemsPerPage }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="px-3 sm:px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                        <div className="space-y-1.5 min-w-0 flex-1">
                          <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="h-3 w-1/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                      </div>
                    </td>
                    <td className="hidden lg:table-cell px-3 sm:px-4 py-4">
                      <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="h-3.5 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-3 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                    </td>
                    <td className="hidden sm:table-cell px-3 sm:px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                    </td>
                    <td className="hidden md:table-cell px-3 sm:px-4 py-4">
                      <div className="space-y-1.5">
                        <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-3 w-1/2 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-4 text-center">
                      <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto"></div>
                    </td>
                    <td className="px-3 sm:px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                        <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                      </div>
                    </td>
                  </tr>
                ))
              ) : paginatedEnterprises.length > 0 ? (
                paginatedEnterprises.map((enterprise) => {
                  const statusKey =
                    enterprise.subscriptionStatus?.toUpperCase() ?? "";
                  const statusCfg =
                    STATUS_CONFIG[statusKey] ?? STATUS_CONFIG.INACTIVE;

                  const planKey = enterprise.subscriptionType?.toUpperCase() ?? "";
                  const planClasses =
                    PLAN_CLASSES[planKey] ?? PLAN_CLASSES.STARTER;
                  const frequencyLabel =
                    FREQUENCY_LABELS[
                      enterprise.paymentFrequency?.toUpperCase() ?? ""
                    ] ??
                    enterprise.paymentFrequency ??
                    "-";

                  const daysLeft = getDaysLeft(enterprise.subscriptionExpiresAt);
                  const isExpired = daysLeft !== null && daysLeft < 0;
                  const isExpiringSoon =
                    daysLeft !== null && daysLeft >= 0 && daysLeft <= 7;

                  return (
                    <tr
                      key={enterprise.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Entreprise */}
                      <td className="px-3 sm:px-4 py-4">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                            <img
                              src={
                                enterprise.logo
                                  ? `${providers.ImageUrl}/${enterprise.logo}`
                                  : "/images/company-placeholder.png"
                              }
                              alt={enterprise.name || "Logo"}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <div
                              className="font-semibold text-slate-900 dark:text-slate-100 truncate"
                              title={enterprise.name}
                            >
                              {enterprise.name}
                            </div>
                            <p className="text-xs text-slate-400 font-medium truncate">
                              {enterprise.legalForm || "N/A"}
                              {enterprise.City?.name
                                ? ` • ${enterprise.City.name}`
                                : ""}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Secteur */}
                      <td
                        className="hidden lg:table-cell px-3 sm:px-4 py-4 text-sm font-medium text-slate-700 dark:text-slate-300"
                        title={enterprise.activityDomain}
                      >
                        <span className="block truncate">
                          {enterprise.activityDomain || "-"}
                        </span>
                      </td>

                      {/* Contact */}
                      <td className="hidden md:table-cell px-3 sm:px-4 py-4">
                        <div className="flex flex-col gap-0.5 text-sm font-medium min-w-0">
                          <span
                            className="text-slate-800 dark:text-slate-200 truncate"
                            title={enterprise.email}
                          >
                            {enterprise.email || "-"}
                          </span>
                          <span className="text-slate-400 text-xs truncate">
                            {enterprise.phone || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Abonnement + fréquence de paiement */}
                      <td className="hidden sm:table-cell px-3 sm:px-4 py-4">
                        <div className="flex flex-col items-start gap-1 min-w-0">
                          <span
                            className={`inline-block text-xs font-bold px-2.5 py-0.5 rounded-md border ${planClasses}`}
                          >
                            {enterprise.subscriptionType || "-"}
                          </span>
                          <span className="text-xs text-slate-400 font-medium truncate max-w-full">
                            {frequencyLabel}
                          </span>
                        </div>
                      </td>

                      {/* Date d'expiration */}
                      <td className="hidden md:table-cell px-3 sm:px-4 py-4">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span
                            className={`text-sm font-medium truncate ${
                              isExpired
                                ? "text-rose-600 dark:text-rose-400"
                                : isExpiringSoon
                                  ? "text-amber-600 dark:text-amber-400"
                                  : "text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            {formatDate(enterprise.subscriptionExpiresAt)}
                          </span>
                          {daysLeft !== null && (
                            <span className="text-xs text-slate-400 truncate">
                              {isExpired
                                ? `Expiré depuis ${Math.abs(daysLeft)} j`
                                : daysLeft === 0
                                  ? "Expire aujourd'hui"
                                  : `Dans ${daysLeft} j`}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Statut */}
                      <td className="px-3 sm:px-4 py-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border whitespace-nowrap ${statusCfg.classes}`}
                        >
                          <FontAwesomeIcon icon={statusCfg.icon} />
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-3 sm:px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-0.5">
                          <Link
                            href={`/dashboard/OTHERS/enterprise/view/${enterprise.id}`}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Link>

                          <Link
                            href={`/dashboard/OTHERS/enterprise/edit/${enterprise.id}`}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </Link>

                          {adminRole === "Super_Admin_Platform" && (
                            <button
                              onClick={() => handleDelete(enterprise.id)}
                              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Supprimer"
                            >
                              <FontAwesomeIcon icon={faTrash} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                  >
                    Aucune entreprise trouvée.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        <div className="flex items-center justify-between gap-3 border-t border-slate-200/80 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {currentPage}
            </strong>{" "}
            sur{" "}
            <strong className="text-slate-800 dark:text-slate-200">
              {totalPages}
            </strong>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              Précédent
            </button>

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-2 px-3 py-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Suivant
              <FontAwesomeIcon icon={faChevronRight} className="text-xs" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
