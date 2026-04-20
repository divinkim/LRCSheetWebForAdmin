"use client";
import { useEffect, useState } from "react";
import { providers } from "@/index";
import { faChevronLeft, faChevronRight, faSearch, faTimes } from "@fortawesome/free-solid-svg-icons";
import { tablesModal } from "@/components/Tables/tablesModal";
import Link from "next/link";
import { ClipLoader } from "react-spinners";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { getOriginalStackFrames } from "next/dist/next-devtools/shared/stack-frame";
import Swal from "sweetalert2";
import { PresencesListHookModal } from "./hook";
import AddPresenceModal from "./addPresenceModal/page";
import UpdatePresenceModal from "./updatePresenceModal/page";

export default function PresencesList() {
    const { presencesListCloned, adminRole, onSearch, } = PresencesListHookModal();

    const [page, setPage] = useState(0);             // page courante
    const limit = 5;                                 // items par page
    const [showAddPresenceModal, setShowAddPresenceModal] = useState(false);
    const [showUpdatePresenceModal, setShowUpdatePresenceModal] = useState(false);
    const [maxPage, setMaxPage] = useState(0);
    const requireAdminRoles = ['Super-Admin', 'Supervisor-Admin'];
    const [start, setStart] = useState(1);

    useEffect(() => {
        (() => {
            const maxPage = Math.ceil(presencesListCloned?.length / limit);

            setMaxPage(maxPage);
            setPage(maxPage);

        })()
    }, [presencesListCloned])

    const startPage = (start - 1) * limit;

    // 📑 Pagination

    // const selectAllUser = () => {
    //     const allIds = presencesList.filter(user => user.UserId && user?.EnterpriseId && user?.SalaryId);
    //     const getEnterprisesIds = allIds.map(item => item.EnterpriseId);
    //     const getUsersIds = allIds.map(item => item.UserId);
    //     const getSalariesIds = allIds.map(item => item.SalaryId);

    //     setAddPresenceInputs({
    //         ...addPresenceInputs,
    //         usersIds: getUsersIds,
    //         enterprisesIds: getEnterprisesIds,
    //         salariesIds: getSalariesIds
    //     }
    //     );
    //     setUpdatePresenceInputs({
    //         ...updatePresenceInputs,
    //         usersIds: getUsersIds
    //     })
    // }
    // const deselectAllUser = () => {
    //     setAddPresenceInputs({
    //         ...addPresenceInputs,
    //         usersIds: [],
    //         enterprisesIds: [],
    //         salariesIds: []
    //     });
    //     setUpdatePresenceInputs({
    //         ...updatePresenceInputs,
    //         usersIds: [],
    //     })
    // }

    return (
        <div>
            <div className="flex">
                <main className='dark:bg-transparent w-full text-gray-700 dark:text-gray-300'>
                    {/*Modal d'ajout de présence */}
                    <div className="relative">
                        {
                            showAddPresenceModal && (<AddPresenceModal />)
                        }
                        {
                            showUpdatePresenceModal && (<UpdatePresenceModal />)
                        }
                        <div className={showAddPresenceModal || showUpdatePresenceModal ? "absolute z-20 right-10 top-10" : "hidden"}>
                            <FontAwesomeIcon onClick={() => {
                                setShowAddPresenceModal(false);
                                setShowUpdatePresenceModal(false);
                            }} icon={faTimes} className="text-[20px] cursor-pointer text-white" />
                        </div>
                    </div>
                    {
                        tablesModal.map((e) => (
                            <div className="flex font-semibold justify-between px-4 items-center">
                                <h1 className="text-[20px] my-4 font-bold dark:text-gray-300">{e.presencesList.pageTitle}  </h1>
                                <button className='text-blue-700 dark:text-blue-600 hidden xl:block'>{e.presencesList.path}</button>
                            </div>
                        ))
                    }
                    <div className="px-4 mx-auto">
                        <hr className='' />
                        <div className="flex flex-col space-y-4 xl:space-y-0  lg:flex-row items-center justify-between">
                            <div className="relative z-10 w-[250px]">
                                <input
                                    type="text"
                                    placeholder="Rechercher un profil..."
                                    className="border border-gray-400 outline-none dark:border-gray-300 dark:bg-transparent px-3 py-2.5 rounded-md my-6 w-full"

                                    onChange={(e) => {
                                        onSearch(e.target.value, "");
                                    }}
                                />
                                <FontAwesomeIcon icon={faSearch} className="absolute text-gray-400 right-3 top-[38px]" />
                            </div>
                            <div className="flex flex-col lg:flex-row items-center space-y-4 lg:space-y-0 lg:space-x-4">
                                {
                                    tablesModal.map((e) => (
                                        e.presencesList.links.map((item) => (
                                            <Link href={item.href} onClick={() => {
                                                if (!requireAdminRoles.includes(adminRole ?? "")) {
                                                    Swal.fire({
                                                        icon: 'warning',
                                                        title: "Violation d'accès!",
                                                        text: "Vous n'avez aucun droit d'effectuer cette action. Contacter votre administrateur de gestion",
                                                        showConfirmButton: false,
                                                    });
                                                    return setTimeout(() => {
                                                        window.location.href = "/dashboard/RH/presencesList"
                                                    }, 1500)
                                                }
                                                if (item.href === "") {
                                                    item.modal === "addPresenceModal" ? setShowAddPresenceModal(!showAddPresenceModal) : setShowUpdatePresenceModal(!showUpdatePresenceModal)
                                                }
                                            }} className="bg-blue-800 rounded-md hover:bg-blue-900 ease duration-500 py-3 px-4">
                                                <FontAwesomeIcon icon={item.icon} className="text-white" />
                                                <span className='text-white font-semibold  lg:text-normal'> {item.title}</span>
                                            </Link>
                                        ))

                                    ))
                                }
                            </div>
                        </div>
                        {/* 🧾 Tableau */}
                        <table className="border w-full mt-10 lg:mt-0">
                            <thead>
                                <tr className="bg-gray-800 dark:bg-transparent ">

                                    {
                                        tablesModal.map((item) => (
                                            item.presencesList.table.titles.map((e) => (
                                                <th className="border font-normal py-2 xl:px-5 border-gray-400 dark:border-gray-300 text-gray-200  2xl:px-10 px-2 dark:text-gray-300">{e.title}</th>
                                            ))
                                        ))
                                    }
                                </tr>
                            </thead>

                            <tbody className="w-full">
                                {
                                    presencesListCloned.length > 0 ? presencesListCloned.slice(startPage, startPage + limit).map((u) => (
                                        <tr className="">
                                            <td className="border p-2 border-gray-400 dark:border-gray-300">
                                                {u.User?.photo ? <img src={`${providers.APIUrl}/images/${u.User?.photo}`} className="w-[50px] mx-auto h-[50px] object-cover rounded-full" alt="" /> : <p className="text-center text-[40px]">
                                                    🧑‍💼
                                                </p>}
                                            </td>
                                            <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.User?.lastname} {u.User?.firstname}</td>
                                            <td className="border p-2 border-gray-400 dark:border-gray-300 dark:text-gray-300 text-center font-semibold">{u.arrivalTime === "00:00:00" ? "--" : u.arrivalTime} - {u?.breakStartTime ?? "--"}</td>
                                            <td className="border p-2 border-gray-400 dark:border-gray-300 dark:text-gray-300 text-center font-semibold">{u?.resumeTime ?? "--"} - {u?.departureTime ?? "--"}</td>
                                            {/* <td className="border p-2 border-gray-400 dark:border-gray-300 dark:text-gray-300 text-center font-semibold">{u.Planning?.startTime ? u.Planning.startTime.slice(0, 5) : "--"} - {u.Planning?.endTime ? u.Planning.endTime.slice(0, 5) : "--"}</td> */}
                                            <td className="border w-[155px] p-2 border-gray-400 dark:border-gray-300 dark:text-gray-300 text-center font-semibold">{new Date(u.createdAt ?? "").toLocaleDateString('fr-Fr', {
                                                day: "numeric",
                                                weekday: "short",
                                                month: "short",
                                                year: "numeric",
                                            })}</td>
                                            <td className="p-2 border border-gray-400 dark:border-gray-300 dark:text-gray-300 text-center font-semibold">{u.Enterprise?.logo ? <img src={`${providers.APIUrl}/images/${u.Enterprise?.logo}`} className="w-[50px] mx-auto h-[50px] object-cover rounded-full" alt="" /> : u.Enterprise?.name}</td>

                                            <td className="p-2 border border-gray-400 dark:border-gray-300 dark:text-gray-300 text-center font-semibold">{u.status === "A temps" ? "✅ A temps" : u.status === "En retard" ? "⏳ En retard" : "❌ Absent"}</td>

                                            <td className="text-center font-semibold border w-[155px]  space-x-3  h-auto p-2 border-gray-400 dark:border-gray-300">
                                                <button onClick={() => {
                                                    if (!requireAdminRoles.includes(adminRole ?? "")) {
                                                        return providers.alertMessage(false, "violation d'accès!", "Vous n'avez aucun droit d'effectuer cette action. Veuillez contacter votre administrateur local.", null)
                                                    }
                                                    window.location.href = "/dashboard/RH/getAllPresencesOfUser/" + u.UserId
                                                }} className="bg-gray-300 hover:scale-105 ease duration-500 p-2 rounded-md">
                                                    <p className="text-center">👁️</p>
                                                </button>

                                                {/* <button onClick={() => {
                                                if (!requireAdminRoles.includes(adminRole ?? "")) {
                                                    return providers.alertMessage(false, "violation d'accès!", "Vous n'avez aucun droit d'effectuer cette action. Veuillez contacter votre administrateur local.", null)
                                                }
                                                setShowUpdatePresenceModal(!showUpdatePresenceModal);
                                                setCreatedAt(u.createdAt);
                                                onSearch(u.UserId?.toString() ?? "");
                                            }} className="bg-gray-300 hover:scale-105 ease duration-500 p-2 rounded-md">
                                                <p className="text-center">🖊️</p>
                                            </button> */}

                                                <button onClick={async () => {
                                                    if (!requireAdminRoles.includes(adminRole ?? "")) {
                                                        return providers.alertMessage(false, "violation d'accès!", "Vous n'avez aucun droit d'effectuer cette action. Veuillez contacter votre administrateur local.", null)
                                                    }
                                                    const response = await providers.API.delete(providers.APIUrl, "deleteUserAttendance", u.UserId, { createdAt: u.createdAt });
                                                    providers.alertMessage(response.status, response.title, response.message, response.status ? "/dashboard/RH/presencesList" : null);
                                                }} className="bg-gray-300 hover:scale-105 ease duration-500 p-2 rounded-md">
                                                    <p className="text-center">🗑️</p>
                                                </button>
                                            </td>
                                        </tr>
                                    )) :
                                        <p className="text-center absolute left-1/2 right-1/2 w-[200px] mt-3">
                                            Aucune donnée trouvée
                                        </p>
                                }

                            </tbody>
                        </table>
                        {/* 🔄 Pagination */}
                        <div className="flex items-center justify-center  gap-4 my-10">
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
                                        <span className="relative top-[1px]"><FontAwesomeIcon icon={faChevronLeft} /></span> précédent
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
                    </div>
                </main>
            </div>
        </div>
    );
}
