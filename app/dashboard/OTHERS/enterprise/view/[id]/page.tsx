"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBuilding,
  faPhone,
  faEnvelope,
  faGlobe,
  faMapMarkerAlt,
  faCity,
  faPen,
  faArrowLeft,
  faCheckCircle,
  faClock,
  faPercentage,
  faFileContract,
  faBriefcase,
  faCompass,
} from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";

type EnterpriseType = {
  id?: number;
  name: string;
  description: string;
  logo: string;
  activityDomain: string;
  phone: string;
  toleranceTime: string | null;
  maxToleranceTime: string | null;
  pourcentageOfHourlyDeduction: string | null;
  maxPourcentageOfHourlyDeduction: string | null;
  email: string;
  address: string;
  website: string | null;
  latitude: string;
  longitude: string;
  CityId: number | null;
  City?: {
    name: string;
  };
  CountryId: number | null;
  Country?: {
    name: string;
  };
  legalForm: string;
  rccm: string | null;
  nui: string | null;
  subscriptionType: string;
  subscriptionStatus: string;
  [key: string]: any;
};

// ==========================================
// Composant Skeleton (Pendant le chargement)
// ==========================================
function EnterpriseSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Titre Skeleton */}
        <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>

        {/* Bannière Profil Supérieure Skeleton */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-800 shrink-0"></div>
            <div className="space-y-2.5">
              <div className="h-7 w-52 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
              <div className="h-4 w-44 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          </div>
        </div>

        {/* Grille Principale Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonne Gauche (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Informations Générales Skeleton */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="h-5 w-48 bg-slate-200 dark:bg-slate-800 rounded-md pb-4 border-b border-slate-200 dark:border-slate-800"></div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tolérances Skeleton */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="h-5 w-56 bg-slate-200 dark:bg-slate-800 rounded-md pb-4 border-b border-slate-200 dark:border-slate-800"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Localisation Skeleton */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-60 bg-slate-200 dark:bg-slate-800 rounded-md pb-4 border-b border-slate-200 dark:border-slate-800"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Colonne Droite (1/3) */}
          <div className="space-y-6">

            {/* Abonnement Skeleton */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded-md pb-3 border-b border-slate-200 dark:border-slate-800"></div>
              <div className="space-y-3">
                <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              </div>
            </div>

            {/* Registre Skeleton */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md pb-3 border-b border-slate-200 dark:border-slate-800"></div>
              <div className="space-y-3">
                <div className="h-14 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
                <div className="h-14 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}

// ==========================================
// Composant Principal
// ==========================================
export default function ViewEnterprise() {
  const [enterprise, setEnterprise] = useState<EnterpriseType | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const id = window.location.href.split("/").pop();
        if (id && !isNaN(Number(id))) {
          const res = await providers.API.getOne(
            providers.APIUrl,
            "getEnterprise",
            Number(id)
          );
          if (res) {
            setEnterprise(res);
          }
        }
      } catch (error) {
        console.error("Erreur lors de la récupération de l'entreprise:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return <EnterpriseSkeleton />;
  }

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Titre & Fil d'Ariane */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Fiche de l'entreprise : {enterprise?.name || "Non disponible"}
            </h1>
          </div>
        </div>

        {/* Bannière Profil Supérieure */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="flex items-center gap-5">
            {/* Logo de l'entreprise */}
            <div className="relative w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {enterprise?.logo ? (
                <img
                  src={`${providers.APIUrl}/images/${enterprise.logo}`}
                  alt={enterprise.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <FontAwesomeIcon icon={faBuilding} className="text-3xl text-slate-400 dark:text-slate-500" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-wide">
                {enterprise?.name || "Nom non spécifié"}
              </h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <FontAwesomeIcon icon={faBriefcase} className="text-slate-400 dark:text-slate-500" />
                {enterprise?.activityDomain || "Secteur d'activité non renseigné"}
              </p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faFileContract} className="text-slate-400 dark:text-slate-500" />
                Forme juridique : {enterprise?.legalForm || "Non précisée"}
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/ADMIN/updateEnterprise/${enterprise?.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/10 active:scale-95"
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

          {/* Colonne Gauche (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Carte Informations Générales & Contacts */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                <FontAwesomeIcon icon={faBuilding} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Informations Générales</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Description</p>
                  <p className="text-slate-700 dark:text-slate-300 mt-1 leading-relaxed">
                    {enterprise?.description || "Aucune description renseignée pour cette entreprise."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Téléphone</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faPhone} className="text-slate-400 dark:text-slate-500" />
                      {enterprise?.phone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">E-mail</p>
                    <p className="font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="text-slate-400 dark:text-slate-500" />
                      {enterprise?.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Site Web</p>
                    {enterprise?.website ? (
                      <a
                        href={enterprise.website.startsWith("http") ? enterprise.website : `https://${enterprise.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-2 hover:underline"
                      >
                        <FontAwesomeIcon icon={faGlobe} className="text-slate-400 dark:text-slate-500" />
                        {enterprise.website}
                      </a>
                    ) : (
                      <p className="font-medium text-slate-800 dark:text-slate-200 mt-1">—</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Adresse</p>
                    <p className="font-medium text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-slate-400 dark:text-slate-500" />
                      {enterprise?.address || "Non communiquée"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Carte Règles de Tolérance & Règlements */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                <FontAwesomeIcon icon={faClock} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Tolérances & Retenues Horaire</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase">
                    <FontAwesomeIcon icon={faClock} className="text-slate-400" /> Temps de tolérance
                  </p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    {enterprise?.toleranceTime ? `${enterprise.toleranceTime} min` : "0 min"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Max : {enterprise?.maxToleranceTime ? `${enterprise.maxToleranceTime} min` : "Non défini"}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5 uppercase">
                    <FontAwesomeIcon icon={faPercentage} className="text-slate-400" /> Déduction horaire
                  </p>
                  <p className="font-bold text-slate-800 dark:text-slate-100 text-base">
                    {enterprise?.pourcentageOfHourlyDeduction ? `${enterprise.pourcentageOfHourlyDeduction} %` : "0 %"}
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Max : {enterprise?.maxPourcentageOfHourlyDeduction ? `${enterprise.maxPourcentageOfHourlyDeduction} %` : "Non défini"}
                  </p>
                </div>
              </div>
            </div>

            {/* Carte Localisation Géographique */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Localisation & Coordonnées GPS</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faGlobe} className="text-slate-400" /> Pays
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{enterprise?.Country?.name || "—"}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faCity} className="text-slate-400" /> Ville
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{enterprise?.City?.name || "—"}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faCompass} className="text-slate-400" /> Latitude
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{enterprise?.latitude || "—"}</p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/60 p-3.5 rounded-xl border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faCompass} className="text-slate-400" /> Longitude
                  </p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">{enterprise?.longitude || "—"}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Colonne Droite (1/3) */}
          <div className="space-y-6">

            {/* Carte Abonnement & Statut */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Statut de l'abonnement</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Statut</span>
                  {enterprise?.subscriptionStatus === "onGoing" ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                      ● En cours
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold border border-rose-500/20">
                      ● Expiré
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between">
                  <span className="text-sm text-blue-700 dark:text-blue-300 font-semibold">Formule d'abonnement</span>
                  <span className="text-base font-extrabold text-blue-600 dark:text-blue-400 capitalize">
                    {enterprise?.subscriptionType || "Standard"}
                  </span>
                </div>
              </div>
            </div>

            {/* Carte Identifiants Légal & Administratifs */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <FontAwesomeIcon icon={faFileContract} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Registre & Fiscalité</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">N° RCCM</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {enterprise?.rccm || "Non renseigné"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">N° NUI / NIU</p>
                  <p className="font-bold text-slate-800 dark:text-slate-200">
                    {enterprise?.nui || enterprise?.niu || "Non renseigné"}
                  </p>
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}