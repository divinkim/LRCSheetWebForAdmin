"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faSpinner,
  faArrowRight,
  faChartPie,
  faBuilding,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

import HomeComponent from "./hook";
import GetAnnualGain from "../dashboard/STATS/page";
import SubscriptionEpiredComponent from "@/components/subscriptionExpiredComponent/page";

const REQUIRED_ADMIN_ROLES = ["Super-Admin", "Supervisor-Admin"];

export default function HomePage() {
  const { data: session } = useSession();
  const { cardComponent, enterprise, loader } = HomeComponent();

  // Récupération du rôle depuis la session
  const userRole = session?.user?.adminRole ?? "";
  const userName = session?.user?.name ?? "Administrateur";
  const hasAdminAccess = useMemo(
    () => REQUIRED_ADMIN_ROLES.includes(userRole),
    [userRole]
  );

  /**
   * Format montant (Currency / Int)
   */
  const formatCardValue = (index: number, value: number) => {
    if (index === 2) {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XAF",
        maximumFractionDigits: 0,
      }).format(value);
    }

    return new Intl.NumberFormat("fr-FR").format(value);
  };

  // State Loader Pro
  if (loader) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-slate-50 dark:bg-slate-950">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-16 w-16 animate-ping rounded-full bg-amber-400/20" />
          <FontAwesomeIcon
            icon={faSpinner}
            className="h-16 w-16 animate-spin text-amber-500"
          />
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-600 dark:text-slate-400">
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-8">
        
        {/* 📌 SECTION HEADER DASHBOARD */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl dark:bg-amber-500/5" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-blue-600/10 blur-2xl dark:bg-blue-600/5" />

          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-400 dark:border-blue-900/40">
                  <FontAwesomeIcon icon={faBuilding} className="text-[10px]" />
                  {enterprise?.name || "Espace Entreprise"}
                </span>
                {hasAdminAccess && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-900/40">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[10px]" />
                    {userRole}
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Bienvenue, <span className="text-blue-600 dark:text-blue-400">{userName}</span> 👋
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Aperçu général de vos activités, statistiques et indicateurs clés.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-3 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60">
                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Aujourd'hui</p>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {new Date().toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ⚠️ ALERTE ABONNEMENT EXPIRÉ */}
        {enterprise?.subscriptionStatus === "expired" && (
          <div className="rounded-2xl border border-amber-400/40 bg-amber-500/10 p-4 shadow-sm backdrop-blur-sm">
            <SubscriptionEpiredComponent />
          </div>
        )}

        {/* 📊 GRILLE DE CARTES KPI / INDICATEURS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cardComponent.map((card, index) => {
            // Masquer la 3ème carte si restreint
            if (index === 2 && !hasAdminAccess) return null;

            return (
              <Link
                key={card.title}
                href={card.path}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/50"
                )}
              >
                {/* Accent de ligne supérieure au survol */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div>
                  <div className="flex items-center justify-between">
                    {/* Icône principale avec conteneur stylisé */}
                    <div
                      style={{ backgroundColor: card.backgroundColor }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md shadow-slate-900/5 ring-1 ring-white/20 transition-transform duration-300 group-hover:scale-110"
                    >
                      <FontAwesomeIcon icon={card.icon} className="text-xl" />
                    </div>

                    {/* Bouton Consulter / Oeil */}
                    {index !== 2 && (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-600 transition-all duration-200 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-amber-500 dark:group-hover:text-slate-950">
                        <FontAwesomeIcon icon={faEye} className="text-xs" />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {card.title}
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {formatCardValue(index, card.value)}
                    </h3>
                  </div>
                </div>

                {/* Footer de carte interactif */}
                {/* <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <span className="text-xs font-medium text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">
                    Accéder au détail
                  </span>
                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-xs text-slate-600 dark:text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-blue-600 dark:group-hover:text-amber-400"
                  />
                </div> */}
              </Link>
            );
          })}
        </div>

        {/* 📈 SECTION STATISTIQUES ANNUELLES (ADMINS) */}
        {hasAdminAccess && (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-4 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                  <FontAwesomeIcon icon={faChartPie} className="text-sm" />
                </div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  Analyse des Gains & Performances
                </h2>
              </div>
              <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-200/60 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                Rapport Annuel
              </span>
            </div>

            <div className="p-6">
              <GetAnnualGain />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}