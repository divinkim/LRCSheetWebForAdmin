"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClipLoader } from "react-spinners";
import { formElements } from "@/components/FormElements/forms";
import { providers } from "@/index";
import { UpdateUserHookModal } from "../hook";
import { faEye, faEyeSlash, faSpinner } from "@fortawesome/free-solid-svg-icons";
export default function UpdateUser() {
    const {
        dynamicOptions,
        staticOptions,
        setInputs,
        inputs,
        handleSubmit,
        isLoading,
        adminRole,
    } = UpdateUserHookModal();

    const currentFormElement = formElements[0]; // Récupération propre de la configuration

    return (
        <main className="min-h-screen bg-gray-50 p-4 text-gray-700 dark:bg-transparent dark:text-gray-300 md:p-6">
            <div className="mx-auto max-w-7xl">
                {/* Header & Fil d'Ariane */}
                <div className="mb-8 flex flex-col gap-4 border-b border-slate-200/80 pb-5 dark:border-slate-800">
                    {/* Titre & Fil d'Ariane */}
                    <div className="flex justify-between items-center">
                        <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                            Modifier un collaborateur existant
                        </h1>

                        <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                            <Link href="/dashboard" className="hover:text-blue-600 transition-colors">
                                Dashboard
                            </Link>
                            <span>/</span>
                            <span>RH</span>
                            <span>/</span>
                            <span className="text-blue-600 dark:text-blue-400">Modifier un collaborateur</span>
                        </div>
                    </div>

                    {/* Liens de Navigation */}
                    <div className="flex flex-wrap items-center gap-2.5">
                        {currentFormElement?.addOrUpdateUser.navigationLinks
                            .filter((link, index) => {
                                // Sécurisation du check des droits d'accès
                                const isSuperAdminOnlyLink = index === 2 || link.requireSuperAdmin;
                                if (isSuperAdminOnlyLink && adminRole !== "Super-Admin") {
                                    return false;
                                }
                                return true;
                            })
                            .map((link, index) => (
                                <Link
                                    key={index}
                                    href={link.href}
                                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-[0.98] dark:bg-blue-600 dark:hover:bg-blue-500"
                                >
                                    {link.icon && (
                                        <FontAwesomeIcon icon={link.icon} className="text-sm text-white/90" />
                                    )}
                                    <span>{link.title}</span>
                                </Link>
                            ))}
                    </div>
                </div>

                {/* Card Conteneur Formulaire */}
                <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                    {/* Titre du formulaire */}
                    <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                        <h2 className="text-lg font-bold text-gray-800 dark:text-gray-200">
                            {currentFormElement?.addOrUpdateUser.updateUserTitleForm}
                        </h2>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                            <span className="text-red-500 font-bold">*</span> Champs obligatoires
                        </p>
                    </div>

                    <hr className="mb-6 border-gray-200 dark:border-gray-800" />

                    {/* Aperçu Photo de Profil si présente */}
                    {inputs.photo && (
                        <div className="mb-6 flex items-center gap-4 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 w-fit">
                            <div className="relative h-20 w-20 overflow-hidden rounded-full border-2 border-blue-500 shadow-md">
                                <img
                                    src={`${providers.APIUrl}/images/${inputs.photo}`}
                                    alt="Profil collaborateur"
                                    className="h-full w-full object-cover"
                                />
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Photo actuelle</p>
                                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{inputs.firstname} {inputs.lastname}</p>
                            </div>
                        </div>
                    )}

                    {/* Grille des Champs */}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                        {currentFormElement?.addOrUpdateUser.inputs.map((e, index) => {
                            // Masquer le service admin selon le rôle
                            const isHidden =
                                e.alias === "adminService" &&
                                ["Super-Admin", "Supervisor-Admin", "client"].includes(
                                    inputs.role ?? ""
                                );

                            if (isHidden) return null;

                            return (
                                <div key={e.alias || index} className="flex flex-col space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        {e.requireField && <span className="text-red-500 mr-1">*</span>}
                                        {e.label}
                                    </label>

                                    {!e.selectedInput ? (
                                        /* Champs de type Input classique */
                                        <input
                                            type={e.type}
                                            value={e.type !== "file" ? (inputs[e.alias] ?? "") : ""}
                                            maxLength={e.type === "tel" ? 9 : undefined}
                                            placeholder={e.placeholder}
                                            onChange={async (v) => {
                                                if (e.type === "file") {
                                                    const files = v.target.files?.[0];
                                                    if (files) {
                                                        const response = await providers.API.post(
                                                            providers.APIUrl,
                                                            "sendFiles",
                                                            null,
                                                            { files }
                                                        );
                                                        if (response.status) {
                                                            setInputs({
                                                                ...inputs,
                                                                [e.alias]: response.filename,
                                                            });
                                                        }
                                                    }
                                                    return;
                                                }
                                                setInputs({
                                                    ...inputs,
                                                    [e.alias]: v.target.value,
                                                });
                                            }}
                                            className="w-full rounded-lg border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition-all placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:text-gray-200 dark:placeholder:text-gray-500 dark:focus:border-blue-400"
                                        />
                                    ) : (
                                        /* Champs de type Select */
                                        <select
                                            value={inputs[e.alias] ?? ""}
                                            onChange={(v) => {
                                                setInputs({
                                                    ...inputs,
                                                    [e.alias]:
                                                        e.type === "number"
                                                            ? parseInt(v.target.value)
                                                            : v.target.value,
                                                });
                                            }}
                                            className="w-full rounded-lg border border-gray-300 bg-transparent px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none transition-all focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:focus:border-blue-400"
                                        >
                                            <option value="" disabled>
                                                {e.placeholder}
                                            </option>
                                            {e.dynamicOptions?.status
                                                ? dynamicOptions
                                                    .find((item) => item.alias === e.alias)
                                                    ?.arrayData?.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.title}
                                                        </option>
                                                    ))
                                                : staticOptions
                                                    .find((item) => item.alias === e.alias)
                                                    ?.arrayData.map((option) => (
                                                        <option key={option.value} value={option.value}>
                                                            {option.title}
                                                        </option>
                                                    ))}
                                        </select>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Bouton d'action */}
                    <div className="mt-8 flex justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
                        <button
                            type="button"
                            disabled={isLoading}
                            onClick={() => handleSubmit()}
                            className="inline-flex min-w-[140px] items-center justify-center rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/40 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {isLoading ? (
                                <>
                                    <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin text-white" />
                                    <span>Chargement...</span>
                                </>
                            ) : (
                                <span>Exécuter</span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </main>
    );
}