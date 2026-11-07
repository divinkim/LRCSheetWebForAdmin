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
    faCalendarDays,
    faFileDownload,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import Swal from "sweetalert2";

import { providers } from "@/index";
import { useToast } from "@/components/toast";
import { LeaveListDto, LeaveListsResponseDto } from "@/types/global";

const REQUIRED_ADMIN_ROLES = ["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"];

// Adaptez ces valeurs à votre type `Status` si elles diffèrent
type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";

const STATUS_CONFIG: Record<LeaveStatus, { label: string; dot: string; classes: string }> = {
    PENDING: {
        label: "En attente",
        dot: "bg-amber-500",
        classes:
            "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 focus-visible:ring-amber-500/20 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900 dark:hover:bg-amber-950/70",
    },
    APPROVED: {
        label: "Approuvé",
        dot: "bg-emerald-500",
        classes:
            "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 focus-visible:ring-emerald-500/20 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900 dark:hover:bg-emerald-950/70",
    },
    REJECTED: {
        label: "Refusé",
        dot: "bg-red-500",
        classes:
            "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 focus-visible:ring-red-500/20 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900 dark:hover:bg-red-950/70",
    },
};

function normalizeStatus(status?: string | null): LeaveStatus {
    const s = String(status ?? "").toUpperCase();
    return s === "APPROVED" || s === "REJECTED" ? s : "PENDING";
}

