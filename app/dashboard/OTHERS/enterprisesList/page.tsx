"use client";
import { useEffect, useState } from "react";
import { providers } from "@/index";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronLeft, faChevronRight, faSearch } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { tablesModal } from "@/components/Tables/tablesModal";
import Swal from "sweetalert2";
// import TablesPage from "@/app/tables/page";

type EnterpriseType = {
    name: string,
    description: string,
    logo: string,
    activityDomain: string,
    phone: string,
    toleranceTime: string | null,
    maxToleranceTime: string | null,
    pourcentageOfHourlyDeduction: string | null,
    maxPourcentageOfHourlyDeduction: string | null,
    email: string,
    address: string,
    website: string | null,
    latitude: string,
    longitude: string,
    CityId: number | null,
    City: {
        name: string
    }
    CountryId: number | null,
    Country: {
        name: string
    },
    legalForm: string,
    rccm: string | null,
    nui: string | null,
    subscriptionType: string,
    subscriptionStatus: string,
    [key: string]: any

}

export default function UsersList() {
    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);             // page courante

    const [usersList, setEnterprisesList] = useState<EnterpriseType[]>([]);
    const [savedEnterprisesList, setSavedEnterprisesList] = useState<EnterpriseType[]>([]);
    const [getAdminRole, setAdminRole] = useState("");
    const limit = 5;                                 // items par page
    const [maxPage, setMaxPage] = useState(0);
    const [start, setStart] = useState(1);

    const [loading, setIsLoading] = useState(false);
    const requireAdminRoles = ['Super-Admin', 'Supervisor-Admin'];

    useEffect(() => {
        if (typeof (window) === "undefined") return;
        (async () => {
            const getAdminRole = window?.localStorage.getItem("adminRole");
            setAdminRole(getAdminRole ?? "");

            const authToken = window?.localStorage.getItem("authToken");
            if (authToken === null) {
                window.location.href = "/"
            }

            const enterprisesList = await providers.API.getAll(providers.APIUrl, "getEnterprises", null);
            setEnterprisesList(enterprisesList);
            setSavedEnterprisesList(enterprisesList)

        })()
    }, [getAdminRole]);

    // 🔎 Filtrer par recherche
    function onSearch(value: string) {
        let filtered = usersList.filter(item => item?.lastname?.toLocaleLowerCase()?.includes(value.toLocaleLowerCase()) || item?.firstname?.toLocaleLowerCase()?.includes(value.toLocaleLowerCase()));
        setSavedEnterprisesList(filtered)
    }

    // 📑 Pagination
    useEffect(() => {
        (() => {
            const maxPage = Math.ceil(savedEnterprisesList?.length / limit);

            setMaxPage(maxPage);
            setPage(maxPage);

        })()
    }, [savedEnterprisesList])

    const startPage = (start - 1) * limit;

    return (
        <div className="flex justify-center   mx-auto">
            <main className='m-4  text-gray-700 dark:text-gray-300 dark:bg-transparent'>
                {
                    tablesModal.map((e) => (
                        <div className="flex font-semibold justify-between items-center">
                            <h1 className="text-[20px] my-4 font-bold dark:text-gray-300">{e.enterprisesList.pageTitle}  </h1>
                            <p className='text-blue-700 dark:text-blue-600 hidden xl:block'>{e.enterprisesList.path}</p>
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
                            e.enterprisesList.links.map((item) => (
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
                                    e.enterprisesList.table.titles.map((item) => (
                                        <th className="border py-2 xl:px-5 border-gray-400 dark:border-gray-300 text-gray-300  2xl:px-10 px-2 dark:text-gray-300">{item.title}</th>
                                    ))
                                ))
                            }
                        </tr>
                    </thead>

                    <tbody className="w-full">

                        {

                            savedEnterprisesList.length > 0 ? savedEnterprisesList.slice(start, start + limit).map((u) => (
                                <tr className="">

                                    <td className="border p-2 border-gray-400 dark:border-gray-300">
                                        {u.photo ? <img src={`${providers.APIUrl}/images/${u.logo}`} className="w-[50px] mx-auto h-[50px] object-cover rounded-full" alt="" /> : <p className="text-center text-[40px]">
                                            🧑‍💼
                                        </p>}
                                    </td>

                                    <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{providers.reduceLengthOfText(u.description, 12)}</td>

                                    <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.activityDomain}</td>
                                    <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.phone}</td>
                                    <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.email}</td>
                                    <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">{u.subscriptionType}</td>
                                    <td className="border p-2 border-gray-400 dark:border-gray-300  text-center font-semibold dark:text-gray-300">
                                        {u.subscriptionStatus === "expired" ? <p className="bg-red-500 text-center p-3 rounded-md text-white">Expiré</p> : u.subscriptionStatus === "onGoing" ? <p className="bg-green-500 text-center p-3 rounded-md text-white">En cours</p> : ""}
                                    </td>
                                    <td className="text-center py-5 font-semibold border-b border-r  space-x-3 flex  h-auto p-2 border-gray-400 dark:border-gray-300">
                                        <Link onClick={() => {
                                            if (!requireAdminRoles.includes(getAdminRole ?? "")) {
                                                Swal.fire({
                                                    icon: 'warning',
                                                    title: "Violation d'accès!",
                                                    text: "Vous n'avez aucun droit d'effectuer cette action. Contacter votre administrateur de gestion",
                                                });
                                            }
                                        }} href={requireAdminRoles.includes(getAdminRole ?? "") ? `/dashboard/RH/getUserProfil/${u.id}` : ""} className="bg-gray-300 hover:scale-105 ease duration-500 p-2 rounded-md">
                                            <p className="text-center">👁️</p>
                                        </Link>
                                        <button className="bg-gray-300 hover:scale-105 ease duration-500 p-2 rounded-md" onClick={() => {
                                            if (!requireAdminRoles.includes(getAdminRole ?? "")) {
                                                return Swal.fire({
                                                    icon: "warning",
                                                    title: "Vioaltion d'accès!",
                                                    text: "Vous n'avez aucun droit d'effectuer cette opération. Veuillez contacter votre administrateur local"
                                                });
                                            }
                                        }}>
                                            <Link href={requireAdminRoles.includes(getAdminRole ?? "") ? `/dashboard/OTHERS/updateEnterprise/${u.id}` : ""} >
                                                <p className="text-center">🖊️</p>
                                            </Link>
                                        </button>
                                        <button type="button" onClick={() => {
                                            if (!requireAdminRoles.includes(getAdminRole ?? "")) {
                                                return Swal.fire({
                                                    icon: "warning",
                                                    title: "Vioaltion d'accès!",
                                                    text: "Vous n'avez aucun droit d'effectuer cette opération. Veuillez contacter votre administrateur local"
                                                })
                                            }
                                            Swal.fire({
                                                icon: "warning",
                                                title: "Voulez-vous supprimer ce collaborateur? ",
                                                showCancelButton: true,
                                                cancelButtonText: "Annuler",
                                                confirmButtonText: "Oui"
                                            }).then(async (confirmed) => {
                                                if (confirmed.isConfirmed) {
                                                    const response = await providers.API.delete(providers.APIUrl, "deleteEnterprise", u.id, {});
                                                    providers.alertMessage(response.status, response.title, response.message, "/dashboard/OTHERS/enterprisesList")
                                                }
                                            })
                                        }} className="bg-gray-300 hover:scale-105 ease duration-500 p-2 rounded-md">
                                            <p className="text-center">🗑️</p>
                                        </button>
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
    )
}
