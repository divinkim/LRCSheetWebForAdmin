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
import { useToast } from "@/components/toast";

export default function PresencesList() {
    const { presencesListCloned, adminRole, onSearch, } = PresencesListHookModal();
    const [page, setPage] = useState(0);             // page courante
    const limit = 5;                                 // items par page
    const [showAddPresenceModal, setShowAddPresenceModal] = useState(false);
    const [showUpdatePresenceModal, setShowUpdatePresenceModal] = useState(false);
    const [maxPage, setMaxPage] = useState(0);
    const requireAdminRoles = ['Super-Admin', 'Supervisor-Admin'];
    const [start, setStart] = useState(1);
    const toast = useToast();

    useEffect(() => {
        (() => {
            const maxPage = Math.ceil(presencesListCloned?.length / limit);
            setMaxPage(maxPage);
            setPage(maxPage);
        })()
    }, [presencesListCloned])

    const startPage = (start - 1) * limit;

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
                        <div className={showAddPresenceModal || showUpdatePresenceModal ? "absolute z-50 right-10 top-10" : "hidden"}>
                            <FontAwesomeIcon onClick={() => {
                                setShowAddPresenceModal(false);
                                setShowUpdatePresenceModal(false);
                            }} icon={faTimes} className="text-[20px] cursor-pointer text-white" />
                        </div>
                    </div>
                    {
                        tablesModal.map((e, index) => (
                            <div key={index} className="flex flex-col gap-1 border-b border-slate-100 px-6 py-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                                {/* Titre de la page */}
                                <div>
                                    <h1 className="text-xl font-semibold tracking-tight text-slate-800 dark:text-white">
                                        {e.presencesList.pageTitle}
                                    </h1>
                                </div>

                                {/* Fil d'Ariane (Breadcrumb) */}
                                <div className="hidden items-center gap-1.5 text-sm text-slate-500 xl:flex dark:text-slate-400">
                                    <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">Dashboard</span>
                                    <span className="text-slate-300 dark:text-slate-700">/</span>
                                    <span className="hover:text-slate-700 dark:hover:text-slate-200 cursor-pointer transition-colors">RH</span>
                                    <span className="text-slate-300 dark:text-slate-700">/</span>
                                    <span className="font-medium text-blue-600 dark:text-blue-400">Présences au poste</span>
                                </div>
                            </div>
                        ))
                    }
                    <div className="px-4  mx-auto">
                        <hr className='' />
                        <div className="mt-10 flex flex-col items-center justify-between gap-4 lg:flex-row xl:space-y-0">
                            {/* Barre de recherche */}
                            <div className="relative w-full max-w-sm">
                                <input
                                    type="text"
                                    placeholder="Rechercher un collaborateur..."
                                    onChange={(e) => onSearch(e.target.value, "")}
                                    className="peer w-full rounded-xl border border-slate-300 bg-white py-3 pl-11 pr-4 text-slate-700 placeholder:text-slate-400 shadow-sm outline-none transition-all duration-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-100 dark:border-slate-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-slate-400 dark:focus:ring-blue-900/40"
                                />
                                <FontAwesomeIcon
                                    icon={faSearch}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors duration-300 peer-focus:text-blue-600"
                                />
                            </div>

                            {/* Actions / Liens de présence */}
                            <div className="flex flex-wrap items-center gap-4">
                                {tablesModal.flatMap((e) =>
                                    e.presencesList.links.map((item) => (
                                        <Link
                                            key={item.title}
                                            href={item.href || "#"}
                                            onClick={(e) => {
                                                if (!requireAdminRoles.includes(adminRole ?? "")) {
                                                    toast.error("Violation d'accès", "Vous n'avez aucun droit d'effectuer cette action");
                                                    return;
                                                }

                                                if (!item.href) {
                                                    e.preventDefault(); // Évite le comportement par défaut si c'est une modal
                                                    item.modal === "addPresenceModal"
                                                        ? setShowAddPresenceModal(!showAddPresenceModal)
                                                        : setShowUpdatePresenceModal(!showUpdatePresenceModal);
                                                }
                                            }}
                                            className="group inline-flex items-center gap-3 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-5 py-3 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-blue-800 hover:to-blue-700 hover:shadow-xl active:scale-95"
                                        >
                                            <FontAwesomeIcon
                                                icon={item.icon}
                                                className="text-lg transition-transform duration-300 group-hover:rotate-6"
                                            />
                                            <span>{item.title}</span>
                                        </Link>
                                    ))
                                )}
                            </div>
                        </div>
                        {/* 🧾 Tableau */}
                        <div className="mt-10 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                                    {/* Header */}
                                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                                        <tr>
                                            {tablesModal.flatMap((item) =>
                                                item.presencesList.table.titles.map((e) => (
                                                    <th
                                                        key={e.title}
                                                        className="px-4 text-sm py-4 text-left  font-semibold uppercase tracking-wider  text-slate-500 dark:text-slate-400 whitespace-nowrap"
                                                    >
                                                        {e.title}
                                                    </th>
                                                ))
                                            )}
                                        </tr>
                                    </thead>

                                    {/* Body */}
                                    <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-700 dark:bg-slate-900">
                                        {presencesListCloned.length > 0 ? (
                                            presencesListCloned
                                                .slice(startPage, startPage + limit)
                                                .map((u) => (
                                                    <tr
                                                        key={`${u.UserId}-${u.createdAt}`}
                                                        className="transition-colors duration-200 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                    >
                                                        {/* Photo */}
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <img
                                                                src={u.User.photo ? `${providers.APIUrl}/images/${u.User.photo}` : "/images/clientProfile.png"}
                                                                className="h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                                                                alt=""
                                                            />
                                                        </td>

                                                        {/* Collaborateur */}
                                                        <td className="px-4 py-4 whitespace-nowrap">
                                                            <div className="font-medium text-slate-900 dark:text-white truncate max-w-[150px]">
                                                                {u.User.lastname} {u.User.firstname}
                                                            </div>
                                                            <p className=" text-slate-400 dark:text-slate-500">Collaborateur</p>
                                                        </td>

                                                        {/* Arrivée / Pause */}
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                            <div className="flex  text-sm 2xl:text-base flex-col gap-1">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <span className="text-slate-400"></span>
                                                                    {["00:00:00", "00:00"].includes(String(u.arrivalTime)) ? "--" : u.arrivalTime}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1.5  text-slate-400">
                                                                    <span></span> {u.breakStartTime ?? "--"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Reprise / Départ */}
                                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">
                                                            <div className="flex  text-sm 2xl:text-base flex-col gap-1">
                                                                <span className="inline-flex items-center gap-1.5">
                                                                    <span className="text-slate-400"></span> {u.resumeTime ?? "--"}
                                                                </span>
                                                                <span className="inline-flex items-center gap-1.5  text-slate-400">
                                                                    <span></span> {u.departureTime ?? "--"}
                                                                </span>
                                                            </div>
                                                        </td>

                                                        {/* Date */}
                                                        <td className="px-4  text-sm 2xl:text-base py-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                                                            {new Date(u.createdAt ?? "").toLocaleDateString("fr-FR", {
                                                                weekday: "short",
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            })}
                                                        </td>

                                                        {/* Entreprise */}
                                                        <td className="px-4 py-4 whitespace-nowrap text-center">
                                                            {u.Enterprise?.logo ? (
                                                                <img
                                                                    src={`${providers.APIUrl}/images/${u.Enterprise.logo}`}
                                                                    className="mx-auto h-10 w-10 rounded-full border border-slate-200 object-cover dark:border-slate-700"
                                                                    alt=""
                                                                />
                                                            ) : (
                                                                <span className="text-sm 2xl:text-base font-medium text-slate-700 dark:text-slate-300">
                                                                    {u.Enterprise?.name}
                                                                </span>
                                                            )}
                                                        </td>

                                                        {/* Statut */}
                                                        <td className="px-4  py-4 whitespace-nowrap">
                                                            <span
                                                                className={`inline-flex items-center rounded-full px-2.5 py-0.5  font-medium ${u.status === "A temps"
                                                                    ? "bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-500/20"
                                                                    : u.status === "En retard"
                                                                        ? "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-500/20"
                                                                        : "bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-500/20"
                                                                    }`}
                                                            >
                                                                {u.status}
                                                            </span>
                                                        </td>

                                                        {/* Actions */}
                                                        <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                            <div className="flex items-center justify-end gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        if (!requireAdminRoles.includes(adminRole ?? "")) {
                                                                            toast.error("Violation d'accès", "Vous n'avez pas le droit d'effectuer cette action.");
                                                                            return;
                                                                        }
                                                                        window.location.href = `/dashboard/RH/getAllPresencesOfUser/${u.UserId}`;
                                                                    }}
                                                                    className="p-2  text-sm 2xl:text-base text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                    title="Voir les détails"
                                                                >
                                                                    👁️
                                                                </button>
                                                                <button
                                                                    onClick={async () => {
                                                                        if (!requireAdminRoles.includes(adminRole ?? "")) {
                                                                            toast.error("Violation d'accès", "Vous n'avez pas le droit d'effectuer cette action.");
                                                                            return;
                                                                        }
                                                                        const response = await providers.API.delete(
                                                                            providers.APIUrl,
                                                                            "deleteUserAttendance",
                                                                            u.UserId,
                                                                            { createdAt: u.createdAt }
                                                                        );
                                                                        providers.alertMessage(
                                                                            response.status,
                                                                            response.title,
                                                                            response.message,
                                                                            response.status ? "/dashboard/RH/presencesList" : null
                                                                        );
                                                                    }}
                                                                    className="p-2 text-slate-400  text-sm 2xl:text-base hover:text-red-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                                                    title="Supprimer"
                                                                >
                                                                    🗑️
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))
                                        ) : (
                                            <tr>
                                                <td colSpan={8} className="py-20 text-center">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <div className="mb-4 text-5xl opacity-80">📂</div>
                                                        <h3 className=" text-sm 2xl:text-base font-semibold text-slate-700 dark:text-slate-200">
                                                            Aucune présence trouvée
                                                        </h3>
                                                        <p className="mt-1 text-sm text-slate-400 dark:text-slate-500">
                                                            Essayez un autre filtre ou ajoutez une présence.
                                                        </p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* 🔄 Pagination */}
                        <div className="my-6 flex flex-col items-center justify-between gap-4 border-t border-slate-100 bg-white py-4 dark:border-slate-800 dark:bg-slate-950 sm:flex-row">
                            {/* Informations de pagination */}
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                    Affichage de la page
                                </p>
                                <div className="inline-flex items-center gap-1 rounded-md bg-slate-50 px-2 py-1 text-xs font-semibold text-slate-700 border border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800">
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
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                                >
                                    <FontAwesomeIcon icon={faChevronLeft} className="h-3.5 w-3.5" />
                                    Précédent
                                </button>

                                <button
                                    disabled={page === maxPage}
                                    onClick={() => {
                                        setPage((prev) => prev + 1);
                                        setStart(start - 1);
                                    }}
                                    className="inline-flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 disabled:pointer-events-none disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-50"
                                >
                                    Suivant
                                    <FontAwesomeIcon icon={faChevronRight} className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
