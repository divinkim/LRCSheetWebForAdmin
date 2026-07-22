'use client';

import { 
  faBuilding, 
  faCalendarAlt, 
  faCity, 
  faCoins, 
  faEnvelope, 
  faGlobe, 
  faHeart, 
  faMapMarkerAlt, 
  faMoneyBill1Wave, 
  faPen, 
  faPhone, 
  faUser, 
  faBriefcase, 
  faWallet,
  faArrowLeft,
  faCheckCircle
} from "@fortawesome/free-solid-svg-icons";
import useUserProfile from "../hook";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { providers } from "@/index";
import Link from "next/link";

export default function GetUserProfile() {
  const { user } = useUserProfile();

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Fil d'Ariane & Titre */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
              <span>Dashboard</span>
              <span>/</span>
              <span>Collaborateurs</span>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-500 font-semibold">Détails du collaborateur</span>
            </nav>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Profil de {user?.firstname} {user?.lastname}
            </h1>
          </div>
        </div>

        {/* Bannière Profil Supérieure */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="flex items-center gap-5">
            {/* Photo de profil */}
            <div className="relative w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <img
                src={user?.photo ? `${providers.APIUrl}/images/${user.photo}` : "/images/clientProfile.png"}
                alt={`${user?.firstname} ${user?.lastname}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
                {user?.firstname} {user?.lastname}
              </h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5">
                {user?.Post?.title || "Poste non spécifié"}
              </p>
              <p className="text-sm font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faBuilding} className="text-slate-400 dark:text-slate-500" />
                {user?.Enterprise?.name || "Entreprise non assignée"}
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/RH/editUser/${user?.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-all shadow-md shadow-amber-500/10 active:scale-95"
            >
              <FontAwesomeIcon icon={faPen} />
              <span>Modifier</span>
            </Link>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-sm transition-all border border-slate-200 dark:border-slate-700"
            >
              <FontAwesomeIcon icon={faArrowLeft} />
              <span>Retour</span>
            </button>
          </div>
        </div>

        {/* Grille principale */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Colonne Gauche & Milieu */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Carte Informations Personnelles & Contact */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                <FontAwesomeIcon icon={faUser} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Informations personnelles</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Prénom</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{user?.firstname || "—"}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Nom</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{user?.lastname || "—"}</p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Téléphone</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faPhone} className="text-sm text-slate-400 dark:text-slate-500" />
                    {user?.phone || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">E-mail</p>
                  <p className="font-semibold text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faEnvelope} className="text-sm text-slate-400 dark:text-slate-500" />
                    {user?.email || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Situation matrimoniale</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faHeart} className="text-sm text-slate-400 dark:text-slate-500" />
                    {user?.marialStatus || "Non précisée"}
                  </p>
                </div>
              </div>
            </div>

            {/* Carte Poste & Contrat */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                <FontAwesomeIcon icon={faBriefcase} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Poste & Contrat</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Titre du poste</p>
                  <p className="font-semibold text-slate-900 dark:text-white mt-1 text-base">{user?.Post?.title || "—"}</p>
                  {user?.Post?.description && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">{user?.Post?.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Type de contrat</p>
                  <div className="flex flex-wrap items-center gap-3 mt-1">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      Contrat {user?.ContractType?.title || "N/A"}
                    </span>
                    {(user?.Contract?.startDate || user?.Contract?.endDate) && (
                      <span className="text-sm text-slate-600 dark:text-slate-400 flex items-center gap-1 bg-slate-100 dark:bg-slate-950 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-800">
                        <FontAwesomeIcon icon={faCalendarAlt} className="text-slate-400 dark:text-slate-500" />
                        {user?.Contract?.startDate} à {user?.Contract?.endDate}
                      </span>
                    )}
                  </div>
                  {user?.ContractType?.description && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">{user?.ContractType?.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/60">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Planning hebdomadaire</p>
                  <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">{user?.PlanningType?.title || "N/A"}</p>
                  {user?.PlanningType?.description && (
                    <p className="text-slate-600 dark:text-slate-400 text-sm mt-1 leading-relaxed">{user?.PlanningType?.description}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Carte Localisation */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Localisation</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faGlobe} className="text-slate-400 dark:text-slate-500" /> Pays
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.Country?.name || "—"}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faCity} className="text-slate-400 dark:text-slate-500" /> Ville
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.City?.name || "—"}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faBuilding} className="text-slate-400 dark:text-slate-500" /> Arrondissement
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{user?.District?.name || "—"}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Colonne Droite */}
          <div className="space-y-6">

            {/* Carte Statut */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Statut</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Statut du compte</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                    ● Actif
                  </span>
                </div>
              </div>
            </div>

            {/* Carte Rémunération */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <FontAwesomeIcon icon={faWallet} className="text-amber-600 dark:text-amber-400 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Rémunération</h3>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faCoins} className="text-slate-400 dark:text-slate-500 text-sm" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Salaire brut</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {user?.Salary?.netSalary ? `${user.Salary.netSalary} XAF` : "—"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faMoneyBill1Wave} className="text-slate-400 dark:text-slate-500 text-sm" />
                    <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">Salaire journalier</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    {user?.Salary?.dailySalary ? `${user.Salary.dailySalary} XAF` : "—"}
                  </span>
                </div>

                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <FontAwesomeIcon icon={faWallet} className="text-amber-600 dark:text-amber-400 text-sm" />
                    <span className="text-sm text-amber-700 dark:text-amber-300 font-semibold">Salaire final</span>
                  </div>
                  <span className="text-base font-extrabold text-amber-600 dark:text-amber-400">
                    {user?.Salary?.netSalary ? `${user.Salary.netSalary} XAF` : "—"}
                  </span>
                </div>
              </div>
            </div>

            {/* Carte Entreprise */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-3 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <FontAwesomeIcon icon={faBuilding} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Entreprise associée</h3>
              </div>

              <div>
                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">{user?.Enterprise?.name || "Non renseignée"}</p>
                {user?.Enterprise?.description && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
                    {user?.Enterprise?.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}