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
  faCompass
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
    return (
      <main className="min-h-screen bg-white dark:bg-slate-700 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
          <p className="text-sm font-medium text-slate-600 dark:text-white">
            Chargement des détails de l'entreprise...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-slate-700 text-slate-700 dark:text-white p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Titre & En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-700 dark:text-white">
              Fiche de l'entreprise : {enterprise?.name || "Non disponible"}
            </h1>
          </div>
        </div>

        {/* Carte Profil Supérieure */}
        <div className="bg-white dark:bg-slate-600 border-2 border-slate-600 rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="flex items-center gap-5">
            {/* Logo */}
            <div className="relative w-20 h-20 rounded-2xl bg-slate-700 border-2 border-amber-400 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              {enterprise?.logo ? (
                <img
                  src={`${providers.APIUrl}/images/${enterprise.logo}`}
                  alt={enterprise.name}
                  className="w-full h-full object-contain p-2"
                />
              ) : (
                <FontAwesomeIcon icon={faBuilding} className="text-3xl text-amber-400" />
              )}
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-700 dark:text-white tracking-wide">
                {enterprise?.name || "Nom non spécifié"}
              </h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-200 mt-0.5 flex items-center gap-2">
                <FontAwesomeIcon icon={faBriefcase} className="text-amber-500" />
                {enterprise?.activityDomain || "Secteur d'activité non renseigné"}
              </p>
              <p className="text-sm font-semibold text-blue-600 dark:text-amber-400 mt-1 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faFileContract} className="text-blue-600 dark:text-amber-400" />
                Forme juridique : {enterprise?.legalForm || "Non précisée"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Link
              href={`/dashboard/OTHERS/updateEnterprise/${enterprise?.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition-all shadow-md active:scale-95"
            >
              <FontAwesomeIcon icon={faPen} />
              <span>Modifier</span>
            </Link>

            <button
              type="button"
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-500 text-slate-700 font-bold text-sm transition-all border border-amber-500"
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

            {/* Informations Générales */}
            <div className="bg-white dark:bg-slate-600 border border-slate-600 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-600 pb-4">
                <FontAwesomeIcon icon={faBuilding} className="text-blue-600 dark:text-amber-400 text-sm" />
                <h3 className="font-bold text-base text-slate-700 dark:text-white">Informations Générales</h3>
              </div>

              <div className="space-y-4 text-sm">
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-amber-400 uppercase tracking-wider">Description</p>
                  <p className="text-slate-700 dark:text-white mt-1 leading-relaxed">
                    {enterprise?.description || "Aucune description renseignée pour cette entreprise."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-amber-400 uppercase tracking-wider">Téléphone</p>
                    <p className="font-semibold text-blue-600 dark:text-white mt-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faPhone} className="text-amber-500" />
                      {enterprise?.phone || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-amber-400 uppercase tracking-wider">E-mail</p>
                    <p className="font-semibold text-blue-600 dark:text-white mt-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faEnvelope} className="text-amber-500" />
                      {enterprise?.email || "—"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-amber-400 uppercase tracking-wider">Site Web</p>
                    {enterprise?.website ? (
                      <a
                        href={enterprise.website.startsWith("http") ? enterprise.website : `https://${enterprise.website}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-semibold text-blue-600 hover:text-blue-700 dark:text-amber-400 mt-1 flex items-center gap-2 hover:underline"
                      >
                        <FontAwesomeIcon icon={faGlobe} className="text-amber-500" />
                        {enterprise.website}
                      </a>
                    ) : (
                      <p className="font-medium text-slate-700 dark:text-white mt-1">—</p>
                    )}
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-600 dark:text-amber-400 uppercase tracking-wider">Adresse</p>
                    <p className="font-medium text-slate-700 dark:text-white mt-1 flex items-center gap-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} className="text-amber-500" />
                      {enterprise?.address || "Non communiquée"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Tolérances & Règlements */}
            <div className="bg-white dark:bg-slate-600 border border-slate-600 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-600 pb-4">
                <FontAwesomeIcon icon={faClock} className="text-blue-600 dark:text-amber-400 text-sm" />
                <h3 className="font-bold text-base text-slate-700 dark:text-white">Tolérances & Retenues Horaire</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-600 space-y-1">
                  <p className="text-xs font-semibold text-slate-600 dark:text-amber-400 flex items-center gap-1.5 uppercase">
                    <FontAwesomeIcon icon={faClock} className="text-amber-500" /> Temps de tolérance
                  </p>
                  <p className="font-bold text-blue-600 dark:text-white text-base">
                    {enterprise?.toleranceTime ? `${enterprise.toleranceTime} min` : "0 min"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-200">
                    Max : {enterprise?.maxToleranceTime ? `${enterprise.maxToleranceTime} min` : "Non défini"}
                  </p>
                </div>

                <div className="bg-white dark:bg-slate-700 p-4 rounded-xl border border-slate-600 space-y-1">
                  <p className="text-xs font-semibold text-slate-600 dark:text-amber-400 flex items-center gap-1.5 uppercase">
                    <FontAwesomeIcon icon={faPercentage} className="text-amber-500" /> Déduction horaire
                  </p>
                  <p className="font-bold text-blue-600 dark:text-white text-base">
                    {enterprise?.pourcentageOfHourlyDeduction ? `${enterprise.pourcentageOfHourlyDeduction} %` : "0 %"}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-200">
                    Max : {enterprise?.maxPourcentageOfHourlyDeduction ? `${enterprise.maxPourcentageOfHourlyDeduction} %` : "Non défini"}
                  </p>
                </div>
              </div>
            </div>

            {/* Localisation Géographique */}
            <div className="bg-white dark:bg-slate-600 border border-slate-600 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-600 pb-4">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 dark:text-amber-400 text-sm" />
                <h3 className="font-bold text-base text-slate-700 dark:text-white">Localisation & Coordonnées GPS</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                <div className="bg-white dark:bg-slate-700 p-3.5 rounded-xl border border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faGlobe} className="text-amber-500" /> Pays
                  </p>
                  <p className="font-semibold text-slate-700 dark:text-white">{enterprise?.Country?.name || "—"}</p>
                </div>

                <div className="bg-white dark:bg-slate-700 p-3.5 rounded-xl border border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faCity} className="text-amber-500" /> Ville
                  </p>
                  <p className="font-semibold text-slate-700 dark:text-white">{enterprise?.City?.name || "—"}</p>
                </div>

                <div className="bg-white dark:bg-slate-700 p-3.5 rounded-xl border border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faCompass} className="text-amber-500" /> Latitude
                  </p>
                  <p className="font-semibold text-slate-700 dark:text-white">{enterprise?.latitude || "—"}</p>
                </div>

                <div className="bg-white dark:bg-slate-700 p-3.5 rounded-xl border border-slate-600">
                  <p className="text-xs font-medium text-slate-600 dark:text-amber-400 flex items-center gap-1.5 mb-1">
                    <FontAwesomeIcon icon={faCompass} className="text-amber-500" /> Longitude
                  </p>
                  <p className="font-semibold text-slate-700 dark:text-white">{enterprise?.longitude || "—"}</p>
                </div>
              </div>
            </div>

          </div>

          {/* Colonne Droite (1/3) */}
          <div className="space-y-6">

            {/* Statut de l'Abonnement */}
            <div className="bg-white dark:bg-slate-600 border border-slate-600 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-600 pb-3">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 dark:text-amber-400 text-sm" />
                <h3 className="font-bold text-base text-slate-700 dark:text-white">Statut de l'abonnement</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-slate-700 border border-slate-600">
                  <span className="text-slate-600 dark:text-slate-200 font-medium">Statut</span>
                  {enterprise?.subscriptionStatus === "onGoing" ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-700 font-bold border border-amber-500">
                      ● En cours
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-700 text-amber-400 font-bold border border-amber-400">
                      ● Expiré
                    </span>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-blue-600 text-white border border-blue-700 flex items-center justify-between">
                  <span className="text-sm font-semibold">Formule</span>
                  <span className="text-base font-extrabold text-amber-400 capitalize">
                    {enterprise?.subscriptionType || "Standard"}
                  </span>
                </div>
              </div>
            </div>

            {/* Registre & Fiscalité */}
            <div className="bg-white dark:bg-slate-600 border border-slate-600 rounded-2xl p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 border-b border-slate-600 pb-3">
                <FontAwesomeIcon icon={faFileContract} className="text-blue-600 dark:text-amber-400 text-sm" />
                <h3 className="font-bold text-base text-slate-700 dark:text-white">Registre & Fiscalité</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-600">
                  <p className="text-xs font-semibold text-slate-600 dark:text-amber-400 uppercase tracking-wider mb-1">N° RCCM</p>
                  <p className="font-bold text-blue-700 dark:text-white">
                    {enterprise?.rccm || "Non renseigné"}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-white dark:bg-slate-700 border border-slate-600">
                  <p className="text-xs font-semibold text-slate-600 dark:text-amber-400 uppercase tracking-wider mb-1">N° NUI / NIU</p>
                  <p className="font-bold text-blue-700 dark:text-white">
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