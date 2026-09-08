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
  faWandMagicSparkles,
  faMagnifyingGlass,
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

  const {
    cardComponent,
    enterprise,
    loader,
  } = HomeComponent();

  const user = session?.user as UserSession | undefined;

  const userRole = user?.adminRole ?? "";
  const userName = user?.name ?? "Administrateur";

  const hasAdminAccess = useMemo(
    () =>
      REQUIRED_ADMIN_ROLES.includes(
        userRole as typeof REQUIRED_ADMIN_ROLES[number]
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
    () =>
      new Intl.NumberFormat("fr-FR", {
        maximumFractionDigits: 0,
      }),
    []
  );

  /**
   * Les cartes restent dynamiques.
   *
   * On détermine simplement si la valeur représente
   * une somme d'argent à partir du titre de la carte.
   */
  const formatCardValue = (
    title: string,
    value: number
  ) => {
    const titleLower = title.toLowerCase();

    const isCurrency =
      titleLower.includes("gain") ||
      titleLower.includes("solde") ||
      titleLower.includes("revenu") ||
      titleLower.includes("paiement") ||
      titleLower.includes("montant") ||
      titleLower.includes("déduction") ||
      titleLower.includes("deduction");

    return isCurrency
      ? currencyFormatter.format(value)
      : numberFormatter.format(value);
  };

  /* =====================================================
     LOADING
  ===================================================== */

  if (loader) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center gap-6 bg-slate-950 text-slate-100">
        <div className="relative flex items-center justify-center">
          <div className="absolute h-24 w-24 animate-ping rounded-full bg-blue-500/10 blur-xl" />

          <div className="absolute h-16 w-16 animate-pulse rounded-full bg-amber-500/20 blur-md" />

          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl backdrop-blur-xl">
            <FontAwesomeIcon
              icon={faSpinner}
              className="animate-spin text-2xl text-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="animate-pulse text-xs font-bold uppercase tracking-widest text-slate-400">
            LRCSheet Analytics
          </p>

          <p className="text-[11px] text-slate-600">
            Chargement de votre environnement entreprise...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="
        min-h-screen
        bg-gradient-to-b
        from-slate-50
        via-slate-50
        to-slate-100
        px-3
        py-4
        text-slate-800
        transition-all
        duration-300
        sm:px-5
        sm:py-6
        lg:px-7
        lg:py-7
        dark:from-slate-950
        dark:via-slate-950
        dark:to-slate-900
        dark:text-slate-100
      "
    >
      <div className="mx-auto max-w-[1500px] space-y-5 sm:space-y-6">

        {/* =================================================
            HEADER / HERO
        ================================================= */}

        <section
          className="
            relative
            overflow-hidden
            rounded-2xl
            border
            border-slate-200/80
            bg-white/80
            shadow-sm
            backdrop-blur-xl
            dark:border-slate-800
            dark:bg-slate-900/80
          "
        >
          {/* Background decorations */}

          <div className="pointer-events-none absolute -right-24 -top-24 h-56 w-56 rounded-full bg-blue-500/10 blur-3xl" />

          <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-indigo-500/10 blur-3xl" />

          <div
            className="
              relative
              flex
              flex-col
              gap-5
              px-4
              py-5
              sm:px-6
              sm:py-6
              lg:flex-row
              lg:items-center
              lg:justify-between
            "
          >
            {/* LEFT */}

            <div className="min-w-0">

              {/* BADGES */}

              <div className="mb-3 flex flex-wrap items-center gap-2">

                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-blue-200
                    bg-blue-50
                    px-2.5
                    py-1
                    text-[10px]
                    font-bold
                    text-blue-700
                    dark:border-blue-900
                    dark:bg-blue-950/50
                    dark:text-blue-300
                  "
                >
                  <FontAwesomeIcon
                    icon={faBuilding}
                    className="text-[9px]"
                  />

                  Espace Entreprise
                </span>

                {hasAdminAccess && (
                  <span
                    className="
                      inline-flex
                      items-center
                      gap-1.5
                      rounded-lg
                      border
                      border-amber-200
                      bg-amber-50
                      px-2.5
                      py-1
                      text-[10px]
                      font-bold
                      text-amber-700
                      dark:border-amber-900
                      dark:bg-amber-950/40
                      dark:text-amber-300
                    "
                  >
                    <FontAwesomeIcon
                      icon={faShieldHalved}
                      className="text-[9px]"
                    />

                    {userRole}
                  </span>
                )}

                <span
                  className="
                    inline-flex
                    items-center
                    gap-1.5
                    rounded-lg
                    border
                    border-emerald-200
                    bg-emerald-50
                    px-2.5
                    py-1
                    text-[10px]
                    font-bold
                    text-emerald-600
                    dark:border-emerald-900
                    dark:bg-emerald-950/40
                    dark:text-emerald-400
                  "
                >
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />

                  Live Sync
                </span>
              </div>

              {/* TITLE */}

              <h1
                className="
                  text-2xl
                  font-black
                  tracking-tight
                  text-slate-900
                  sm:text-3xl
                  dark:text-white
                "
              >
                Tableau de bord
              </h1>

              <p
                className="
                  mt-1
                  max-w-2xl
                  text-xs
                  font-medium
                  leading-relaxed
                  text-slate-500
                  sm:text-sm
                  dark:text-slate-400
                "
              >
                Vue d'ensemble de votre entreprise et de ses performances.
              </p>

              <p className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-500">
                Ravi de vous revoir,{" "}
                <span className="font-black text-blue-600 dark:text-blue-400">
                  {userName}
                </span>
              </p>
            </div>

            {/* RIGHT */}

            <div className="flex shrink-0 items-center gap-3">

              {/* SEARCH */}

              {/* <div
                className="
                  hidden
                  items-center
                  gap-2.5
                  rounded-xl
                  border
                  border-slate-200
                  bg-slate-50/80
                  px-3
                  py-2.5
                  lg:flex
                  dark:border-slate-700
                  dark:bg-slate-800/70
                "
              >
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  className="text-xs text-slate-400"
                />

                <span className="text-[11px] font-medium text-slate-400">
                  Rechercher...
                </span>
              </div> */}

              {/* DATE */}
              <div
                className="
                  flex
                  items-center
                  gap-2.5
                  rounded-xl
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-2.5
                  shadow-sm
                  dark:border-slate-700
                  dark:bg-slate-800
                "
              >
                <div
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-blue-600
                    text-white
                  "
                >
                  <FontAwesomeIcon
                    icon={faCalendarDays}
                    className="text-xs"
                  />
                </div>

                <div>
                  <p className="text-[8px] font-black uppercase tracking-wider text-slate-400">
                    Date
                  </p>

                  <p className="text-[10px] font-bold capitalize text-slate-800 dark:text-slate-200">
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
        </section>
        {/* =================================================
            SUBSCRIPTION EXPIRED
        ================================================= */}
        {enterprise?.subscriptionStatus === "expired" && (
          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              border-rose-500/30
              bg-rose-500/10
              p-4
              shadow-sm
              backdrop-blur-md
              sm:p-5
            "
          >
            <SubscriptionEpiredComponent />
          </div>
        )}
        {/* =================================================
            KPI CARDS
        ================================================= */}
        <section>
          <div
            className="
              mb-3
              flex
              items-center
              justify-between
            "
          >
            <div>
              <h2 className="text-sm font-black text-slate-900 dark:text-white">
                Indicateurs clés
              </h2>

              <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                Vue synthétique de votre activité
              </p>
            </div>
          </div>

          <div
            className="
              grid
              grid-cols-1
              gap-4
              md:grid-cols-2
              lg:grid-cols-3
            "
          >
            {cardComponent.map((card, index) => (
              <Link
                key={card.title || index}
                href={card.path}
                className="
                  group
                  relative
                  min-h-[190px]
                  overflow-hidden
                  rounded-2xl
                  border
                  border-slate-200/80
                  bg-white
                  p-5
                  shadow-sm
                  transition-all
                  duration-300
                  hover:-translate-y-1
                  hover:border-blue-300
                  hover:shadow-xl
                  hover:shadow-blue-500/10
                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:hover:border-blue-700
                  dark:hover:shadow-none
                "
              >
                {/* TOP LINE */}

                <div
                  className="
                    absolute
                    inset-x-0
                    top-0
                    h-0.5
                    bg-gradient-to-r
                    from-blue-600
                    via-indigo-500
                    to-amber-400
                    opacity-0
                    transition-opacity
                    duration-300
                    group-hover:opacity-100
                  "
                />

                {/* CARD HEADER */}

                <div className="flex items-start justify-between">

                  <div
                    style={{
                      backgroundColor: card.backgroundColor,
                    }}
                    className="
                      flex
                      h-11
                      w-11
                      items-center
                      justify-center
                      rounded-xl
                      text-white
                      shadow-md
                      ring-4
                      ring-slate-50
                      transition-transform
                      duration-300
                      group-hover:scale-105
                      dark:ring-slate-800
                    "
                  >
                    <FontAwesomeIcon
                      icon={card.icon}
                      className="text-lg"
                    />
                  </div>

                  <div
                    className="
                      flex
                      h-8
                      w-8
                      items-center
                      justify-center
                      rounded-lg
                      bg-slate-50
                      text-slate-400
                      transition-all
                      group-hover:bg-blue-600
                      group-hover:text-white
                      dark:bg-slate-800
                      dark:text-slate-500
                    "
                  >
                    <FontAwesomeIcon
                      icon={faArrowUpRightFromSquare}
                      className="text-[10px]"
                    />
                  </div>
                </div>

                {/* VALUE */}

                <div className="mt-5">

                  <div className="flex items-center justify-between gap-2">

                    <p
                      className="
                        truncate
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-400
                        dark:text-slate-500
                      "
                    >
                      {card.title}
                    </p>

                    {/* EVOLUTION */}

                    <span
                      className="
                        inline-flex
                        shrink-0
                        items-center
                        gap-1
                        text-[10px]
                        font-bold
                        text-emerald-600
                        dark:text-emerald-400
                      "
                    >
                      <FontAwesomeIcon
                        icon={faArrowTrendUp}
                        className="text-[9px]"
                      />

                      +0.0%
                    </span>
                  </div>

                  <h3
                    className="
                      mt-2
                      truncate
                      text-2xl
                      font-black
                      tracking-tight
                      text-slate-900
                      transition-colors
                      group-hover:text-blue-600
                      sm:text-3xl
                      dark:text-white
                      dark:group-hover:text-blue-400
                    "
                  >
                    {formatCardValue(
                      card.title,
                      card.value
                    )}
                  </h3>
                </div>

                {/* FOOTER */}

                <div
                  className="
                    mt-5
                    flex
                    items-center
                    justify-between
                    border-t
                    border-slate-100
                    pt-3
                    dark:border-slate-800
                  "
                >
                  <span
                    className="
                      text-[10px]
                      font-semibold
                      text-slate-400
                      transition-colors
                      group-hover:text-blue-600
                      dark:group-hover:text-blue-400
                    "
                  >
                    Consulter les données
                  </span>

                  <span
                    className="
                      text-xs
                      font-bold
                      text-slate-300
                      transition-transform
                      group-hover:translate-x-1
                      group-hover:text-blue-600
                      dark:text-slate-600
                      dark:group-hover:text-blue-400
                    "
                  >
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
          <section
            className="
              overflow-hidden
              rounded-2xl
              border
              border-slate-200/80
              bg-white/80
              shadow-sm
              dark:border-slate-800
              dark:bg-slate-900/80
            "
          >
            {/* HEADER */}

            <div
              className="
                flex
                flex-col
                gap-3
                border-b
                border-slate-100
                bg-slate-50/50
                px-4
                py-4
                sm:flex-row
                sm:items-center
                sm:justify-between
                sm:px-5
                dark:border-slate-800
                dark:bg-slate-900/50
              "
            >
              <div className="flex items-center gap-3">

                <div
                  className="
                    flex
                    h-10
                    w-10
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-blue-500/20
                    bg-blue-600/10
                    text-blue-600
                    shadow-inner
                    dark:text-blue-400
                  "
                >
                  <FontAwesomeIcon
                    icon={faChartPie}
                    className="text-sm"
                  />
                </div>

                <div>

                  <h2
                    className="
                      flex
                      items-center
                      gap-2
                      text-sm
                      font-black
                      tracking-tight
                      text-slate-900
                      sm:text-base
                      dark:text-white
                    "
                  >
                    Analyse des gains & performances

                    <FontAwesomeIcon
                      icon={faWandMagicSparkles}
                      className="text-[10px] text-amber-400"
                    />
                  </h2>

                  <p className="mt-0.5 text-[10px] font-medium text-slate-500 dark:text-slate-400">
                    Rapports financiers, métriques de rendement et tendances annuelles.
                  </p>
                </div>
              </div>

              {/* YEAR */}

              <div
                className="
                  flex
                  items-center
                  gap-2
                  self-start
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-1.5
                  text-[10px]
                  font-bold
                  text-slate-500
                  sm:self-auto
                  dark:border-slate-700
                  dark:bg-slate-800
                  dark:text-slate-300
                "
              >
                <FontAwesomeIcon
                  icon={faCalendarDays}
                  className="text-blue-500"
                />

                Exercice {new Date().getFullYear()}
              </div>
            </div>

            {/* =================================================
                NE PAS TOUCHER
            ================================================= */}

            <div className="p-4 sm:p-6 lg:p-7">
              <GetAnnualGain />
            </div>

          </section>
        )}

      </div>
    </div>
  );
}