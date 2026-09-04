"use client";
import { ClipLoader } from "react-spinners";
import {
    faChevronLeft,
    faChevronRight,
    faSearch,
    faTimes,
    faPaperclip,
    faPaperPlane,
    faUserPlus,
    faUsers,
    faBuilding,
    faFileAlt
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { providers } from "@/index";
import useNotifications from "./hook";

// Composant Skeleton complet de la page
function NotificationsSkeleton() {
    return (
        <div className="w-full min-h-screen bg-slate-50 dark:bg-slate-900 p-4 lg:p-8 animate-pulse space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                <div className="space-y-2">
                    <div className="h-8 w-48 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
                    <div className="h-4 w-64 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <div className="h-10 w-full md:w-64 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                    <div className="h-10 w-32 bg-slate-300 dark:bg-slate-700 rounded-lg"></div>
                </div>
            </div>

            {/* Selected Users Chips Skeleton */}
            <div className="flex gap-2 items-center">
                <div className="h-4 w-6 bg-slate-300 dark:bg-slate-700 rounded"></div>
                <div className="h-6 w-24 bg-amber-200 dark:bg-amber-900/40 rounded-full"></div>
                <div className="h-6 w-32 bg-amber-200 dark:bg-amber-900/40 rounded-full"></div>
            </div>

            {/* Main Grid Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column - Collaborators List */}
                <div className="lg:col-span-5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 space-y-4 shadow-sm">
                    <div className="h-6 w-48 bg-slate-300 dark:bg-slate-700 rounded"></div>
                    <div className="h-10 w-full bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
                    <div className="space-y-3 pt-2">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="flex items-center justify-between p-3 border-b border-slate-100 dark:border-slate-700/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-300 dark:bg-slate-700 rounded-full"></div>
                                    <div className="space-y-1">
                                        <div className="h-4 w-32 bg-slate-300 dark:bg-slate-700 rounded"></div>
                                        <div className="h-3 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                                    </div>
                                </div>
                                <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded"></div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Column - Form */}
                <div className="lg:col-span-7 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 space-y-6 shadow-sm">
                    <div className="space-y-2">
                        <div className="h-4 w-16 bg-slate-300 dark:bg-slate-700 rounded"></div>
                        <div className="h-11 w-full bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-4 w-20 bg-slate-300 dark:bg-slate-700 rounded"></div>
                        <div className="h-64 w-full bg-slate-100 dark:bg-slate-900 rounded-lg"></div>
                    </div>
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                        <div className="h-20 w-full sm:w-64 bg-slate-100 dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700"></div>
                        <div className="h-11 w-full sm:w-36 bg-blue-600/50 rounded-lg"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function Notifications() {
    const {
        isLoading,
        handleSubmit,
        inputs,
        setInputs,
        showModal,
        setShowModal,
        users,
        filterUsersByFullName,
        onCheck,
        files,
        setFiles,
        filterUsersByDepartment,
        loader
    } = useNotifications();

    // Affichage du Skeleton intégral pendant le chargement initial
    if (loader) {
        return <NotificationsSkeleton />;
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-200 p-4 lg:p-8">
            {/* Modal Mobile pour les Collaborateurs */}
            {showModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden relative">
                        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-semibold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                                <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
                                Collaborateurs
                            </h3>
                            <button
                                onClick={() => setShowModal(false)}
                                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
                            >
                                <FontAwesomeIcon icon={faTimes} className="text-lg" />
                            </button>
                        </div>

                        <div className="p-4 space-y-4">
                            <div className="relative">
                                <input
                                    onChange={(e) => filterUsersByFullName(e.target.value)}
                                    type="text"
                                    placeholder="Rechercher un collaborateur..."
                                    className="w-full pl-10 pr-4 py-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                                />
                                <FontAwesomeIcon icon={faSearch} className="text-slate-400 absolute left-3.5 top-3.5 text-sm" />
                            </div>

                            <div className="overflow-y-auto max-h-[350px] divide-y divide-slate-100 dark:divide-slate-800 pr-1">
                                {users.map((item, index) => (
                                    item.id !== 66 && (
                                        <label
                                            key={index}
                                            className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-xl cursor-pointer transition"
                                        >
                                            <div className="flex items-center gap-3">
                                                <img
                                                    src={item.photo ? `${providers.APIUrl}/images/${item.photo}` : "/images/clientProfile.png"}
                                                    alt={`${item.firstname} ${item.lastname}`}
                                                    className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                                />
                                                <div>
                                                    <p className="font-medium text-slate-800 dark:text-slate-100 text-sm">
                                                        {item.lastname} {item.firstname}
                                                    </p>
                                                    <p className="text-xs text-slate-400">{item.email}</p>
                                                </div>
                                            </div>
                                            <input
                                                type="checkbox"
                                                onChange={() => onCheck(item.email, item.id)}
                                                checked={inputs.emails.includes(item.email)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-700"
                                            />
                                        </label>
                                    )
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Container */}
            <div className="max-w-7xl mx-auto space-y-6">

                {/* Header Section */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                            Notifications
                            <span className="text-xs px-2.5 py-1 bg-amber-400/20 text-amber-600 dark:text-amber-400 border border-amber-400/30 rounded-full font-semibold">
                                gestion pro
                            </span>
                        </h1>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Rédigez et envoyez vos communications internes en toute simplicité.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative w-full lg:w-72">
                            <input
                                onChange={(e) => filterUsersByDepartment(e.target.value)}
                                type="text"
                                placeholder="Filtrer par département"
                                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 shadow-sm transition"
                            />
                            <FontAwesomeIcon icon={faBuilding} className="text-slate-400 absolute left-3.5 top-3.5 text-sm" />
                        </div>

                        <button
                            onClick={() => setShowModal(true)}
                            className="lg:hidden flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition shadow-sm whitespace-nowrap"
                        >
                            <FontAwesomeIcon icon={faUserPlus} />
                            <span>Copie</span>
                        </button>
                    </div>
                </div>

                {/* Selected Recipients Badge List */}
                {inputs.emails.length > 0 && (
                    <div className="flex items-center gap-2 flex-wrap bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider px-1">
                            À :
                        </span>
                        {inputs.emails.map((email, idx) => (
                            <span
                                key={idx}
                                className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-400/10 text-amber-600 dark:text-amber-400 border border-amber-400/30 text-xs font-medium rounded-full"
                            >
                                {email}
                            </span>
                        ))}
                    </div>
                )}

                {/* Workspace Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    {/* Left Column: Collaborator Selection (Desktop Only) */}
                    <div className="hidden lg:block lg:col-span-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[680px]">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                            <h2 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-3 flex items-center gap-2">
                                <FontAwesomeIcon icon={faUsers} className="text-blue-600" />
                                Collaborateurs en copie
                            </h2>
                            <div className="relative">
                                <input
                                    onChange={(e) => filterUsersByFullName(e.target.value)}
                                    type="text"
                                    placeholder="Rechercher par nom..."
                                    className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
                                />
                                <FontAwesomeIcon icon={faSearch} className="text-slate-400 absolute left-3.5 top-4 text-sm" />
                            </div>
                        </div>

                        <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/60 p-2">
                            {users.map((item, index) => (
                                item.id !== 66 && (
                                    <label
                                        key={index}
                                        className="flex items-center justify-between p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-xl cursor-pointer transition group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <img
                                                src={item.photo ? `${providers.APIUrl}/images/${item.photo}` : "/images/clientProfile.png"}
                                                alt={`${item.firstname} ${item.lastname}`}
                                                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                            />
                                            <div>
                                                <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm group-hover:text-blue-600 transition-colors">
                                                    {item.lastname} {item.firstname}
                                                </p>
                                                <p className="text-xs text-slate-400">{item.email}</p>
                                            </div>
                                        </div>
                                        <input
                                            type="checkbox"
                                            onChange={() => onCheck(item.email, item.id)}
                                            checked={inputs.emails.includes(item.email)}
                                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600 dark:border-slate-700"
                                        />
                                    </label>
                                )
                            ))}
                        </div>
                    </div>

                    {/* Right Column: Main Message Form */}
                    <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-6 flex flex-col justify-between min-h-[680px]">
                        <div className="space-y-5">
                            {/* Subject Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Objet
                                </label>
                                <input
                                    value={inputs.title}
                                    onChange={(e) => setInputs({ ...inputs, title: e.target.value })}
                                    placeholder="Saisissez un titre..."
                                    className="w-full border border-slate-200 dark:border-slate-700 focus:border-blue-600 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white p-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600/20 transition"
                                />
                            </div>

                            {/* Content Input */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                                    Contenu du message
                                </label>
                                <textarea
                                    value={inputs.content}
                                    onChange={(e) => setInputs({ ...inputs, content: e.target.value })}
                                    placeholder="Rédigez le contenu de votre message..."
                                    className="w-full border border-slate-200 dark:border-slate-700 focus:border-blue-600 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-white p-3.5 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-600/20 transition h-72 resize-none"
                                ></textarea>
                            </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 mt-6">

                            {/* File Attachment Area */}
                            <div className="w-full sm:w-auto flex items-center gap-3">
                                <label className="cursor-pointer flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 rounded-xl transition text-slate-700 dark:text-slate-300 text-xs font-medium">
                                    <FontAwesomeIcon icon={faPaperclip} className="text-slate-500" />
                                    <span>Joindre un fichier</span>
                                    <input
                                        type="file"
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                const result = await providers.API.post(providers.APIUrl, "sendFiles", null, { files: file });
                                                setFiles(result.filename);
                                            }
                                        }}
                                    />
                                </label>

                                {files && (
                                    <div className="flex items-center gap-2 bg-amber-400/10 border border-amber-400/30 px-3 py-2 rounded-xl text-xs text-amber-700 dark:text-amber-400 max-w-[200px]">
                                        <FontAwesomeIcon icon={faFileAlt} />
                                        <span className="truncate">{files}</span>
                                    </div>
                                )}
                            </div>

                            {/* Submit Button */}
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-sm px-7 py-3 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isLoading ? (
                                    <ClipLoader color="#fff" size={18} />
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faPaperPlane} className="text-xs" />
                                        <span>Envoyer la notification</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}