function formatDate(value?: string | null) {
    if (!value) return "-";
    const d = new Date(value);
    return isNaN(d.getTime()) ? "-" : d.toLocaleDateString("fr-FR");
}

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
    const cfg = STATUS_CONFIG[normalizeStatus(status)];

    return (
        <button
            type="button"
            onClick={onClick}
            disabled={loading}
            title="Cliquer pour modifier le statut"
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold border transition-all disabled:opacity-60 disabled:cursor-wait focus:outline-none focus-visible:ring-4 ${cfg.classes}`}
        >
            {loading ? (
                <FontAwesomeIcon icon={faSpinner} spin className="h-3 w-3" />
            ) : (
                <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            )}
            {cfg.label}
            <FontAwesomeIcon icon={faChevronDown} className="h-2.5 w-2.5 opacity-60" />
        </button>
    );
}

export default function LeaveList() {
    const router = useRouter();
    const { data: session, status: sessionStatus } = useSession();
    const toast = useToast();

    const limit = 8;

    const [leaves, setLeaves] = useState<LeaveListDto[]>([]);
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);
    const [hasAdminAccess, setHasAdminAccess] = useState(false);

    // Récupération des congés
    useEffect(() => {
        if (sessionStatus === "loading") return;

        async function fetchLeaves() {
            const adminRole = String((session?.user as any)?.adminRole);
            const enterpriseId = Number((session?.user as any)?.EnterpriseId);
            const isAdmin = REQUIRED_ADMIN_ROLES.includes(adminRole);

            if (!isAdmin) {
                window.location.href = "/home";
                return;
            }

            try {
                setLoading(true);
                const response = await providers.API.getAll<LeaveListsResponseDto>(providers.APIUrl, "leaves", null);
                const rawLeaves: LeaveListDto[] = Array.isArray(response.data) ? response.data : [];

                let filtered: LeaveListDto[] = [];

                if (adminRole === "Super_Admin_Platform" || adminRole === "Super_Admin_Enterprise") {
                    filtered = rawLeaves;
                } else if (adminRole === "Enterprise_Admin") {
                    // EnterpriseId n'est pas dans le type : il passe par l'index signature
                    filtered = rawLeaves.filter((l) => Number(l.EnterpriseId) === enterpriseId);
                }

                setLeaves(filtered);
                setHasAdminAccess(isAdmin);
            } catch (error) {
                toast.error("Erreur", "Erreur lors de la récupération des congés");
                console.error("Erreur fetchLeaves:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchLeaves();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [session, sessionStatus]);

    // Filtrage & recherche
    const filteredLeaves = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return leaves;

        return leaves.filter((leave) => {
            const statusLabel = STATUS_CONFIG[normalizeStatus(leave.status)].label.toLowerCase();
            return (
                leave.reason?.toLowerCase().includes(query) ||
                leave.rejectedReason?.toLowerCase().includes(query) ||
                statusLabel.includes(query) ||
                String(leave.UserId).includes(query) ||
                String(leave.LeaveTypeId).includes(query)
            );
        });
    }, [leaves, search]);

    // Pagination
    const maxPage = Math.max(1, Math.ceil(filteredLeaves.length / limit));

    // Évite de rester sur une page inexistante (après suppression, par exemple)
    useEffect(() => {
        if (page > maxPage) setPage(maxPage);
    }, [page, maxPage]);

    const currentData = useMemo(() => {
        const startIdx = (page - 1) * limit;
        return filteredLeaves.slice(startIdx, startIdx + limit);
    }, [filteredLeaves, page]);

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
        const headers = [
            "ID",
            "Employé (ID)",
            "Type de congé (ID)",
            "Motif",
            "Date de début",
            "Date de fin",
            "Statut",
            "Motif du refus",
        ];
        const rows = filteredLeaves.map((leave) => [
            leave.id,
            esc(leave.UserId),
            esc(leave.LeaveTypeId),
            esc(leave.reason),
            esc(leave.startDate),
            esc(leave.endDate),
            esc(leave.status),
            esc(leave.rejectedReason),
        ]);

        const csvContent =
            "data:text/csv;charset=utf-8,\uFEFF" +
            [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
        const link = document.createElement("a");
        link.setAttribute("href", encodeURI(csvContent));
        link.setAttribute("download", `conges_export_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [filteredLeaves]);

    function buildLeaveNotification(
        leave: LeaveListDto,
        newStatus: LeaveStatus,
        rejectedReason?: string | null
    ): { title: string; content: string } | null {
        const period = `du ${formatDate(leave.startDate)} au ${formatDate(leave.endDate)}`;
        switch (newStatus) {
            case "APPROVED":
                return {
                    title: "Demande de congé approuvée",
                    content: `Votre demande de congé ${period} a été approuvée.`,
                };
            case "REJECTED":
                return {
                    title: "Demande de congé refusée",
                    content: `Votre demande de congé ${period} a été refusée. Motif : ${rejectedReason}.`,
                };
            default:
                // PENDING : pas de notification
                return null;
        }
    }

    // Modification du statut (PENDING / APPROVED / REJECTED)
    const handleChangeStatus = (leave: LeaveListDto) => {
        checkAccessAndExecute(async () => {
            const currentStatus = normalizeStatus(leave.status);

            const result = await Swal.fire({
                title: "Modifier le statut",
                text: `Demande de congé #${leave.id}`,
                input: "radio",
                inputOptions: {
                    PENDING: STATUS_CONFIG.PENDING.label,
                    APPROVED: STATUS_CONFIG.APPROVED.label,
                    REJECTED: STATUS_CONFIG.REJECTED.label,
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

            const newStatus = result.value as LeaveStatus;
            if (newStatus === currentStatus) return;

            // Un refus doit être justifié
            let rejectedReason: string | null = null;
            if (newStatus === "REJECTED") {
                const reasonResult = await Swal.fire({
                    title: "Motif du refus",
                    input: "textarea",
                    inputValue: leave.rejectedReason ?? "",
                    inputPlaceholder: "Expliquez pourquoi cette demande est refusée...",
                    showCancelButton: true,
                    cancelButtonText: "Annuler",
                    confirmButtonText: "Confirmer le refus",
                    confirmButtonColor: "#ef4444",
                    cancelButtonColor: "#64748b",
                    inputValidator: (value) => (!value?.trim() ? "Le motif du refus est obligatoire" : null),
                    customClass: {
                        popup: "dark:bg-slate-800 dark:text-white rounded-xl border dark:border-slate-700",
                    },
                });
                if (!reasonResult.isConfirmed) return;
                rejectedReason = String(reasonResult.value).trim();
            }

            const previous = { status: leave.status, rejectedReason: leave.rejectedReason };

            try {
                setUpdatingStatusId(leave.id);

                // Mise à jour optimiste
                setLeaves((prev) =>
                    prev.map((l) =>
                        l.id === leave.id ? { ...l, status: newStatus, rejectedReason } : l
                    )
                );

                await providers.API.update(
                    providers.APIUrl,
                    "leaves",
                    null,
                    { status: newStatus, rejectedReason },
                    leave.id
                );
            } catch (err) {
                // Annulation si la mise à jour échoue
                setLeaves((prev) => prev.map((l) => (l.id === leave.id ? { ...l, ...previous } : l)));
                toast.error("Erreur", err instanceof Error ? err.message : "Impossible de modifier le statut");
                setUpdatingStatusId(null);
                return;
            }

            // Notification : séparée pour ne pas annuler le statut si elle échoue
            const notification = buildLeaveNotification(leave, newStatus, rejectedReason);
            if (notification) {
                try {
                    await providers.API.post(providers.APIUrl, "notification-push", null, {
                        senderId: "40",
                        receiverId: String(leave.UserId),
                        messagingType: "general",
                        title: notification.title,
                        content: notification.content,
                    });
                } catch (notifErr) {
                    console.error("Erreur notification-push:", notifErr);
                    toast.error("Attention", "Statut modifié, mais la notification n'a pas pu être envoyée");
                    setUpdatingStatusId(null);
                    return;
                }
            }

            toast.success("Bravo", `Statut modifié : ${STATUS_CONFIG[newStatus].label}`);
            setUpdatingStatusId(null);
        });
    };

    // Suppression d'une demande de congé
    const handleDeleteLeave = (id: number) => {
        checkAccessAndExecute(() => {
            Swal.fire({
                icon: "warning",
                title: "Confirmer la suppression",
                text: "Êtes-vous sûr de vouloir supprimer cette demande de congé ?",
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
                        await providers.API.delete(providers.APIUrl, "leaves", id, {});
                        toast.success("Bravo", "Demande de congé supprimée avec succès");
                        setLeaves((prev) => prev.filter((l) => l.id !== id));
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
                                <FontAwesomeIcon icon={faCalendarDays} className="text-lg" />
                            </span>
                            Gestion des Congés
                        </h1>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Suivi et validation des demandes de congé.
                        </p>
                    </div>
                </div>

                {/* Toolbar */}
                <div className="flex shrink-0 flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
                        <div className="relative flex-1 max-w-md">
                            <input
                                type="text"
                                placeholder="Rechercher par motif, statut ou employé..."
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
                            disabled={filteredLeaves.length === 0}
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700/60 disabled:opacity-50 transition-all"
                            title="Exporter au format CSV"
                        >
                            <FontAwesomeIcon icon={faFileDownload} className="text-slate-400" />
                            <span className="hidden sm:inline">Exporter</span>
                        </button>

                        <Link
                            href="/dashboard/RH/leave/new"
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 active:bg-blue-800 transition-all dark:bg-blue-600 dark:hover:bg-blue-500"
                        >
                            <span className="text-sm">+</span>
                            <span>Ajouter un congé</span>
                        </Link>
                    </div>
                </div>

                {/* Tableau : occupe l'espace restant et défile en interne */}
                <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="min-h-0 flex-1 overflow-auto">
                        <table className="w-full min-w-[900px] text-left text-sm text-slate-600 dark:text-slate-300">
                            <thead className="sticky top-0 z-10 bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 border-b border-slate-200/80 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-800">
                                <tr>
                                    <th scope="col" className="px-6 py-4">Employé</th>
                                    <th scope="col" className="px-6 py-4">Type de congé</th>
                                    <th scope="col" className="px-6 py-4">Motif</th>
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
                                                <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded-md" />
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
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
                                    currentData.map((leave) => (
                                        <tr
                                            key={leave.id}
                                            className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors"
                                        >
                                            {/* Employé */}
                                            <td className="px-6 py-4 font-semibold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                                                {leave.User?.firstname ?? ""} {leave.User?.lastname ?? ""}
                                            </td>

                                            {/* Type de congé */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {leave.LeaveType.title}
                                            </td>

                                            {/* Motif (tronqué, texte complet au survol) */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400">
                                                <div
                                                    className="max-w-[260px] truncate"
                                                    title={leave.reason || undefined}
                                                >
                                                    {leave.reason || "-"}
                                                </div>
                                                {normalizeStatus(leave.status) === "REJECTED" && leave.rejectedReason && (
                                                    <div
                                                        className="mt-0.5 max-w-[260px] truncate text-xs text-red-600 dark:text-red-400"
                                                        title={leave.rejectedReason}
                                                    >
                                                        Refus : {leave.rejectedReason}
                                                    </div>
                                                )}
                                            </td>

                                            {/* Date de début */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {formatDate(leave.startDate)}
                                            </td>

                                            {/* Date de fin */}
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {formatDate(leave.endDate)}
                                            </td>

                                            {/* Statut (modifiable) */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <StatusBadge
                                                    status={leave.status}
                                                    loading={updatingStatusId === leave.id}
                                                    onClick={() => handleChangeStatus(leave)}
                                                />
                                            </td>

                                            {/* Actions */}
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        title="Modifier"
                                                        onClick={() =>
                                                            checkAccessAndExecute(() => {
                                                                router.push(`/dashboard/RH/leave/edit/${leave.id}`);
                                                            })
                                                        }
                                                        className="p-2 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 transition-all"
                                                    >
                                                        <FontAwesomeIcon icon={faPen} className="w-4 h-4" />
                                                    </button>

                                                    <button
                                                        title="Supprimer"
                                                        onClick={() => handleDeleteLeave(leave.id)}
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
                                            Aucune demande de congé trouvée.
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
