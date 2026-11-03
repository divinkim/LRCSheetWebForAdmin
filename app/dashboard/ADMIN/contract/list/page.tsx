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
    faChevronDown,
    faTrashAlt,
    faPen,
    faFileContract,
    faFileDownload,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { providers } from "@/index";
import { useToast } from "@/components/toast";
import { Contract, ContractsResponseDto } from "@/types/global";

const REQUIRED_ADMIN_ROLES = ["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"];

type ContractStatus = "ACTIVE" | "INACTIVE";

/* -------------------------------------------------------------------------- */
/*  Badge de statut (cliquable pour modifier)                                 */
/* -------------------------------------------------------------------------- */
function StatusBadge({
    status,
    onClick,
    loading = false,
}: {
    status?: string;
    onClick?: () => void;
    loading?: boolean;
}) {
    const isActive = status?.toUpperCase() === "ACTIVE";

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            title="Cliquer pour modifier le statut"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-4 ${isActive
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 focus-visible:ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-950/70"
                : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 focus-visible:ring-red-500/20 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/70"
                }`}
        >
            {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="h-3 w-3" />
            ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-red-500"}`} />
            )}
            {isActive ? "En cours" : "Expiré"}
            <FontAwesomeIcon icon={faChevronDown} className="h-2.5 w-2.5 opacity-60" />
        </button>
    );
}

