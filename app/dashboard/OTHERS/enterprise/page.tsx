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

// ==========================================
// Composant Skeleton de chargement
// ==========================================
function EnterpriseSkeleton() {
  return (
    <main className="min-h-screen bg-white dark:bg-slate-700 p-4 sm:p-6 lg:p-8 font-sans animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Titre Skeleton */}
        <div className="h-7 w-64 bg-slate-200 dark:bg-slate-600 rounded-lg"></div>

        {/* Carte Profil Supérieure Skeleton */}
        <div className="bg-white dark:bg-slate-600 border-2 border-slate-200 dark:border-slate-500 rounded-2xl p-6 shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-2xl bg-slate-200 dark:bg-slate-500 shrink-0"></div>
            <div className="space-y-2.5">
              <div className="h-7 w-48 bg-slate-200 dark:bg-slate-500 rounded-md"></div>
              <div className="h-4 w-36 bg-slate-200 dark:bg-slate-500 rounded-md"></div>
              <div className="h-4 w-40 bg-slate-200 dark:bg-slate-500 rounded-md"></div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-28 bg-slate-200 dark:bg-slate-500 rounded-xl"></div>
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-500 rounded-xl"></div>
          </div>
        </div>

        {/* Grille Principale Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonne Gauche (2/3) */}
          <div className="lg:col-span-2 space-y-6">

            {/* Infos Générales Skeleton */}
            <div className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-2xl p-6 space-y-6">
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-500 rounded-md pb-4 border-b border-slate-200 dark:border-slate-500"></div>
              <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-200 dark:bg-slate-500 rounded"></div>
                <div className="h-4 w-full bg-slate-200 dark:bg-slate-500 rounded"></div>
                <div className="h-4 w-3/4 bg-slate-200 dark:bg-slate-500 rounded"></div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-500 rounded"></div>
                    <div className="h-5 w-32 bg-slate-200 dark:bg-slate-500 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tolérances Skeleton */}
            <div className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-2xl p-6 space-y-6">
              <div className="h-5 w-56 bg-slate-200 dark:bg-slate-500 rounded-md pb-4 border-b border-slate-200 dark:border-slate-500"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-4 rounded-xl border border-slate-200 dark:border-slate-500 space-y-2">
                    <div className="h-3 w-28 bg-slate-200 dark:bg-slate-500 rounded"></div>
                    <div className="h-6 w-16 bg-slate-200 dark:bg-slate-500 rounded-md"></div>
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-500 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Localisation Skeleton */}
            <div className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-60 bg-slate-200 dark:bg-slate-500 rounded-md pb-4 border-b border-slate-200 dark:border-slate-500"></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-500 space-y-2">
                    <div className="h-3 w-16 bg-slate-200 dark:bg-slate-500 rounded"></div>
                    <div className="h-5 w-24 bg-slate-200 dark:bg-slate-500 rounded"></div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Colonne Droite (1/3) */}
          <div className="space-y-6">

            {/* Abonnement Skeleton */}
            <div className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-500 rounded-md pb-3 border-b border-slate-200 dark:border-slate-500"></div>
              <div className="space-y-3">
                <div className="h-12 w-full bg-slate-200 dark:bg-slate-500 rounded-xl"></div>
                <div className="h-12 w-full bg-slate-200 dark:bg-slate-500 rounded-xl"></div>
              </div>
            </div>

            {/* Registre Skeleton */}
            <div className="bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-500 rounded-md pb-3 border-b border-slate-200 dark:border-slate-500"></div>
              <div className="space-y-3">
                <div className="h-14 w-full bg-slate-200 dark:bg-slate-500 rounded-xl"></div>
                <div className="h-14 w-full bg-slate-200 dark:bg-slate-500 rounded-xl"></div>
              </div>
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}

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
    <main className="min-h-screen bg-white dark:bg-slate-700 text-slate-700 dark:text-white p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
    </main>
  );
}