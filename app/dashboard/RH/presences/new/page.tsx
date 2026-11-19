
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faFolderOpen,
    faSearch,
    faSpinner,
} from "@fortawesome/free-solid-svg-icons";
import useAddPresenceModal from "./hook";
import { providers } from "@/index";

export default function AddPresenceModal() {
    const {
        usersArray,
        filterUserByName,
        onCheckBtnEvent,
        handleSubmit,
        isLoading,
        setInputs,
        inputs,
        selectAllProfile,
        deselectAllProfile,
        isLoadingBtn,
    } = useAddPresenceModal();

    const inputClass =
        "w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 sm:px-4 py-3 text-sm sm:text-base outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white";

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-2 sm:p-4 backdrop-blur-sm">

            <div className="flex max-h-[95dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

                {/* HEADER */}
                <div className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-7 sm:py-5 dark:border-slate-700">
                    <h1 className="text-xl font-bold text-slate-700 sm:text-2xl dark:text-white">
                        Ajouter une présence
                    </h1>
                    <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                        Enregistrez les horaires de présence des collaborateurs.
                    </p>
                </div>

                {/* CONTENU SCROLLABLE */}
                <form
                    onSubmit={(e) => e.preventDefault()}
                    className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7 sm:py-5"
                >
                    <p className="mb-4 text-xs font-medium text-orange-500 sm:text-sm">
                        * Champs obligatoires
                    </p>

                    {/* RECHERCHE */}
                    <div className="mb-5">
                        <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Rechercher un collaborateur
                        </label>

                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Rechercher un collaborateur..."
                                onChange={(e) => filterUserByName(e.target.value)}
                                className={`${inputClass} pr-11`}
                            />

                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />
                        </div>
                    </div>

                    {/* HEURES ET DATE */}
                    <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                        <div className="min-w-0">
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Arrivée
                            </label>

                            <input
                                type="time"
                                value={inputs.arrivalTime ?? ""}
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        arrivalTime: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>

                        <div className="min-w-0">
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Départ
                            </label>

                            <input
                                type="time"
                                value={inputs.departureTime ?? ""}
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        departureTime: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>

                        <div className="min-w-0 sm:col-span-2 lg:col-span-1">
                            <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                Date
                            </label>

                            <input
                                type="date"
                                value={inputs.date ?? ""}
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        date: e.target.value,
                                    })
                                }
                                className={inputClass}
                            />
                        </div>
                    </div>

                    {/* SÉLECTION */}
                    <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">

                        <button
                            type="button"
                            onClick={selectAllProfile}
                            className="flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 active:scale-[0.98]"
                        >
                            Tout sélectionner
                        </button>

                        <button
                            type="button"
                            onClick={deselectAllProfile}
                            className="flex w-full items-center justify-center rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-orange-600 active:scale-[0.98]"
                        >
                            Tout désélectionner
                        </button>
                    </div>

                    {/* LISTE DES COLLABORATEURS */}
                    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:p-3 dark:border-slate-700 dark:bg-slate-800">

                        <div className="mb-2 flex items-center justify-between px-1">
                            <h2 className="text-sm font-semibold text-slate-700 dark:text-white">
                                Collaborateurs
                            </h2>

                            <span className="text-xs text-slate-500 dark:text-slate-400">
                                {inputs.usersId.length} sélectionné(s)
                            </span>
                        </div>

                        <div className="max-h-[30vh] min-h-[150px] space-y-2 overflow-y-auto overscroll-contain pr-1 sm:max-h-[250px]">

                            {usersArray.length > 0 && !isLoading && (
                                usersArray.map((user) => (
                                    <label
                                        key={user.id}
                                        className="flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border border-transparent bg-white p-3 transition-colors hover:border-blue-400 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-700"
                                    >
                                        <div className="flex min-w-0 items-center gap-3">

                                            <img
                                                src={
                                                    user.photo
                                                        ? `${providers.ImageUrl}/${user.photo}`
                                                        : "/images/clientProfile.png"
                                                }
                                                alt={`${user.firstname} ${user.lastname}`}
                                                className="h-10 w-10 shrink-0 rounded-full border-2 border-slate-200 object-cover sm:h-12 sm:w-12"
                                            />

                                            <div className="min-w-0">
                                                <h3 className="break-words text-sm font-semibold text-slate-700 dark:text-white sm:text-base">
                                                    {user.firstname} {user.lastname}
                                                </h3>

                                                <p className="text-xs text-slate-500">
                                                    Collaborateur
                                                </p>
                                            </div>
                                        </div>

                                        <input
                                            type="checkbox"
                                            checked={inputs.usersId.includes(user.id)}
                                            onChange={() =>
                                                onCheckBtnEvent(
                                                    user.id,
                                                    user.SalaryId,
                                                    user.PlanningId,
                                                    user.EnterpriseId
                                                )
                                            }
                                            className="h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
                                        />
                                    </label>
                                ))
                            )}

                            {usersArray.length === 0 && isLoading && (
                                <div className="flex min-h-[150px] items-center justify-center">
                                    <FontAwesomeIcon
                                        icon={faSpinner}
                                        className="animate-spin text-3xl text-orange-400"
                                    />
                                </div>
                            )}

                            {usersArray.length === 0 && !isLoading && (
                                <div className="flex min-h-[150px] flex-col items-center justify-center gap-3 text-center">
                                    <FontAwesomeIcon
                                        icon={faFolderOpen}
                                        className="text-3xl text-orange-400"
                                    />

                                    <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                        Aucune donnée trouvée
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </form>

                {/* FOOTER FIXE */}
                <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-7 sm:py-4 dark:border-slate-700 dark:bg-slate-900">
                    <button
                        type="button"
                        disabled={isLoadingBtn}
                        onClick={handleSubmit}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-800 hover:to-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:ml-auto sm:w-auto sm:min-w-[160px]"
                    >
                        {isLoadingBtn ? (
                            <>
                                <FontAwesomeIcon
                                    icon={faSpinner}
                                    className="animate-spin"
                                />
                                Traitement...
                            </>
                        ) : (
                            "Soumettre"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
