
"use client";

import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEyeSlash,
  faSpinner,
  faEnvelope,
  faLock,
  faArrowRightToBracket,
  faChartColumn,
  faUsers,
  faGear,
  faShieldHalved,
  faCheck,
  faCircleCheck,
  faArrowTrendUp,
} from "@fortawesome/free-solid-svg-icons";

import useAuth from "./auth";
import Cell from "./Cell";
import ResetPassword from "./auth/ResetPassword";
import useResetPassword from "./auth/useResetPassword";

const ROW_HEIGHT = 76;

const FEATURES = [
  {
    icon: faChartColumn,
    title: "Tableau de bord",
    text: "Une vision claire de vos performances",
  },
  {
    icon: faUsers,
    title: "Gestion des équipes",
    text: "Pilotez vos collaborateurs au quotidien",
  },
  {
    icon: faGear,
    title: "Gestion des ressources",
    text: "Optimisez vos moyens et vos activités",
  },
  {
    icon: faShieldHalved,
    title: "Sécurité des données",
    text: "Vos informations protégées en permanence",
  },
];

const COLUMNS = "ABCDEFGHIJKLMNOPQRST".split("");

/* ---------------------------------------------------------------
   APERÇU DU TABLEAU DE BORD
--------------------------------------------------------------- */

