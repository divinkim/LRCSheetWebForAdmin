"use client";

import { useMemo } from "react";
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
  faArrowTrendUp,
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

/* =========================================================
   THEME — même identité que GetAnnualGain
========================================================= */

const GOLD = "#c9a24b";
const SERIF = "'Fraunces', 'Playfair Display', Georgia, serif";

const CARD =
  "rounded-3xl border border-slate-200/70 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-12px_rgba(15,23,42,0.10)] dark:border-white/5 dark:bg-[#0f1a33] dark:shadow-none";

export default function HomePage() {
  const { data: session } = useSession();

  const { cardComponent, enterprise, loader } = HomeComponent();

  const user = session?.user as UserSession | undefined;

  const userRole = user?.adminRole ?? "";
  const userName = user?.name ?? "Administrateur";

  const hasAdminAccess = useMemo(
    () =>
      REQUIRED_ADMIN_ROLES.includes(
        userRole as (typeof REQUIRED_ADMIN_ROLES)[number]
      ),
    [userRole]
  );

  /* =====================================================
     FORMATTERS
  ===================================================== */

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

  const todayLabel = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  /* =====================================================
     LOADING
  ===================================================== */

  if (loader) {
    return (
      <div
        className="flex min-h-screen w-full flex-col items-center justify-center gap-6 text-slate-100"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, #14244f 0%, #0b1530 55%, #070e20 100%)",
        }}
      >
        <div className="relative flex items-center justify-center">
          <div
            className="absolute h-24 w-24 animate-ping rounded-full opacity-20 blur-xl"
            style={{ background: GOLD }}
          />
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a24b]/40 bg-[#0b1530] shadow-2xl">
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin text-xl text-[#c9a24b]"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p
            className="text-lg tracking-tight text-white"
          >
            LRCSheet Analytics
          </p>
          <p className="text-xs text-white/50">
            Chargement de votre environnement entreprise…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f6fa] px-3 py-4 text-slate-800 transition-colors duration-300 sm:px-5 sm:py-6 lg:px-8 lg:py-8 dark:bg-[#070e20] dark:text-slate-100">
      <div className="mx-auto max-w-[1500px] space-y-7">
        {/* =================================================
            HERO
        ================================================= */}

        <section
          className="relative overflow-hidden rounded-3xl text-white shadow-[0_24px_60px_-20px_rgba(11,21,48,0.55)]"
          style={{
            background:
              "radial-gradient(120% 160% at 0% 0%, #1b2f66 0%, #0b1530 55%, #070e20 100%)",
          }}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full opacity-25 blur-3xl"
            style={{ background: GOLD }}
          />

          <div className="relative flex flex-col gap-8 px-6 py-8 sm:px-10 sm:py-10 lg:flex-row lg:items-end lg:justify-between">
            {/* GAUCHE */}

            <div className="min-w-0">
              <div className="mb-5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-medium text-white/80">
                  <FontAwesomeIcon icon={faBuilding} className="text-[10px]" />
                  Espace Entreprise
                </span>

                {hasAdminAccess && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-[#c9a24b]/40 bg-[#c9a24b]/10 px-3 py-1 text-[11px] font-medium text-[#e3c47a]">
                    <FontAwesomeIcon
                      icon={faShieldHalved}
                      className="text-[10px]"
                    />
                    {userRole}
                  </span>
                )}

                <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                  Live Sync
                </span>
              </div>

              <h1
                className="text-4xl font-medium leading-tight tracking-tight sm:text-5xl"
  
              >
                Bonjour, {userName}
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/60">
                Vue d'ensemble de votre entreprise et de ses performances.
              </p>
            </div>

            {/* DROITE — DATE */}

            <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur">
              <div
                className="flex h-10 w-10 items-center justify-center rounded-full text-[#0b1530]"
                style={{ background: GOLD }}
              >
                <FontAwesomeIcon icon={faCalendarDays} className="text-sm" />
              </div>
              <div>
                <p className="text-[11px] text-white/50">Aujourd'hui</p>
                <p className="text-sm font-medium capitalize">{todayLabel}</p>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            ABONNEMENT EXPIRÉ
        ================================================= */}

        {enterprise?.subscriptionStatus === "expired" && (
          <div className="overflow-hidden rounded-3xl border border-rose-500/30 bg-rose-500/10 p-5 shadow-sm backdrop-blur-md">
            <SubscriptionEpiredComponent />
          </div>
        )}

        {/* =================================================
            INDICATEURS CLÉS
        ================================================= */}

        <section>
          <div className="mb-4 px-1">
            <h2
              className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white"

            >
              Indicateurs clés
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Vue synthétique de votre activité
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {cardComponent.map((card, index) => (
              <Link
                key={card.title || index}
                href={card.path}
                className={`${CARD} group relative flex min-h-[200px] flex-col justify-between overflow-hidden p-6 transition-all duration-300 hover:-translate-y-0.5 hover:border-[#c9a24b]/50 hover:shadow-[0_20px_40px_-16px_rgba(11,21,48,0.25)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a24b]`}
              >
                {/* filet doré */}
                <div
                  aria-hidden
                  className="absolute inset-x-6 top-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
                  }}
                />

                {/* EN-TÊTE */}
                <div className="flex items-start justify-between">
                  <div
                    style={{ backgroundColor: card.backgroundColor }}
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-slate-50 dark:ring-white/5"
                  >
                    <FontAwesomeIcon icon={card.icon} className="text-lg" />
                  </div>

                  <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 text-slate-400 transition-colors duration-300 group-hover:border-[#c9a24b] group-hover:bg-[#c9a24b] group-hover:text-[#0b1530] dark:border-white/10">
                    <FontAwesomeIcon
                      icon={faArrowUpRightFromSquare}
                      className="text-[11px]"
                    />
                  </div>
                </div>

                {/* VALEUR */}
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm text-slate-500 dark:text-slate-400">
                      {card.title}
                    </p>

                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      <FontAwesomeIcon
                        icon={faArrowTrendUp}
                        className="text-[9px]"
                      />
                      +0.0%
                    </span>
                  </div>

                  <h3
                    className="mt-2 truncate text-3xl font-medium tracking-tight text-slate-900 dark:text-white sm:text-4xl"
      
                  >
                    {formatCardValue(card.title, card.value)}
                  </h3>
                </div>

                {/* PIED */}
                <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-white/5">
                  <span className="text-xs text-slate-400 transition-colors group-hover:text-slate-700 dark:group-hover:text-slate-200">
                    Consulter les données
                  </span>
                  <span className="text-sm text-slate-300 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[#c9a24b] dark:text-slate-600">
                    →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* =================================================
            ANALYSE ANNUELLE
            ⚠️ GetAnnualGain INCHANGÉ
        ================================================= */}

        {hasAdminAccess && (
          <section className="space-y-5">
            {/* EN-TÊTE DE SECTION */}

            <div className="flex flex-col gap-3 px-1 sm:flex-row sm:items-end sm:justify-between">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[#c9a24b] ring-1 ring-[#c9a24b]/30"
                  style={{ background: "rgba(201,162,75,0.08)" }}
                >
                  <FontAwesomeIcon icon={faChartPie} className="text-base" />
                </div>

                <div>
                  <h2
                    className="text-2xl font-medium tracking-tight text-slate-900 dark:text-white"
      
                  >
                    Analyse des gains & performances
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Rapports financiers, métriques de rendement et tendances
                    annuelles.
                  </p>
                </div>
              </div>

              <div className="inline-flex items-center gap-2 self-start rounded-full border border-slate-200/70 bg-white px-4 py-2 text-xs font-medium text-slate-600 shadow-sm sm:self-auto dark:border-white/5 dark:bg-[#0f1a33] dark:text-slate-300">
                <FontAwesomeIcon
                  icon={faCalendarDays}
                  className="text-[#c9a24b]"
                />
                Exercice {new Date().getFullYear()}
              </div>
            </div>

            {/* =================================================
                NE PAS TOUCHER
            ================================================= */}

            <GetAnnualGain />
          </section>
        )}
      </div>
    </div>
  );
}
