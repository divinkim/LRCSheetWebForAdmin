"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCalendarCheck,
  faUser,
  faEnvelope,
  faPhone,
  faClock,
  faCalendarAlt,
  faInfoCircle,
  faArrowLeft,
  faPen,
  faCheckCircle,
  faTimesCircle,
  faHourglassHalf,
  faUserTie,
  faHashtag,
} from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";

export type Appointment = {
  id?: number;
  fullName: string;
  email?: string | null;
  phone: string;
  UserId: number;
  date: string;
  time?: string | null;
  status: string;
  reason: string;
  User?: {
    id: number;
    lastname: string;
    firstname: string;
  };
};

function AppointmentSkeleton() {
  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 sm:p-6 lg:p-8 font-sans animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Titre Skeleton */}
        <div className="h-7 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>

        {/* Bannière Supérieure Skeleton */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                    <div className="h-5 w-36 bg-slate-200 dark:bg-slate-800 rounded-md"></div>
                  </div>
                ))}
              </div>
            </div>

            {/* Motifs / Détails Skeleton */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-56 bg-slate-200 dark:bg-slate-800 rounded-md pb-4 border-b border-slate-200 dark:border-slate-800"></div>
              <div className="h-16 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>

          </div>

          {/* Colonne Droite (1/3) */}
          <div className="space-y-6">

            {/* Agent Assigné Skeleton */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-44 bg-slate-200 dark:bg-slate-800 rounded-md pb-3 border-b border-slate-200 dark:border-slate-800"></div>
              <div className="h-14 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            </div>

            {/* Statut Skeleton */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="h-5 w-40 bg-slate-200 dark:bg-slate-800 rounded-md pb-3 border-b border-slate-200 dark:border-slate-800"></div>
              <div className="h-12 w-full bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
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
export default function ViewAppointment() {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const id = window.location.href.split("/").pop();
        const res = await providers.API.getOne(
          "https://vps118934.serveur-vps.net:4001",
          "appointment",
          Number(id)
        );
        console.log(res)
        if (res) {
          setAppointment(res);
        }

      } catch (error) {
        console.error("Erreur lors de la récupération du rendez-vous:", error);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  if (isLoading) {
    return <AppointmentSkeleton />;
  }

  // Rendu conditionnel des badges de statut
  const renderStatusBadge = (status?: string) => {
    switch (status?.toUpperCase()) {
      case "ACCEPTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-xs border border-emerald-500/20">
            <FontAwesomeIcon icon={faCheckCircle} /> Accepté
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold text-xs border border-rose-500/20">
            <FontAwesomeIcon icon={faTimesCircle} /> Rejeté
          </span>
        );
      case "PENDING":
      case "PEDDING":
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold text-xs border border-amber-500/20">
            <FontAwesomeIcon icon={faHourglassHalf} /> En attente
          </span>
        );
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 p-4 sm:p-6 lg:p-8 font-sans transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Titre & Fil d'Ariane */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Détails du Rendez-vous #{appointment?.id || "N/A"}
            </h1>
          </div>
        </div>

        {/* Bannière Profil Supérieure */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors">
          <div className="flex items-center gap-5">
            {/* Avatar / Icône du Visiteur */}
            <div className="relative w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 shadow-inner">
              <FontAwesomeIcon icon={faUser} className="text-3xl text-slate-400 dark:text-slate-500" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-wide">
                {appointment?.fullName || "Visiteur Inconnu"}
              </h2>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                <FontAwesomeIcon icon={faPhone} className="text-slate-400 dark:text-slate-500" />
                {appointment?.phone || "—"}
              </p>
              <p className="text-sm font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-1.5">
                <FontAwesomeIcon icon={faEnvelope} className="text-slate-400 dark:text-slate-500" />
                {appointment?.email || "Email non renseigné"}
              </p>
            </div>
          </div>

          {/* Boutons d'action */}
          <div className="flex items-center gap-3">
            {/* <Link
              href={`/dashboard/ADMIN/updateAppointment/${appointment?.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm transition-all shadow-md shadow-blue-600/10 active:scale-95"
            >
              <FontAwesomeIcon icon={faPen} />
              <span>Modifier</span>
            </Link> */}
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

            {/* Carte Informations Générales du RDV */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-6 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                <FontAwesomeIcon icon={faCalendarCheck} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Planification du Rendez-vous</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Date prévue</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-2 text-sm">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-blue-600 dark:text-blue-400" />
                    {appointment?.date || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Heure prévue</p>
                  <p className="font-semibold text-slate-800 dark:text-slate-200 mt-1 flex items-center gap-2 text-sm">
                    <FontAwesomeIcon icon={faClock} className="text-blue-600 dark:text-blue-400" />
                    {appointment?.time ? appointment?.time : "Non spécifiée"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Téléphone de contact</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faPhone} className="text-slate-400 dark:text-slate-500" />
                    {appointment?.phone || "—"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Email de contact</p>
                  <p className="font-semibold text-blue-600 dark:text-blue-400 mt-1 flex items-center gap-2">
                    <FontAwesomeIcon icon={faEnvelope} className="text-slate-400 dark:text-slate-500" />
                    {appointment?.email || "—"}
                  </p>
                </div>
              </div>
            </div>

            {/* Carte Motif & Informations Supplémentaires */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-4">
                <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Motif ou raison</h3>
              </div>

              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 text-sm">
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {appointment?.reason || "Aucun motif spécifié pour ce rendez-vous."}
                </p>
              </div>
            </div>

          </div>

          {/* Colonne Droite (1/3) */}
          <div className="space-y-6">

            {/* Carte Statut */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Statut de la demande</h3>
              </div>

              <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 text-sm">
                <span className="text-slate-600 dark:text-slate-400 font-medium">État</span>
                {renderStatusBadge(appointment?.status)}
              </div>
            </div>

            {/* Carte Agent / Utilisateur Concerné */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm dark:shadow-xl space-y-4 transition-colors">
              <div className="flex items-center gap-2.5 border-b border-slate-200 dark:border-slate-800 pb-3">
                <FontAwesomeIcon icon={faUserTie} className="text-blue-600 dark:text-blue-500 text-sm" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">Agent Concerné</h3>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 text-sm">
                {appointment?.User ? (
                  <>
                    <p className="font-bold text-slate-800 dark:text-slate-100 text-sm">
                      {appointment.User.firstname} {appointment.User.lastname}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <FontAwesomeIcon icon={faHashtag} /> ID Employé : {appointment.UserId}
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 dark:text-slate-400 italic">
                    Aucun agent spécifiquement assigné (ID: {appointment?.UserId || "—"})
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