"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

import HomeComponent from "./hook";
import GetAnnualGain from "../dashboard/STATS/page";
import SubscriptionEpiredComponent from "@/components/subscriptionExpiredComponent/page";

const REQUIRED_ADMIN_ROLES = ["Super-Admin", "Supervisor-Admin"];

export default function HomePage() {
  const { data: session } = useSession();
  const { cardComponent, enterprise, loader } = HomeComponent();

  // Récupération du rôle depuis la session
  const userRole = session?.user?.adminRole ?? "";
  const hasAdminAccess = useMemo(
    () => REQUIRED_ADMIN_ROLES.includes(userRole),
    [userRole]
  );

  /**
   * Format montant(Currency / Int)
   */
  const formatCardValue = (index: number, value: number) => {
    if (index === 2) {
      return new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "XAF",
        maximumFractionDigits: 0,
      }).format(value);
    }

    return new Intl.NumberFormat("fr-FR").format(value);
  };

  if (loader) {
    return (
      <div className="flex h-[500px] w-full items-center justify-center">
        <FontAwesomeIcon
          icon={faSpinner}
          className="animate-spin text-3xl text-amber-500"
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Alerte si l'abonnement est expiré */}
      {enterprise.subscriptionStatus === "expired" && (
        <SubscriptionEpiredComponent />
      )}

      {/* Grille de cartes d'indicateurs */}
      <div className="grid grid-cols-1 gap-5 px-1 md:grid-cols-2 xl:grid-cols-3">
        {cardComponent.map((card, index) => {
          // Masquer la 3ème carte si l'utilisateur n'a pas le rôle requis
          if (index === 2 && !hasAdminAccess) return null;

          return (
            <Link
              key={card.title}
              href={card.path}
              className={cn(
                "group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
              )}
            >
              <div className="flex items-center justify-between">
                <div
                  style={{ backgroundColor: card.backgroundColor }}
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-sm"
                >
                  <FontAwesomeIcon icon={card.icon} className="text-lg" />
                </div>

                {index !== 2 && (
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors duration-200 group-hover:bg-amber-500 group-hover:text-white dark:bg-slate-800 dark:text-slate-300">
                    <FontAwesomeIcon icon={faEye} className="text-xs" />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <h3 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                  {formatCardValue(index, card.value)}
                </h3>
                <p className="mt-1 text-sm font-medium text-slate-500 dark:text-slate-400">
                  {card.title}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      {/* Section des statistiques annuelles (Admin seulement) */}
      {hasAdminAccess && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <GetAnnualGain />
        </div>
      )}
    </div>
  );
}