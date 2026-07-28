"use client";

import AddOrEditUserPlanningOfWeek from "@/components/addEditRoster";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faCalendarAlt, faUsers, faCheck } from "@fortawesome/free-solid-svg-icons";
import { providers } from "@/index";
import { ClipLoader } from "react-spinners";
import Link from "next/link";
import useAddUserInPlanningOfWeek from "./hook";

export default function Edit() {
  const {
    handleSubmit,
    onSearch,
    usersArrayCloned = [],
    addEditUserPlanningOfWeek,
    weekDays = [],
    plannings = [],
    isLoading = false,
    datas = [],
    getFormatTime,
    handleToggleUser,
    handleSelectPlanning,
    handleToggleWeekDay
  } = useAddUserInPlanningOfWeek();

  // Vérifie si un utilisateur donné est sélectionné
  const isUserSelected = (userId: number) => datas.some(item => item.userId === userId);

  // Vérifie le planning sélectionné actuellement (prend le 1er utilisateur comme référence)
  const selectedPlanningId = datas[0]?.planningsId[0] || "";

  // Vérifie si un jour est sélectionné (prend le 1er utilisateur comme référence)
  const isDaySelected = (dayId: number) => datas[0]?.weekDaysId.includes(dayId) || false;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* Header & Breadcrumbs */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Modifier le planning
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ajustez l'affectation des créneaux et des jours pour vos collaborateurs.
            </p>
          </div>

          {/* Navigation Dynamic Links */}
          <div className="flex flex-wrap gap-3">
            {addEditUserPlanningOfWeek?.updateUserInPlanningOfWeek.links.map((elm) => (
              <Link
                key={elm.path}
                href={elm.path}
                className="inline-flex items-center gap-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white active:scale-95"
              >
                <FontAwesomeIcon icon={elm.icon} className="text-blue-600 dark:text-blue-400 text-sm" />
                <span>{elm.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Panneau Principal : Grid 2 Colonnes */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* COLONNE 1 : LISTE DES COLLABORATEURS */}
          <div className="flex flex-col h-[560px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm dark:shadow-xl transition-all duration-200">

            {/* En-tête Section */}
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <FontAwesomeIcon icon={faUsers} className="text-sm" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">Collaborateurs</h2>
              </div>
              {isLoading ? (
                <div className="h-6 w-28 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
              ) : (
                <span className="rounded-full bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                  {usersArrayCloned.length} membre(s) ({datas.length} sel.)
                </span>
              )}
            </div>

            {/* Recherche */}
            <div className="relative mb-4">
              <FontAwesomeIcon
                icon={faSearch}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-sm"
              />
              <input
                type="text"
                disabled={isLoading}
                onChange={(e) => onSearch(e.target.value)}
                placeholder="Rechercher un collaborateur..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 py-2.5 pl-11 pr-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 outline-none transition-all duration-200 focus:border-amber-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-2 focus:ring-amber-500/20 disabled:opacity-60"
              />
            </div>

            {/* Liste des cartes collaborateurs (Squelette ou Données) */}
            <div className="flex-1 overflow-y-auto pr-1.5 space-y-2.5">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 p-3.5 animate-pulse"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="h-11 w-11 rounded-full bg-slate-200 dark:bg-slate-800 flex-shrink-0"></div>
                      <div className="space-y-2">
                        <div className="h-3.5 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                    </div>
                    <div className="h-5 w-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  </div>
                ))
              ) : (
                usersArrayCloned.map((user) => {
                  const selected = isUserSelected(user.id);
                  return (
                    <label
                      key={user.id}
                      onClick={() => handleToggleUser(user)}
                      className={`group flex cursor-pointer items-center justify-between rounded-xl border p-3.5 transition-all duration-200 ${
                        selected
                          ? "border-amber-500 bg-amber-50/60 dark:border-amber-500/50 dark:bg-amber-500/10 shadow-sm"
                          : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="relative">
                          <img
                            src={
                              user.photo
                                ? `${providers.APIUrl}/images/${user.photo}`
                                : "/images/clientProfile.png"
                            }
                            alt={`${user.firstname} ${user.lastname}`}
                            className="h-11 w-11 rounded-full border-2 border-slate-200 dark:border-slate-700 object-cover group-hover:border-amber-500 transition-colors"
                          />
                          {selected && (
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white font-bold">
                              <FontAwesomeIcon icon={faCheck} />
                            </span>
                          )}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-slate-800 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                            {user.lastname} {user.firstname}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            Collaborateur
                          </p>
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => {}}
                        className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-amber-500 focus:ring-amber-400 dark:focus:ring-offset-slate-900"
                      />
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* COLONNE 2 : CHOIX DU PLANNING & DES JOURS */}
          <div className="flex flex-col h-[560px] rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 p-6 shadow-sm dark:shadow-xl transition-all duration-200 justify-between">
            <div>
              {/* En-tête Section */}
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    <FontAwesomeIcon icon={faCalendarAlt} className="text-sm" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Planning hebdomadaire</h2>
                </div>
                {isLoading ? (
                  <div className="h-6 w-16 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse"></div>
                ) : (
                  <span className="rounded-full bg-blue-100 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 px-3 py-1 text-xs font-semibold text-blue-700 dark:text-blue-400">
                    {weekDays.length} jours
                  </span>
                )}
              </div>

              {/* Select Planning */}
              <div className="mb-6">
                <label className="mb-2 block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Sélectionnez un planning horaire
                </label>
                {isLoading ? (
                  <div className="h-11 w-full bg-slate-200 dark:bg-slate-800 rounded-xl animate-pulse"></div>
                ) : (
                  <select
                    value={selectedPlanningId}
                    onChange={(e) => handleSelectPlanning(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/80 p-3 text-sm text-slate-800 dark:text-slate-100 outline-none transition-all duration-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                  >
                    <option value="" className="bg-white dark:bg-slate-900 text-slate-400">Sélectionnez un planning</option>
                    {plannings.map((planning) => (
                      <option key={planning.id} value={planning.id} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                        {getFormatTime(planning.startTime)} - {getFormatTime(planning.breakingStartTime)} | {getFormatTime(planning.resumeEndTime)} - {getFormatTime(planning.endTime)}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Jours de la semaine */}
              <div>
                <label className="mb-3 block text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Jours de la semaine
                </label>

                <div className="max-h-[250px] overflow-y-auto pr-1.5 space-y-2">
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between rounded-xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 p-3 animate-pulse"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-slate-200 dark:bg-slate-800"></div>
                          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                        </div>
                        <div className="h-5 w-5 bg-slate-200 dark:bg-slate-800 rounded"></div>
                      </div>
                    ))
                  ) : (
                    weekDays.map((weekDay) => {
                      const checked = isDaySelected(weekDay.id);
                      return (
                        <label
                          key={weekDay.id}
                          onClick={() => handleToggleWeekDay(weekDay.id)}
                          className={`flex cursor-pointer items-center justify-between rounded-xl border p-3 transition-all duration-200 ${
                            checked
                              ? "border-blue-500 bg-blue-50/60 dark:border-blue-500/50 dark:bg-blue-500/10"
                              : "border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-100/80 dark:hover:bg-slate-800/80"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-lg font-bold text-xs transition-colors ${
                              checked
                                ? "bg-blue-600 text-white"
                                : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                            }`}>
                              {weekDay.day.substring(0, 3).toUpperCase()}
                            </div>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                              {weekDay.day}
                            </span>
                          </div>

                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="h-5 w-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-blue-600 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                          />
                        </label>
                      );
                    })
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex justify-end">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex w-full sm:w-auto min-w-[150px] items-center justify-center gap-2.5 rounded-xl bg-blue-600 dark:bg-blue-600 px-6 py-3 font-semibold text-sm text-white shadow-md shadow-blue-600/20 hover:bg-blue-700 dark:hover:bg-blue-500 transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <ClipLoader size={18} color="#fff" />
                    <span>Traitement...</span>
                  </>
                ) : (
                  <span>Modifier</span>
                )}
              </button>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}