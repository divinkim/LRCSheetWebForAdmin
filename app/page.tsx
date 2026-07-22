"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import useAuth from "./auth";


export default function Home() {
  const { showPassword, setShowPassword, showSpinner, inputs, setInputs, authFunction, message, invalidInput } = useAuth()
  return (
    <div className="bg-slate-50 dark:bg-slate-900 flex overflow-hidden justify-center lg:justify-normal items-center w-screen h-screen">
      <div className="flex w-full h-full">
        <div className="hidden lg:flex lg:w-1/2 xl:w-7/12 bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 dark:from-slate-900 dark:via-slate-800 dark:to-orange-500/20 justify-center items-center relative overflow-hidden transition-colors duration-500">

          {/* Overlay sombre pour la profondeur */}
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]"></div>

          {/* Formes géométriques décoratives (Cercles en fond) */}
          <div className="absolute -bottom-32 -left-40 w-96 h-96 border-4 border-white/10 dark:border-orange-400/10 rounded-full animate-pulse"></div>
          <div className="absolute -bottom-40 -left-20 w-96 h-96 border-4 border-white/10 dark:border-orange-400/10 rounded-full"></div>
          <div className="absolute top-0 -right-20 w-96 h-96 border-4 border-white/10 dark:border-orange-400/10 rounded-full"></div>
          <div className="absolute -top-20 right-40 w-64 h-64 border border-blue-400/20 dark:border-orange-400/20 rounded-full"></div>

          {/* Contenu Branding */}
          <div className="relative z-10 px-12 text-center max-w-xl">
            {/* Conteneur Logo avec Ombre Portée */}
            <div className="w-28 h-28 mx-auto bg-white dark:bg-slate-800 rounded-3xl flex items-center justify-center mb-8 shadow-2xl border border-white/20 p-3 transform hover:scale-105 transition-transform duration-300">
              <img src="/images/logo.png" alt="LRCSheet Logo" className="w-full h-full object-contain" />
            </div>

            <h1 className="text-4xl font-black text-white dark:text-orange-400 tracking-wide mb-4 drop-shadow-md">
              LRCSheet Web Admin
            </h1>

            <p className="text-slate-200 dark:text-slate-300 text-lg leading-relaxed mb-8 font-light">
              Plateforme RH unifiée : gérez les plannings, salaires, rapports et données utilisateurs en toute sécurité.
            </p>

            {/* Carousel / Navigation dots de présentation */}
            <div className="flex justify-center items-center space-x-3">
              <div className="w-2.5 h-2.5 rounded-full bg-white/40 dark:bg-orange-400/40"></div>
              <div className="w-8 h-2.5 rounded-full bg-white dark:bg-orange-400 shadow-sm"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-white/40 dark:bg-orange-400/40"></div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 xl:w-5/12 h-full flex flex-col items-center justify-center bg-white dark:bg-slate-900 transition-colors duration-500 relative">

          {/* Notification / Message d'erreur rétractable */}
          <div className={`absolute top-0 left-0 right-0 transition-all duration-500 z-20 ${message ? "py-3 bg-red-500 text-white shadow-md" : "h-0 opacity-0 overflow-hidden"}`}>
            <p className="text-center font-medium text-sm">{message}</p>
          </div>

          <div className="w-full h-full flex items-center justify-center p-6 sm:p-12">
            <div className="w-full max-w-md">

              {/* Carte Formulaire */}
              <div className="w-full bg-white dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 py-10 px-8 rounded-2xl shadow-xl dark:shadow-2xl backdrop-blur-sm">

                {/* Entête Mobile (Logo affiché uniquement sur petit écran) */}
                <div className="lg:hidden text-center mb-6">
                  <img src="/images/logo.png" alt="LRCSheet Logo" className="w-16 h-16 mx-auto mb-2 object-contain" />
                </div>

                <div className="text-center mb-8">
                  <h2 className="text-2xl font-extrabold text-blue-700 dark:text-orange-400 tracking-tight">
                    Authentification à LRCSheet
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                    Entrez vos identifiants administrateur
                  </p>
                </div>

                <form onSubmit={authFunction} className="space-y-6">

                  {/* Champ Email */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Adresse E-mail
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={inputs.email}
                      onChange={(e) => {
                        setInputs({
                          ...inputs,
                          email: e.target.value
                        })
                      }}
                      required
                      placeholder="admin@lrcsheet.com"
                      className="mt-1 block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-orange-400 focus:border-transparent transition-all duration-200"
                    />
                  </div>
                  {
                    invalidInput.email && (
                      <div className="text-red-500 text-sm my-1">
                        {invalidInput.email}
                      </div>
                    )
                  }
                  {/* Champ Mot de passe */}
                  <div className="relative">
                    <label htmlFor="password" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Mot de passe
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={inputs.password}
                        onChange={(e) => {
                          setInputs({
                            ...inputs,
                            password: e.target.value
                          })
                        }}
                        required
                        placeholder="••••••••"
                        className="mt-1 block w-full px-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:focus:ring-orange-400 focus:border-transparent transition-all duration-200 pr-12"
                      />
                      {
                        invalidInput.password && (
                          <div className="text-red-500 text-sm my-1">
                            {invalidInput.password}
                          </div>
                        )
                      }
                      {/* Bouton afficher/masquer le mot de passe */}
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 focus:outline-none"
                      >
                        {showPassword ? (
                          /* Icône Masquer (Eye Slash) */
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.96 8.96 0 012.122-.363c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m-1.748-1.748a3 3 0 01-4.243-4.243M1 1l22 22" />
                          </svg>
                        ) : (
                          /* Icône Afficher (Eye) */
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Bouton de Soumission */}
                  <div className="pt-2">
                    <button onClick={authFunction}
                      type="button"
                      disabled={showSpinner}
                      className={`w-full flex justify-center items-center py-3.5 px-4 border border-transparent rounded-lg shadow-md text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 dark:bg-orange-400 dark:text-slate-900 dark:hover:bg-orange-500 dark:active:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-600 dark:focus:ring-orange-400 dark:focus:ring-offset-slate-900 transition-all duration-300 ${showSpinner ? "opacity-50" : "opacity-100"}`}
                    >
                      {
                        showSpinner && (
                          <FontAwesomeIcon icon={faSpinner} className="text-white relative right-1 animate-spin" />
                        )
                      }
                      {
                        showSpinner ? "Connexion en cours..." : "Se connecter"
                      }
                    </button>
                  </div>
                </form>

                {/* Lien Mot de Passe Oublié */}
                <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
                  Mot de passe oublié ?{" "}
                  <a href="#reset" className="font-bold text-blue-600 dark:text-orange-400 hover:text-blue-700 dark:hover:text-orange-500 transition-colors underline-offset-2 hover:underline">
                    Réinitialisez votre mot de passe
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
