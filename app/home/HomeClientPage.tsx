
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSpinner,
  faArrowUpRightFromSquare,
  faChartPie,
  faBuilding,
  faShieldHalved,
  faCalendarDays,
  faArrowRight,
  faChartLine,
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

const GOLD = "#c9a24b";

const CARD =
  "rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,0.035)] transition-all duration-300 dark:border-white/[0.07] dark:bg-[#0f1a33]";

export default function HomePage() {
  const { data: session } = useSession();
  const { cardComponent, enterprise, loader } = HomeComponent();
  const [adminRole, setAdminRole] = useState("");

  useEffect(() => {
    (() => {
      const adminRole = String((session?.user as any).adminRole)
      setAdminRole(adminRole)
    })()
  }, [session])
  
  const hasAdminAccess = useMemo(
    () =>
      REQUIRED_ADMIN_ROLES.includes(
        adminRole as (typeof REQUIRED_ADMIN_ROLES)[number]
      ),
    [adminRole]
  );

  const getAdminRole = (value: string): string => {
    if (!value) return '';
    if (value === "Super_Admin_Platform") return "Super Administrateur LRCSheet";
    if (value === "Super_Admin_Enterprise") return "Super Administrateur";
    return "Administrateur";
  }

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XAF",
        maximumFractionDigits: 0,
      }),
    []
  );

  const numberFormatter = useMemo(
    () => new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }),
    []
  );

  const formatCardValue = (title: string, value: number) => {
    const t = title.toLowerCase();

    const isCurrency =
      t.includes("gain") ||
      t.includes("solde") ||
      t.includes("revenu") ||
      t.includes("paiement") ||
      t.includes("montant") ||
      t.includes("déduction") ||
      t.includes("deduction");

    return isCurrency
      ? currencyFormatter.format(value)
      : numberFormatter.format(value);
  };

  const today = new Date();

  const todayLabel = today.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  if (loader) {
    return (
      <div
        className="flex min-h-screen flex-col items-center justify-center gap-5 text-white"
        style={{
          background:
            "radial-gradient(100% 100% at 50% 0%, #1b2f66 0%, #0b1530 55%, #070e20 100%)",
        }}
      >
        <div className="relative flex h-16 w-16 items-center justify-center">
          <div className="absolute inset-0 animate-ping rounded-full bg-[#c9a24b]/20" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-[#c9a24b]/30 bg-[#0b1530]">
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin text-xl text-[#c9a24b]"
            />
          </div>
        </div>

        <div className="text-center">
          <p className="text-lg font-semibold tracking-tight">
            LRCSheet Analytics
          </p>
          <p className="mt-1 text-xs text-white/45">
            Préparation de votre espace de travail...
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f6fa] px-3 py-5 text-slate-800 transition-colors duration-300 sm:px-5 sm:py-7 lg:px-8 dark:bg-[#080f20] dark:text-slate-100">
      {/* Décoration d'arrière-plan */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 right-0 h-[420px] w-[420px] rounded-full bg-[#c9a24b]/[0.045] blur-[100px]"
      />

      <div className="relative mx-auto max-w-[1500px] space-y-8">

        {/* =====================================================
            EN-TÊTE PRINCIPAL
        ===================================================== */}

        <section
          className="relative isolate overflow-hidden rounded-[28px] text-white shadow-[0_25px_70px_-30px_rgba(11,21,48,0.65)]"
          style={{
            background:
              "linear-gradient(120deg, #172d5c 0%, #0b1530 55%, #080f20 100%)",
          }}
        >
          {/* Décorations */}
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-40 h-[430px] w-[430px] rounded-full border border-white/[0.06]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-10 -top-24 h-[300px] w-[300px] rounded-full border border-white/[0.06]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -right-20 -bottom-40 h-80 w-80 rounded-full bg-[#c9a24b]/20 blur-[90px]"
          />

          <div className="relative grid gap-8 p-6 sm:p-9 lg:grid-cols-[1fr_auto] lg:items-end lg:p-11">

            {/* Présentation */}
            <div className="min-w-0">
              {/* <div className="mb-7 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3.5 py-2 text-[11px] font-medium text-white/80 backdrop-blur">
                  <FontAwesomeIcon
                    icon={faBuilding}
                    className="text-[#c9a24b]"
                  />
                  Espace Entreprise
                </span>

                {hasAdminAccess && (
                  <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#c9a24b]/30 bg-[#c9a24b]/10 px-3.5 py-2 text-[11px] font-medium text-[#e8cc8c]">
                    <FontAwesomeIcon icon={faShieldHalved} />
                    <span className="truncate">{userRole}</span>
                  </span>
                )}

                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3.5 py-2 text-[11px] font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live Sync
                </span>
              </div> */}

              <p className="mb-2 text-xs font-medium uppercase tracking-[0.22em] text-[#c9a24b]">
                Tableau de pilotage
              </p>

              <h1 className="max-w-3xl break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl lg:text-5xl">
                Bonjour, {getAdminRole(adminRole)}
                <span className="ml-2 inline-block text-[#c9a24b]">.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-300/70 sm:text-base">
                Retrouvez en un seul endroit les informations essentielles,
                les indicateurs et les performances de votre entreprise.
              </p>

              <div className="mt-7 flex items-center gap-3">
                <div className="h-px w-10 bg-[#c9a24b]" />
                <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
                  LRCSheet Management
                </span>
              </div>
            </div>

            {/* Date */}
            <div className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-md sm:min-w-[270px] sm:p-5">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#c9a24b] text-[#101b35] shadow-lg shadow-black/10">
                <FontAwesomeIcon icon={faCalendarDays} className="text-lg" />
              </div>

              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/45">
                  Aujourd'hui
                </p>
                <p className="mt-1 text-sm font-semibold capitalize text-white">
                  {todayLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Filet inférieur */}
          <div className="h-[3px] w-full bg-gradient-to-r from-transparent via-[#c9a24b] to-transparent opacity-70" />
        </section>

        {/* =====================================================
            ABONNEMENT EXPIRÉ
        ===================================================== */}

        {enterprise?.subscriptionStatus === "expired" && (
          <div className="overflow-hidden rounded-2xl border border-rose-500/20 bg-rose-50 p-4 shadow-sm dark:bg-rose-500/[0.07] sm:p-5">
            <SubscriptionEpiredComponent />
          </div>
        )}

        {/* =====================================================
            INDICATEURS CLÉS
        ===================================================== */}

        <section className="space-y-5">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[#c9a24b]" />
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#b28a38]">
                  Vue d'ensemble
                </span>
              </div>

              <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Indicateurs clés
              </h2>

              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                Les données essentielles de votre activité.
              </p>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Données disponibles
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {cardComponent.map((card, index) => (
              <Link
                key={card.title || index}
                href={card.path}
                className={`${CARD} group relative flex min-h-[190px] min-w-0 flex-col justify-between overflow-hidden p-5 sm:p-6 hover:-translate-y-1 hover:border-[#c9a24b]/50 hover:shadow-[0_18px_40px_-18px_rgba(15,23,42,0.20)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]`}
              >
                {/* Décoration */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full opacity-[0.045] transition-transform duration-500 group-hover:scale-125"
                  style={{ backgroundColor: card.backgroundColor }}
                />

                <div className="relative flex items-start justify-between gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg transition-transform duration-300 group-hover:scale-105"
                    style={{
                      backgroundColor: card.backgroundColor,
                      boxShadow: `0 8px 20px ${card.backgroundColor}35`,
                    }}
                  >
                    <FontAwesomeIcon icon={card.icon} className="text-lg" />
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-all duration-300 group-hover:border-[#c9a24b] group-hover:bg-[#c9a24b] group-hover:text-[#0b1530] dark:border-white/10 dark:text-slate-500">
                    <FontAwesomeIcon
                      icon={faArrowUpRightFromSquare}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="relative mt-7 min-w-0">
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    {card.title}
                  </p>

                  <h3 className="mt-2 break-words text-2xl font-bold leading-tight tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                    {formatCardValue(card.title, card.value)}
                  </h3>
                </div>

                <div className="relative mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/[0.07]">
                  <span className="text-[11px] font-medium text-slate-400 transition-colors group-hover:text-slate-700 dark:group-hover:text-slate-200">
                    Consulter les détails
                  </span>

                  <FontAwesomeIcon
                    icon={faArrowRight}
                    className="text-xs text-[#c9a24b] transition-transform duration-300 group-hover:translate-x-1"
                  />
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =====================================================
            ANALYSE ANNUELLE
        ===================================================== */}

        {hasAdminAccess && (
          <section className="space-y-5">

            {/* En-tête */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm dark:border-white/[0.07] dark:bg-[#0f1a33] sm:p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#c9a24b]/10 text-[#b28a38] ring-1 ring-[#c9a24b]/20">
                    <FontAwesomeIcon icon={faChartPie} className="text-lg" />
                  </div>

                  <div className="min-w-0">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#b28a38]">
                      Performance financière
                    </p>

                    <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white sm:text-xl">
                      Analyse des gains & performances
                    </h2>

                    <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400 sm:text-sm">
                      Rapports financiers, métriques de rendement et tendances
                      annuelles.
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-white/10 dark:bg-white/[0.03] sm:self-auto">
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    className="text-[#c9a24b]"
                  />

                  <div>
                    <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                      Exercice en cours
                    </p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">
                      {today.getFullYear()}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Composant conservé sans modification */}
            <GetAnnualGain />
          </section>
        )}

        {/* Pied de page */}
        <footer className="flex flex-col items-center justify-between gap-2 border-t border-slate-200/70 py-5 text-[10px] text-slate-400 sm:flex-row dark:border-white/[0.06]">
          <span>LRCSheet Management System</span>
          <span>Tableau de bord • {today.getFullYear()}</span>
        </footer>
      </div>
    </main>
  );
}
