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
    faPen,
    faTags,
    faFileDownload,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { providers } from "@/index";
import { useToast } from "@/components/toast";
import { LeaveTypeListDto, LeaveTypeListsResponseDto } from "@/types/global";

const REQUIRED_ADMIN_ROLES = ["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"];

/** Nom d'affichage de l'entreprise (EnterpriseDto : adaptez le champ si besoin) */
function getEnterpriseName(leaveType: LeaveTypeListDto): string {
    const e = leaveType.Enterprise as any;
    return e?.name ?? e?.title ?? (leaveType.EnterpriseId ? `#${leaveType.EnterpriseId}` : "-");
}

export default function LeaveTypeList() {
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const toast = useToast();

    const limit = 8;

    const [leaveTypes, setLeaveTypes] = useState<LeaveTypeListDto[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasAdminAccess, setHasAdminAccess] = useState(false);

    // Récupération des types de congé
    useEffect(() => {
        if (sessionStatus === "loading") return;

        async function fetchLeaveTypes() {
            const adminRole = String((session?.user as any)?.adminRole);
            const enterpriseId = Number((session?.user as any)?.EnterpriseId);
            const isAdmin = REQUIRED_ADMIN_ROLES.includes(adminRole);

            if (!isAdmin) {
                window.location.href = "/home";
                return;
            }

            try {
                setLoading(true);
                const response = await providers.API.getAll<LeaveTypeListsResponseDto>(
                    providers.APIUrl,
                    "leave-types",
                    null
                );
                const rawLeaveTypes: LeaveTypeListDto[] = Array.isArray(response.data) ? response.data : [];

                let filtered: LeaveTypeListDto[] = [];

                if (adminRole === "Super_Admin_Platform" || adminRole === "Super_Admin_Enterprise") {
                    filtered = rawLeaveTypes;
                } else if (adminRole === "Enterprise_Admin") {
                    filtered = rawLeaveTypes.filter((t) => Number(t.EnterpriseId) === enterpriseId);
                }

                setLeaveTypes(filtered);
                setHasAdminAccess(isAdmin);
            } catch (error) {
                toast.error("Erreur", "Erreur lors de la récupération des types de congé");
                console.error("Erreur fetchLeaveTypes:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaveTypes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, sessionStatus]);

    // Filtrage & recherche
    const filteredLeaveTypes = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return leaveTypes;

        return leaveTypes.filter(
            (t) =>
                t.title?.toLowerCase().includes(query) ||
                t.description?.toLowerCase().includes(query) ||
                getEnterpriseName(t).toLowerCase().includes(query)
        );
    }, [leaveTypes, search]);

    // Pagination
    const maxPage = Math.max(1, Math.ceil(filteredLeaveTypes.length / limit));

    // Évite de rester sur une page inexistante (après suppression, par exemple)
    useEffect(() => {
        if (page > maxPage) setPage(maxPage);
    }, [page, maxPage]);

    const currentData = useMemo(() => {
        const startIdx = (page - 1) * limit;
        return filteredLeaveTypes.slice(startIdx, startIdx + limit);
    }, [filteredLeaveTypes, page]);

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
        const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const headers = ["ID", "Titre", "Description", "Entreprise"];
        const rows = filteredLeaveTypes.map((t) => [
            t.id,
            esc(t.title),
            esc(t.description),
            esc(getEnterpriseName(t)),
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8,\uFEFF" +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `types_conges_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredLeaveTypes]);

    // Suppression d'un type de congé
    const handleDeleteLeaveType = (id: number) => {
        checkAccessAndExecute(() => {
            Swal.fire({
                icon: "warning",
                title: "Confirmer la suppression",
                text: "Êtes-vous sûr de vouloir supprimer ce type de congé ?",
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
                        await providers.API.delete(providers.APIUrl, "leave-types", id, {});
                        toast.success("Bravo", "Type de congé supprimé avec succès");
                        setLeaveTypes((prev) => prev.filter((t) => t.id !== id));
                    } catch (err) {
                        toast.error("Erreur", err instanceof Error ? err.message : "Erreur réseau");
                    }
                }
            });
        });
    };

    return (
        // Hauteur fixée à l'écran : seul le tableau défile, jamais la page
        <div className="flex h-[100dvh] w-full min-w-0 flex-col overflow-hidden p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950 transition-colors">
            <main className="mx-auto flex min-h-0 w-full max-w-7xl flex-1 flex-col gap-6">
                {/* Header */}
                <div className="flex shrink-0 flex-col gap-4 pb-2 border-b border-slate-200/80 dark:border-slate-800 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 flex items-center gap-3">
                            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-600 border border-blue-500/20 dark:bg-blue-400/10 dark:text-blue-400">
                                <FontAwesomeIcon icon={faTags} className="text-lg" />
                            </span>
                            Types de Congé
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Gestion des catégories de congé disponibles pour vos employés.
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex shrink-0 flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Rechercher par titre, description ou entreprise..."
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
                            disabled={filteredLeaveTypes.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all"
                            title="Exporter au format CSV"
                        >
                            <FontAwesomeIcon icon={faFileDownload} className="text-slate-400" />
                            <span className="hidden sm:inline">Exporter</span>
                        </button>

                        <Link
                            href="/dashboard/RH/leave-type/new"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            <span className="text-sm">+</span>
                            <span>Ajouter un type de congé</span>
                        </Link>
                    </div>
                </div>

                {/* Tableau : occupe l'espace restant et défile en interne */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="min-h-0 flex-1 overflow-auto">
                        <table className="w-full min-w-[700px] text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Titre</th>
                                    <th scope="col" className="px-6 py-4">Description</th>
                                    <th scope="col" className="px-6 py-4">Entreprise</th>
                                    <th scope="col" className="px-6 py-4">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-200/80 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: limit }).map((_, index) => (
                                        <tr key={index} className="animate-pulse">
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-28 bg-slate-200 dark:bg-slate-800 rounded-md" />
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
                                    currentData.map((leaveType) => (
                                        <tr
                                            key={leaveType.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            {/* Titre */}
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                {leaveType.title}
                                            </td>

                                            {/* Description (tronquée, texte complet au survol) */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                <div
                                                    className="max-w-[360px] truncate"
                                                    title={leaveType.description || undefined}
                                                >
                                                    {leaveType.description || "-"}
                                                </div>
                                            </td>

                                            {/* Entreprise */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {getEnterpriseName(leaveType)}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        title="Modifier"
                                                        onClick={() =>
                                                            checkAccessAndExecute(() => {
                                                                router.push(`/dashboard/RH/leave-type/edit/${leaveType.id}`);
                                                            })
                                                        }
                                                        className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        title="Supprimer"
                                                        onClick={() => handleDeleteLeaveType(leaveType.id)}
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
                                        <td colSpan={4} className="py-12 text-center text-slate-500">
                                            Aucun type de congé trouvé.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination (toujours visible sous le tableau) */}
                    <div className="flex shrink-0 flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
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
