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
  faCalendarDays,
} from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

import HomeComponent from "./hook";
import GetAnnualGain from "../dashboard/STATS/page";
import SubscriptionEpiredComponent from "@/components/subscriptionExpiredComponent/page";

const REQUIRED_ADMIN_ROLES = ["Super_Admin_Platform", "Super_Admin_Enterprise", "Enterprise_Admin"];

export default function HomePage() {
  const { data: session } = useSession();
  const { cardComponent, enterprise, loader } = HomeComponent();

  // Récupération du rôle depuis la session
  const userRole = (session?.user as any)?.adminRole ?? "";
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

  // State Loader Pro avec pulsations dorées & bleues
  if (loader) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-slate-950">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-20 w-20 animate-ping rounded-full bg-amber-500/20" />
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 shadow-xl">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-xl animate-spin text-amber-400"
            />
          </div>
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 animate-pulse">
          Chargement du tableau de bord...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-6 lg:p-8 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-8">

        {/*  BANNIÈRE D'ACCUEIL PRO */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all">
          {/* Halo d'ambiance en tâche de fond */}
          <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-amber-400/10 blur-3xl dark:bg-amber-500/10" />
          <div className="pointer-events-none absolute -left-12 -bottom-12 h-48 w-48 rounded-full bg-blue-600/10 blur-3xl dark:bg-blue-600/10" />

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {/* Badge Entreprise */}
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50/80 px-3 py-1 text-xs font-bold text-blue-700 border border-blue-200/60 dark:bg-blue-950/50 dark:text-blue-400 dark:border-blue-900/50">
                  <FontAwesomeIcon icon={faBuilding} className="text-[11px] text-blue-600 dark:text-blue-400" />
                  {(enterprise as any)?.name || "Espace Entreprise"}
                </span>

                {/* Badge Rôle Admin */}
                {hasAdminAccess && (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50/80 px-2.5 py-1 text-xs font-bold text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/40">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[11px] text-amber-500" />
                    {userRole}
                  </span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                Bienvenue, <span className="text-blue-600 dark:text-blue-400">{userName}</span> 👋
              </h1>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Aperçu général de vos activités, statistiques clés et indicateurs de performance.
              </p>
            </div>

            {/* Carte Date / Heure */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 rounded-xl bg-slate-100/80 px-4 py-2.5 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 shadow-inner">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white dark:bg-blue-600">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-sm" />
                </div>
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">Aujourd'hui</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100">
                    {new Date().toLocaleDateString("fr-FR", {
                      weekday: "short",
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ⚠️ ALERTE ABONNEMENT EXPIRÉ */}
        {enterprise?.subscriptionStatus === "expired" && (
          <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 shadow-sm backdrop-blur-sm">
            <SubscriptionEpiredComponent />
          </div>
        )}

        {/* 📊 GRILLE DES CARTES DE STATISTIQUES (KPIs) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cardComponent.map((card, index) => {
            // Masquer la 3ème carte si non autorisé
            if (!hasAdminAccess) return null;

            return (
              <Link
                key={card.title}
                href={card.path}
                className={cn(
                  "group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-amber-400 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900 dark:hover:border-amber-500/50"
                )}
              >
                {/* Ligne accent colorée au survol (Blue à Amber) */}
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-amber-400 to-amber-500 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

                <div>
                  <div className="flex items-center justify-between">
                    {/* Icône principale avec conteneur stylisé */}
                    <div
                      style={{ backgroundColor: card.backgroundColor }}
                      className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-md ring-4 ring-slate-100 dark:ring-slate-800/50 transition-transform duration-300 group-hover:scale-105"
                    >
                      <FontAwesomeIcon icon={card.icon} className="text-lg" />
                    </div>

                    {/* Bouton Consulter / Oeil */}
                    {!hasAdminAccess && (
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 text-slate-600 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800 dark:text-slate-300 dark:group-hover:bg-amber-500 dark:group-hover:text-slate-950 shadow-sm">
                        <FontAwesomeIcon icon={faEye} className="text-xs" />
                      </div>
                    )}
                  </div>

                  <div className="mt-6 space-y-1">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                      {card.title}
                    </p>
                    <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                      {formatCardValue(index, card.value)}
                    </h3>
                  </div>
                </div>

                {/* Footer interactif sur la carte */}
                <div className="mt-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                  <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-amber-400 transition-colors">
                    Voir les détails
                  </span>
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-amber-500 dark:group-hover:text-slate-950 transition-all duration-200">
                    <FontAwesomeIcon
                      icon={faArrowRight}
                      className="text-[10px] transition-transform duration-200 group-hover:translate-x-0.5"
                    />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* 📈 SECTION STATISTIQUES ANNUELLES (RESERVÉ AUX ADMINS) */}
        {hasAdminAccess && (
          <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 transition-all">
            {/* Header du composant de graphique */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 px-6 py-5 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400">
                  <FontAwesomeIcon icon={faChartPie} className="text-sm" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                    Analyse des Gains & Performances
                  </h2>
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                    Évolution des revenus et tendance globale d'activité.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 border border-emerald-500/20 dark:bg-emerald-400/10 dark:text-emerald-400">
                  Données en direct
                </span>
                <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1 text-xs font-bold text-slate-600 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
                  Rapport Annuel
                </span>
              </div>
            </div>

            {/* Zone du Graphique */}
            <div className="p-6">
              <GetAnnualGain />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}