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
} from "@fortawesome/free-solid-svg-icons";

import useAuth from "./auth";
import Cell from "./Cell";
import ResetPassword from "./auth/ResetPassword";
import useResetPassword from "./auth/useResetPassword";

/* ---------------------------------------------------------------
   DONNÉES
--------------------------------------------------------------- */
const ROW_HEIGHT = 64; // = h-16, doit rester synchronisé avec la sélection

const FEATURES = [
  {
    icon: faChartColumn,
    title: "Tableau de bord",
    text: "Vue d'ensemble de votre activité",
  },
  {
    icon: faUsers,
    title: "Gestion des équipes",
    text: "Organisez et suivez vos collaborateurs",
  },
  {
    icon: faGear,
    title: "Gestion des ressources",
    text: "Optimisez vos outils et budgets",
  },
  {
    icon: faShieldHalved,
    title: "Sécurité des données",
    text: "Vos informations toujours protégées",
  },
];

const COLUMNS = "ABCDEFGHIJKLMNOPQRST".split("");

/* ---------------------------------------------------------------
   APERÇU DU TABLEAU DE BORD
--------------------------------------------------------------- */
function MiniDashboard() {
  const kpis = [
    ["Chiffre d'affaires", "2 540 000 FCFA", "↑ 12%"],
    ["Commandes", "128", "↑ 8%"],
    ["Utilisateurs", "24", "↑ 5%"],
  ];
  const menu = ["Entreprises", "Produits", "Commandes", "Utilisateurs", "Paramètres"];

  return (
    <div
      aria-hidden="true"
      className="hidden w-[400px] overflow-hidden rounded-xl border border-white/20 bg-white/95 shadow-2xl backdrop-blur-xl 2xl:block"
    >
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
            <span className="text-xs font-black text-white">L</span>
          </div>
          <span className="text-sm font-bold text-slate-800">LRCSheet</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-slate-200" />
          <div>
            <p className="text-[10px] font-semibold text-slate-700">
              Bonjour, Administrateur
            </p>
            <p className="text-[9px] text-slate-400">Admin</p>
          </div>
        </div>
      </div>

      <div className="flex">
        <div className="w-[96px] border-r border-slate-100 bg-slate-50 p-3">
          <div className="mb-3 rounded-md bg-blue-600 px-2 py-1.5">
            <span className="text-[9px] font-semibold text-white">
              Tableau de bord
            </span>
          </div>
          <div className="space-y-2.5">
            {menu.map((item) => (
              <div key={item} className="px-2 text-[9px] font-medium text-slate-500">
                {item}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 p-3">
          <div className="grid grid-cols-3 gap-2">
            {kpis.map(([label, value, delta]) => (
              <div key={label} className="rounded-md border border-slate-100 bg-white p-2">
                <p className="text-[8px] text-slate-400">{label}</p>
                <p className="mt-1 whitespace-nowrap text-[10px] font-bold tabular-nums tracking-tight text-slate-800">
                  {value}
                </p>
                <p className="mt-1 text-[8px] font-semibold text-emerald-500">{delta}</p>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-md border border-slate-100 bg-white p-3">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-slate-700">Évolution des ventes</p>
              <span className="text-[8px] text-slate-400">2026</span>
            </div>
            <div className="relative mt-3 h-16">
              <div className="absolute inset-x-0 top-1/4 border-t border-slate-100" />
              <div className="absolute inset-x-0 top-2/4 border-t border-slate-100" />
              <div className="absolute inset-x-0 top-3/4 border-t border-slate-100" />
              <svg
                viewBox="0 0 350 80"
                className="absolute inset-0 h-full w-full"
                preserveAspectRatio="none"
              >
                <polyline
                  points="0,65 30,52 60,60 90,40 120,47 150,30 180,40 210,20 240,32 270,14 300,22 330,5 350,12"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  className="text-blue-600"
                />
              </svg>
            </div>
            <div className="mt-2 flex justify-between text-[7px] text-slate-400">
              <span>Jan</span>
              <span>Fév</span>
              <span>Mar</span>
              <span>Avr</span>
              <span>Mai</span>
              <span>Juin</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------
   PAGE
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

  // Ligne actuellement « sélectionnée » dans la feuille de droite
  const [active, setActive] = useState(0);

  // "login" | "reset" : on reste sur la même page, seul le panneau change
  const [view, setView] = useState("login");
  const reset = useResetPassword();

  const openReset = () => {
    reset.restart(inputs.email);
    setView("reset");
  };

  const backToLogin = () => {
    const resetEmail = reset.email;
    reset.restart();
    if (resetEmail) setInputs({ ...inputs, email: resetEmail });
    setView("login");
  };

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(
      () => setActive((i) => (i + 1) % FEATURES.length),
      2800
    );
    return () => clearInterval(id);
  }, []);

  const handleSubmit = () => {
    authFunction();
  };

  return (
    <main className="min-h-screen w-full bg-white">
      {/* =========================================================
          NOTIFICATION
      ========================================================= */}
      <div
        role="alert"
        aria-live="assertive"
        className={`
          fixed left-4 right-4 top-4 z-[100]
          sm:left-auto sm:right-6 sm:w-[420px]
          overflow-hidden rounded-xl
          transition-all duration-500
          ${message
            ? "max-h-32 translate-y-0 opacity-100"
            : "pointer-events-none max-h-0 -translate-y-4 opacity-0"
          }
        `}
      >
        <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 shadow-xl ring-1 ring-red-200">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
            <span className="text-sm font-bold text-red-600">!</span>
          </div>
          <div>
            <p className="text-sm font-bold text-red-800">Échec de connexion</p>
            <p className="mt-1 text-xs leading-5 text-red-600">{message}</p>
          </div>
        </div>
      </div>

      <div className="flex min-h-screen w-full">
        {/* =========================================================
            PARTIE GAUCHE — PRÉSENTATION (feuille de calcul)
        ========================================================= */}
        <section className="relative hidden min-h-screen flex-1 overflow-hidden bg-slate-950 lg:block">
          {/* Image de fond */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('/images/businessman.png')" }}
          />
          {/* Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/95 via-blue-950/80 to-blue-900/60" />

          {/* Quadrillage de tableur */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage:
                "linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />

          {/* En-têtes de colonnes */}
          <div className="absolute inset-x-0 top-0 flex h-7 overflow-hidden border-b border-white/10 bg-slate-950/40">
            {COLUMNS.map((c) => (
              <div
                key={c}
                className="h-7 w-16 shrink-0 border-l border-white/10 text-center text-[10px] leading-7 text-white/30"
              >
                {c}
              </div>
            ))}
          </div>

          {/* Contenu */}
          <div className="relative z-10 flex min-h-screen flex-col justify-between px-10 pb-12 pt-20 xl:px-16">
            {/* Haut : badge + titre */}
            <div>
              <div className="mb-10 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />
                <span className="text-xs font-medium text-blue-100">
                  Solution professionnelle de gestion
                </span>
              </div>

              <div className="max-w-2xl">
                <h2 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-5xl">
                  Gérez votre entreprise
                  <br />
                  <span className="text-blue-400">de manière professionnelle</span>
                </h2>

                <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 xl:text-lg">
                  Suivez vos activités, faites la gestion de vos collaborateurs,
                  optimisez vos ressources et faites grandir votre entreprise.
                </p>
              </div>
            </div>

            {/* Bas : fonctionnalités (lignes de la feuille) + aperçu */}
            <div className="mt-12 grid items-end gap-10 2xl:grid-cols-[minmax(0,1fr)_400px]">
              <ul className="relative max-w-md border-t border-white/10">
                {FEATURES.map((f, i) => (
                  <li
                    key={f.title}
                    onMouseEnter={() => setActive(i)}
                    style={{ height: ROW_HEIGHT }}
                    className="flex items-center gap-4 border-b border-white/10 px-4"
                  >
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md transition-colors duration-500 ${active === i
                        ? "bg-blue-600 shadow-lg shadow-blue-900/40"
                        : "bg-white/10"
                        }`}
                    >
                      <FontAwesomeIcon icon={f.icon} className="text-sm text-white" />
                    </div>
                    <div>
                      <h3
                        className={`text-sm font-bold transition-colors duration-500 ${active === i ? "text-white" : "text-white/70"
                          }`}
                      >
                        {f.title}
                      </h3>
                      <p className="mt-0.5 text-xs text-slate-300">{f.text}</p>
                    </div>
                  </li>
                ))}

                {/* Rectangle de sélection, qui se déplace de ligne en ligne */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 w-full border-2 border-blue-400 bg-blue-500/10 transition-transform duration-700 ease-out motion-reduce:transition-none"
                  style={{
                    height: ROW_HEIGHT,
                    transform: `translateY(${active * ROW_HEIGHT}px)`,
                  }}
                >
                  <span className="absolute -bottom-[7px] -right-[7px] h-2.5 w-2.5 border border-white bg-blue-400" />
                </div>
              </ul>

              <MiniDashboard />
            </div>
          </div>
        </section>

        {/* =========================================================
            PARTIE DROITE — CONNEXION
        ========================================================= */}
        <section className="flex min-h-screen w-full flex-col bg-white px-6 py-8 sm:px-12 lg:w-[44%] lg:max-w-[640px] lg:px-14 xl:px-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-lg shadow-blue-600/20 ring-1 ring-slate-100">
              <img
                src="/images/logo.png"
                alt="LRCSheet"
                className="h-8 w-8 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-extrabold tracking-tight text-slate-900">
                LRCSheet
              </h1>
              <p className="text-[11px] font-medium text-slate-400">
                Enterprise Management
              </p>
            </div>
          </div>

          {/* Bloc formulaire */}
          <div className="flex flex-1 items-center py-10">
            <div className="w-full max-w-[420px]">
              {view === "reset" ? (
                <ResetPassword r={reset} onBack={backToLogin} />
              ) : (
                <>
                  <div className="mb-8">
                    <span className="mb-4 inline-flex items-center gap-2 rounded-md bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                      <FontAwesomeIcon icon={faShieldHalved} className="text-[11px]" />
                      Espace sécurisé
                    </span>

                    <h2 className="text-3xl font-extrabold tracking-tight text-amber-500 sm:text-[2rem]">
                      Bienvenue, administrateur
                    </h2>

                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      Connectez-vous à votre espace d’administration pour accéder au
                      tableau de bord LRCSheet.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-4">
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
                        onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
                        required
                        autoComplete="email"
                        placeholder="admin@lrcsheet.com"
                        className="block w-full rounded-b-lg bg-transparent py-3 pl-10 pr-4 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
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
                          className="text-xs font-semibold text-blue-600 transition hover:text-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
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
                        onChange={(e) =>
                          setInputs({ ...inputs, password: e.target.value })
                        }
                        required
                        autoComplete="current-password"
                        placeholder="Votre mot de passe"
                        className="block w-full rounded-b-lg bg-transparent py-3 pl-10 pr-12 text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? "Masquer le mot de passe"
                            : "Afficher le mot de passe"
                        }
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
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
                        className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-blue-600"
                      />
                      <span className="text-xs font-medium text-slate-500 transition group-hover:text-slate-700">
                        Se souvenir de moi
                      </span>
                    </label>

                    {/* BOUTON */}
                    <button onClick={handleSubmit}
                      type="button"
                      disabled={showSpinner}
                      className="
                    group flex w-full items-center justify-center gap-3
                    rounded-lg bg-blue-600 px-5 py-3.5
                    text-sm font-bold text-white
                    shadow-lg shadow-blue-600/20
                    transition-all duration-300
                    hover:bg-blue-700 hover:shadow-xl hover:shadow-blue-600/25
                    focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600
                    active:scale-[0.99]
                    disabled:cursor-not-allowed disabled:opacity-60
                  "
                    >
                      {showSpinner ? (
                        <>
                          <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
                          <span>Connexion en cours...</span>
                        </>
                      ) : (
                        <>
                          <span>Accéder au tableau de bord</span>
                          <FontAwesomeIcon
                            icon={faArrowRightToBracket}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
