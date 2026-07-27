"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faUserPlus, faImage } from "@fortawesome/free-solid-svg-icons";
import { formElements } from "@/components/FormElements/forms";
import { providers } from "@/index";
import { cn } from "@/lib/utils";
import AddUserHookModal from "./hook";

export default function AddUser() {
  const {
    dynamicArrayData,
    staticArrayData,
    inputs,
    setInputs,
    isLoading,
    handleSubmit,
    adminRole
  } = AddUserHookModal();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* 📌 HEADER & NAVIGATION */}
        {formElements.map((element, idx) => (
          <div key={idx} className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                Ajouter un nouveau collaborateur
              </h1>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Renseignez les informations ci-dessous pour créer un nouvel utilisateur.
              </p>
            </div>

            {/* Action Links Bar */}
            <div className="flex flex-wrap items-center gap-3">
              {element.addOrUpdateUser.navigationLinks.map((navItem, index) => {
                // Masquer l'onglet selon le rôle si nécessaire
                if (index === 2 && adminRole !== "Super-Admin") return null;

                return (
                  <Link
                    key={index}
                    href={navItem.href}
                    className="inline-flex items-center gap-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white active:scale-95"
                  >
                    <FontAwesomeIcon icon={navItem.icon} className="text-blue-600 dark:text-blue-400 text-sm" />
                    <span>{navItem.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* 📝 FORM CARD CONTAINER */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-xl transition-all duration-200">

          {/* Card Header */}
          {formElements.map((element, idx) => (
            <div key={idx} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                  <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {element.addOrUpdateUser.addUserTitleForm}
                </h2>
              </div>
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                <span className="text-amber-500 font-bold">*</span> Champs obligatoires
              </p>
            </div>
          ))}

          <div className="p-6 sm:p-8">

            {/* Preview Photo Upload */}
            {inputs.photo && (
              <div className="mb-8 flex items-center gap-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 p-4 transition-all">
                <img
                  src={`${providers.APIUrl}/images/${inputs.photo}`}
                  alt="Aperçu du profil"
                  className="h-16 w-16 rounded-full border-2 border-blue-500 object-cover shadow-sm"
                />
                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <FontAwesomeIcon icon={faImage} className="text-blue-500" />
                    Photo de profil téléchargée
                  </p>
                  <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                    L'image a été correctement enregistrée sur le serveur.
                  </p>
                </div>
              </div>
            )}

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              {formElements.map((element) =>
                element.addOrUpdateUser.inputs.map((e) => {
                  // Règle de masquage
                  const isHidden = e.alias === "adminService" && ["Super-Admin", "Supervisor-Admin", "client", null].includes(inputs.role);
                  if (isHidden) return null;

                  return (
                    <div key={e.alias} className="flex flex-col gap-2">
                      <label className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {e.requireField && <span className="mr-1 text-amber-500 font-bold">*</span>}
                        {e.label}
                      </label>

                      {!e.selectedInput ? (
                        <input
                          type={e.type}
                          value={
                            e.type !== "file"
                              ? (typeof inputs[e.alias] === "boolean"
                                ? String(inputs[e.alias])
                                : ((inputs[e.alias] ?? "") as string | number))
                              : undefined
                          }
                          maxLength={e.type === "tel" ? 9 : undefined}
                          placeholder={e.placeholder}
                          onChange={async (v) => {
                            let field = e.alias;
                            if (e.type === "file") {
                              const files = v.target.files?.[0];
                              if (!files) return;
                              const response = await providers.API.post(providers.APIUrl, "sendFiles", null, { files });
                              if (response.status) {
                                const updatedInputs = { ...inputs, [field]: response.filename };
                                setInputs(updatedInputs);
                                localStorage.setItem("inputMemoryOfAddUserPage", JSON.stringify(updatedInputs));
                                return;
                              }
                            }
                            const updatedInputs = { ...inputs, [field]: v.target.value };
                            setInputs(updatedInputs);
                            localStorage.setItem("inputMemoryOfAddUserPage", JSON.stringify(updatedInputs));
                          }}
                          className={cn(
                            "w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                            e.type === "file" && "file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 dark:file:bg-blue-900/30 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-100"
                          )}
                        />
                      ) : (
                        <select
                          value={
                            typeof inputs[e.alias] === "boolean"
                              ? String(inputs[e.alias])
                              : ((inputs[e.alias] ?? "") as string | number)
                          }
                          onChange={(v) => {
                            const field = {
                              ...inputs,
                              [e.alias]:
                                e.type === "number"
                                  ? parseInt(v.target.value) || 0
                                  : v.target.value,
                            }
                            setInputs(field);
                            localStorage.setItem("inputMemoryOfAddUserPage", JSON.stringify(field));
                          }}

                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                          <option value="" className="text-slate-400 dark:bg-slate-900">
                            {e.placeholder}
                          </option>
                          {e.dynamicOptions?.status
                            ? dynamicArrayData
                              .find((item: any) => item.alias === e.alias)
                              ?.arrayData?.map((option: any) => (
                                <option key={option.value} value={option.value} className="text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                  {option.title}
                                </option>
                              ))
                            : staticArrayData
                              .find((item: any) => item.alias === e.alias)
                              ?.arrayData?.map((option: any) => (
                                <option key={option.value} value={option.value} className="text-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                  {option.title}
                                </option>
                              ))}
                        </select>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Form Actions Footer */}
            <div className="mt-8 flex justify-end border-t border-slate-200 dark:border-slate-800 pt-6">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className={`inline-flex w-full sm:w-auto min-w-[150px] items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-blue-600 dark:hover:bg-blue-500 ${isLoading ? "opacity-50" : "opacity-100"}`}
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
      </div>
    </main>
  );
}