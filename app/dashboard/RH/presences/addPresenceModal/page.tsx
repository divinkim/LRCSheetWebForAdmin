"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";
import useAddPresenceModal from "./hook";
import { providers } from "@/index";
import { ClipLoader } from "react-spinners";
import { useState } from "react";

export default function AddPresenceModal() {
    const { usersArray,
        filterUserByName,
        onCheckBtnEvent,
        handleSubmit, isLoading, setInputs, inputs, selectAllProfile, deselectAllProfile } = useAddPresenceModal();
    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center backdrop-blur-sm p-4">

            <div className="w-full max-w-2xl rounded-3xl  bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                {/* Header */}
                <div className="px-8 my-4">
                    <h1 className="text-2xl font-bold text-slate-700 dark:text-white">
                        Ajouter une présence
                    </h1>

                </div>
                <form className="px-8">
                    <p className="text-sm text-orange-500 font-medium my-4">
                        * Champs obligatoires
                    </p>
                    {/* Recherche */}
                    <div className="mb-6">

                        <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
                            Rechercher un collaborateur
                        </label>

                        <div className="relative">

                            <input
                                type="text"
                                placeholder="Rechercher..."
                                onChange={(e) => filterUserByName(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 px-4 py-3 pr-12 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:text-white"
                            />

                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                        </div>

                    </div>

                    {/* Heure + Date */}

                    <div className="grid md:grid-cols-3 gap-5 mb-8">
                        <div>
                            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
                                Arrivée
                                <span className="text-orange-500"> *</span>
                            </label>
                            <input
                                type="time"
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        arrivalTime: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
                                Départ
                                {/* <span className="text-orange-500"> *</span> */}
                            </label>
                            <input
                                type="time"
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        departureTime: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block mb-2 font-medium text-slate-700 dark:text-slate-200">
                                Date
                                <span className="text-orange-500"> *</span>
                            </label>
                            <input
                                type="date"
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        date: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 dark:bg-slate-800 dark:border-slate-600 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:text-white"
                            />
                        </div>
                    </div>
                    {/* Boutons */}
                    <div className="flex flex-wrap gap-3 mb-5">
                        <button
                            type="button"
                            onClick={selectAllProfile}
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 px-5 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105"
                        >
                            Tout sélectionner
                        </button>

                        <button
                            type="button"
                            onClick={deselectAllProfile}
                            className="rounded-xl bg-orange-500 hover:bg-orange-600 px-5 py-3 font-semibold text-white shadow-lg transition-all hover:scale-105"
                        >
                            Tout désélectionner
                        </button>

                    </div>

                    {/* Liste */}

                    <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">

                        <div className="h-[200px] overflow-y-auto space-y-3 pr-2">

                            {usersArray.map((user) => (

                                <label
                                    key={user.id}
                                    className="flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-white dark:bg-slate-900 p-3 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-slate-700 transition-all"
                                >

                                    <div className="flex items-center gap-3">

                                        <input
                                            type="checkbox"
                                            checked={inputs.usersId.includes(user.id)}
                                            onChange={() =>
                                                onCheckBtnEvent(
                                                    user.id,
                                                    user.EnterpriseId,
                                                    user.SalaryId,
                                                    user.PlanningId
                                                )
                                            }
                                            className="h-5 w-5 accent-blue-600"
                                        />

                                        <img
                                            src={
                                                user.photo
                                                    ? `${providers.APIUrl}/images/${user.photo}`
                                                    : "/images/clientProfile.png"
                                            }
                                            className="h-12 w-12 rounded-full object-cover border-2 border-slate-200"
                                        />

                                        <div>

                                            <h3 className="font-semibold text-slate-700 dark:text-white">
                                                {user.firstname} {user.lastname}
                                            </h3>

                                            <p className="text-sm text-slate-500">
                                                Collaborateur
                                            </p>

                                        </div>

                                    </div>

                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="my-4 flex justify-end">

                        <button
                            type="button" disabled={isLoading}
                            onClick={handleSubmit}
                            className={`rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 px-8 py-3 font-semibold text-white shadow-xl transition-all hover:scale-105 ${isLoading ? "opacity-50" : "opacity-100"}`}
                        >
                            {isLoading ? (
                                <p>
                                    <FontAwesomeIcon icon={faSpinner} className="text-white animate-spin" />
                                    <span className="left-1 relative">Traitement...</span>
                                </p>
                            ) : (
                                "Soumettre"
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}