function MiniDashboard() {
  const kpis = [
    {
      label: "Chiffre d'affaires",
      value: "2 540 000",
      unit: "FCFA",
      trend: "+12%",
    },
    {
      label: "Commandes",
      value: "128",
      unit: "",
      trend: "+8%",
    },
    {
      label: "Utilisateurs",
      value: "24",
      unit: "",
      trend: "+5%",
    },
  ];

  const menu = [
    "Entreprises",
    "Produits",
    "Commandes",
    "Utilisateurs",
    "Paramètres",
  ];

  return (
    <div
      aria-hidden="true"
      className="
        hidden w-full max-w-[430px] overflow-hidden
        rounded-2xl border border-white/50
        bg-white shadow-[0_30px_90px_rgba(0,0,0,0.25)]
        2xl:block
      "
    >
      {/* Barre supérieure */}
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#359ADE]">
            <span className="text-sm font-black text-white">L</span>
          </div>

          <div>
            <p className="text-sm font-extrabold tracking-tight text-slate-800">
              LRCSheet
            </p>
            <p className="text-[9px] font-medium text-slate-400">
              MANAGEMENT PLATFORM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-medium text-slate-500">
            Système opérationnel
          </span>
        </div>
      </div>

      <div className="flex min-h-[280px]">
        {/* Navigation */}
        <aside className="w-[112px] shrink-0 border-r border-slate-100 bg-slate-50/80 p-3">
          <p className="mb-3 px-2 text-[8px] font-bold uppercase tracking-widest text-slate-400">
            Menu
          </p>

          <div className="mb-2 rounded-lg bg-[#359ADE] px-2 py-2.5 text-[9px] font-semibold text-white shadow-md shadow-blue-500/20">
            Tableau de bord
          </div>

          <div className="space-y-1.5">
            {menu.map((item) => (
              <div
                key={item}
                className="rounded-lg px-2 py-2 text-[9px] font-medium text-slate-500"
              >
                {item}
              </div>
            ))}
          </div>
        </aside>

        {/* Contenu */}
        <div className="min-w-0 flex-1 bg-[#FAFCFE] p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold text-slate-800">
                Vue d'ensemble
              </p>
              <p className="mt-0.5 text-[8px] text-slate-400">
                Bienvenue sur votre espace
              </p>
            </div>

            <div className="h-7 w-7 rounded-full border-2 border-white bg-slate-200 shadow-sm" />
          </div>

          {/* KPI */}
          <div className="grid grid-cols-3 gap-2">
            {kpis.map((item) => (
              <div
                key={item.label}
                className="min-w-0 rounded-xl border border-slate-100 bg-white p-2.5 shadow-sm"
              >
                <p className="truncate text-[8px] font-medium text-slate-400">
                  {item.label}
                </p>

                <p className="mt-2 whitespace-nowrap text-[11px] font-extrabold tracking-tight text-slate-800">
                  {item.value}
                </p>

                {item.unit && (
                  <p className="text-[7px] text-slate-400">{item.unit}</p>
                )}

                <p className="mt-1.5 flex items-center gap-1 text-[8px] font-bold text-emerald-500">
                  <FontAwesomeIcon icon={faArrowTrendUp} />
                  {item.trend}
                </p>
              </div>
            ))}
          </div>

          {/* Graphique */}
          <div className="mt-3 rounded-xl border border-slate-100 bg-white p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[9px] font-bold text-slate-700">
                  Évolution des ventes
                </p>
                <p className="mt-0.5 text-[8px] text-slate-400">
                  Performance annuelle
                </p>
              </div>

              <span className="rounded-md bg-blue-50 px-2 py-1 text-[8px] font-bold text-[#359ADE]">
                2026
              </span>
            </div>

            <div className="relative mt-3 h-[76px]">
              <div className="absolute inset-x-0 top-1/4 border-t border-dashed border-slate-100" />
              <div className="absolute inset-x-0 top-2/4 border-t border-dashed border-slate-100" />
              <div className="absolute inset-x-0 top-3/4 border-t border-dashed border-slate-100" />

              <svg
                viewBox="0 0 350 80"
                className="absolute inset-0 h-full w-full overflow-visible"
                preserveAspectRatio="none"
              >
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#359ADE" stopOpacity="0.25" />
                    <stop offset="100%" stopColor="#359ADE" stopOpacity="0" />
                  </linearGradient>
                </defs>

                <path
                  d="M0 65 L30 52 L60 60 L90 40 L120 47 L150 30 L180 40 L210 20 L240 32 L270 14 L300 22 L330 5 L350 12 L350 80 L0 80 Z"
                  fill="url(#salesGradient)"
                />

                <polyline
                  points="0,65 30,52 60,60 90,40 120,47 150,30 180,40 210,20 240,32 270,14 300,22 330,5 350,12"
                  fill="none"
                  stroke="#359ADE"
                  strokeWidth="2.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="mt-2 flex justify-between text-[7px] font-medium text-slate-400">
              {["Jan", "Fév", "Mar", "Avr", "Mai", "Juin"].map((month) => (
                <span key={month}>{month}</span>
              ))}
            </div>
          </div>

          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2">
            <FontAwesomeIcon
              icon={faCircleCheck}
              className="text-[10px] text-emerald-500"
            />
            <span className="text-[8px] font-semibold text-emerald-700">
              Toutes les activités sont synchronisées
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   PAGE DE CONNEXION
--------------------------------------------------------------- */

export default function Home() {
  const {
    showPassword,
    setShowPassword,
    showSpinner,
    inputs,
    setInputs,
    authFunction,
    message,
    invalidInput,
  } = useAuth();

  const [active, setActive] = useState(0);
  const [view, setView] = useState<"login" | "reset">("login");

  const reset = useResetPassword();

  const openReset = () => {
    reset.restart(inputs.email);
    setView("reset");
  };

  const backToLogin = () => {
    const resetEmail = reset.email;

    reset.restart();

    if (resetEmail) {
      setInputs({ ...inputs, email: resetEmail });
    }

    setView("login");
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const interval = window.setInterval(() => {
      setActive((current) => (current + 1) % FEATURES.length);
    }, 3200);

    return () => window.clearInterval(interval);
  }, []);

  const handleSubmit = (event: { preventDefault: () => void }) => {
    event.preventDefault();
    if (!showSpinner) authFunction();
  };

  return (
    <main className="min-h-screen w-full overflow-hidden bg-white">
      {/* ---------------------------------------------------------
          NOTIFICATION
      --------------------------------------------------------- */}
      <div
        role="alert"
        aria-live="assertive"
        className={`
          fixed left-4 right-4 top-4 z-[100]
          sm:left-auto sm:right-6 sm:w-[420px]
          overflow-hidden rounded-2xl
          transition-all duration-500
          ${
            message
              ? "max-h-40 translate-y-0 opacity-100"
              : "pointer-events-none max-h-0 -translate-y-4 opacity-0"
          }
        `}
      >
        <div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-white p-4 shadow-2xl shadow-red-900/10">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50">
            <span className="text-lg font-black text-red-500">!</span>
          </div>

          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-900">
              Échec de connexion
            </p>
            <p className="mt-1 text-xs leading-5 text-slate-500">
              {message}
            </p>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen w-full">
        {/* =========================================================
            PARTIE GAUCHE — PRÉSENTATION
        ========================================================= */}
        <section
          className="
            relative hidden min-h-screen flex-1 overflow-hidden
            bg-[#102C46] lg:flex lg:flex-col
          "
        >
          {/* Image de fond */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/images/businessman.png')",
            }}
          />

          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#102C46]/95 via-[#163D5C]/90 to-[#16324F]/80" />

          {/* Lumières décoratives */}
          <div className="pointer-events-none absolute -left-40 top-1/4 h-[500px] w-[500px] rounded-full bg-[#359ADE]/10 blur-[100px]" />
          <div className="pointer-events-none absolute -right-32 bottom-0 h-[450px] w-[450px] rounded-full bg-[#FFAB02]/10 blur-[100px]" />

          {/* Quadrillage */}
          <div
            className="absolute inset-0 opacity-50"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.045) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          {/* En-têtes de colonnes */}
          <div className="absolute inset-x-0 top-0 flex h-8 overflow-hidden border-b border-white/10 bg-[#102C46]/30">
            {COLUMNS.map((column) => (
              <div
                key={column}
                className="h-8 w-16 shrink-0 border-l border-white/10 text-center text-[10px] leading-8 text-white/30"
              >
                {column}
              </div>
            ))}
          </div>

          {/* Contenu */}
          <div className="relative z-10 flex min-h-screen flex-col justify-between px-8 pb-10 pt-20 xl:px-14 2xl:px-16">
            {/* Présentation */}
            <div>
              <div className="mb-9 inline-flex items-center gap-2.5 rounded-full border border-white/15 bg-white/[0.08] px-4 py-2.5 shadow-lg backdrop-blur-md">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#FFAB02] opacity-60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[#FFAB02]" />
                </span>

                <span className="text-[11px] font-semibold tracking-wide text-white/90">
                  Votre plateforme de gestion professionnelle
                </span>
              </div>

              <div className="max-w-2xl">
                <h2 className="text-4xl font-black leading-[1.14] tracking-tight text-white xl:text-[3.4rem]">
                  Prenez le contrôle
                  <br />
                  de votre entreprise
                  <br />
                  <span className="text-[#FFAB02]">
                    avec LRCSheet.
                  </span>
                </h2>

                <p className="mt-6 max-w-xl text-sm leading-7 text-blue-100/80 xl:text-base">
                  Une solution intelligente pour piloter vos activités,
                  organiser vos équipes et gérer efficacement vos ressources
                  au sein d&apos;une plateforme unique.
                </p>
              </div>

              {/* Points forts */}
              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3">
                {[
                  "Gestion centralisée",
                  "Suivi en temps réel",
                  "Données sécurisées",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2 text-[11px] font-medium text-white/80"
                  >
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400/15 text-emerald-300">
                      <FontAwesomeIcon icon={faCheck} className="text-[9px]" />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Fonctionnalités + aperçu */}
            <div className="mt-12 grid items-end gap-8 2xl:grid-cols-[minmax(0,1fr)_430px]">
              <div className="min-w-0">
                <div className="mb-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#FFAB02]">
                    Un environnement complet
                  </p>
                  <p className="mt-1 text-sm font-semibold text-white/90">
                    Tout ce dont vous avez besoin
                  </p>
                </div>

                <ul className="relative max-w-md border-t border-white/10">
                  {FEATURES.map((feature, index) => (
                    <li
                      key={feature.title}
                      onMouseEnter={() => setActive(index)}
                      style={{ height: ROW_HEIGHT }}
                      className="flex cursor-default items-center gap-4 border-b border-white/10 px-3 transition-colors"
                    >
                      <div
                        className={`
                          flex h-10 w-10 shrink-0 items-center justify-center
                          rounded-xl transition-all duration-500
                          ${
                            active === index
                              ? "bg-[#359ADE] shadow-lg shadow-blue-900/40"
                              : "border border-white/10 bg-white/[0.07]"
                          }
                        `}
                      >
                        <FontAwesomeIcon
                          icon={feature.icon}
                          className="text-sm text-white"
                        />
                      </div>

                      <div className="min-w-0">
                        <h3
                          className={`text-sm font-bold transition-colors duration-300 ${
                            active === index
                              ? "text-white"
                              : "text-white/65"
                          }`}
                        >
                          {feature.title}
                        </h3>

                        <p className="mt-1 text-[11px] text-blue-100/60">
                          {feature.text}
                        </p>
                      </div>
                    </li>
                  ))}

                  {/* Sélection animée */}
                  <div
                    aria-hidden="true"
                    className="
                      pointer-events-none absolute left-0 top-0 w-full
                      border border-[#359ADE]/80 bg-[#359ADE]/10
                      transition-transform duration-700 ease-out
                      motion-reduce:transition-none
                    "
                    style={{
                      height: ROW_HEIGHT,
                      transform: `translateY(${active * ROW_HEIGHT}px)`,
                    }}
                  >
                    <span className="absolute -bottom-[5px] -right-[5px] h-2.5 w-2.5 rounded-sm border border-white bg-[#FFAB02]" />
                  </div>
                </ul>
              </div>

              <MiniDashboard />
            </div>

            {/* Pied de page */}
            <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-5">
              <p className="text-[10px] font-medium tracking-wide text-white/45">
                LRCSheet — Enterprise Management
              </p>

              <p className="text-[10px] text-white/45">
                Une gestion plus simple. Une entreprise plus performante.
              </p>
            </div>
          </div>
        </section>

        {/* =========================================================
            PARTIE DROITE — CONNEXION
        ========================================================= */}
        <section
          className="
            relative flex min-h-screen w-full flex-col
            overflow-hidden bg-white
            px-6 py-7 sm:px-10
            lg:w-[44%] lg:max-w-[650px] lg:flex-none
            lg:px-12 lg:py-10 xl:px-16
          "
        >
          {/* Décoration discrète */}
          <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-[#359ADE]/[0.06] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#FFAB02]/[0.06] blur-3xl" />

          {/* Logo */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-slate-100 bg-white shadow-lg shadow-slate-900/[0.06]">
                <img
                  src="/images/logo.png"
                  alt="LRCSheet"
                  className="h-9 w-9 object-contain"
                />
              </div>

              <div>
                <h1 className="text-xl font-black tracking-tight text-[#16324F]">
                  LRCSheet
                </h1>
                <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">
                  Enterprise Management
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-2 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-semibold text-emerald-700">
                Espace sécurisé
              </span>
            </div>
          </div>

          {/* Formulaire */}
          <div className="relative z-10 flex flex-1 items-center justify-center py-12">
            <div className="w-full max-w-[420px]">
              {view === "reset" ? (
                <ResetPassword r={reset} onBack={backToLogin} />
              ) : (
                <>
                  {/* En-tête */}
                  <div className="mb-9">
                    <div className="mb-5 inline-flex items-center gap-2 rounded-lg border border-[#359ADE]/15 bg-[#359ADE]/[0.07] px-3 py-2">
                      <FontAwesomeIcon
                        icon={faShieldHalved}
                        className="text-xs text-[#359ADE]"
                      />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#359ADE]">
                        Accès sécurisé
                      </span>
                    </div>

                    <h2 className="text-3xl font-black leading-tight tracking-tight text-[#16324F] sm:text-[2.15rem]">
                      Bienvenue
                      <span className="text-[#FFAB02]"> !</span>
                    </h2>

                    <p className="mt-3 max-w-sm text-sm leading-6 text-slate-500">
                      Connectez-vous à votre espace d&apos;administration
                      pour accéder à toutes vos fonctionnalités.
                    </p>
                  </div>

                  {/* Formulaire de connexion */}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    {/* E-MAIL */}
                    <Cell
                      label="Adresse e-mail"
                      icon={faEnvelope}
                      error={invalidInput.email}
                    >
                      <input
                        id="email"
                        name="email"
                        type="email"
                        value={inputs.email}
                        onChange={(event) =>
                          setInputs({
                            ...inputs,
                            email: event.target.value,
                          })
                        }
                        required
                        autoComplete="email"
                        placeholder="admin@lrcsheet.com"
                        className="
                          block w-full rounded-b-lg bg-transparent
                          py-3.5 pl-10 pr-4 text-sm font-medium
                          text-[#16324F] outline-none
                          placeholder:font-normal placeholder:text-slate-400
                        "
                      />
                    </Cell>

                    {/* MOT DE PASSE */}
                    <Cell
                      label="Mot de passe"
                      icon={faLock}
                      error={invalidInput.password}
                      action={
                        <button
                          type="button"
                          onClick={openReset}
                          className="
                            text-[11px] font-bold text-[#359ADE]
                            transition-colors hover:text-[#16324F]
                            focus-visible:outline-none focus-visible:underline
                          "
                        >
                          Mot de passe oublié ?
                        </button>
                      }
                    >
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={inputs.password}
                        onChange={(event) =>
                          setInputs({
                            ...inputs,
                            password: event.target.value,
                          })
                        }
                        required
                        autoComplete="current-password"
                        placeholder="Votre mot de passe"
                        className="
                          block w-full rounded-b-lg bg-transparent
                          py-3.5 pl-10 pr-12 text-sm font-medium
                          text-[#16324F] outline-none
                          placeholder:font-normal placeholder:text-slate-400
                        "
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                        className="
                          absolute right-2 top-1/2
                          -translate-y-1/2 rounded-lg p-2
                          text-slate-400 transition-all
                          hover:bg-slate-100 hover:text-[#359ADE]
                          focus-visible:outline-none focus-visible:ring-2
                          focus-visible:ring-[#359ADE]/40
                        "
                      >
                        <FontAwesomeIcon
                          icon={showPassword ? faEyeSlash : faEye}
                          className="text-sm"
                        />
                      </button>
                    </Cell>

                    {/* SE SOUVENIR */}
                    <label className="group flex w-fit cursor-pointer items-center gap-2.5 pt-1">
                      <input
                        type="checkbox"
                        className="
                          h-4 w-4 cursor-pointer rounded
                          border-slate-300 accent-[#359ADE]
                          focus:ring-2 focus:ring-[#359ADE]/30
                        "
                      />

                      <span className="text-xs font-medium text-slate-500 transition-colors group-hover:text-[#16324F]">
                        Se souvenir de moi
                      </span>
                    </label>

                    {/* BOUTON */}
                    <button
                      type="submit"
                      disabled={showSpinner}
                      className="
                        group relative flex w-full items-center
                        justify-center gap-3 overflow-hidden
                        rounded-xl bg-[#359ADE] px-5 py-4
                        text-sm font-bold text-white
                        shadow-lg shadow-[#359ADE]/20
                        transition-all duration-300
                        hover:-translate-y-0.5 hover:bg-[#2589CC]
                        hover:shadow-xl hover:shadow-[#359ADE]/30
                        focus-visible:outline-none focus-visible:ring-4
                        focus-visible:ring-[#359ADE]/25
                        active:translate-y-0
                        disabled:cursor-not-allowed disabled:opacity-60
                        disabled:hover:translate-y-0
                      "
                    >
                      <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />

                      {showSpinner ? (
                        <>
                          <FontAwesomeIcon
                            icon={faSpinner}
                            className="animate-spin"
                          />
                          <span>Connexion en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Accéder à mon espace</span>
                          <FontAwesomeIcon
                            icon={faArrowRightToBracket}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Sécurité */}
                  <div className="mt-8 flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
                      <FontAwesomeIcon
                        icon={faShieldHalved}
                        className="text-sm text-emerald-600"
                      />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#16324F]">
                        Votre sécurité est notre priorité
                      </p>
                      <p className="mt-1 text-[11px] leading-5 text-slate-500">
                        Vos accès et vos données sont traités dans un
                        environnement sécurisé.
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Pied de page */}
          <footer className="relative z-10 border-t border-slate-100 pt-5">
            <div className="flex flex-col items-center justify-between gap-2 text-center sm:flex-row sm:text-left">
              <p className="text-[10px] font-medium text-slate-400">
                © {new Date().getFullYear()} LRCSheet. Tous droits réservés.
              </p>

              <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Plateforme sécurisée
              </div>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
}
