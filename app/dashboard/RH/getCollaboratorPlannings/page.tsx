"use client";
import { useEffect, useState } from "react";
import { providers } from "@/index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSearch, faChevronLeft, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { tablesModal } from "@/components/Tables/tablesModal";
import Swal from "sweetalert2";

type UsersDatas = {
    id: number,
    firstname: string | null | undefined,
    lastname: string | null | undefined,
    phone: string | null | undefined,
    address: string | null | undefined,
    birthDate: string | null | undefined,
    email: string | null | undefined,
    status: boolean | null,
    gender: string | null | undefined,
    photo: string | null | undefined,
    Enterprise: {
        name: string | null | undefined,
        logo: string | null | undefined
    },

}

type WeekDaysPlannings = {
    id: number,
    WeekDaysId: number,
    PlanningTypeId: number,
    PlanningId: number,
    EnterpriseId: number,
    Enterprise: {
        name: string | null,
        logo: string | null
    }
    WeekDays: {
        name: string,
    },
    PlanningType: {
        title: string,
    },
    Planning: {
        startTime: string,
        breakingStartTime: string,
        resumeEndTime: string,
        endTime: string
    },
    UserId: number,
    User: {
        firstname: string,
        lastname: string,
        photo: string | null,
    }
}
import { useSession } from "next-auth/react";
export default function WeekDaysPlanningsList() {
    const [search, setSearch] = useState("");
    // page courante                         // items par page
    const [usersList, setUsersList] = useState<UsersDatas[]>([]);
    const [savedUsersList, setSavedUsersList] = useState<UsersDatas[]>([]);
    const [weekDaysPlannings, setWeekDaysPlannings] = useState<WeekDaysPlannings[]>([])
    const [weekDaysPlanningsSaved, setWeekDaysPlanningsSaved] = useState<WeekDaysPlannings[]>([])

    const [getAdminRole, setAdminRole] = useState<string | null>(null);
    const [loading, setIsLoading] = useState(false);
    const requireAdminRoles = ['Super-Admin', 'Supervisor-Admin'];

    const [page, setPage] = useState(1);
    const limit = 5;                                 // items par page
    const [maxPage, setMaxPage] = useState(0);
    const [start, setStart] = useState(1);


    useEffect(() => {
        (() => {
            const maxPage = Math.ceil(weekDaysPlannings?.length / limit);

            setMaxPage(maxPage);
            setPage(maxPage);

        })()
    }, [weekDaysPlanningsSaved])

    const { data: session, status } = useSession()

    useEffect(() => {
        (async () => {
            if (status !== "authenticated" || !session?.user) return;
            const EnterpriseId = Number(session.user.EnterpriseId);
            console.log(EnterpriseId)
            const userId = Number(session.user.id);
            const request = await providers.API.getAll("https://vps118934.serveur-vps.net:4001", "getAllCollaboratorPlannings", null);
            console.log("le requete", request)
            console.log(EnterpriseId)
            if (Number(EnterpriseId) === 1) {
                const filterWeekDaysPlanningsByEnterpriseId = request.filter((item: { EnterpriseId: number }) => [1, 2, 3, 4, null].includes(item.EnterpriseId))
                setWeekDaysPlannings(filterWeekDaysPlanningsByEnterpriseId);
                setWeekDaysPlanningsSaved(filterWeekDaysPlanningsByEnterpriseId);
                return;
            }
            const filterWeekDaysPlanningsByEnterpriseId = request.filter((item: { EnterpriseId: number }) => item.EnterpriseId === (Number(EnterpriseId)))
            setWeekDaysPlannings(filterWeekDaysPlanningsByEnterpriseId);
            setWeekDaysPlanningsSaved(filterWeekDaysPlanningsByEnterpriseId);
        })();
    }, [session]);


    // 🔎 Filtrer par recherche
    function onSearch(value: string) {
        let filtered = weekDaysPlannings.filter(item => item?.User?.lastname?.toLowerCase()?.includes(value.toLowerCase()) || item?.User?.firstname?.toLowerCase()?.includes(value.toLowerCase()));
        setWeekDaysPlanningsSaved(filtered)
    }

    // 📑 Pagination

    const arrayUsersRefactory = weekDaysPlanningsSaved

    return (
        <div>
            <div className="flex justify-center w-full mx-auto">
                <main className='m-4  w-full text-gray-700 dark:text-gray-300 dark:bg-transparent'>
                    {
                        tablesModal.map((e, index) => (
                            <div key={index} className="flex flex-col gap-4 border-b border-slate-100 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                                {/* Titre et Sous-titre */}
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                                        {e.weekDaysPlanningList.pageTitle}
                                    </h1>
                                    <p className="mt-1 text-base text-slate-500 dark:text-slate-400">
                                        Modifiez ou ajustez le planning de vos collaborateurs.
                                    </p>
                                </div>

                                {/* Fil d'Ariane (Breadcrumb) à droite */}
                                <div className="hidden items-center gap-1.5 text-base text-slate-500 xl:flex dark:text-slate-400">
                                    <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">Dashboard</span>
                                    <span className="text-slate-300 dark:text-slate-700">/</span>
                                    <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">RH</span>
                                    <span className="text-slate-300 dark:text-slate-700">/</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">Liste des collaborateurs au planning</span>
                                </div>
                            </div>
                        ))
                    }
                    <hr className='' />
                    <div className="flex flex-col space-y-4 xl:space-y-0  lg:flex-row items-center justify-between">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between my-6">
                            {/* Barre de recherche */}
                            <div className="relative w-full sm:w-[250px]">
                                <input
                                    type="text"
                                    placeholder="Rechercher un profil..."
                                    value={search}
                                    onChange={(e) => {
                                        setSearch(e.target.value);
                                        onSearch(e.target.value);
                                        setPage(1); // Reset de la page lors de la frappe
                                    }}
                                    className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-colors focus:border-slate-400 dark:border-slate-800 dark:bg-transparent dark:text-white dark:placeholder:text-slate-500 dark:focus:border-slate-600"
                                />
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400 dark:text-slate-500"
                                />
                            </div>

                            {/* Actions / Liens */}
                            <div className="flex flex-wrap items-center gap-3">
                                {tablesModal.flatMap((e) =>
                                    e.weekDaysPlanningList.links.map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href || "#"}
                                            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-base font-medium text-white shadow-sm transition-colors hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
                                        >
                                            <FontAwesomeIcon icon={item.icon} className="text-base text-white" />
                                            <span>{item.title}</span>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 🧾 Tableau */}
                    <div className="mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                                {/* Header */}
                                <thead className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        {tablesModal.map((e) =>
                                            e.weekDaysPlanningList.table.titles.map((item) => (
                                                <th
                                                    key={item.title}
                                                    className="px-6 py-4 text-sm text-left font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap dark:text-slate-400"
                                                >
                                                    {item.title}
                                                </th>
                                            ))
                                        )}
                                    </tr>
                                </thead>

                                {/* Body */}
                                <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-900">
                                    {weekDaysPlanningsSaved.length > 0 ? (
                                        weekDaysPlanningsSaved.slice(start, start + limit).map((u, idx) => (
                                            <tr
                                                key={u.id || idx}
                                                className="transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                            >
                                                {/* Photo */}
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <img
                                                        src={u.User?.photo ? `${providers.APIUrl}/images/${u.User?.photo}` : "/images/clientProfile.png"}
                                                        alt=""
                                                        className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                                                    />
                                                </td>

                                                {/* Nom du collaborateur */}
                                                <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-slate-900 dark:text-white">
                                                    {u.User?.firstname} {u.User?.lastname}
                                                </td>

                                                {/* Jour de la semaine */}
                                                <td className="px-6 py-4 whitespace-nowrap text-base text-slate-600 dark:text-slate-300">
                                                    {u.WeekDays?.name}
                                                </td>

                                                {/* Type de planification */}
                                                <td className="px-6 py-4 whitespace-nowrap text-base text-slate-600 dark:text-slate-300">
                                                    {u.PlanningType?.title}
                                                </td>

                                                {/* Horaires */}
                                                <td className="px-6 py-4 whitespace-nowrap text-base font-medium text-slate-600 dark:text-slate-300">
                                                    {(() => {
                                                        const formatTime = (isoString?: string | null) => {
                                                            if (!isoString) return null;
                                                            return isoString.split('T')[1]?.slice(0, 5) || null;
                                                        };

                                                        const start = formatTime(u.Planning?.startTime);
                                                        const breakStart = formatTime(u.Planning?.breakingStartTime);
                                                        const resume = formatTime(u.Planning?.resumeEndTime);
                                                        const end = formatTime(u.Planning?.endTime);

                                                        const hasBreak = breakStart && resume;

                                                        return (
                                                            <span className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                                                              
                                                                <span>{start} - {hasBreak ? breakStart : end}</span>
                                                                {hasBreak && (
                                                                    <>
                                                                        <span className="text-slate-400">|</span>
                                                                        <span>{resume} - {end}</span>
                                                                    </>
                                                                )}
                                                            </span>
                                                        );
                                                    })()}
                                                </td>

                                                {/* Entreprise / Logo */}
                                                <td className="px-6 py-4 whitespace-nowrap text-base text-slate-600 dark:text-slate-300">
                                                    {u.Enterprise?.logo ? (
                                                        <img
                                                            src={`${providers.APIUrl}/images/${u.Enterprise?.logo}`}
                                                            className="h-8 w-8 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                                                            alt=""
                                                        />
                                                    ) : (
                                                        u.Enterprise?.name
                                                    )}
                                                </td>

                                                {/* Actions */}
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-base font-medium">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                if (!requireAdminRoles.includes(getAdminRole ?? "")) {
                                                                    return Swal.fire({
                                                                        icon: "warning",
                                                                        title: "Violation d'accès!",
                                                                        text: "Vous n'avez aucun droit d'effectuer cette opération. Veuillez contacter votre administrateur local",
                                                                        customClass: { confirmButton: 'bg-blue-600 text-white rounded-lg px-4 py-2' }
                                                                    });
                                                                }
                                                                Swal.fire({
                                                                    icon: "warning",
                                                                    title: "Voulez-vous supprimer ce collaborateur du planning ?",
                                                                    showCancelButton: true,
                                                                    cancelButtonText: "Annuler",
                                                                    confirmButtonText: "Oui, supprimer",
                                                                    confirmButtonColor: "#ef4444",
                                                                    cancelButtonColor: "#64748b"
                                                                }).then(async (confirmed) => {
                                                                    if (confirmed.isConfirmed) {
                                                                        const response = await providers.API.delete(providers.APIUrl, "deleteUserInPlanningOfWeek", u.id, {});
                                                                        providers.alertMessage(response.status, response.title, response.message, "/dashboard/RH/getUsersInPlanningOfWeek");
                                                                    }
                                                                });
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                            title="Supprimer du planning"
                                                        >
                                                            🗑️
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center">
                                                <div className="flex flex-col items-center justify-center">
                                                    <div className="mb-3 text-4xl opacity-70">📂</div>
                                                    <h3 className="text-base font-semibold text-slate-700 dark:text-slate-200">
                                                        Aucune donnée trouvée
                                                    </h3>
                                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                                        Il n'y a actuellement aucune planification enregistrée pour cette sélection.
                                                    </p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Pagination */}
                    <div className="my-6 flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-white py-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row">
                        {/* Informations de pagination */}
                        <div className="flex items-center gap-2">
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                Affichage de la page
                            </p>
                            <div className="inline-flex text-sm items-center gap-1 rounded-md bg-slate-50 px-2.5 py-1 text-base font-semibold text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800">
                                <span>{page}</span>
                                <span className="text-slate-400 dark:text-slate-600">/</span>
                                <span>{maxPage}</span>
                            </div>
                        </div>

                        {/* Navigation */}
                        <div className="flex items-center gap-2">
                            <button
                                disabled={page === 1}
                                onClick={() => {
                                    setPage(page - 1);
                                    setStart(start + 1);
                                }}
                                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-base font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                            >
                                <FontAwesomeIcon icon={faChevronLeft} className="h-4 w-4" />
                                Précédent
                            </button>

                            <button
                                disabled={page === maxPage}
                                onClick={() => {
                                    setPage((prev) => prev + 1);
                                    setStart(start - 1);
                                }}
                                className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-200 bg-white px-5 text-base font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                            >
                                Suivant
                                <FontAwesomeIcon icon={faChevronRight} className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
