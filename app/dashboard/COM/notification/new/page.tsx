
"use client";

import { useRef, useState } from "react";
import { ClipLoader } from "react-spinners";
import {
    faSearch,
    faTimes,
    faPaperclip,
    faPaperPlane,
    faUsers,
    faBuilding,
    faFileAlt,
    faUserPlus,
    faCheck,
    faBell,
    faEnvelope,
    faArrowRight,
    faCloudUploadAlt,
    faTrash,
    faUserGroup,
    faCircleInfo,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { providers } from "@/index";
import useNotifications from "./hook";
import { UploadFileResponseDto } from "@/types/global";

const COLORS = {
    blue: "#359ADE",
    orange: "#FFAB02",
};

function NotificationsSkeleton() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#101827] p-4 sm:p-6 lg:p-8 animate-pulse">
            <div className="max-w-[1450px] mx-auto space-y-7">
                <div className="flex justify-between gap-5">
                    <div className="space-y-3">
                        <div className="h-8 w-52 rounded-lg bg-slate-200 dark:bg-slate-700" />
                        <div className="h-4 w-72 max-w-full rounded bg-slate-200 dark:bg-slate-700" />
                    </div>
                    <div className="hidden sm:block h-11 w-40 rounded-xl bg-slate-200 dark:bg-slate-700" />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    <div className="lg:col-span-4 h-[620px] rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-5 space-y-5">
                        <div className="h-6 w-44 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="h-11 w-full rounded-xl bg-slate-100 dark:bg-slate-700" />
                        {[...Array(7)].map((_, i) => (
                            <div key={i} className="flex items-center gap-3 py-3">
                                <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                                <div className="flex-1 space-y-2">
                                    <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
                                    <div className="h-3 w-44 rounded bg-slate-100 dark:bg-slate-700" />
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="lg:col-span-8 h-[620px] rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-6 space-y-6">
                        <div className="h-6 w-48 rounded bg-slate-200 dark:bg-slate-700" />
                        <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-700" />
                        <div className="h-72 w-full rounded-xl bg-slate-100 dark:bg-slate-700" />
                        <div className="h-16 w-full rounded-xl bg-slate-100 dark:bg-slate-700" />
                    </div>
                </div>
            </div>
        </div>
    );
}

function SectionTitle({
    icon,
    title,
    subtitle,
}: {
    icon: any;
    title: string;
    subtitle?: string;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[#359ADE]/10 text-[#359ADE]">
                <FontAwesomeIcon icon={icon} />
            </div>
            <div>
                <h2 className="text-sm font-bold text-slate-800 dark:text-white">
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {subtitle}
                    </p>
                )}
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
        loader,
    } = useNotifications();

    const [search, setSearch] = useState("");
    const [department, setDepartment] = useState("");
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (loader) return <NotificationsSkeleton />;

    const selectedCount = inputs.emails.length;

    const handleSearch = (value: string) => {
        setSearch(value);
        filterUsersByFullName(value);
    };

    const handleDepartment = (value: string) => {
        setDepartment(value);
        filterUsersByDepartment(value);
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const result = await providers.API.post<UploadFileResponseDto>(
                providers.APIUrl,
                "media/upload-single",
                null,
                { file }
            );
            setFiles(result.filename);
        } catch (error) {
            console.error("Erreur lors du téléversement :", error);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const collaborators = users.filter((item) => item.id !== 66);

    const CollaboratorsList = () => (
        <div className="flex flex-col h-full min-h-0">
            <div className="p-5 border-b border-slate-100 dark:border-slate-700/70">
                <div className="flex items-center justify-between mb-4">
                    <SectionTitle
                        icon={faUsers}
                        title="Destinataires"
                        subtitle="Sélectionnez les collaborateurs"
                    />
                    <span className="text-xs font-bold px-2.5 py-1.5 rounded-lg bg-[#359ADE]/10 text-[#359ADE]">
                        {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
                    </span>
                </div>

                <div className="relative">
                    <FontAwesomeIcon
                        icon={faSearch}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
                    />
                    <input
                        value={search}
                        onChange={(e) => handleSearch(e.target.value)}
                        type="text"
                        placeholder="Rechercher un collaborateur..."
                        className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 outline-none transition focus:border-[#359ADE] focus:ring-4 focus:ring-[#359ADE]/10"
                    />
                </div>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto p-3">
                {collaborators.length > 0 ? (
                    <div className="space-y-1">
                        {collaborators.map((item) => {
                            const checked = inputs.emails.includes(item.email);

                            return (
                                <label
                                    key={item.id}
                                    className={`group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                                        checked
                                            ? "bg-[#359ADE]/[0.07] border-[#359ADE]/30"
                                            : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800/70"
                                    }`}
                                >
                                    <div className="relative shrink-0">
                                        <img
                                            src={
                                                item.photo
                                                    ? `${providers.ImageUrl}/${item.photo}`
                                                    : "/images/clientProfile.png"
                                            }
                                            alt={`${item.firstname} ${item.lastname}`}
                                            className="w-11 h-11 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                                        />
                                        {checked && (
                                            <span className="absolute -right-1 -bottom-1 w-5 h-5 rounded-full bg-[#359ADE] border-2 border-white dark:border-slate-900 flex items-center justify-center">
                                                <FontAwesomeIcon icon={faCheck} className="text-white text-[9px]" />
                                            </span>
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate transition-colors ${
                                            checked
                                                ? "text-[#359ADE]"
                                                : "text-slate-800 dark:text-slate-100"
                                        }`}>
                                            {item.lastname} {item.firstname}
                                        </p>
                                        <p className="text-xs text-slate-400 truncate mt-0.5">
                                            {item.email}
                                        </p>
                                    </div>

                                    <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => onCheck(item.email, item.id)}
                                        className="w-4 h-4 rounded border-slate-300 text-[#359ADE] focus:ring-[#359ADE] cursor-pointer"
                                    />
                                </label>
                            );
                        })}
                    </div>
                ) : (
                    <div className="h-full min-h-40 flex flex-col items-center justify-center text-center px-5">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                            <FontAwesomeIcon icon={faUsers} />
                        </div>
                        <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                            Aucun collaborateur
                        </p>
                        <p className="text-xs text-slate-400 mt-1">
                            Essayez une autre recherche.
                        </p>
                    </div>
                )}
            </div>

            <div className="px-5 py-3 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-800/40">
                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <FontAwesomeIcon icon={faCircleInfo} className="text-[#359ADE]" />
                    Les collaborateurs sélectionnés seront ajoutés en copie.
                </p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F5F7FA] dark:bg-[#101827] text-slate-700 dark:text-slate-200 p-3 sm:p-5 lg:p-8">
            <div className="max-w-[1450px] mx-auto space-y-6">

                {/* En-tête */}
                <div className="relative overflow-hidden rounded-2xl bg-white dark:bg-[#172235] border border-slate-200 dark:border-slate-700/70 shadow-sm">
                    <div className="absolute right-0 top-0 w-64 h-full opacity-[0.06] pointer-events-none">
                        <div className="absolute -right-12 -top-20 w-64 h-64 rounded-full border-[35px] border-[#359ADE]" />
                        <div className="absolute right-20 -bottom-28 w-64 h-64 rounded-full border-[35px] border-[#FFAB02]" />
                    </div>

                    <div className="relative flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5 p-5 sm:p-7">
                        <div className="flex items-start gap-4">
                            <div className="hidden sm:flex w-14 h-14 rounded-2xl bg-[#359ADE]/10 items-center justify-center text-[#359ADE] text-xl shrink-0">
                                <FontAwesomeIcon icon={faBell} />
                            </div>
                            <div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#359ADE]">
                                        Communication interne
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-[#FFAB02]" />
                                    <span className="text-[11px] font-medium text-slate-400">
                                        Espace administration
                                    </span>
                                </div>
                                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#374151] dark:text-white">
                                    Notifications
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-xl leading-relaxed">
                                    Préparez et diffusez vos communications auprès des collaborateurs de votre entreprise.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                            <div className="relative flex-1 xl:w-64">
                                <FontAwesomeIcon
                                    icon={faBuilding}
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm"
                                />
                                <input
                                    value={department}
                                    onChange={(e) => handleDepartment(e.target.value)}
                                    placeholder="Filtrer par département"
                                    className="w-full h-11 pl-11 pr-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm outline-none focus:border-[#359ADE] focus:ring-4 focus:ring-[#359ADE]/10 transition"
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowModal(true)}
                                className="lg:hidden h-11 px-5 rounded-xl bg-[#359ADE] hover:bg-[#2586C4] text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-sm transition"
                            >
                                <FontAwesomeIcon icon={faUserPlus} />
                                Destinataires
                                {selectedCount > 0 && (
                                    <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs">
                                        {selectedCount}
                                    </span>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Destinataires sélectionnés */}
                {selectedCount > 0 && (
                    <div className="bg-white dark:bg-[#172235] border border-slate-200 dark:border-slate-700/70 rounded-2xl px-4 py-3.5 shadow-sm">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-slate-200 shrink-0">
                                <span className="w-8 h-8 rounded-lg bg-[#FFAB02]/15 text-[#D18B00] flex items-center justify-center">
                                    <FontAwesomeIcon icon={faUserGroup} />
                                </span>
                                En copie
                                <span className="text-xs text-slate-400 font-medium">
                                    ({selectedCount})
                                </span>
                            </div>

                            <div className="hidden sm:block h-7 w-px bg-slate-200 dark:bg-slate-700" />

                            <div className="flex flex-wrap gap-2 flex-1">
                                {inputs.emails.map((email, index) => (
                                    <span
                                        key={`${email}-${index}`}
                                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FFAB02]/10 border border-[#FFAB02]/25 text-[#A96E00] dark:text-[#FFBF3F] text-xs font-medium max-w-full"
                                    >
                                        <FontAwesomeIcon icon={faEnvelope} className="text-[10px]" />
                                        <span className="truncate max-w-[220px]">{email}</span>
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Espace de travail */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

                    {/* Colonne destinataires */}
                    <div className="hidden lg:flex lg:col-span-4 flex-col bg-white dark:bg-[#172235] rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-sm overflow-hidden min-h-[680px] max-h-[760px]">
                        <CollaboratorsList />
                    </div>

                    {/* Formulaire */}
                    <div className="lg:col-span-8 bg-white dark:bg-[#172235] rounded-2xl border border-slate-200 dark:border-slate-700/70 shadow-sm overflow-hidden flex flex-col min-h-[680px]">
                        <div className="p-5 sm:p-7 border-b border-slate-100 dark:border-slate-700/70">
                            <div className="flex items-center justify-between gap-3">
                                <SectionTitle
                                    icon={faPaperPlane}
                                    title="Rédiger une notification"
                                    subtitle="Composez votre message avant sa diffusion"
                                />
                                <span className="hidden sm:inline-flex items-center gap-2 text-[11px] font-semibold text-slate-400 bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded-lg">
                                    <span className="w-2 h-2 rounded-full bg-[#FFAB02]" />
                                    Nouveau message
                                </span>
                            </div>
                        </div>

                        <div className="p-5 sm:p-7 flex-1 flex flex-col gap-6">
                            {/* Objet */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <span className="w-6 h-6 rounded-md bg-[#359ADE]/10 text-[#359ADE] flex items-center justify-center">
                                        <FontAwesomeIcon icon={faEnvelope} className="text-[10px]" />
                                    </span>
                                    Objet de la notification
                                </label>
                                <input
                                    value={inputs.title}
                                    onChange={(e) =>
                                        setInputs({ ...inputs, title: e.target.value })
                                    }
                                    placeholder="Ex. : Information importante, réunion d'équipe..."
                                    className="w-full h-14 px-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm text-slate-800 dark:text-white placeholder:text-slate-400 outline-none transition focus:bg-white dark:focus:bg-slate-800 focus:border-[#359ADE] focus:ring-4 focus:ring-[#359ADE]/10"
                                />
                            </div>

                            {/* Message */}
                            <div className="flex-1 flex flex-col space-y-2">
                                <div className="flex items-center justify-between gap-3">
                                    <label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                        <span className="w-6 h-6 rounded-md bg-[#FFAB02]/15 text-[#C18400] flex items-center justify-center">
                                            <FontAwesomeIcon icon={faPaperPlane} className="text-[10px]" />
                                        </span>
                                        Contenu du message
                                    </label>
                                    <span className="text-[11px] text-slate-400">
                                        Message interne
                                    </span>
                                </div>
                                <textarea
                                    value={inputs.content}
                                    onChange={(e) =>
                                        setInputs({ ...inputs, content: e.target.value })
                                    }
                                    placeholder="Bonjour à tous,

Rédigez ici votre communication...

Pensez à préciser les informations importantes et les éventuelles consignes."
                                    className="w-full flex-1 min-h-[280px] p-5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm leading-7 text-slate-800 dark:text-white placeholder:text-slate-400 outline-none resize-y transition focus:bg-white dark:focus:bg-slate-800 focus:border-[#359ADE] focus:ring-4 focus:ring-[#359ADE]/10"
                                />
                            </div>

                            {/* Pièce jointe */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    Pièce jointe
                                </label>

                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleUpload}
                                    />

                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        disabled={uploading}
                                        className="flex items-center justify-center gap-3 min-h-[62px] px-5 rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800/60 hover:border-[#359ADE] hover:bg-[#359ADE]/5 transition text-left disabled:opacity-60"
                                    >
                                        <span className="w-10 h-10 rounded-xl bg-[#359ADE]/10 text-[#359ADE] flex items-center justify-center shrink-0">
                                            {uploading ? (
                                                <ClipLoader size={17} color={COLORS.blue} />
                                            ) : (
                                                <FontAwesomeIcon icon={faCloudUploadAlt} />
                                            )}
                                        </span>
                                        <span>
                                            <span className="block text-xs font-bold text-slate-700 dark:text-slate-200">
                                                {uploading ? "Téléversement en cours..." : "Ajouter un fichier"}
                                            </span>
                                            <span className="block text-[11px] text-slate-400 mt-1">
                                                Cliquez pour parcourir vos fichiers
                                            </span>
                                        </span>
                                    </button>

                                    {files && (
                                        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-[#FFAB02]/10 border border-[#FFAB02]/25 min-w-0 flex-1">
                                            <span className="w-9 h-9 rounded-lg bg-[#FFAB02]/15 text-[#B77900] flex items-center justify-center shrink-0">
                                                <FontAwesomeIcon icon={faFileAlt} />
                                            </span>
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                                                    Fichier ajouté
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                                    {files}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setFiles("")}
                                                className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition"
                                                title="Retirer le fichier"
                                            >
                                                <FontAwesomeIcon icon={faTrash} className="text-xs" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Pied du formulaire */}
                        <div className="p-5 sm:px-7 sm:py-5 border-t border-slate-100 dark:border-slate-700/70 bg-slate-50/70 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                <span className="w-7 h-7 rounded-lg bg-[#359ADE]/10 text-[#359ADE] flex items-center justify-center">
                                    <FontAwesomeIcon icon={faCircleInfo} />
                                </span>
                                Vérifiez votre message avant l'envoi.
                            </div>

                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={isLoading || uploading}
                                className="group w-full sm:w-auto min-h-[48px] px-7 rounded-xl bg-[#359ADE] hover:bg-[#2586C4] active:scale-[0.98] text-white text-sm font-bold shadow-[0_5px_15px_rgba(53,154,222,0.22)] hover:shadow-[0_7px_20px_rgba(53,154,222,0.3)] transition-all flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {isLoading ? (
                                    <>
                                        <ClipLoader color="#fff" size={17} />
                                        Envoi en cours...
                                    </>
                                ) : (
                                    <>
                                        <FontAwesomeIcon icon={faPaperPlane} />
                                        Envoyer la notification
                                        <FontAwesomeIcon
                                            icon={faArrowRight}
                                            className="text-xs transition-transform group-hover:translate-x-1"
                                        />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modal mobile */}
            {showModal && (
                <div
                    className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-5"
                    onClick={() => setShowModal(false)}
                >
                    <div
                        className="w-full sm:max-w-xl h-[88vh] sm:h-[650px] bg-white dark:bg-[#172235] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700/70">
                            <SectionTitle
                                icon={faUsers}
                                title="Destinataires"
                                subtitle="Choisissez les collaborateurs"
                            />
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-red-500 transition"
                            >
                                <FontAwesomeIcon icon={faTimes} />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 flex flex-col">
                            <CollaboratorsList />
                        </div>
                        <div className="p-4 border-t border-slate-100 dark:border-slate-700/70">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="w-full h-11 rounded-xl bg-[#359ADE] hover:bg-[#2586C4] text-white text-sm font-bold transition"
                            >
                                Confirmer ({selectedCount})
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
