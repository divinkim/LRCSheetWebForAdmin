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


    useEffect(() => {
        if (typeof (window) === "undefined") return;
        (async () => {
            const getAdminRole = window?.localStorage.getItem("adminRole");
            setAdminRole(getAdminRole);

            const authToken = window?.localStorage.getItem("authToken");
            if (authToken === null) {
                window.location.href = "/"
            }

            let EnterpriseId = window?.localStorage.getItem("EnterpriseId");

            const request = await providers.API.getAll(providers.APIUrl, "getAllUsersPlanningsOfWeek", null);
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
    }, []);

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
                        tablesModal.map((e) => (
                            <div className="flex font-semibold justify-between items-center">
                                <h1 className="text-[20px] my-4 font-bold dark:text-gray-300">{tablesModal[0].weekDaysPlanningList.pageTitle}  </h1>
                                <p className='text-blue-700 dark:text-blue-600 hidden xl:block'>{tablesModal[0].weekDaysPlanningList.pageTitle}</p>
                            </div>
                        ))
                    }
                    <hr className='' />
                    <div className="flex flex-col space-y-4 xl:space-y-0  lg:flex-row items-center justify-between">
                        <div className="relative w-[250px]">
                            <input
                                type="text"
                                placeholder="Rechercher un profil..."
                                className="border  outline-none border-gray-300 dark:bg-transparent px-3 py-2.5 rounded-md my-6 w-full"
                                value={search}
                                onChange={(e) => {
                                    setSearch(e.target.value)
                                    onSearch(e.target.value)
                                    setPage(1); // reset page quand on tape
                                }}
                            />
                            <FontAwesomeIcon icon={faSearch} className="absolute text-gray-400 right-3 top-[38px]" />
                        </div>
                        {
                            tablesModal.map((e) => (
                                e.weekDaysPlanningList.links.map((item) => (
                                    <Link href={item.href} className="bg-blue-800 rounded-md hover:bg-blue-900 ease duration-500 py-3 px-4">
                                        <FontAwesomeIcon icon={item.icon} className="text-white" />
                                        <span className='text-white font-semibold'> {item.title}</span>
                                    </Link>
                                ))

                            ))
                        }
                    </div>

                    {/* 🧾 Tableau */}
                    <table className="border w-full mx-auto">
                        <thead>
                            <tr className="bg-gray-800 dark:bg-transparent ">
                                {
                                    tablesModal.map((e) => (
                                        e.weekDaysPlanningList.table.titles.map((item) => (
                                            <th className="border py-2 xl:px-5 border-gray-400 dark:border-gray-300 text-gray-300  2xl:px-10 px-2 dark:text-gray-300">{item.title}</th>
                                        ))
                                    ))
                                }
                            </tr>
                        </thead>

                        <tbody className="w-full">
                            {

                                weekDaysPlanningsSaved.length > 0 ? weekDaysPlanningsSaved.slice(start, start + limit).map((u) => (
                                    <tr className="">
                                        <td className="p-2 border-b flex justify-center items-center h-[120px] border-gray-400 dark:border-gray-300">

                                            <img src={u.User?.photo ? `${providers.APIUrl}/images/${u.User?.photo}` : "/images/clientProfile.png"} alt="" className="rounded-full w-[50px] h-[50px] object-cover" />
                                        </td>


                                        <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.User?.firstname} {u.User?.lastname}</td>
                                        <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.WeekDays.name}</td>
                                        <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.PlanningType.title}
                                        </td>
                                        <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.Planning.startTime?.slice(0, 5)}-{u.Planning.breakingStartTime?.slice(0, 5)}-{u.Planning.resumeEndTime?.slice(0, 5)}-{u.Planning.endTime?.slice(0, 5)}
                                        </td>
                                        <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.Enterprise?.logo ? <img src={`${providers.APIUrl}/images/${u.Enterprise?.logo}`} className="w-[50px] mx-auto h-[50px] object-cover rounded-full" alt="" /> : u.Enterprise?.name}
                                        </td>
                                        
                                        <td className="text-center font-semibold border border-gray-400 dark:border-gray-300">
                                            <div className="relative top-0 items-center justify-center px-2 space-x-3 flex ">
                                                <button className="bg-gray-300 hover:scale-105 ease duration-500 p-2 rounded-md" onClick={() => {
                                                    if (!requireAdminRoles.includes(getAdminRole ?? "")) {
                                                        return Swal.fire({
                                                            icon: "warning",
                                                            title: "Vioalation d'accès!",
                                                            text: "Vous n'avez aucun droit d'effectuer cette opération. Veuillez contacter votre administrateur local"
                                                        });
                                                    }
                                                }}>
                                                    <Link href={requireAdminRoles.includes(getAdminRole ?? "") ? `/dashboard/RH/updateUserInPlanningOfWeek/${u.id}` : ""} >
                                                        <p className="text-center">🖊️</p>
                                                    </Link>
                                                </button>
                                                <button type="button" onClick={() => {
                                                    if (!requireAdminRoles.includes(getAdminRole ?? "")) {
                                                        return Swal.fire({
                                                            icon: "warning",
                                                            title: "Violation d'accès!",
                                                            text: "Vous n'avez aucun droit d'effectuer cette opération. Veuillez contacter votre administrateur local"
                                                        })
                                                    }
                                                    Swal.fire({
                                                        icon: "warning",
                                                        title: "Voulez-vous supprimer ce collaborateur du planning? ",
                                                        showCancelButton: true,
                                                        cancelButtonText: "Annuler",
                                                        confirmButtonText: "Oui"
                                                    }).then(async (confirmed) => {
                                                        if (confirmed.isConfirmed) {
                                                            const response = await providers.API.delete(providers.APIUrl, "deleteUserInPlanningOfWeek", u.id, {});
                                                            providers.alertMessage(response.status, response.title, response.message, "/dashboard/RH/getUsersInPlanningOfWeek")
                                                        }
                                                    })
                                                }} className="bg-gray-300 hover:scale-105 ease duration-500 p-2 rounded-md">
                                                    <p className="text-center">🗑️</p>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                )) :
                                    <tr>
                                        <td>
                                            <p className="text-center absolute left-1/2 right-1/2 w-[200px] mt-3">
                                                Aucune donnée trouvée
                                            </p>
                                        </td>
                                    </tr>

                            }

                        </tbody>
                    </table>

                    {/* 🔄 Pagination */}
                    <div className="flex items-center justify-center  gap-4 mt-10">
                        <div className="flex flex-col">
                            <p className="text-center">Page {page} / {maxPage}</p>
                            <div className="flex flex-row mt-4 space-x-4">
                                <button
                                    className="px-4 py-3  font-semibold text-white ease duration-500 hover:bg-red-600 bg-red-500 rounded disabled:opacity-40"
                                    onClick={() => {
                                        setPage(page - 1);
                                        setStart(start + 1)
                                    }}
                                    disabled={page === 1}
                                >
                                    <span className="relative top-[1px]"><FontAwesomeIcon icon={faChevronLeft} /></span> Précédent
                                </button>
                                <button
                                    className="px-4 py-3 bg-green-500 ease duration-500 hover:bg-green-600 text-white font-semibold rounded disabled:opacity-40"
                                    onClick={() => {
                                        setPage(nextPage => nextPage + 1);
                                        setStart(start - 1)
                                    }}
                                    disabled={page === maxPage}
                                >
                                    Suivant<span className="relative top-[1px]"><FontAwesomeIcon icon={faChevronRight} /></span>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
