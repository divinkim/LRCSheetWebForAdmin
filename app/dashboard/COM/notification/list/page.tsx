
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNotification } from "./hook";
import {
    Bell,
    FileText,
    Search,
    Trash2,
    ArrowUpRight,
    X,
    ChevronDown,
    Check,
    Clock,
    Ban,
    Inbox,
    Paperclip,
    CircleCheck,
    CircleAlert,
    CalendarDays,
    UserRound,
    RefreshCw,
} from "lucide-react";
import { providers } from "@/index";
import { NotificationDto } from "@/types/global";
import DecisionDialog, { DecisionAction } from "./DecisionDialog";

const API_URL = providers.APIUrl;

/* -------------------------------------------------------
   HELPERS
------------------------------------------------------- */

function isUnread(n: NotificationDto) {
    return String(n.status ?? "").trim().toLowerCase() !== "read";
}

function senderName(user: NotificationDto["User"]) {
    if (!user) return "";
    const first = user.firstname ?? "";
    const last = user.lastname ?? "";
    return `${first} ${last}`.trim() || user.email || "";
}

function initials(user: NotificationDto["User"]) {
    const name = senderName(user);
    if (!name) return "NA";

    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]!.toUpperCase())
        .join("");
}

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

function relativeTime(date: string | Date) {
    const timestamp = new Date(date).getTime();

    if (!Number.isFinite(timestamp)) return "";

    const diffSec = Math.round((timestamp - Date.now()) / 1000);
    const abs = Math.abs(diffSec);

    if (abs < 60) return "À l'instant";
    if (abs < 3600) return rtf.format(Math.round(diffSec / 60), "minute");
    if (abs < 86400) return rtf.format(Math.round(diffSec / 3600), "hour");

    return rtf.format(Math.round(diffSec / 86400), "day");
}

function dayKey(date: string | Date) {
    const d = new Date(date);

    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(date: string | Date) {
    const d = new Date(date);

    if (!Number.isFinite(d.getTime())) return "Date inconnue";

    const today = new Date();
    const yesterday = new Date();

    yesterday.setDate(today.getDate() - 1);

    if (dayKey(d) === dayKey(today)) return "Aujourd'hui";
    if (dayKey(d) === dayKey(yesterday)) return "Hier";

    return d.toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: d.getFullYear() === today.getFullYear() ? undefined : "numeric",
    });
}

/* -------------------------------------------------------
   BADGE DE CONFIRMATION
------------------------------------------------------- */

function ConfirmationBadge({
    value,
}: {
    value: NonNullable<NotificationDto["isConfirmedReason"]>;
}) {
    const config = {
        PENDING: {
            label: "En attente",
            icon: Clock,
            style: "bg-[#FFAB02]/10 text-[#B77900] border-[#FFAB02]/30 dark:text-[#FFBF3F]",
        },
        ACCEPTED: {
            label: "Demande acceptée",
            icon: Check,
            style: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20 dark:text-emerald-400",
        },
        DENIED: {
            label: "Demande refusée",
            icon: Ban,
            style: "bg-red-500/10 text-red-700 border-red-500/20 dark:text-red-400",
        },
    }[value];

    const Icon = config.icon;

    return (
        <span className={`inline-flex items-center gap-2 rounded-lg border px-3 py-1.5 text-xs font-semibold ${config.style}`}>
            <Icon className="h-3.5 w-3.5" />
            {config.label}
        </span>
    );
}

/* -------------------------------------------------------
   CARTE NOTIFICATION
------------------------------------------------------- */

