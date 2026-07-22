"use client";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faSpinner, faTimes } from "@fortawesome/free-solid-svg-icons";
import { PresencesListHookModal } from "../hook";
import { providers } from "@/index";
import { ClipLoader } from "react-spinners";
import { useState, useEffect } from "react";
import { useToast } from "@/components/toast";
type UpdatePresence = {
    usersId: number[],
    arrivalTime: string | null,
    departureTime: string | null,
    resumeTime: string | null,
    breakStartTime: string | null,
    enterprisesId: any[],
    salariesId: any[],
    planningsId: any[],
    date: string,
}

export default function UpdatePresenceModal() {
    const { onSelectAllUser, users, usersCloned, setUsersCloned } = PresencesListHookModal();
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const [inputs, setInputs] = useState<UpdatePresence>({
        usersId: [],
        arrivalTime: null,
        breakStartTime: null,
        resumeTime: null,
        departureTime: null,
        salariesId: [],
        enterprisesId: [],
        planningsId: [],
        date: "",
    });

    function includesValue(array: number[], value: number) {
        const result = array.includes(value) ? array.filter(item => item !== value) : [...array, value];
        return result;
    }

    function onSelect(UserId: number, SalaryId: number, PlanningId: number, EnterpriseId: number) {
        setInputs({
            ...inputs,
            usersId: includesValue(inputs.usersId, UserId),
            salariesId: [...inputs.salariesId, SalaryId],
            planningsId: [...inputs.planningsId, PlanningId],
            enterprisesId: [...inputs.enterprisesId, EnterpriseId],
        })
    }

    function selectAllUser() {
        setInputs({
            ...inputs,
            usersId: onSelectAllUser().getUsersId,
            salariesId: onSelectAllUser().getSalariesId,
            planningsId: onSelectAllUser().getPlanningId,
            enterprisesId: onSelectAllUser().getEnterprisesId
        })
    }

    function deselectAllUser() {
        setInputs({
            ...inputs,
            usersId: [],
            salariesId: [],
            planningsId: [],
            enterprisesId: []
        })
    }


    function onSearch(e: string) {
        const newUsersArray = users.filter(item => item?.lastname?.toLowerCase().includes(e.toLowerCase()) || item?.firstname?.toLowerCase().includes(e.toLowerCase()));
        setUsersCloned(newUsersArray);
    }

    const handleSubmit = async () => {
        try {
            if (!inputs.date) {
                toast.error("Champs invalides", "Veuillez saisir la date à modifier")
                return;
            }
            setIsLoading(true)
            const response = await providers.API.post("https://vps118934.serveur-vps.net:4001",
                "postAttendancesFromAdmin",
                null,
                inputs,
            );

            const status = response.status;
            const title = response.title;
            const message = response.message;

            if (status) {
                toast.success(title, message);
                return window.location.href = "/dashboard/RH/presencesList";
            }
        } catch (error) {
            console.log(error)
            toast.error("Erreur",
                error instanceof Error
                    ? error.message :
                    "Erreur inconnue"
            )
        } finally {
            setIsLoading(false)
        }

    }

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">

            <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">

                {/* Header */}
                <div className="px-8 my-5">

                    <h2 className="text-2xl font-bold text-slate-700 dark:text-white">
                        Modifier une présence
                    </h2>
                </div>

                <form className="px-8">
                    {/* Recherche */}
                    <div className="mb-6">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Recherchez un collaborateur..."
                                onChange={(e) => onSearch(e.target.value)}
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 pr-12 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />

                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                        </div>

                    </div>

                    {/* Horaires */}

                    <div className="grid gap-5 md:grid-cols-3">

                        <div>

                            <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">
                                Arrivée
                            </label>

                            <input
                                type="time"
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        arrivalTime: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />

                        </div>

                        <div>

                            <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">
                                Pause
                            </label>

                            <input
                                type="time"
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        breakStartTime: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />

                        </div>

                        <div>

                            <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">
                                Reprise
                            </label>

                            <input
                                type="time"
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        resumeTime: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />

                        </div>

                        <div>

                            <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">
                                Départ
                            </label>

                            <input
                                type="time"
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        departureTime: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />

                        </div>
                        <div className="">

                            <label className="mb-2 block font-medium text-slate-700 dark:text-slate-200">
                                Date
                            </label>

                            <input
                                type="date"
                                onChange={(e) =>
                                    setInputs({
                                        ...inputs,
                                        date: e.target.value,
                                    })
                                }
                                className="w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                            />

                        </div>
                    </div>

                    {/* Boutons */}

                    <div className="mt-8 flex flex-wrap gap-3">

                        <button
                            type="button"
                            onClick={selectAllUser}
                            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-blue-700"
                        >
                            Tout sélectionner
                        </button>

                        <button
                            type="button"
                            onClick={deselectAllUser}
                            className="rounded-xl bg-orange-500 px-5 py-3 font-semibold text-white shadow-lg transition hover:scale-105 hover:bg-orange-600"
                        >
                            Tout désélectionner
                        </button>

                    </div>

                    {/* Liste collaborateurs */}

                    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">

                        <div className="h-[150px] space-y-3 overflow-y-auto pr-2">

                            {usersCloned.map((user) => (

                                <label
                                    key={user.id}
                                    className="flex cursor-pointer items-center justify-between rounded-xl border border-transparent bg-white p-3 transition-all hover:border-blue-500 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-700"
                                >
                                    <div className="flex items-center gap-3">
                                        <img
                                            src={
                                                user.photo
                                                    ? `${providers.APIUrl}/images/${user.photo}`
                                                    : "/images/clientProfile.png"
                                            }
                                            className="h-12 w-12 rounded-full border-2 border-slate-200 object-cover"
                                        />
                                        <div>
                                            <h3 className="font-semibold text-slate-700 dark:text-white">
                                                {providers.reduceLengthOfText(
                                                    String(user.firstname),
                                                    10
                                                )}{" "}
                                                {user.lastname}
                                            </h3>

                                            <p className="text-sm text-slate-500">
                                                Collaborateur
                                            </p>

                                        </div>

                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={inputs.usersId.includes(user.id)}
                                        onChange={() =>
                                            onSelect(
                                                user.id,
                                                user.SalaryId,
                                                user.PlanningId,
                                                user.EnterpriseId
                                            )
                                        }
                                        className="h-5 w-5 accent-blue-600"
                                    />

                                </label>

                            ))}

                        </div>

                    </div>
                    {/* Footer */}
                    <div className="my-4 flex justify-end">
                        <button
                            type="button"
                            onClick={handleSubmit}
                            className="rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-3 font-semibold text-white shadow-xl transition-all hover:scale-105 hover:from-blue-800 hover:to-blue-700"
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