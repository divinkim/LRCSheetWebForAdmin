"use client";

import { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
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
  faChevronLeft,
  faChevronRight,
  faFilter,
} from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";

export type EnterpriseType = {
  id?: number;
  name: string;
  description: string;
  logo: string;
  activityDomain: string;
  phone: string;
  toleranceTime: string | null;
  maxToleranceTime: string | null;
  pourcentageOfHourlyDeduction: string | null;
  maxPourcentageOfHourlyDeduction: string | null;
  email: string;
  address: string;
  website: string | null;
  latitude: string;
  longitude: string;
  CityId: number | null;
  City?: {
    name: string;
  };
  CountryId: number | null;
  Country?: {
    name: string;
  };
  legalForm: string;
  rccm: string | null;
  nui: string | null;
  subscriptionType: string;
  subscriptionStatus: string;
  [key: string]: any;
};

export default function ListEnterprise() {
  const [enterprises, setEnterprises] = useState<EnterpriseType[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const toast = useToast()
  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 8;

  // Récupération des données
  const fetchEnterprises = async () => {
    setIsLoading(true);
    try {
      const res = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);
      if (Array.isArray(res)) {
        setEnterprises(res);
      } else if (res?.data && Array.isArray(res.data)) {
        setEnterprises(res.data);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des entreprises:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterprises();
  }, []);

  // Suppression
  const handleDelete = async (id?: number) => {
    if (!id) return;

    // Modale de confirmation
    const result = await Swal.fire({
      title: "Êtes-vous sûr ?",
      text: "Cette action est irréversible et supprimera l'entreprise.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", // Rouge (rose-600 Tailwind)
      cancelButtonColor: "#64748b",  // Gris (slate-500 Tailwind)
      confirmButtonText: "Oui, supprimer !",
      cancelButtonText: "Annuler",
      reverseButtons: true, // Met "Annuler" à gauche et "Supprimer" à droite
    });

    // Si l'utilisateur clique sur "Oui, supprimer !"
    if (result.isConfirmed) {
      try {
        await providers.API.delete("https://vps118934.serveur-vps.net:4001", "deleteEnterprise", id);
        setEnterprises((prev) => prev.filter((item) => item.id !== id));
        // Notification de succès
        toast.success("Bravo", "Enterprise supprimée avec succès.")
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
        toast.error("Erreur",
          error instanceof Error ? error.message : "Erreur inconnue."
        )
      }
    }
  };

  // Filtrage
  const filteredEnterprises = useMemo(() => {
    return enterprises.filter((ent) => {
      const matchesSearch =
        ent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ent.activityDomain?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ent.City?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ent.email?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "ALL" ||
        ent.subscriptionStatus?.toUpperCase() === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [enterprises, searchQuery, statusFilter]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredEnterprises.length / itemsPerPage);
  const paginatedEnterprises = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredEnterprises.slice(start, start + itemsPerPage);
  }, [filteredEnterprises, currentPage, itemsPerPage]);

  return (
    <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
      <main className="max-w-7xl mx-auto space-y-6 font-sans">

        {/* En-tête Principal */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-3">
              <FontAwesomeIcon icon={faBuilding} className="text-blue-600" />
              Gestion des Entreprises
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Gérez vos entreprises clientes, leurs abonnements et leurs paramètres.
            </p>
          </div>

          <Link
            href="/dashboard/RH/enterprise/add"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl shadow-sm transition-all shrink-0"
          >
            <FontAwesomeIcon icon={faPlus} />
            <span>Nouvelle Entreprise</span>
          </Link>
        </div>

        {/* Barre de Recherche & Filtres */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">

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
            <FontAwesomeIcon icon={faFilter} className="text-slate-400 text-xs" />
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-transparent focus:outline-none text-slate-700 dark:text-slate-200 font-medium cursor-pointer w-full md:w-auto"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="onGoing">Actif</option>
              <option value="expired">Inactif</option>
            </select>
          </div>

        </div>

        {/* DATA TABLE */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800">
                <tr>
                  <th scope="col" className="px-6 py-4">Entreprise</th>
                  <th scope="col" className="px-6 py-4">Secteur</th>
                  <th scope="col" className="px-6 py-4">Contact</th>
                  {/* <th scope="col" className="px-6 py-4">Localisation</th> */}
                  <th scope="col" className="px-6 py-4">Abonnement</th>
                  <th scope="col" className="px-6 py-4 text-center">Statut</th>
                  <th scope="col" className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                {isLoading ? (
                  Array.from({ length: itemsPerPage }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-200 dark:bg-slate-800 shrink-0"></div>
                          <div className="space-y-1.5">
                            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                            <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div>
                          <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </td>
                      {/* <td className="px-6 py-4">
                        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </td> */}
                      <td className="px-6 py-4 text-center">
                        <div className="h-6 w-20 rounded-full bg-slate-200 dark:bg-slate-800 mx-auto"></div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : paginatedEnterprises.length > 0 ? (
                  paginatedEnterprises.map((enterprise) => (
                    <tr
                      key={enterprise.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Entreprise */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 shrink-0">
                            <Image
                              src={
                                enterprise.logo
                                  ? `${providers.APIUrl}/images/${enterprise.logo}`
                                  : "/images/company-placeholder.png"
                              }
                              alt={enterprise.name || "Logo"}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-slate-100">
                              {enterprise.name}
                            </div>
                            <p className="text-xs text-slate-400 font-medium">
                              {enterprise.legalForm || "N/A"}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Secteur */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-700 dark:text-slate-300">
                        {enterprise.activityDomain?.slice(0, 7) + "..." || "-"}
                      </td>

                      {/* Contact */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-0.5 text-sm font-medium">
                          <span className="text-slate-800 dark:text-slate-200">
                            {enterprise.email || "-"}
                          </span>
                          <span className="text-slate-400 text-xs">
                            {enterprise.phone || "-"}
                          </span>
                        </div>
                      </td>

                      {/* Localisation */}
                      {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-600 dark:text-slate-300">
                        {enterprise.City?.name ? `${enterprise.City.name}, ` : ""}
                        {enterprise.Country?.name || enterprise.address || "-"}
                      </td> */}

                      {/* Abonnement */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-slate-700 dark:text-slate-300">
                        {enterprise.subscriptionType}
                      </td>

                      {/* Statut */}
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border ${enterprise.subscriptionStatus === "onGoing"
                            ? "bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900"
                            : "bg-rose-50 text-rose-600 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900"
                            }`}
                        >
                          <FontAwesomeIcon
                            icon={
                              enterprise.subscriptionStatus === "onGoing"
                                ? faCheckCircle
                                : faTimesCircle
                            }
                          />
                          {enterprise.subscriptionStatus === "onGoing" ? "Actif" : "Inactif"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/dashboard/enterprise/OTHERS/view/${enterprise.id}`}
                            className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Voir"
                          >
                            <FontAwesomeIcon icon={faEye} />
                          </Link>
                          <Link
                            href={`/dashboard/enterprise/OTHERS/edit/${enterprise.id}`}
                            className="p-2 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Modifier"
                          >
                            <FontAwesomeIcon icon={faPen} />
                          </Link>
                          <button
                            onClick={() => handleDelete(enterprise.id)}
                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                      Aucune entreprise trouvée.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION */}

        <div className="flex items-center justify-between border-t border-slate-200/80 dark:border-slate-800 pt-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Page <strong className="text-slate-800 dark:text-slate-200">{currentPage}</strong> sur{" "}
            <strong className="text-slate-800 dark:text-slate-200">{totalPages}</strong>
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />
              Précédent
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl hover:bg-slate-100 text-sm dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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