function NotificationItem({
    n,
    removing,
    onOpen,
    onDelete,
    onDecide,
}: {
    n: NotificationDto;
    removing: boolean;
    onOpen: (n: NotificationDto) => void;
    onDelete: (n: NotificationDto) => void;
    onDecide: (n: NotificationDto, action: DecisionAction) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [truncated, setTruncated] = useState(false);

    const textRef = useRef<HTMLParagraphElement>(null);

    const unread = isUnread(n);
    const name = senderName(n.User);
    const ini = initials(n.User);
    const confirmation = n.isConfirmedReason;

    const canToggle = truncated || expanded;

    useEffect(() => {
        const el = textRef.current;

        if (!el) return;

        const measure = () => {
            if (expanded) return;

            setTruncated(el.scrollHeight > el.clientHeight + 1);
        };

        measure();

        const observer = new ResizeObserver(measure);
        observer.observe(el);

        return () => observer.disconnect();
    }, [n.description, expanded]);

    const handleClick = () => {
        if (window.getSelection()?.toString()) return;

        onOpen(n);

        if (canToggle) {
            setExpanded((value) => !value);
        }
    };

    const createdAt = new Date(n.createdAt);
    const validDate = Number.isFinite(createdAt.getTime());

    return (
        <li
            tabIndex={0}
            onClick={handleClick}
            onKeyDown={(e) => {
                if (e.target !== e.currentTarget) return;

                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleClick();
                }
            }}
            aria-expanded={canToggle ? expanded : undefined}
            className={`group relative overflow-hidden rounded-2xl border transition-all duration-200 ${
                unread
                    ? "border-[#359ADE]/30 bg-[#359ADE]/[0.035] dark:border-[#359ADE]/30 dark:bg-[#359ADE]/[0.055]"
                    : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-[#172235] dark:hover:border-slate-700"
            } ${
                removing
                    ? "translate-x-3 scale-[0.98] opacity-0"
                    : "translate-x-0 opacity-100"
            }`}
        >
            {unread && (
                <span className="absolute inset-y-0 left-0 w-[3px] bg-[#359ADE]" />
            )}

            <div className="p-4 sm:p-5">
                <div className="flex items-start gap-3 sm:gap-4">

                    {/* Avatar */}
                    <div
                        aria-hidden="true"
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
                            unread
                                ? "bg-[#359ADE] text-white"
                                : "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-300"
                        }`}
                    >
                        {ini || <Bell className="h-4 w-4" />}
                    </div>

                    {/* Contenu */}
                    <div className="min-w-0 flex-1">

                        {/* Titre et date */}
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                    {unread && (
                                        <span className="h-2 w-2 shrink-0 rounded-full bg-[#359ADE]" />
                                    )}

                                    <h3 className={`min-w-0 break-words text-sm sm:text-base ${
                                        unread
                                            ? "font-bold text-[#374151] dark:text-white"
                                            : "font-semibold text-slate-700 dark:text-slate-200"
                                    }`}>
                                        {n.title || "Notification sans titre"}
                                    </h3>
                                </div>

                                {name && (
                                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="inline-flex items-center gap-1.5 font-medium">
                                            <UserRound className="h-3.5 w-3.5" />
                                            {name}
                                        </span>

                                        {n.User?.email && name !== n.User.email && (
                                            <>
                                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                                <span className="break-all">{n.User.email}</span>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-between gap-3 sm:justify-end">
                                {validDate && (
                                    <time
                                        dateTime={createdAt.toISOString()}
                                        title={createdAt.toLocaleString("fr-FR")}
                                        className="inline-flex items-center gap-1.5 text-xs text-slate-400 whitespace-nowrap"
                                    >
                                        <Clock className="h-3.5 w-3.5" />
                                        {relativeTime(n.createdAt)}
                                    </time>
                                )}

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDelete(n);
                                    }}
                                    aria-label={`Supprimer la notification ${n.title ?? ""}`}
                                    title="Supprimer"
                                    className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        {/* Description */}
                        <p
                            ref={textRef}
                            className={`mt-3 whitespace-pre-line break-words text-sm leading-6 text-slate-600 dark:text-slate-400 ${
                                expanded ? "" : "line-clamp-3"
                            }`}
                        >
                            {n.description || "Aucune description fournie."}
                        </p>

                        {canToggle && (
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setExpanded((value) => !value);
                                }}
                                className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-[#359ADE] hover:text-[#2586C4]"
                            >
                                {expanded ? "Voir moins" : "Lire la suite"}
                                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${expanded ? "rotate-180" : ""}`} />
                            </button>
                        )}

                        {/* Pièce jointe */}
                        {n.file && (
                            <div className="mt-4">
                                <a
                                    href={`${providers.ImageUrl}/${n.file}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onOpen(n);
                                    }}
                                    className="inline-flex max-w-full items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 transition hover:border-[#FFAB02]/50 hover:bg-[#FFAB02]/5 dark:border-slate-700 dark:bg-slate-800/70 dark:hover:border-[#FFAB02]/40"
                                >
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FFAB02]/15 text-[#B77900] dark:text-[#FFBF3F]">
                                        <FileText className="h-4 w-4" />
                                    </span>

                                    <span className="min-w-0 text-left">
                                        <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                                            Pièce jointe
                                        </span>
                                        <span className="block text-xs text-slate-400">
                                            Consulter le document
                                        </span>
                                    </span>

                                    <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-400" />
                                </a>
                            </div>
                        )}

                        {/* Confirmation */}
                        {confirmation && (
                            <div
                                className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-3 sm:p-4 dark:border-slate-700 dark:bg-slate-900/50"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                    <ConfirmationBadge value={confirmation} />

                                    {confirmation === "PENDING" && (
                                        <div className="flex flex-wrap items-center gap-2">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDecide(n, "ACCEPTED");
                                                }}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                            >
                                                <Check className="h-4 w-4" />
                                                Accepter
                                            </button>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDecide(n, "DENIED");
                                                }}
                                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900"
                                            >
                                                <X className="h-4 w-4" />
                                                Refuser
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {confirmation !== "PENDING" && n.adminComment && (
                                    <p className="mt-3 border-t border-slate-200 pt-3 text-sm leading-6 text-slate-600 dark:border-slate-700 dark:text-slate-400">
                                        <strong className="text-slate-700 dark:text-slate-200">
                                            Commentaire :
                                        </strong>{" "}
                                        {n.adminComment}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </li>
    );
}

/* -------------------------------------------------------
   PAGE PRINCIPALE
------------------------------------------------------- */

export default function NotificationPage() {
    const {
        notifications,
        loadingData,
        setNotifications,
        adminId,
    } = useNotification();

    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<"all" | "unread">("all");
    const [confirmClear, setConfirmClear] = useState(false);
    const [clearing, setClearing] = useState(false);
    const [removingIds, setRemovingIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [decision, setDecision] = useState<{
        item: NotificationDto;
        action: DecisionAction;
    } | null>(null);

    const [deciding, setDeciding] = useState(false);
    const [decisionError, setDecisionError] = useState<string | null>(null);

    const pendingReadIds = useRef<Set<number>>(new Set());

    const total = notifications.length;

    const unreadCount = useMemo(
        () => (notifications as NotificationDto[]).filter(isUnread).length,
        [notifications]
    );

    const readCount = total - unreadCount;

    /* Recherche et filtres */
    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return (notifications as NotificationDto[]).filter((n) => {
            const matchesQuery =
                !q ||
                [n.title, n.description, senderName(n.User)]
                    .filter(Boolean)
                    .some((value) => String(value).toLowerCase().includes(q));

            const matchesFilter =
                filter === "all" || isUnread(n);

            return matchesQuery && matchesFilter;
        });
    }, [notifications, query, filter]);

    /* Groupement par jour */
    const groups = useMemo(() => {
        const map = new Map<string, {
            label: string;
            items: NotificationDto[];
        }>();

        [...filtered]
            .sort(
                (a, b) =>
                    new Date(b.createdAt).getTime() -
                    new Date(a.createdAt).getTime()
            )
            .forEach((n) => {
                const key = dayKey(n.createdAt);

                if (!map.has(key)) {
                    map.set(key, {
                        label: dayLabel(n.createdAt),
                        items: [],
                    });
                }

                map.get(key)!.items.push(n);
            });

        return Array.from(map.values());
    }, [filtered]);

    /* Marquer comme lu */
    const handleMarkAsRead = async (item: NotificationDto) => {
        if (!isUnread(item) || pendingReadIds.current.has(item.id)) return;

        pendingReadIds.current.add(item.id);
        setError(null);

        try {
            await providers.API.update(
                API_URL,
                "notifications",
                null,
                { status: "read" },
                item.id
            );

            setNotifications((prev: NotificationDto[]) =>
                prev.map((n) =>
                    n.id === item.id ? { ...n, status: "read" } : n
                )
            );
        } catch {
            setError(
                "Le statut de la notification n'a pas pu être mis à jour. Réessayez."
            );
        } finally {
            pendingReadIds.current.delete(item.id);
        }
    };

    /* Décision */
    const openDecision = (
        item: NotificationDto,
        action: DecisionAction
    ) => {
        setDecisionError(null);
        setDecision({ item, action });
    };

    const closeDecision = () => {
        if (deciding) return;

        setDecision(null);
        setDecisionError(null);
    };

    const handleConfirmDecision = async (comment: string) => {
        if (!decision) return;

        const { item, action } = decision;

        setDeciding(true);
        setDecisionError(null);

        try {
            await providers.API.update(
                API_URL,
                "notifications",
                null,
                {
                    isConfirmedReason: action,
                    adminComment: comment || null,
                    status: "read",
                },
                item.id
            );

            await providers.API.post(
                API_URL,
                "attendances/from-admin",
                null,
                {
                    isConfirmedReason: action,
                    usersId: [item.UserId],
                    date: new Date(item.createdAt).toISOString(),
                }
            );
        } catch {
            setDecisionError(
                "La décision n'a pas pu être enregistrée. Réessayez."
            );
            setDeciding(false);
            return;
        }

        setNotifications((prev: NotificationDto[]) =>
            prev.map((n) =>
                n.id === item.id
                    ? {
                        ...n,
                        isConfirmedReason: action,
                        adminComment: comment || null,
                        status: "read",
                    }
                    : n
            )
        );

        const accepted = action === "ACCEPTED";

        try {
            await providers.API.post(
                API_URL,
                "notification-push",
                null,
                {
                    title: "Retour suite à votre départ anticipé",
                    content:
                        `Votre demande « ${item.title || "Notification"} » a été ${accepted ? "acceptée" : "refusée"}.` +
                        (comment ? `\n\nCommentaire : ${comment}` : ""),
                    senderId: String(adminId),
                    messagingtype: "general",
                    receiverId: String(item.UserId),
                    EnterpriseId: String(item.EnterpriseId),
                    status: "unread",
                }
            );
        } catch {
            setError(
                "La décision a été enregistrée, mais la notification de retour n'a pas pu être envoyée."
            );
        } finally {
            setDeciding(false);
            setDecision(null);
        }
    };

    /* Supprimer une notification */
    const handleDeleteOne = async (item: NotificationDto) => {
        setError(null);

        if (removingIds.includes(item.id)) return;

        const snapshot = notifications as NotificationDto[];

        setRemovingIds((ids) => [...ids, item.id]);

        await new Promise((resolve) => setTimeout(resolve, 200));

        setNotifications((prev: NotificationDto[]) =>
            prev.filter((n) => n.id !== item.id)
        );

        setRemovingIds((ids) => ids.filter((id) => id !== item.id));

        try {
            await providers.API.delete(
                API_URL,
                "notifications",
                item.id,
                {}
            );
        } catch {
            setNotifications((prev: NotificationDto[]) => {
                if (prev.some((n) => n.id === item.id)) return prev;

                return [...prev, item].sort(
                    (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                );
            });

            setError("La notification n'a pas pu être supprimée. Réessayez.");
        }
    };

    /* Tout effacer */
    const handleClearAll = async () => {
        if (clearing) return;

        setError(null);
        setClearing(true);

        const snapshot = notifications as NotificationDto[];

        try {
            await providers.API.deleteMany(API_URL, "notifications");
            setNotifications([]);
            setConfirmClear(false);
        } catch {
            setNotifications(snapshot);
            setError("Les notifications n'ont pas pu être effacées. Réessayez.");
        } finally {
            setClearing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F5F7FA] text-[#374151] dark:bg-[#101827] dark:text-slate-200">

            {/* En-tête */}
            <div className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#172235]">
                <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#359ADE]/10 text-[#359ADE]">
                                <Bell className="h-6 w-6" />
                            </div>

                            <div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <h1 className="text-2xl font-extrabold tracking-tight text-[#374151] dark:text-white">
                                        Notifications
                                    </h1>

                                    {!loadingData && (
                                        <span className="rounded-lg bg-[#359ADE]/10 px-2.5 py-1 text-xs font-bold text-[#359ADE]">
                                            {total}
                                        </span>
                                    )}
                                </div>

                                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                                    Retrouvez toutes vos alertes et communications.
                                </p>
                            </div>
                        </div>

                        {!loadingData && total > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {confirmClear ? (
                                    <>
                                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                                            Confirmer la suppression ?
                                        </span>

                                        <button
                                            type="button"
                                            disabled={clearing}
                                            onClick={handleClearAll}
                                            className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-xs font-bold text-white transition hover:bg-red-700 disabled:opacity-50"
                                        >
                                            {clearing ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-4 w-4" />
                                            )}
                                            Oui, effacer
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setConfirmClear(false)}
                                            disabled={clearing}
                                            className="h-10 rounded-xl border border-slate-200 px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            Annuler
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmClear(true)}
                                        className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-900 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Tout effacer
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Indicateurs */}
                    {!loadingData && (
                        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <Inbox className="h-4 w-4 text-[#359ADE]" />
                                    Total
                                </div>
                                <p className="mt-2 text-2xl font-extrabold text-[#374151] dark:text-white">
                                    {total}
                                </p>
                            </div>

                            <div className="rounded-xl border border-[#359ADE]/20 bg-[#359ADE]/[0.045] p-4 dark:border-[#359ADE]/20 dark:bg-[#359ADE]/[0.08]">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <CircleAlert className="h-4 w-4 text-[#359ADE]" />
                                    Non lues
                                </div>
                                <p className="mt-2 text-2xl font-extrabold text-[#359ADE]">
                                    {unreadCount}
                                </p>
                            </div>

                            <div className="col-span-2 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.035] p-4 dark:bg-emerald-500/[0.06] sm:col-span-1">
                                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                                    <CircleCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                                    Lues
                                </div>
                                <p className="mt-2 text-2xl font-extrabold text-emerald-700 dark:text-emerald-400">
                                    {readCount}
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Contenu */}
            <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-8">

                {/* Barre de recherche et filtres */}
                {!loadingData && total > 0 && (
                    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-slate-800 dark:bg-[#172235] sm:p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder="Rechercher par titre, message ou expéditeur..."
                                    className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-11 pr-10 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#359ADE] focus:ring-4 focus:ring-[#359ADE]/10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                />

                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery("")}
                                        aria-label="Effacer la recherche"
                                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
                                <button
                                    type="button"
                                    onClick={() => setFilter("all")}
                                    className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold transition lg:flex-none ${
                                        filter === "all"
                                            ? "bg-white text-[#359ADE] shadow-sm dark:bg-slate-700 dark:text-white"
                                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                                    }`}
                                >
                                    Toutes
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setFilter("unread")}
                                    className={`flex-1 rounded-lg px-4 py-2.5 text-xs font-semibold transition lg:flex-none ${
                                        filter === "unread"
                                            ? "bg-white text-[#359ADE] shadow-sm dark:bg-slate-700 dark:text-white"
                                            : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white"
                                    }`}
                                >
                                    Non lues
                                    {unreadCount > 0 && (
                                        <span className="ml-2 rounded-md bg-[#359ADE]/10 px-1.5 py-0.5 text-[#359ADE]">
                                            {unreadCount}
                                        </span>
                                    )}
                                </button>
                            </div>
                        </div>

                        {query && (
                            <p className="mt-3 text-xs text-slate-400">
                                {filtered.length} résultat{filtered.length > 1 ? "s" : ""} trouvé{filtered.length > 1 ? "s" : ""}
                            </p>
                        )}
                    </div>
                )}

                {/* Erreur */}
                {error && (
                    <div
                        role="alert"
                        className="mb-5 flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300"
                    >
                        <div className="flex items-start gap-2">
                            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
                            {error}
                        </div>

                        <button
                            type="button"
                            onClick={() => setError(null)}
                            aria-label="Fermer"
                            className="shrink-0 rounded-lg p-1 hover:bg-red-100 dark:hover:bg-red-900/50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Chargement */}
                {loadingData ? (
                    <div className="space-y-3" aria-busy="true">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="flex animate-pulse gap-4 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-[#172235]"
                            >
                                <div className="h-11 w-11 shrink-0 rounded-xl bg-slate-200 dark:bg-slate-700" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 w-1/3 rounded bg-slate-200 dark:bg-slate-700" />
                                    <div className="h-3 w-full rounded bg-slate-100 dark:bg-slate-800" />
                                    <div className="h-3 w-2/3 rounded bg-slate-100 dark:bg-slate-800" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : total === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-20 text-center shadow-sm dark:border-slate-800 dark:bg-[#172235]">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#359ADE]/10 text-[#359ADE]">
                            <Bell className="h-7 w-7" />
                        </div>

                        <h2 className="mt-5 text-lg font-bold text-[#374151] dark:text-white">
                            Aucune notification
                        </h2>

                        <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500 dark:text-slate-400">
                            Vous êtes à jour. Les nouvelles notifications apparaîtront automatiquement dans cet espace.
                        </p>
                    </div>
                ) : groups.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm dark:border-slate-800 dark:bg-[#172235]">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400 dark:bg-slate-800">
                            <Search className="h-6 w-6" />
                        </div>

                        <h2 className="mt-4 font-bold text-slate-700 dark:text-white">
                            Aucun résultat trouvé
                        </h2>

                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                            Modifiez votre recherche ou votre filtre.
                        </p>

                        <button
                            type="button"
                            onClick={() => {
                                setQuery("");
                                setFilter("all");
                            }}
                            className="mt-4 text-sm font-semibold text-[#359ADE] hover:underline"
                        >
                            Réinitialiser les filtres
                        </button>
                    </div>
                ) : (
                    <div className="space-y-8">
                        {groups.map((group) => (
                            <section key={group.label}>
                                <div className="mb-4 flex items-center gap-3">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFAB02]/15 text-[#B77900] dark:text-[#FFBF3F]">
                                        <CalendarDays className="h-4 w-4" />
                                    </div>

                                    <h2 className="text-sm font-bold capitalize text-slate-700 dark:text-slate-200">
                                        {group.label}
                                    </h2>

                                    <span className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-semibold text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                                        {group.items.length}
                                    </span>

                                    <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
                                </div>

                                <ul className="space-y-3">
                                    {group.items.map((n) => (
                                        <NotificationItem
                                            key={n.id}
                                            n={n}
                                            removing={removingIds.includes(n.id)}
                                            onOpen={handleMarkAsRead}
                                            onDelete={handleDeleteOne}
                                            onDecide={openDecision}
                                        />
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}

                {!loadingData && total > 0 && (
                    <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-400">
                        <Bell className="h-3.5 w-3.5" />
                        {filtered.length} notification{filtered.length > 1 ? "s" : ""} affichée{filtered.length > 1 ? "s" : ""} sur {total}
                    </div>
                )}
            </main>

            {/* Dialogue de décision */}
            <DecisionDialog
                open={!!decision}
                action={decision?.action ?? "ACCEPTED"}
                notificationTitle={decision?.item.title ?? ""}
                submitting={deciding}
                error={decisionError}
                onConfirm={handleConfirmDecision}
                onClose={closeDecision}
            />
        </div>
    );
}