export default function ContractList() {
    const router = useRouter();
    const { data: session, status } = useSession();
    const toast = useToast();

    // Configuration & constantes
    const limit = 8;

    // 1. Données de session
    // 2. États locaux
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
    const [hasAdminAccess, setHasAdminAccess] = useState(false)
    // 3. Récupération des contrats
    useEffect(() => {
        async function fetchContracts() {

            const adminRole = String((session?.user as any)?.adminRole);
            const enterpriseId = Number((session?.user as any)?.EnterpriseId);
            const hasAdminAccess = REQUIRED_ADMIN_ROLES.includes(adminRole);

            if (!REQUIRED_ADMIN_ROLES.includes(adminRole)) {
                window.location.href = "/home";
                return;
            }

            try {
                setLoading(true);
                const response = await providers.API.getAll<ContractsResponseDto>(providers.APIUrl, "contracts", null);
                const rawContracts: Contract[] = response.data;

                let filtered: Contract[] = [];

                if (adminRole === "Super_Admin_Platform") {
                    filtered = rawContracts;
                } else if (adminRole === "Enterprise_Admin" || adminRole === "Super_Admin_Enterprise") {
                    filtered = rawContracts.filter(
                        (c) => c.EnterpriseId === enterpriseId || adminRole === "Super_Admin_Enterprise"
                    );
                }

                setContracts(filtered);
                setHasAdminAccess(hasAdminAccess)
            } catch (error) {
                toast.error("Erreur", "Erreur lors de la récupération des contrats");
                console.error("Erreur fetchContracts:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchContracts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session]);

    // 4. Filtrage & recherche
    const filteredContracts = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (Array.isArray(contracts)) {
            return contracts?.filter((contract) => {
                return (
                    !query ||
                    contract.ContractType?.title?.toLowerCase().includes(query) ||
                    contract.ContractType?.description?.toLowerCase().includes(query) ||
                    contract.Enterprise?.name?.toLowerCase().includes(query)
                );
            });
        } else {
            return []
        }
    }, [contracts, search]);

    // Pagination
    const maxPage = Math.max(1, Math.ceil(filteredContracts.length / limit));

    const currentData = useMemo(() => {
        const startIdx = (page - 1) * limit;
        return filteredContracts.slice(startIdx, startIdx + limit);
    }, [filteredContracts, page, limit]);

    // Gestionnaires d'événements
    const handleSearchChange = (value: string) => {
        setSearch(value);
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
        const headers = ["ID", "Type de contrat", "Description", "Entreprise", "Date de début", "Date de fin", "Statut"];
        const rows = filteredContracts.map((contract) => [
            contract.id,
            `"${contract.ContractType?.title || ""}"`,
            `"${(contract.ContractType?.description || "").replace(/"/g, '""')}"`,
            `"${contract.Enterprise?.name || ""}"`,
            `"${contract.startDate || ""}"`,
            `"${contract.endDate || ""}"`,
            `"${contract.status || ""}"`,
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8," +
            [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `contrats_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredContracts]);

    // Modification du statut (ACTIVE / INACTIVE)
    const handleChangeStatus = (contract: Contract) => {
        checkAccessAndExecute(async () => {
            const currentStatus: ContractStatus =
                contract.status?.toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE";

            const result = await Swal.fire({
                title: "Modifier le statut",
                text: contract.ContractType?.title ?? "",
                input: "radio",
                inputOptions: {
                    ACTIVE: "ACTIVE",
                    INACTIVE: "INACTIVE",
                },
                inputValue: currentStatus,
                showCancelButton: true,
                cancelButtonText: "Annuler",
                confirmButtonText: "Enregistrer",
                confirmButtonColor: "#2563eb",
                cancelButtonColor: "#64748b",
                customClass: {
                    popup: "dark:bg-slate-800 dark:text-white rounded-xl border dark:border-slate-700",
                },
            });

            if (!result.isConfirmed || !result.value) return;

            const newStatus = result.value as ContractStatus;
            if (newStatus === currentStatus) return;

            const previousStatus = contract.status;

            try {
                setUpdatingStatusId(contract.id);

                // Mise à jour optimiste
                setContracts((prev) =>
                    prev.map((c) => (c.id === contract.id ? { ...c, status: newStatus } : c))
                );

                await providers.API.update(providers.APIUrl, "contracts", null, {
                    status: newStatus,
                }, contract.id);

                toast.success("Bravo", `Statut modifié : ${newStatus}`);
            } catch (err) {
                // Annulation en cas d'erreur
                setContracts((prev) =>
                    prev.map((c) => (c.id === contract.id ? { ...c, status: previousStatus } : c))
                );
                toast.error("Erreur", err instanceof Error ? err.message : "Impossible de modifier le statut");
            } finally {
                setUpdatingStatusId(null);
            }
        });
    };

    // Suppression d'un contrat
    const handleDeleteContract = (id: number) => {
        checkAccessAndExecute(() => {
            Swal.fire({
                icon: "warning",
                title: "Confirmer la suppression",
                text: "Êtes-vous sûr de vouloir supprimer ce contrat ?",
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
                        await providers.API.delete(providers.APIUrl, "contracts", id, {});
                        toast.success("Bravo", "Contrat supprimé avec succès");
                        setContracts((prev) => prev.filter((c) => c.id !== id));
                    } catch (err) {
                        toast.error("Erreur", err instanceof Error ? err.message : "Erreur réseau");
                    }
                }
            });
        });
    };

    return (
        <div className="w-full min-h-screen p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
            <main className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400">
                                <FontAwesomeIcon icon={faFileContract} className="text-lg" />
                            </span>
                            Gestion des Contrats
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Gestion centralisée et suivi des contrats.
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Rechercher par type, description ou entreprise..."
                                value={search}
                                onChange={(e) => handleSearchChange(e.target.value)}
                                className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/50 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
                            />
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5 justify-end">
                        <button
                            onClick={exportToCSV}
                            disabled={filteredContracts.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all"
                            title="Exporter au format CSV"
                        >
                            <FontAwesomeIcon icon={faFileDownload} className="text-slate-400" />
                            <span className="hidden sm:inline">Exporter</span>
                        </button>

                        <Link
                            href="/dashboard/ADMIN/contract/new"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            <span className="text-sm">+</span>
                            <span>Ajouter un contrat</span>
                        </Link>
                    </div>
                </div>

                {/* Tableau */}
                <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="bg-slate-50/80 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800/40 dark:text-slate-400 dark:border-slate-800">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Type de contrat</th>
                                    <th scope="col" className="px-6 py-4">Description</th>
                                    <th scope="col" className="px-6 py-4">Entreprise</th>
                                    <th scope="col" className="px-6 py-4">Date de début</th>
                                    <th scope="col" className="px-6 py-4">Date de fin</th>
                                    <th scope="col" className="px-6 py-4">Statut</th>
                                    <th scope="col" className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: limit }).map((_, index) => (
                                        <tr key={index} className="animate-pulse">
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 bg-slate-200 dark:bg-slate-800 rounded-lg" />
                                                    <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-6 w-24 bg-slate-200 dark:bg-slate-800 rounded-full" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                                                    <div className="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : currentData.length > 0 ? (
                                    currentData.map((contract) => (
                                        <tr
                                            key={contract.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            {/* Type de contrat */}
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                {contract.ContractType?.title ?? ""}
                                            </td>

                                            {/* Description */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                {contract.ContractType?.description
                                                    ? `${contract.ContractType.description.slice(0, 30)}...`
                                                    : "-"}
                                            </td>

                                            {/* Entreprise (logo + nom, ou nom seul) */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    {contract.Enterprise?.logo && (
                                                        <img
                                                            src={`${providers.ImageUrl}/${contract.Enterprise.logo}`}
                                                            alt={`Logo ${contract.Enterprise?.name ?? ""}`}
                                                            width={32}
                                                            height={32}
                                                            className="h-8 w-8 rounded-lg object-contain border border-slate-200 dark:border-slate-700 bg-white p-0.5"
                                                        />
                                                    )}
                                                    <span>{contract.Enterprise?.name ?? "-"}</span>
                                                </div>
                                            </td>

                                            {/* Date de début */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {contract.startDate
                                                    ? new Date(contract.startDate).toLocaleDateString("fr-FR")
                                                    : "-"}
                                            </td>

                                            {/* Date de fin */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {contract.endDate
                                                    ? new Date(contract.endDate).toLocaleDateString("fr-FR")
                                                    : "-"}
                                            </td>

                                            {/* Statut (modifiable) */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge
                                                    status={contract.status}
                                                    loading={updatingStatusId === contract.id}
                                                    onClick={() => handleChangeStatus(contract)}
                                                />
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        title="Modifier"
                                                        onClick={() =>
                                                            checkAccessAndExecute(() => {
                                                                router.push(`/dashboard/ADMIN/contract/edit/${contract.id}`);
                                                            })
                                                        }
                                                        className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        title="Supprimer"
                                                        onClick={() => handleDeleteContract(contract.id)}
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
                                            Aucun contrat trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Page{" "}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{page}</span>{" "}
                            sur{" "}
                            <span className="font-semibold text-slate-900 dark:text-slate-100">{maxPage}</span>
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
