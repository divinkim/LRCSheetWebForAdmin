
"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faSearch,
    faSpinner,
    faUsers,
    faFolderOpen,
    faClock,
    faCalendarAlt,
} from "@fortawesome/free-solid-svg-icons";

import { PresencesListHookModal } from "../hook";
import { providers } from "@/index";
import { useState } from "react";
import { useToast } from "@/components/toast";
import { AttendancesListDto } from "@/types/global";

type UpdatePresence = {
    usersId: number[];
    arrivalTime: string | null;
    departureTime: string | null;
    resumeTime: string | null;
    breakStartTime: string | null;
    enterprisesId: number[];
    salariesId: number[];
    planningsId: number[];
    date: string;
};

const INITIAL_INPUTS: UpdatePresence = {
    usersId: [],
    arrivalTime: null,
    breakStartTime: null,
    resumeTime: null,
    departureTime: null,
    salariesId: [],
    enterprisesId: [],
    planningsId: [],
    date: "",
};

export default function UpdatePresenceModal() {
    const {
        onSelectAllUser,
        users,
        usersCloned,
        setUsersCloned,
        setPresencesListCloned,
        setPresencesList,
        isLoading,
    } = PresencesListHookModal();

    const [loadingBtn, setIsLoadingBtn] = useState(false);
    const [inputs, setInputs] = useState<UpdatePresence>(INITIAL_INPUTS);

    const toast = useToast();

    // STYLE DES CHAMPS
    const inputClass =
        "w-full min-w-0 rounded-xl border border-slate-300 bg-slate-50 px-3 sm:px-4 py-3 text-sm sm:text-base text-slate-800 outline-none transition-all focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white";

    // MODIFICATION D'UN CHAMP
    const updateInput = (
        field: keyof UpdatePresence,
        value: string | null
    ) => {
        setInputs((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    // SÉLECTION / DÉSÉLECTION D'UN COLLABORATEUR
    function onSelect(
        UserId: number,
        SalaryId: number,
        PlanningId: number,
        EnterpriseId: number
    ) {
        setInputs((prev) => {
            const index = prev.usersId.indexOf(UserId);

            // Si le collaborateur est déjà sélectionné,
            // retirer également ses identifiants associés.
            if (index !== -1) {
                return {
                    ...prev,
                    usersId: prev.usersId.filter((_, i) => i !== index),
                    salariesId: prev.salariesId.filter((_, i) => i !== index),
                    planningsId: prev.planningsId.filter((_, i) => i !== index),
                    enterprisesId: prev.enterprisesId.filter((_, i) => i !== index),
                };
            }

            // Sinon ajouter le collaborateur et ses identifiants.
            return {
                ...prev,
                usersId: [...prev.usersId, UserId],
                salariesId: [...prev.salariesId, SalaryId],
                planningsId: [...prev.planningsId, PlanningId],
                enterprisesId: [...prev.enterprisesId, EnterpriseId],
            };
        });
    }

    // SÉLECTIONNER TOUS LES COLLABORATEURS
    function selectAllUser() {
        const selectedUsers = onSelectAllUser();

        setInputs((prev) => ({
            ...prev,
            usersId: selectedUsers.getUsersId,
            salariesId: selectedUsers.getSalariesId,
            planningsId: selectedUsers.getPlanningId,
            enterprisesId: selectedUsers.getEnterprisesId,
        }));
    }

    // DÉSÉLECTIONNER TOUS LES COLLABORATEURS
    function deselectAllUser() {
        setInputs((prev) => ({
            ...prev,
            usersId: [],
            salariesId: [],
            planningsId: [],
            enterprisesId: [],
        }));
    }

    // RECHERCHER UN COLLABORATEUR
    function onSearch(value: string) {
        const searchValue = value.trim().toLowerCase();

        const filteredUsers = users.filter((item) =>
            `${item?.firstname ?? ""} ${item?.lastname ?? ""}`
                .toLowerCase()
                .includes(searchValue)
        );

        setUsersCloned(filteredUsers);
    }

    // SOUMISSION
    const handleSubmit = async () => {
        if (!inputs.date) {
            return toast.error(
                "Champs invalides",
                "Veuillez renseigner la date à modifier"
            );
        }

        if (inputs.usersId.length === 0) {
            return toast.error(
                "Aucun collaborateur",
                "Veuillez sélectionner au moins un collaborateur."
            );
        }

        try {
            setIsLoadingBtn(true);

            const res = await providers.API.post<AttendancesListDto>(
                providers.APIUrl,
                "attendances/from-admin",
                null,
                inputs
            );

            toast.success(
                "Bravo",
                "Horaires modifiées avec succès"
            );

            const parsedRes = res.data.filter(
                (item) => item.mounth === new Date().getMonth()
            );

            localStorage.setItem(
                "presencesData",
                JSON.stringify(parsedRes)
            );

            // Actualisation des listes locales
            setPresencesListCloned(parsedRes);
            setPresencesList(parsedRes);

            setInputs({
                ...INITIAL_INPUTS,
            });

        } catch (error) {
            console.error(error);

            toast.error(
                "Erreur",
                error instanceof Error
                    ? error.message
                    : "Une erreur inconnue est survenue."
            );

        } finally {
            setIsLoadingBtn(false);
        }
    };

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center overflow-hidden bg-slate-950/60 p-2 backdrop-blur-sm sm:p-4">

            <div className="flex max-h-[96dvh] w-full max-w-3xl min-w-0 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:rounded-3xl dark:border-slate-700 dark:bg-slate-900">

                {/* HEADER */}
                <div className="shrink-0 border-b border-slate-100 px-4 py-4 sm:px-7 sm:py-5 dark:border-slate-700">

                    <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500/10 text-orange-500 sm:h-12 sm:w-12">
                            <FontAwesomeIcon
                                icon={faClock}
                                className="text-lg sm:text-xl"
                            />
                        </div>

                        <div className="min-w-0">
                            <h2 className="text-lg font-bold text-slate-700 sm:text-2xl dark:text-white">
                               Ajouter ou modifier une présence
                            </h2>

                            <p className="mt-1 text-xs text-slate-500 sm:text-sm dark:text-slate-400">
                                Modifiez les horaires des collaborateurs.
                            </p>
                        </div>

                    </div>

                </div>

                {/* CONTENU SCROLLABLE */}
                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-7 sm:py-5">

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
                                placeholder="Recherchez un collaborateur..."
                                onChange={(e) => onSearch(e.target.value)}
                                className={`${inputClass} pr-11`}
                            />

                            <FontAwesomeIcon
                                icon={faSearch}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                            />

                        </div>

                    </div>

                    {/* HORAIRES */}
                    <div className="mb-5">

                        <div className="mb-3 flex items-center gap-2">
                            <FontAwesomeIcon
                                icon={faClock}
                                className="text-sm text-orange-500"
                            />

                            <h3 className="text-sm font-semibold text-slate-700 dark:text-white">
                                Horaires de présence
                            </h3>
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

                            {/* ARRIVÉE */}
                            <div className="min-w-0">

                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Arrivée
                                </label>

                                <input
                                    type="time"
                                    value={inputs.arrivalTime ?? ""}
                                    onChange={(e) =>
                                        updateInput(
                                            "arrivalTime",
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                />

                            </div>

                            {/* PAUSE */}
                            <div className="min-w-0">

                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Pause
                                </label>

                                <input
                                    type="time"
                                    value={inputs.breakStartTime ?? ""}
                                    onChange={(e) =>
                                        updateInput(
                                            "breakStartTime",
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                />

                            </div>

                            {/* REPRISE */}
                            <div className="min-w-0">

                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Reprise
                                </label>

                                <input
                                    type="time"
                                    value={inputs.resumeTime ?? ""}
                                    onChange={(e) =>
                                        updateInput(
                                            "resumeTime",
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                />

                            </div>

                            {/* DÉPART */}
                            <div className="min-w-0">

                                <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-slate-200">
                                    Départ
                                </label>

                                <input
                                    type="time"
                                    value={inputs.departureTime ?? ""}
                                    onChange={(e) =>
                                        updateInput(
                                            "departureTime",
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                />

                            </div>

                            {/* DATE */}
                            <div className="min-w-0 sm:col-span-2 lg:col-span-1">

                                <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">

                                    <FontAwesomeIcon
                                        icon={faCalendarAlt}
                                        className="text-orange-500"
                                    />

                                    Date
                                </label>

                                <input
                                    type="date"
                                    value={inputs.date}
                                    onChange={(e) =>
                                        updateInput(
                                            "date",
                                            e.target.value
                                        )
                                    }
                                    className={inputClass}
                                />

                            </div>

                        </div>

                    </div>

                    {/* SÉLECTION DES COLLABORATEURS */}
                    <div className="mb-4">

                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">

                            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-white">

                                <FontAwesomeIcon
                                    icon={faUsers}
                                    className="text-orange-500"
                                />

                                Collaborateurs
                            </h3>

                            <span className="rounded-full bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                {inputs.usersId.length} sélectionné(s)
                            </span>

                        </div>

                        {/* BOUTONS */}
                        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-2">

                            <button
                                type="button"
                                onClick={selectAllUser}
                                disabled={isLoading || usersCloned.length === 0}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faUsers} />
                                Tout sélectionner
                            </button>

                            <button
                                type="button"
                                onClick={deselectAllUser}
                                disabled={inputs.usersId.length === 0}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-md transition-colors hover:bg-orange-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <FontAwesomeIcon icon={faFolderOpen} />
                                Tout désélectionner
                            </button>

                        </div>

                        {/* LISTE */}
                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-2 sm:p-3 dark:border-slate-700 dark:bg-slate-800">

                            <div className="max-h-[32vh] min-h-[160px] space-y-2 overflow-y-auto overscroll-contain pr-1 sm:max-h-[280px]">

                                {/* COLLABORATEURS */}
                                {usersCloned.length > 0 && !isLoading && (
                                    usersCloned.map((user) => {

                                        const selected = inputs.usersId.includes(user.id);

                                        return (
                                            <label
                                                key={user.id}
                                                className={`flex min-w-0 cursor-pointer items-center justify-between gap-3 rounded-xl border p-3 transition-all ${
                                                    selected
                                                        ? "border-blue-400 bg-blue-50 dark:border-blue-500/50 dark:bg-blue-500/10"
                                                        : "border-transparent bg-white hover:border-blue-300 hover:bg-blue-50 dark:bg-slate-900 dark:hover:bg-slate-700"
                                                }`}
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

                                                        <h4 className="break-words text-sm font-semibold text-slate-700 sm:text-base dark:text-white">
                                                            {user.firstname} {user.lastname}
                                                        </h4>

                                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                                            Collaborateur
                                                        </p>

                                                    </div>

                                                </div>

                                                <input
                                                    type="checkbox"
                                                    checked={selected}
                                                    onChange={() =>
                                                        onSelect(
                                                            user.id,
                                                            user.SalaryId,
                                                            user.PlanningId,
                                                            user.EnterpriseId
                                                        )
                                                    }
                                                    className="h-5 w-5 shrink-0 cursor-pointer accent-blue-600"
                                                />

                                            </label>
                                        );
                                    })
                                )}

                                {/* CHARGEMENT */}
                                {usersCloned.length === 0 && isLoading && (
                                    <div className="flex min-h-[160px] items-center justify-center">

                                        <div className="flex flex-col items-center gap-3">

                                            <FontAwesomeIcon
                                                icon={faSpinner}
                                                className="animate-spin text-3xl text-orange-400"
                                            />

                                            <p className="text-xs text-slate-500">
                                                Chargement des collaborateurs...
                                            </p>

                                        </div>

                                    </div>
                                )}

                                {/* AUCUN RÉSULTAT */}
                                {usersCloned.length === 0 && !isLoading && (
                                    <div className="flex min-h-[160px] flex-col items-center justify-center gap-3 text-center">

                                        <FontAwesomeIcon
                                            icon={faFolderOpen}
                                            className="text-3xl text-orange-400"
                                        />

                                        <div>
                                            <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                                                Aucun collaborateur trouvé
                                            </p>

                                            <p className="mt-1 text-xs text-slate-400">
                                                Essayez une autre recherche.
                                            </p>
                                        </div>

                                    </div>
                                )}

                            </div>

                        </div>

                    </div>

                </div>

                {/* FOOTER FIXE */}
                <div className="shrink-0 border-t border-slate-100 bg-white px-4 py-3 sm:px-7 sm:py-4 dark:border-slate-700 dark:bg-slate-900">

                    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

                        <p className="text-center text-xs text-slate-400 sm:text-left">
                            {inputs.usersId.length} collaborateur(s) sélectionné(s)
                        </p>

                        <button
                            type="button"
                            disabled={loadingBtn}
                            onClick={handleSubmit}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:from-blue-800 hover:to-blue-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-[170px]"
                        >

                            {loadingBtn ? (
                                <>
                                    <FontAwesomeIcon
                                        icon={faSpinner}
                                        className="animate-spin"
                                    />

                                    Traitement...
                                </>
                            ) : (
                                "Soumettre les modifications"
                            )}

                        </button>

                    </div>

                </div>

            </div>

        </div>
    );
}
