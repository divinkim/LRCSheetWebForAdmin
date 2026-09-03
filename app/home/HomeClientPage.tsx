"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faSpinner,
  faArrowUpRightFromSquare,
  faChartPie,
  faBuilding,
  faShieldHalved,
  faCalendarDays,
  faArrowTrendUp, // <-- Corrigé ici (faTrendingUp n'existe pas, faArrowTrendUp est l'équivalent gratuit)
  faWandMagicSparkles,
} from "@fortawesome/free-solid-svg-icons";

import HomeComponent from "./hook";
import GetAnnualGain from "../dashboard/STATS/page";
import SubscriptionEpiredComponent from "@/components/subscriptionExpiredComponent/page";

const REQUIRED_ADMIN_ROLES = [
  "Super_Admin_Platform",
  "Super_Admin_Enterprise",
  "Enterprise_Admin",
] as const;

interface UserSession {
  name?: string | null;
  adminRole?: string | null;
}

export default function HomePage() {
  const { data: session } = useSession();
  const { cardComponent, enterprise, loader } = HomeComponent();

  const user = session?.user as UserSession | undefined;
  const userRole = user?.adminRole ?? "";
  const userName = user?.name ?? "Administrateur";

  const hasAdminAccess = useMemo(
    () => REQUIRED_ADMIN_ROLES.includes(userRole as typeof REQUIRED_ADMIN_ROLES[number]),
    [userRole]
  );

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XAF",
        maximumFractionDigits: 0,
      }),
    []
  );

  const numberFormatter = useMemo(() => new Intl.NumberFormat("fr-FR"), []);

  const formatCardValue = (index: number, value: number) => {
    return index === 2 ? currencyFormatter.format(value) : numberFormatter.format(value);
  };

  if (loader) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-slate-950 text-slate-100">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-blue-500/10 blur-xl" />
          <div className="absolute h-16 w-16 animate-pulse rounded-full bg-amber-500/20 blur-md" />
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl backdrop-blur-xl">
            <FontAwesomeIcon
              icon={faSpinner}
              className="text-2xl animate-spin text-gradient bg-gradient-to-r from-blue-400 to-amber-400 text-blue-500"
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 animate-pulse">
            LRCSheet Analytics
          </p>
          <p className="text-[11px] text-slate-600">Chargement de votre environnement entreprise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19]/5 bg-gradient-to-b from-slate-50 via-slate-50/50 to-slate-100/80 p-4 sm:p-6 lg:p-10 dark:from-slate-950 dark:via-slate-950/90 dark:to-slate-900 text-slate-800 dark:text-slate-100 transition-all duration-300">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* HERO BANNER GLASSMORPHISM */}
        <div className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/70 p-6 sm:p-10 shadow-xl shadow-slate-200/50 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-900/60 dark:shadow-none transition-all">
          <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-amber-400/20 to-orange-500/10 blur-3xl dark:from-amber-500/10 dark:to-orange-500/5" />
          <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-gradient-to-tr from-blue-600/20 to-indigo-500/10 blur-3xl dark:from-blue-600/15 dark:to-indigo-500/5" />

          <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50/90 px-3.5 py-1 text-xs font-bold text-blue-700 border border-blue-200/60 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60 shadow-sm">
                  <FontAwesomeIcon icon={faBuilding} className="text-[11px] text-blue-500" />
                  {"Espace Entreprise"}
                </span>

                {hasAdminAccess && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50/90 px-3 py-1 text-xs font-bold text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/50 shadow-sm">
                    <FontAwesomeIcon icon={faShieldHalved} className="text-[11px] text-amber-500" />
                    {userRole}
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 dark:text-white">
                Ravi de vous revoir, <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-300">{userName}</span>
              </h1>
              
              <p className="max-w-2xl text-sm font-medium leading-relaxed text-slate-600 dark:text-slate-400">
                Supervisez vos indicateurs clés de performance, gérez vos souscriptions et suivez vos gains consolidés en temps réel.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-3.5 rounded-2xl bg-slate-100/80 px-4 py-3 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/50 shadow-inner backdrop-blur-md">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                  <FontAwesomeIcon icon={faCalendarDays} className="text-sm" />
                </div>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 dark:text-slate-500">Date du jour</p>
                  <p className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 capitalize">
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

        {enterprise?.subscriptionStatus === "expired" && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-5 shadow-lg backdrop-blur-md">
            <SubscriptionEpiredComponent />
          </div>
        )}

        {/* GRILLE DES KPIS */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {cardComponent.map((card, index) => (
            <Link
              key={card.title || index}
              href={card.path}
              className="group relative flex flex-col justify-between overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-7 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/40 hover:shadow-2xl hover:shadow-blue-500/5 dark:border-slate-800/80 dark:bg-slate-900/80 dark:hover:border-blue-500/40 dark:hover:shadow-none"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-amber-400 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

              <div>
                <div className="flex items-start justify-between">
                  <div
                    style={{ backgroundColor: card.backgroundColor }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-slate-100/80 dark:ring-slate-800/60 transition-transform duration-300 group-hover:scale-110"
                  >
                    <FontAwesomeIcon icon={card.icon} className="text-xl" />
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100/80 text-slate-400 transition-all duration-300 group-hover:bg-blue-600 group-hover:text-white dark:bg-slate-800/80 dark:text-slate-400 dark:group-hover:bg-blue-600 dark:group-hover:text-white shadow-sm">
                    <FontAwesomeIcon icon={faArrowUpRightFromSquare} className="text-xs transition-transform group-hover:scale-110" />
                  </div>
                </div>

                <div className="mt-8 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      {card.title}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                      <FontAwesomeIcon icon={faArrowTrendUp} className="text-[10px]" />
                      +0.0%
                    </span>
                  </div>

                  <h3 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {formatCardValue(index, card.value)}
                  </h3>
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between border-t border-slate-100 dark:border-slate-800/80 pt-4">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Consulter les données
                </span>
                <span className="text-xs font-semibold text-slate-400 group-hover:translate-x-1 transition-transform">
                  &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* SECTION STATISTIQUES ANNUELLES */}
        {hasAdminAccess && (
          <div className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 shadow-xl shadow-slate-200/40 dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-none transition-all">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-slate-800 px-8 py-6 bg-slate-50/50 dark:bg-slate-900/50">
              <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-600/10 text-blue-600 border border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-400 shadow-inner">
                  <FontAwesomeIcon icon={faChartPie} className="text-lg" />
                </div>
                <div>
                  <h2 className="text-lg font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                    Analyse des Gains & Performances
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="text-xs text-amber-400" />
                  </h2>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Rapports financiers, métriques de rendement et prévisions annuelles.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="rounded-xl bg-slate-100 dark:bg-slate-800/80 px-3.5 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700/80 shadow-sm">
                  Exercice {new Date().getFullYear()}
                </span>
              </div>
            </div>

            <div className="p-6 sm:p-8">
              <GetAnnualGain />
            </div>
          </div>
        )}

      </div>
    </div>
  );
}