"use client";

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

  return (
    <main className="min-h-screen w-full bg-slate-50 overflow-hidden">
      <div className="flex min-h-screen w-full">

        {/* =========================================================
            PARTIE GAUCHE — FORMULAIRE DE CONNEXION
        ========================================================= */}
      {/* =========================================================
    AUTHENTIFICATION ADMIN LRCSHEET
========================================================= */}
<section className="relative flex min-h-screen w-full items-center justify-center bg-slate-100 px-5 py-10 sm:px-8 lg:w-[48%] xl:w-[45%]">

  {/* =======================================================
      NOTIFICATION
  ======================================================= */}
  <div
    className={`
      fixed left-4 right-4 top-4 z-[100]
      sm:left-auto sm:right-6 sm:w-[420px]
      overflow-hidden rounded-xl
      transition-all duration-500
      ${
        message
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
        <p className="text-sm font-bold text-red-800">
          Échec de connexion
        </p>

        <p className="mt-1 text-xs leading-5 text-red-600">
          {message}
        </p>
      </div>

    </div>
  </div>


  {/* =======================================================
      CARD PRINCIPALE
  ======================================================= */}
  <div className="w-full max-w-[460px]">

    <div
      className="
        overflow-hidden
        rounded-2xl
        border border-slate-200
        bg-white
        shadow-[0_20px_60px_-15px_rgba(15,23,42,0.15)]
      "
    >

      {/* =====================================================
          HEADER CARD
      ===================================================== */}
      <div className="border-b border-slate-100 px-7 py-7 sm:px-9">

        <div className="flex items-center justify-between">

          {/* LOGO */}
          <div className="flex items-center gap-3">

            <div
              className="
                flex h-11 w-11
                items-center justify-center
                rounded-xl
                bg-white
                shadow-lg
                shadow-blue-600/20
              "
            >
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


          {/* BADGE ADMIN */}
          {/* <div
            className="
              hidden sm:flex
              items-center gap-2
              rounded-full
              border border-blue-100
              bg-blue-50
              px-3 py-1.5
            "
          >
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />

            <span className="text-[10px] font-bold uppercase tracking-wide text-blue-700">
              Admin
            </span>
          </div> */}
        </div>
      </div>


      {/* =====================================================
          CONTENU FORMULAIRE
      ===================================================== */}
      <div className="px-7 py-8 sm:px-9 sm:py-9">

        {/* TITRE */}
        <div className="mb-8">

          <div className="mb-3 flex items-center gap-2">

            <div className="h-1 w-7 rounded-full bg-blue-600" />

            <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-blue-600">
              Espace sécurisé
            </span>

          </div>

          <h2 className="text-2xl font-extrabold tracking-tight text-amber-500 sm:text-3xl">
            Bienvenue, administrateur
          </h2>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Connectez-vous à votre espace d’administration
            pour accéder au tableau de bord LRCSheet.
          </p>

        </div>


        {/* ===================================================
            FORMULAIRE
        =================================================== */}
        <form
          className="space-y-5 relative -top-3"
        >
          {/* EMAIL */}
          <div>

            <label
              htmlFor="email"
              className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-700"
            >
              Adresse e-mail
            </label>

            <div className="group relative">

              {/* ICON */}
              <div
                className="
                  pointer-events-none
                  absolute inset-y-0 left-0
                  flex items-center
                  pl-4
                "
              >
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="
                    text-slate-400
                    transition-colors
                    group-focus-within:text-blue-600
                  "
                />
              </div>

              <input
                id="email"
                name="email"
                type="email"
                value={inputs.email}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    email: e.target.value,
                  })
                }
                required
                autoComplete="email"
                placeholder="admin@lrcsheet.com"
                className="
                  block w-full
                  rounded-xl
                  border border-slate-200
                  bg-slate-50
                  py-3.5 pl-11 pr-4
                  text-sm font-medium
                  text-slate-800
                  placeholder:text-slate-400
                  outline-none
                  transition-all duration-200

                  hover:border-slate-300

                  focus:border-blue-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />

            </div>

            {invalidInput.email && (
              <div className="mt-2 flex items-center gap-1.5">

                <span className="text-xs font-bold text-red-500">
                  •
                </span>

                <p className="text-xs font-medium text-red-500">
                  {invalidInput.email}
                </p>

              </div>
            )}

          </div>


          {/* MOT DE PASSE */}
          <div>

            <div className="mb-2 flex items-center justify-between">

              <label
                htmlFor="password"
                className="text-xs font-bold uppercase tracking-wide text-slate-700"
              >
                Mot de passe
              </label>

              <a
                href="#reset"
                className="
                  text-xs
                  font-semibold
                  text-blue-600
                  transition
                  hover:text-blue-700
                "
              >
                Mot de passe oublié ?
              </a>

            </div>

            <div className="group relative">

              {/* ICON */}
              <div
                className="
                  pointer-events-none
                  absolute inset-y-0 left-0
                  flex items-center
                  pl-4
                "
              >
                <FontAwesomeIcon
                  icon={faLock}
                  className="
                    text-slate-400
                    transition-colors
                    group-focus-within:text-blue-600
                  "
                />
              </div>

              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={inputs.password}
                onChange={(e) =>
                  setInputs({
                    ...inputs,
                    password: e.target.value,
                  })
                }
                required
                autoComplete="current-password"
                placeholder="Votre mot de passe"
                className="
                  block w-full
                  rounded-xl
                  border border-slate-200
                  bg-slate-50
                  py-3.5 pl-11 pr-12
                  text-sm font-medium
                  text-slate-800
                  placeholder:text-slate-400
                  outline-none
                  transition-all duration-200

                  hover:border-slate-300

                  focus:border-blue-500
                  focus:bg-white
                  focus:ring-4
                  focus:ring-blue-500/10
                "
              />

              {/* SHOW PASSWORD */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={
                  showPassword
                    ? "Masquer le mot de passe"
                    : "Afficher le mot de passe"
                }
                className="
                  absolute
                  right-2.5
                  top-1/2
                  -translate-y-1/2
                  rounded-lg
                  p-2
                  text-slate-400
                  transition-all
                  hover:bg-slate-200
                  hover:text-slate-700
                "
              >
                <FontAwesomeIcon
                  icon={showPassword ? faEyeSlash : faEye}
                  className="text-sm"
                />
              </button>

            </div>

            {invalidInput.password && (
              <div className="mt-2 flex items-center gap-1.5">

                <span className="text-xs font-bold text-red-500">
                  •
                </span>

                <p className="text-xs font-medium text-red-500">
                  {invalidInput.password}
                </p>

              </div>
            )}

          </div>


          {/* =================================================
              SE SOUVENIR
          ================================================= */}
          <div className="flex items-center">

            <label className="group flex cursor-pointer items-center gap-2.5">

              <input
                type="checkbox"
                className="
                  h-4 w-4
                  cursor-pointer
                  rounded
                  border-slate-300
                  text-blue-600
                  accent-blue-600
                  focus:ring-2
                  focus:ring-blue-500/20
                "
              />

              <span className="text-xs font-medium text-slate-500 transition group-hover:text-slate-700">
                Se souvenir de moi
              </span>

            </label>

          </div>


          {/* =================================================
              BOUTON CONNEXION
          ================================================= */}
          <button
          onClick={authFunction}
            type="button"
            disabled={showSpinner}
            className="
              group
              relative
              flex
              w-full
              items-center
              justify-center
              gap-3
              overflow-hidden
              rounded-xl
              bg-blue-600
              px-5
              py-4
              text-sm
              font-bold
              text-white

              shadow-lg
              shadow-blue-600/20

              transition-all
              duration-300

              hover:bg-blue-700
              hover:shadow-xl
              hover:shadow-blue-600/25

              active:scale-[0.99]

              disabled:cursor-not-allowed
              disabled:opacity-60
            "
          >

            {/* effet hover */}
            <span
              className="
                absolute inset-0
                -translate-x-full
                bg-gradient-to-r
                from-transparent
                via-white/10
                to-transparent
                transition-transform
                duration-700
                group-hover:translate-x-full
              "
            />

            {showSpinner ? (
              <>
                <FontAwesomeIcon
                  icon={faSpinner}
                  className="animate-spin"
                />

                <span>
                  Connexion en cours...
                </span>
              </>
            ) : (
              <>
                <span>
                  Accéder au tableau de bord
                </span>

                <FontAwesomeIcon
                  icon={faArrowRightToBracket}
                  className="
                    transition-transform
                    duration-300
                    group-hover:translate-x-1
                  "
                />
              </>
            )}

          </button>

        </form>


        {/* =====================================================
            SÉPARATEUR
        ===================================================== */}
      </div>
    </div>
   
  </div>

</section>
        {/* =========================================================
            PARTIE DROITE — PRÉSENTATION PROFESSIONNELLE
        ========================================================= */}
        <section
          className="
            relative
            hidden
            min-h-screen
            flex-1
            overflow-hidden
            lg:flex
          "
        >
          {/* IMAGE DE FOND */}
          <div
            className="
              absolute
              inset-0
              bg-cover
              bg-center
            "
            style={{
              backgroundImage:
                "url('/images/businessman.png')",
            }}
          />
          {/* OVERLAY */}
          <div
            className="
              absolute
              inset-0
              bg-gradient-to-br
              from-slate-950/95
              via-blue-950/80
              to-blue-900/60
            "
          />

          {/* DÉCORATIONS */}
          <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10" />

          <div className="absolute -bottom-40 -left-40 h-[500px] w-[500px] rounded-full border border-blue-400/10" />

          <div className="absolute right-1/3 top-1/4 h-32 w-32 rounded-full bg-blue-500/10 blur-3xl" />

          {/* CONTENU */}
          <div className="relative z-10 flex w-full flex-col px-10 py-12 xl:px-16">

            {/* BADGE */}
            <div className="mb-12 inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 backdrop-blur-md">

              <span className="h-2 w-2 rounded-full bg-blue-400 shadow-lg shadow-blue-400/50" />

              <span className="text-xs font-medium text-blue-100">
                Solution professionnelle de gestion
              </span>

            </div>

            {/* TITRE */}
            <div className="max-w-2xl">

              <h2 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-white xl:text-5xl">

                Gérez votre entreprise
                <br />

                <span className="text-blue-400">
                  de manière professionnelle
                </span>

              </h2>

              <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 xl:text-lg">
                Suivez vos activités, faites la gestion de vos collaborateurs,
                optimisez vos ressources et faites grandir
                votre entreprise.
              </p>

            </div>

            {/* =====================================================
                FONCTIONNALITÉS
            ===================================================== */}
            <div className="mt-12 space-y-6">

              {/* Dashboard */}
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600/90 shadow-lg shadow-blue-900/30">

                  <FontAwesomeIcon
                    icon={faChartColumn}
                    className="text-white"
                  />

                </div>

                <div>

                  <h3 className="text-sm font-bold text-white">
                    Tableau de bord
                  </h3>

                  <p className="mt-1 text-xs text-slate-300">
                    Vue d'ensemble de votre activité
                  </p>

                </div>

              </div>

              {/* Équipe */}
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600/90 shadow-lg shadow-blue-900/30">

                  <FontAwesomeIcon
                    icon={faUsers}
                    className="text-white"
                  />

                </div>

                <div>

                  <h3 className="text-sm font-bold text-white">
                    Gestion des équipes
                  </h3>

                  <p className="mt-1 text-xs text-slate-300">
                    Organisez et suivez vos collaborateurs
                  </p>

                </div>

              </div>

              {/* Ressources */}
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600/90 shadow-lg shadow-blue-900/30">

                  <FontAwesomeIcon
                    icon={faGear}
                    className="text-white"
                  />

                </div>

                <div>

                  <h3 className="text-sm font-bold text-white">
                    Gestion des ressources
                  </h3>

                  <p className="mt-1 text-xs text-slate-300">
                    Optimisez vos outils et budgets
                  </p>

                </div>

              </div>

              {/* Sécurité */}
              <div className="flex items-center gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-600/90 shadow-lg shadow-blue-900/30">

                  <FontAwesomeIcon
                    icon={faShieldHalved}
                    className="text-white"
                  />

                </div>

                <div>

                  <h3 className="text-sm font-bold text-white">
                    Sécurité des données
                  </h3>

                  <p className="mt-1 text-xs text-slate-300">
                    Vos informations toujours protégées
                  </p>

                </div>

              </div>

            </div>

            {/* =====================================================
                CARTE DASHBOARD FLOTTANTE
            ===================================================== */}
            <div
              className="
                absolute
                bottom-8
                right-8
                hidden
                w-[420px]
                overflow-hidden
                rounded-2xl
                border
                border-white/20
                bg-white/95
                shadow-2xl
                backdrop-blur-xl
                xl:block
              "
            >

              {/* HEADER DASHBOARD */}
              <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">

                <div className="flex items-center gap-2">

                  <div className="flex h-7 w-7 items-center justify-center rounded-md bg-blue-600">
                    <span className="text-xs font-black text-white">
                      L
                    </span>
                  </div>

                  <span className="text-sm font-bold text-slate-800">
                    LRCSheet
                  </span>

                </div>

                <div className="flex items-center gap-2">

                  <div className="h-7 w-7 rounded-full bg-slate-200" />

                  <div>
                    <p className="text-[9px] font-semibold text-slate-700">
                      Bonjour, Administrateur
                    </p>

                    <p className="text-[8px] text-slate-400">
                      Admin
                    </p>
                  </div>

                </div>

              </div>

              {/* DASHBOARD BODY */}
              <div className="flex">

                {/* SIDEBAR */}
                <div className="w-[95px] border-r border-slate-100 bg-slate-50 p-3">

                  <div className="mb-4 rounded-md bg-blue-600 px-2 py-2">
                    <span className="text-[8px] font-semibold text-white">
                      Tableau de bord
                    </span>
                  </div>

                  <div className="space-y-3">

                    {[
                      "Entreprises",
                      "Produits",
                      "Commandes",
                      "Utilisateurs",
                      "Paramètres",
                    ].map((item) => (
                      <div
                        key={item}
                        className="px-2 text-[8px] font-medium text-slate-500"
                      >
                        {item}
                      </div>
                    ))}

                  </div>

                </div>

                {/* CONTENU */}
                <div className="flex-1 p-4">

                  <div className="grid grid-cols-3 gap-2">

                    <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">

                      <p className="text-[7px] text-slate-400">
                        Chiffre d'affaires
                      </p>

                      <p className="mt-1 text-[11px] font-bold text-slate-800">
                        2 540 000 FCFA
                      </p>

                      <p className="mt-1 text-[7px] font-semibold text-emerald-500">
                        ↑ 12%
                      </p>

                    </div>

                    <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">

                      <p className="text-[7px] text-slate-400">
                        Commandes
                      </p>

                      <p className="mt-1 text-[11px] font-bold text-slate-800">
                        128
                      </p>

                      <p className="mt-1 text-[7px] font-semibold text-emerald-500">
                        ↑ 8%
                      </p>

                    </div>

                    <div className="rounded-lg border border-slate-100 bg-white p-2 shadow-sm">

                      <p className="text-[7px] text-slate-400">
                        Utilisateurs
                      </p>

                      <p className="mt-1 text-[11px] font-bold text-slate-800">
                        24
                      </p>

                      <p className="mt-1 text-[7px] font-semibold text-emerald-500">
                        ↑ 5%
                      </p>

                    </div>

                  </div>

                  {/* GRAPHIQUE */}
                  <div className="mt-3 rounded-lg border border-slate-100 bg-white p-3">

                    <div className="flex items-center justify-between">

                      <p className="text-[8px] font-bold text-slate-700">
                        Évolution des ventes
                      </p>

                      <span className="text-[7px] text-slate-400">
                        2026
                      </span>

                    </div>

                    <div className="relative mt-3 h-20">

                      <div className="absolute inset-x-0 top-1/4 border-t border-slate-100" />
                      <div className="absolute inset-x-0 top-2/4 border-t border-slate-100" />
                      <div className="absolute inset-x-0 top-3/4 border-t border-slate-100" />

                      <svg
                        viewBox="0 0 350 80"
                        className="absolute inset-0 h-full w-full"
                        preserveAspectRatio="none"
                      >
                        <polyline
                          points="
                            0,65
                            30,52
                            60,60
                            90,40
                            120,47
                            150,30
                            180,40
                            210,20
                            240,32
                            270,14
                            300,22
                            330,5
                            350,12
                          "
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="3"
                          className="text-blue-600"
                        />
                      </svg>

                    </div>

                    <div className="mt-2 flex justify-between text-[6px] text-slate-400">
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

          </div>

        </section>

      </div>
    </main>
  );
}