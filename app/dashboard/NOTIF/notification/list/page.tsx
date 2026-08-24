"use client";

import { useState, useEffect } from "react";
import useNotifications from "../new/hook";
import { useNotification } from "./hook";
import { providers } from "@/index";
export interface PrismaNotification {
    id: number;
    title: string | null;
    description: string | null;
    fcmToken: string | null;
    UserId: number | null;
    createdAt: string | Date;
    updatedAt: string | Date;
    User?: {
        id: number;
        firstName?: string;
        lastName?: string;
    } | null;
}



export default function NotificationPage() {
    const { notifications, loadingData, setLoadingData, setNotifications } = useNotification()

    // Simulation du chargement initial de l'API / Base de données
    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //         setNotifications(mockNotifications);
    //         setLoadingData(false);
    //     }, 1500);
    //     return () => clearTimeout(timer);
    // }, []);

    const handleDeleteOne = async (id: number) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        const res = await providers.API.delete("https://vps118934.serveur-vps.net:4001", 'notification', id, {});
        console.log(res)
    };

    const handleClearAll = async () => {
        setNotifications([]);
        const res = await providers.API.delete("https://vps118934.serveur-vps.net:4001", 'notifications', null, {});
        console.log(res)
    };

    return (
        <div className="min-h-screen  dark:bg-gray-900 p-6 text-slate-800 dark:text-white transition-colors duration-200">
            <div className="mx-auto max-w-5xl">

                {/* Header de la page */}
                <div className="mb-8 flex flex-col justify-between gap-4 border-b border-slate-300 dark:border-slate-600 pb-5 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                            Centre de Notifications <span className="text-amber-500 dark:text-amber-400">Administrateur</span>
                        </h1>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Gérant les alertes globales, jetons Push et activités des collaborateurs en mode multi-thème.
                        </p>
                    </div>

                    {!loadingData && notifications.length > 0 && (
                        <button
                            onClick={handleClearAll}
                            className="inline-flex items-center justify-center rounded-lg bg-slate-200 hover:bg-slate-300 dark:bg-slate-600 dark:hover:bg-slate-500 px-4 py-2 text-sm font-semibold text-slate-800 dark:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-400"
                        >
                            Tout effacer ({notifications.length})
                        </button>
                    )}
                </div>

                {/* 1. Affichage du SKELETON pendant le chargement */}
                {loadingData ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((index) => (
                            <div
                                key={index}
                                className="animate-pulse rounded-xl border border-slate-200 dark:border-slate-600 bg-white/70 dark:bg-slate-600/30 p-5 pl-7 relative"
                            >
                                {/* Ligne latérale amber du squelette */}
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-slate-300 dark:bg-slate-500" />
                                <div className="flex justify-between items-start gap-4">
                                    <div className="flex-1 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-5 w-48 rounded bg-slate-300 dark:bg-slate-500" />
                                            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-4 w-full rounded bg-slate-200 dark:bg-slate-500/70" />
                                            <div className="h-4 w-2/3 rounded bg-slate-200 dark:bg-slate-500/70" />
                                        </div>
                                        <div className="flex gap-2 pt-2">
                                            <div className="h-5 w-24 rounded bg-slate-200 dark:bg-slate-600" />
                                            <div className="h-5 w-32 rounded bg-slate-200 dark:bg-slate-600" />
                                        </div>
                                    </div>
                                    <div className="h-6 w-6 rounded bg-slate-200 dark:bg-slate-600" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : notifications.length === 0 ? (
                    /* 2. État vide si aucune donnée */
                    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-white dark:bg-transparent py-16 text-center shadow-sm">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 dark:bg-slate-600 text-amber-500 dark:text-amber-400 text-xl">
                            🔔
                        </div>
                        <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">Aucune notification</h3>
                        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Tout est sous contrôle ! Le système est à jour.</p>
                    </div>
                ) : (
                    /*Liste des vraies notifications chargées */
                    <div className="space-y-4">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className="group relative overflow-hidden rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-600/40 p-5 transition-all hover:border-amber-500/50 dark:hover:border-amber-400/40 hover:bg-slate-50/80 dark:hover:bg-slate-600 shadow-sm"
                            >
                                {/* Bordure latérale distinctive gauche */}
                                <div className="absolute top-0 left-0 bottom-0 w-1 bg-amber-500 dark:bg-amber-400" />

                                <div className="flex items-start justify-between gap-4 pl-2">
                                    <div className="space-y-2">
                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                            <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                                                {notification.title || "Notification sans titre"}
                                            </h2>
                                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                                • {new Date(notification.createdAt).toLocaleString("fr-FR")}
                                            </span>
                                        </div>

                                        <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-200">
                                            {notification.description || "Aucune description fournie."}
                                        </p>

                                        <div className="mt-4 flex flex-wrap gap-2 pt-1">
                                            {notification.User && (
                                                <span className="inline-flex items-center rounded-md bg-blue-600 px-2.5 py-0.5 text-xs font-medium text-white shadow-sm">
                                                    De : 👤 {notification.User.firstname} {notification.User.lastname} {notification.User.email}
                                                </span>
                                            )}

                                            {/* {notification.fcmToken ? (
                                                <span className="inline-flex items-center rounded-md bg-amber-100 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-mono font-medium text-amber-800 dark:text-amber-400 border border-amber-300 dark:border-amber-500/20">
                                                    📲 Push (FCM)
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center rounded-md bg-slate-200 dark:bg-slate-700 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
                                                    💻 Interne
                                                </span>
                                            )} */}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleDeleteOne(notification.id)}
                                        className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-colors"
                                        title="Supprimer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}