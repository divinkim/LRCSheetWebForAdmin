"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useNotification } from "./hook";
import { Bell, FileText, Search, Trash2, ArrowUpRight, X, ChevronDown } from "lucide-react";
import { providers } from "@/index";
import { NotificationDto } from "@/types/global";

const API_URL = providers.APIUrl;

/* ---------- Helpers ---------- */

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
    if (!name) return "";
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((p) => p[0]!.toUpperCase())
        .join("");
}

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

function relativeTime(date: string | Date) {
    const diffSec = Math.round((new Date(date).getTime() - Date.now()) / 1000);
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

/* ---------- Carte de notification ---------- */

function NotificationItem({
    n,
    removing,
    onOpen,
    onDelete,
}: {
    n: NotificationDto;
    removing: boolean;
    onOpen: (n: NotificationDto) => void;
    onDelete: (n: NotificationDto) => void;
}) {
    const [expanded, setExpanded] = useState(false);
    const [truncated, setTruncated] = useState(false);
    const textRef = useRef<HTMLParagraphElement>(null);

    const unread = isUnread(n);
    const name = senderName(n.User);
    const ini = initials(n.User);
    const canToggle = truncated || expanded;

    // Détecte si le texte dépasse les 3 lignes (donc "..." affiché)
    useEffect(() => {
        const el = textRef.current;
        if (!el) return;
        const measure = () => {
            if (expanded) return; // on garde la valeur mesurée quand c'est déplié
            setTruncated(el.scrollHeight - el.clientHeight > 1);
        };
        measure();
        window.addEventListener("resize", measure);
        return () => window.removeEventListener("resize", measure);
    }, [n.description, expanded]);

    const handleClick = () => {
        // Ne pas déplier/replier si l'utilisateur est en train de sélectionner du texte
        if (window.getSelection()?.toString()) return;

        onOpen(n); // passe de unread à read (si besoin)
        if (canToggle) setExpanded((v) => !v);
    };

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
            className={`group relative cursor-pointer overflow-hidden rounded-2xl border p-5 shadow-sm outline-none transition-all duration-200 motion-reduce:transition-none hover:-translate-y-0.5 hover:border-blue-600/30 hover:shadow-xl hover:shadow-blue-700/10 focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:border-blue-500/40 dark:hover:shadow-black/40 ${unread
                    ? "border-blue-200 bg-blue-50/40 dark:border-blue-900/50 dark:bg-slate-900"
                    : "border-gray-200 bg-white dark:border-slate-800 dark:bg-slate-900/80"
                } ${removing ? "translate-x-4 scale-[0.98] opacity-0" : "translate-x-0 opacity-100"}`}
        >
            {/* Liseré d'accent : visible uniquement tant que la notification est non lue */}
            <span
                aria-hidden
                className={`absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-blue-600 to-blue-700 transition-opacity duration-300 dark:from-blue-500 dark:to-blue-600 ${unread ? "opacity-80 group-hover:opacity-100" : "opacity-0"
                    }`}
            />

            <div className="flex items-start gap-4 pl-1">
                {/* Avatar */}
                <div
                    aria-hidden="true"
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-blue-700 text-sm font-semibold text-white shadow-md shadow-blue-700/25 ring-2 ring-white dark:shadow-blue-900/50 dark:ring-slate-800"
                >
                    {ini || <Bell className="h-4 w-4" />}
                </div>

                {/* Contenu */}
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                        <h3
                            className={`flex items-center gap-2 text-base leading-snug text-blue-700 dark:text-white ${unread ? "font-bold" : "font-semibold"
                                }`}
                        >
                            {unread && (
                                <span
                                    aria-label="Non lue"
                                    className="h-2 w-2 shrink-0 rounded-full bg-blue-600 dark:bg-blue-400"
                                />
                            )}
                            {n.title || "Notification sans titre"}
                        </h3>
                        <time
                            dateTime={new Date(n.createdAt).toISOString()}
                            title={new Date(n.createdAt).toLocaleString("fr-FR")}
                            className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                        >
                            {relativeTime(n.createdAt)}
                        </time>
                    </div>

                    {name && (
                        <p className="mt-0.5 text-sm font-medium text-gray-600 dark:text-slate-300">
                            {name}
                            {n.User?.email && name !== n.User.email && (
                                <span className="font-normal text-gray-500 dark:text-slate-500">
                                    {" "}
                                    – {n.User.email}
                                </span>
                            )}
                        </p>
                    )}

                    {/* Texte : 3 lignes max + "..." tant que non déplié */}
                    <p
                        ref={textRef}
                        className={`mt-3 max-w-prose whitespace-pre-line break-words text-sm leading-relaxed text-gray-600 dark:text-slate-400 ${expanded ? "" : "line-clamp-3"
                            }`}
                    >
                        {n.description || "Aucune description fournie."}
                    </p>

                    {canToggle && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                            {expanded ? "Réduire" : "Voir plus"}
                            <ChevronDown
                                className={`h-3.5 w-3.5 transition-transform duration-200 ${expanded ? "rotate-180" : ""
                                    }`}
                            />
                        </span>
                    )}

                    {n.file && (
                        <div>
                            <a
                                href={`${providers.ImageUrl}/${n.file}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onOpen(n); // ouvrir la pièce jointe = avoir lu la notification
                                }}
                                className="group/file mt-4 inline-flex items-center gap-3 rounded-xl border border-gray-200 bg-white py-2 pl-2 pr-4 shadow-sm transition-all hover:border-amber-500 hover:shadow-md hover:shadow-amber-500/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-slate-800 dark:bg-slate-900/90 dark:hover:border-amber-500/60 dark:hover:shadow-amber-500/10"
                            >
                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 transition-colors group-hover/file:bg-amber-500 group-hover/file:text-white dark:text-amber-400 dark:group-hover/file:text-slate-950">
                                    <FileText className="h-4 w-4" />
                                </span>
                                <span className="flex flex-col text-left">
                                    <span className="text-sm font-semibold text-blue-700 dark:text-white">
                                        Pièce jointe
                                    </span>
                                    <span className="text-xs text-gray-500 dark:text-slate-500">
                                        Ouvrir le document
                                    </span>
                                </span>
                                <ArrowUpRight className="h-4 w-4 text-gray-500 transition-colors group-hover/file:text-amber-500 dark:text-slate-500 dark:group-hover/file:text-amber-400" />
                            </a>
                        </div>
                    )}
                </div>

                {/* Suppression */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(n);
                    }}
                    aria-label={`Supprimer la notification ${n.title ?? ""}`}
                    title="Supprimer"
                    className="shrink-0 rounded-full p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100 dark:text-slate-500 dark:hover:bg-red-950/50 dark:hover:text-red-400"
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </li>
    );
}

/* ---------- Page ---------- */

export default function NotificationPage() {
    const { notifications, loadingData, setNotifications } = useNotification();

    const [query, setQuery] = useState("");
    const [confirmClear, setConfirmClear] = useState(false);
    const [removingIds, setRemovingIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Évite d'envoyer deux requêtes si l'utilisateur clique plusieurs fois rapidement
    const pendingReadIds = useRef<Set<number>>(new Set());

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return notifications;
        return notifications.filter((n: NotificationDto) =>
            [n.title, n.description, senderName(n.User)]
                .filter(Boolean)
                .some((v) => v!.toLowerCase().includes(q))
        );
    }, [notifications, query]);

    const groups = useMemo(() => {
        const map = new Map<string, { label: string; items: NotificationDto[] }>();
        ([...filtered] as NotificationDto[])
            .sort(
                (a: NotificationDto, b: NotificationDto) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            )
            .forEach((n: NotificationDto) => {
                const key = dayKey(n.createdAt);
                if (!map.has(key)) map.set(key, { label: dayLabel(n.createdAt), items: [] });
                map.get(key)!.items.push(n);
            });
        return Array.from(map.values());
    }, [filtered]);

    /** Passe la notification de "unread" à "read" (mise à jour optimiste + requête update) */
    const handleMarkAsRead = async (item: NotificationDto) => {
        if (!isUnread(item) || pendingReadIds.current.has(item.id)) return;

        pendingReadIds.current.add(item.id);
        setError(null);

        try {
            await providers.API.update(API_URL, "notifications", null, { status: "read" }, item.id);
            setNotifications((prev: NotificationDto[]) =>
            prev.map((n) => (n.id === item.id ? { ...n, status: "read" } : n))
        );
        } catch {
            // Annulation si la mise à jour échoue
            setNotifications((prev: NotificationDto[]) =>
                prev.map((n) => (n.id === item.id ? { ...n, status: item.status } : n))
            );
            setError("Le statut de la notification n'a pas pu être mis à jour. Réessayez.");
        } finally {
            pendingReadIds.current.delete(item.id);
        }
    };

    const handleDeleteOne = async (item: NotificationDto) => {
        setError(null);
        setRemovingIds((ids) => [...ids, item.id]);
        await new Promise((r) => setTimeout(r, 200));
        setNotifications((prev: NotificationDto[]) => prev.filter((n) => n.id !== item.id));
        setRemovingIds((ids) => ids.filter((id) => id !== item.id));

        try {
            await providers.API.delete(API_URL, "notifications", item.id, {});
        } catch {
            setNotifications((prev: NotificationDto[]) => [...prev, item]);
            setError("La notification n'a pas pu être supprimée. Réessayez.");
        }
    };

    const handleClearAll = async () => {
        setError(null);
        const snapshot = notifications as NotificationDto[];
        setNotifications([]);
        setConfirmClear(false);
        try {
            await providers.API.deleteMany(API_URL, "notifications");
        } catch {
            setNotifications(snapshot);
            setError("Les notifications n'ont pas pu être effacées. Réessayez.");
        }
    };

    const total = notifications.length;
    const unreadCount = useMemo(
        () => (notifications as NotificationDto[]).filter(isUnread).length,
        [notifications]
    );

    return (
        <div className="min-h-screen bg-white text-gray-600 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-300">
            {/* ============ Bandeau héro ============ */}
            <div className="relative overflow-hidden border-b border-transparent bg-gradient-to-br from-blue-700 via-blue-700 to-blue-600 dark:border-slate-800/80 dark:from-blue-950 dark:via-slate-900 dark:to-blue-950">
                {/* Halos décoratifs */}
                <div
                    aria-hidden
                    className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-amber-500/20 blur-3xl dark:bg-amber-500/10"
                />
                <div
                    aria-hidden
                    className="pointer-events-none absolute -bottom-32 left-1/4 h-64 w-64 rounded-full bg-white/10 blur-3xl dark:bg-blue-600/10"
                />

                <div className="relative mx-auto max-w-3xl px-4 pb-24 pt-10 sm:px-6 sm:pt-14">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                        <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-amber-500 ring-1 ring-white/20 backdrop-blur-sm dark:bg-slate-900/80 dark:text-amber-400 dark:ring-slate-800">
                                <Bell className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                                        Notifications
                                    </h1>
                                    {!loadingData && total > 0 && (
                                        <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-xs font-bold text-white shadow-lg shadow-amber-500/30 dark:text-slate-950 dark:shadow-amber-500/20">
                                            {total}
                                        </span>
                                    )}
                                </div>
                                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/75 dark:text-slate-400">
                                    Alertes envoyées par vos collaborateurs et pièces jointes à consulter.
                                    {!loadingData && total > 0 && (
                                        <span className="mt-1 block font-semibold text-white dark:text-slate-200">
                                            {unreadCount > 0
                                                ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                                                : "Tout est lu"}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {!loadingData && total > 0 && (
                            <div className="flex flex-wrap items-center gap-2">
                                {confirmClear ? (
                                    <>
                                        <span className="text-sm text-white/80 dark:text-slate-300">
                                            Effacer les {total} notifications ?
                                        </span>
                                        <button
                                            onClick={handleClearAll}
                                            className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-blue-700 dark:focus-visible:ring-offset-slate-900"
                                        >
                                            Effacer
                                        </button>
                                        <button
                                            onClick={() => setConfirmClear(false)}
                                            className="rounded-full px-4 py-2 text-sm font-medium text-white/90 transition-colors hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white dark:text-slate-300 dark:hover:bg-slate-800"
                                        >
                                            Annuler
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setConfirmClear(true)}
                                        className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Tout effacer
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ============ Contenu (chevauche le bandeau) ============ */}
            <div className="relative mx-auto -mt-14 max-w-3xl px-4 pb-16 sm:px-6">
                {/* Recherche */}
                {!loadingData && total > 0 && (
                    <div className="relative mb-8">
                        <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500 dark:text-slate-400" />
                        <input
                            type="search"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder="Rechercher par titre, message ou expéditeur"
                            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-12 pr-11 text-sm text-gray-600 shadow-xl shadow-blue-700/10 outline-none transition-all placeholder:text-gray-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 dark:border-slate-800 dark:bg-slate-900/90 dark:text-slate-200 dark:shadow-black/40 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery("")}
                                aria-label="Effacer la recherche"
                                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                )}

                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-sm dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300 dark:backdrop-blur-sm"
                    >
                        {error}
                        <button
                            onClick={() => setError(null)}
                            aria-label="Fermer le message"
                            className="ml-4 rounded p-1 hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900/50"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Chargement */}
                {loadingData ? (
                    <div
                        className="space-y-3 pt-4"
                        aria-busy="true"
                        aria-label="Chargement des notifications"
                    >
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex animate-pulse gap-4 rounded-2xl border border-gray-200 bg-white p-5 shadow-xl shadow-blue-700/5 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/20"
                            >
                                <div className="h-11 w-11 shrink-0 rounded-full bg-gray-200 dark:bg-slate-800" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 w-1/3 rounded bg-gray-200 dark:bg-slate-800" />
                                    <div className="h-3 w-full rounded bg-gray-100 dark:bg-slate-800/60" />
                                    <div className="h-3 w-2/3 rounded bg-gray-100 dark:bg-slate-800/60" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : total === 0 ? (
                    /* Aucun résultat du tout */
                    <div className="flex flex-col items-center rounded-3xl border border-gray-200 bg-white px-6 py-20 text-center shadow-xl shadow-blue-700/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/30">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-500 ring-1 ring-amber-500/30 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20">
                            <Bell className="h-7 w-7" />
                        </div>
                        <h2 className="mt-5 text-lg font-semibold text-blue-700 dark:text-white">
                            Aucune notification
                        </h2>
                        <p className="mt-1 max-w-xs text-sm text-gray-500 dark:text-slate-400">
                            Les nouvelles alertes apparaîtront ici dès leur envoi.
                        </p>
                    </div>
                ) : groups.length === 0 ? (
                    /* Recherche sans résultat */
                    <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center shadow-xl shadow-blue-700/10 dark:border-slate-800 dark:bg-slate-900/60 dark:shadow-black/30">
                        <p className="font-semibold text-blue-700 dark:text-white">
                            Aucun résultat pour « {query} »
                        </p>
                        <button
                            onClick={() => setQuery("")}
                            className="mt-2 text-sm font-medium text-blue-600 underline-offset-4 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
                        >
                            Effacer la recherche
                        </button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {groups.map((group) => (
                            <section key={group.label} aria-label={group.label}>
                                <div className="mb-4 flex items-center gap-3 px-1">
                                    <span aria-hidden className="h-2 w-2 rounded-full bg-amber-500" />
                                    <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-slate-400">
                                        {group.label}
                                    </h2>
                                    <span aria-hidden className="h-px flex-1 bg-gray-200 dark:bg-slate-800" />
                                </div>

                                <ul className="space-y-3">
                                    {group.items.map((n) => (
                                        <NotificationItem
                                            key={n.id}
                                            n={n}
                                            removing={removingIds.includes(n.id)}
                                            onOpen={handleMarkAsRead}
                                            onDelete={handleDeleteOne}
                                        />
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
