'use client';

import AddOrEditUserPlanningOfWeek from "@/components/addEditUserPlanningOfWeek";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch } from "@fortawesome/free-solid-svg-icons";
import { ClipLoader } from "react-spinners";
import Link from "next/link";
import useAddUserInPlanningOfWeek from "./hook";
import { providers } from "@/index";

export default function AddUserInPlanningOfWeek() {
    const { 
        handleSubmit, 
        onSearch, 
        usersArrayCloned, 
        addEditUserPlanningOfWeek, 
        weekDays, 
        plannings, 
        isLoading, 
        datas, 
        getFormatTime,
        handleToggleUser,
        handleSelectPlanning,
        handleToggleWeekDay 
    } = useAddUserInPlanningOfWeek();

    // Pour l'affichage UI : récurrence des sélections actuelles
    const selectedPlannings = datas[0]?.planningsId || [];
    const selectedWeekDays = datas[0]?.weekDaysId || [];

    return (
        <main className="bg-gray-100 dark:bg-transparent">
            <div className="flex">
                <div className="mx-4 font-semibold mt-6 mb-4 w-full">
                    {/* Header / Breadcrumb */}
                    <div className="flex flex-col gap-1 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                        <div>
                            <h1 className="text-xl font-semibold tracking-tight text-slate-700 dark:text-white">
                                Gestion du planning d'un collaborateur
                            </h1>
                        </div>
                        <div className="hidden items-center gap-1.5 text-sm text-slate-500 xl:flex dark:text-slate-400">
                            <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">Dashboard</span>
                            <span className="text-slate-300 dark:text-slate-700">/</span>
                            <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">RH</span>
                            <span className="text-slate-300 dark:text-slate-700">/</span>
                            <span className="font-medium text-blue-600 dark:text-blue-400">Ajouter un planning collaborateur au planning</span>
                        </div>
                    </div>
                    
                    <hr />

                    {/* Navigation links */}
                    <div className="mt-6 flex flex-wrap justify-end gap-4">
                        {addEditUserPlanningOfWeek?.addUserInPlanningOfWeek.links.map((elm) => (
                            <Link
                                key={elm.path}
                                href={elm.path}
                                className="inline-flex items-center gap-3 rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-800 hover:shadow-lg hover:-translate-y-0.5 active:scale-95"
                            >
                                <FontAwesomeIcon icon={elm.icon} className="text-white text-sm" />
                                <span>{elm.title}</span>
                            </Link>
                        ))}
                    </div>

                    <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                        {/* Section Collaborateurs */}
                        <div className="h-[500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-5 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-100">Collaborateurs</h2>
                                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-semibold text-orange-600 dark:bg-orange-400/10 dark:text-orange-400">
                                    {usersArrayCloned.length} membre(s)
                                </span>
                            </div>

                            <div className="relative mb-6">
                                <FontAwesomeIcon icon={faSearch} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input
                                    onChange={(e) => onSearch(e.target.value)}
                                    placeholder="Rechercher un collaborateur..."
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-3 pl-11 pr-4 text-slate-700 outline-none transition-all duration-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-orange-400/20"
                                />
                            </div>

                            <div className="flex h-[340px] flex-col gap-3 overflow-y-auto pr-1">
                                {usersArrayCloned.map((user) => (
                                    <div
                                        key={user.id}
                                        className="group flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-orange-400 hover:bg-orange-50/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                                    >
                                        <div className="flex items-center gap-4">
                                            <img
                                                src={user.photo ? `${providers.APIUrl}/images/${user.photo}` : "/images/clientProfile.png"}
                                                alt={`${user.firstname} ${user.lastname}`}
                                                className="h-12 w-12 rounded-full border-2 border-orange-400 object-cover"
                                            />
                                            <div>
                                                <p className="font-semibold text-slate-700 dark:text-slate-100">
                                                    {user.lastname} {user.firstname}
                                                </p>
                                                <p className="text-sm text-slate-500 dark:text-slate-400">Collaborateur</p>
                                            </div>
                                        </div>

                                        {/* Checkbox Utilisateur */}
                                        <input
                                            type="checkbox"
                                            checked={datas.some(item => item.userId === user.id)}
                                            onChange={() => handleToggleUser(user)}
                                            className="h-5 w-5 cursor-pointer rounded border-slate-400 text-orange-400 focus:ring-orange-400"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Section Planning & Jours */}
                        <div className="h-[500px] rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 dark:border-slate-800 dark:bg-slate-900">
                            <div className="mb-6 flex items-center justify-between">
                                <h2 className="text-lg font-bold text-slate-700 dark:text-slate-100">Planning hebdomadaire</h2>
                                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                    {weekDays.length} jours
                                </span>
                            </div>

                            {/* Select Planning */}
                            <div className="mb-6">
                                <label className="mb-2 block font-medium text-slate-600 dark:text-slate-300">
                                    Sélectionnez un planning horaire
                                </label>
                                <select
                                    value={selectedPlannings[0] || ""}
                                    onChange={(e) => handleSelectPlanning(Number(e.target.value))}
                                    className="w-full rounded-xl border border-slate-300 bg-slate-50 p-4 text-slate-700 outline-none transition-all duration-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:focus:ring-orange-400/20"
                                >
                                    <option value="">Sélectionnez un planning</option>
                                    {plannings.map((planning) => (
                                        <option key={planning.id} value={planning.id}>
                                            {getFormatTime(planning.startTime)} - {getFormatTime(planning.breakingStartTime)} - {getFormatTime(planning.resumeEndTime)} - {getFormatTime(planning.endTime)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="mb-4">
                                <h3 className="mb-2 text-base font-semibold text-slate-700 dark:text-slate-200">Jours de la semaine</h3>
                                <div className="h-1 w-20 rounded-full bg-orange-400"></div>
                            </div>

                            {/* Checkboxes Jours de la semaine */}
                            <div className="flex h-[260px] flex-col gap-3 overflow-y-auto pr-1">
                                {weekDays.map((weekDay) => (
                                    <div
                                        key={weekDay.id}
                                        className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-all duration-300 hover:border-orange-400 hover:bg-orange-50/40 hover:shadow-md dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-500 dark:bg-orange-400/10 dark:text-orange-400">
                                                {weekDay.day.charAt(0)}
                                            </div>
                                            <span className="font-medium text-slate-700 dark:text-slate-200">{weekDay.day}</span>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={selectedWeekDays.includes(weekDay.id)}
                                            onChange={() => handleToggleWeekDay(weekDay.id)}
                                            className="h-5 w-5 cursor-pointer rounded border-slate-400 text-orange-400 focus:ring-orange-400"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Bouton de soumission */}
                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={isLoading}
                            className="inline-flex min-w-[170px] items-center justify-center gap-3 rounded-xl bg-blue-700 px-8 py-3.5 font-semibold text-white shadow-md transition-all duration-300 hover:bg-blue-800 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <ClipLoader size={18} color="#fff" />
                                    <span>Traitement...</span>
                                </>
                            ) : (
                                <span>Ajouter</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}