"use client";

import { useMemo, useState } from "react";
import { useNotification } from "./hook";
import { Bell, FileText, Search, Trash2, ArrowUpRight, X } from "lucide-react";
import { providers } from "@/index";
import { NotificationDto } from "@/types/global";

const API_URL = providers.APIUrl;

/* ---------- Helpers ---------- */

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

/* ---------- Page ---------- */

export default function NotificationPage() {
    const { notifications, loadingData, setNotifications } = useNotification();

    const [query, setQuery] = useState("");
    const [confirmClear, setConfirmClear] = useState(false);
    const [removingIds, setRemovingIds] = useState<number[]>([]);
    const [error, setError] = useState<string | null>(null);

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
        [...filtered]
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

    const handleDeleteOne = async (item: NotificationDto) => {
        setError(null);
        setRemovingIds((ids) => [...ids, item.id]);
        await new Promise((r) => setTimeout(r, 200));
        setNotifications((prev: NotificationDto[]) => prev.filter((n) => n.id !== item.id));
        setRemovingIds((ids) => ids.filter((id) => id !== item.id));

        try {
            await providers.API.delete(API_URL, "notification", item.id, {});
        } catch {
            // Rollback : on remet la notification si le serveur a refusé
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

    return (
        <div className="min-h-screen bg-stone-50 px-4 py-10 text-stone-900 transition-colors duration-200 dark:bg-stone-950 dark:text-stone-100 sm:px-6">
            <div className="mx-auto max-w-3xl">
                {/* En-tête */}
                <header className="mb-8">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                Notifications
                            </h1>
                            <p className="mt-2 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">
                                Alertes envoyées par vos collaborateurs et pièces jointes à consulter.
                            </p>
                        </div>

                        {!loadingData && total > 0 && (
                            <div className="flex items-center gap-2">
                                {confirmClear ? (
                                    <>
                                        <span className="text-sm text-stone-500 dark:text-stone-400">
                                            Effacer les {total} notifications ?
                                        </span>
                                        <button
                                            onClick={handleClearAll}
                                            className="rounded-full bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-offset-stone-950"
                                        >
                                            Effacer
                                        </button>
                                        <button
                                            onClick={() => setConfirmClear(false)}
                                            className="rounded-full px-4 py-2 text-sm font-medium text-stone-600 transition-colors hover:bg-stone-200/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-stone-400 dark:text-stone-300 dark:hover:bg-stone-800"
                                        >
                                            Annuler
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={() => setConfirmClear(true)}
                                        className="inline-flex items-center gap-2 rounded-full border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-stone-700 dark:text-stone-200 dark:hover:border-stone-600 dark:hover:bg-stone-900"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Tout effacer
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Recherche */}
                    {!loadingData && total > 0 && (
                        <div className="relative mt-6">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                            <input
                                type="search"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Rechercher par titre, message ou expéditeur"
                                className="w-full rounded-full border border-stone-200 bg-white py-2.5 pl-11 pr-10 text-sm shadow-sm outline-none transition-shadow placeholder:text-stone-400 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 dark:border-stone-800 dark:bg-stone-900 dark:placeholder:text-stone-500 dark:focus:border-amber-400 dark:focus:ring-amber-400/10"
                            />
                            {query && (
                                <button
                                    onClick={() => setQuery("")}
                                    aria-label="Effacer la recherche"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-stone-400 transition-colors hover:text-stone-700 dark:hover:text-stone-200"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    )}
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex items-center justify-between rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
                    >
                        {error}
                        <button
                            onClick={() => setError(null)}
                            aria-label="Fermer le message"
                            className="ml-4 rounded p-1 hover:bg-red-100 dark:hover:bg-red-900/40"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                {/* Chargement */}
                {loadingData ? (
                    <div className="space-y-3" aria-busy="true" aria-label="Chargement des notifications">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex animate-pulse gap-4 rounded-2xl border border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900"
                            >
                                <div className="h-10 w-10 shrink-0 rounded-full bg-stone-200 dark:bg-stone-800" />
                                <div className="flex-1 space-y-3">
                                    <div className="h-4 w-1/3 rounded bg-stone-200 dark:bg-stone-800" />
                                    <div className="h-3 w-full rounded bg-stone-100 dark:bg-stone-800/70" />
                                    <div className="h-3 w-2/3 rounded bg-stone-100 dark:bg-stone-800/70" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : total === 0 ? (
                    /* Aucun résultat du tout */
                    <div className="flex flex-col items-center rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-20 text-center dark:border-stone-800 dark:bg-stone-900/40">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-400/10 dark:text-amber-300">
                            <Bell className="h-6 w-6" />
                        </div>
                        <h2 className="mt-5 text-lg font-semibold">Aucune notification</h2>
                        <p className="mt-1 max-w-xs text-sm text-stone-500 dark:text-stone-400">
                            Les nouvelles alertes apparaîtront ici dès leur envoi.
                        </p>
                    </div>
                ) : groups.length === 0 ? (
                    /* Recherche sans résultat */
                    <div className="rounded-2xl border border-dashed border-stone-300 px-6 py-16 text-center dark:border-stone-800">
                        <p className="font-medium">Aucun résultat pour « {query} »</p>
                        <button
                            onClick={() => setQuery("")}
                            className="mt-2 text-sm font-medium text-amber-700 underline-offset-4 hover:underline dark:text-amber-300"
                        >
                            Effacer la recherche
                        </button>
                    </div>
                ) : (
                    <div className="space-y-10">
                        {groups.map((group) => (
                            <section key={group.label} aria-label={group.label}>
                                <h2 className="mb-3 px-1 text-sm font-medium capitalize text-stone-500 dark:text-stone-400">
                                    {group.label}
                                </h2>

                                <ul className="space-y-3">
                                    {group.items.map((n) => {
                                        const removing = removingIds.includes(n.id);
                                        const name = senderName(n.User);
                                        const ini = initials(n.User);

                                        return (
                                            <li
                                                key={n.id}
                                                className={`group relative rounded-2xl border border-stone-200 bg-white p-5 shadow-[0_1px_2px_rgba(28,25,23,0.04)] transition-all duration-200 motion-reduce:transition-none hover:border-stone-300 hover:shadow-[0_8px_24px_-12px_rgba(28,25,23,0.18)] dark:border-stone-800 dark:bg-stone-900 dark:shadow-none dark:hover:border-stone-700 ${removing
                                                        ? "translate-x-4 scale-[0.98] opacity-0"
                                                        : "translate-x-0 opacity-100"
                                                    }`}
                                            >
                                                <div className="flex items-start gap-4">
                                                    {/* Avatar */}
                                                    <div
                                                        aria-hidden="true"
                                                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-900 text-sm font-semibold text-amber-300 dark:bg-amber-400 dark:text-stone-900"
                                                    >
                                                        {ini || <Bell className="h-4 w-4" />}
                                                    </div>

                                                    {/* Contenu */}
                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                                                            <h3 className="text-base font-semibold leading-snug">
                                                                {n.title || "Notification sans titre"}
                                                            </h3>
                                                            <time
                                                                dateTime={new Date(n.createdAt).toISOString()}
                                                                title={new Date(n.createdAt).toLocaleString("fr-FR")}
                                                                className="text-xs text-stone-500 dark:text-stone-400"
                                                            >
                                                                {relativeTime(n.createdAt)}
                                                            </time>
                                                        </div>

                                                        {name && (
                                                            <p className="mt-0.5 text-sm text-stone-500 dark:text-stone-400">
                                                                {name}
                                                                {n.User?.email && name !== n.User.email && (
                                                                    <span className="text-stone-400 dark:text-stone-500">
                                                                        {" "}
                                                                        – {n.User.email}
                                                                    </span>
                                                                )}
                                                            </p>
                                                        )}

                                                        <p className="mt-3 max-w-prose text-sm leading-relaxed text-stone-700 dark:text-stone-300">
                                                            {n.description || "Aucune description fournie."}
                                                        </p>

                                                        {n.file && (
                                                            <a
                                                                href={`${providers.ImageUrl}/${n.file}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="group/file mt-4 inline-flex items-center gap-3 rounded-xl border border-stone-200 bg-stone-50 py-2 pl-2 pr-4 transition-colors hover:border-amber-400 hover:bg-amber-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 dark:border-stone-700 dark:bg-stone-800/60 dark:hover:border-amber-400/60 dark:hover:bg-amber-400/10"
                                                            >
                                                                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm dark:bg-stone-900 dark:text-amber-300">
                                                                    <FileText className="h-4 w-4" />
                                                                </span>
                                                                <span className="flex flex-col text-left">
                                                                    <span className="text-sm font-medium">Pièce jointe</span>
                                                                    <span className="text-xs text-stone-500 dark:text-stone-400">
                                                                        Ouvrir le document
                                                                    </span>
                                                                </span>
                                                                <ArrowUpRight className="h-4 w-4 text-stone-400 transition-colors group-hover/file:text-amber-600 dark:group-hover/file:text-amber-300" />
                                                            </a>
                                                        )}
                                                    </div>

                                                    {/* Suppression */}
                                                    <button
                                                        onClick={() => handleDeleteOne(n)}
                                                        aria-label={`Supprimer la notification ${n.title ?? ""}`}
                                                        title="Supprimer"
                                                        className="shrink-0 rounded-full p-2 text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 dark:hover:bg-red-950/40 dark:hover:text-red-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
