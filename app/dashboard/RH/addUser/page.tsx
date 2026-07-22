'use client';

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash, faSpinner } from "@fortawesome/free-solid-svg-icons";
import { ClipLoader } from "react-spinners";
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
    <main className="min-h-screen bg-slate-50/50 p-6 dark:bg-slate-900/50 sm:p-8 lg:p-10">
      {/* 📌 HEADER & NAVIGATION */}
      {formElements.map((element, idx) => (
        <div key={idx} className="mb-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
                Ajouter un nouveau collaborateur
              </h1>
              <p className="mt-1 text-base font-medium text-slate-500 dark:text-slate-400">
                Renseignez les informations ci-dessous pour créer un nouvel utilisateur.
              </p>
            </div>

            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">Dashboard</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="hover:text-slate-700 dark:hover:text-slate-200 transition-colors">RH</span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <span className="rounded-md bg-blue-50 px-2.5 py-1 font-semibold text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                Nouveau collaborateur
              </span>
            </nav>
          </div>

          {/* Action Links Bar */}
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {element.addOrUpdateUser.navigationLinks.map((navItem, index) => {
              // Masquer l'onglet selon le rôle si nécessaire
              if (index === 2 && adminRole !== "Super-Admin") return null;

              return (
                <Link
                  key={index}
                  href={navItem.href}
                  className="inline-flex items-center gap-2.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-95 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  <FontAwesomeIcon icon={navItem.icon} className="text-sm" />
                  <span>{navItem.title}</span>
                </Link>
              );
            })}
          </div>
        </div>
      ))}

      {/* 📝 FORM CARD CONTAINER */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-800">

        {/* Card Header */}
        {formElements.map((element, idx) => (
          <div key={idx} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200/80 px-6 py-5 dark:border-slate-700/60">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              {element.addOrUpdateUser.addUserTitleForm}
            </h2>
            <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
              <span className="text-amber-500 font-bold">*</span> Champs obligatoires
            </p>
          </div>
        ))}

        <div className="p-6 sm:p-8">

          {/* Preview Photo Upload */}
          {inputs.photo && (
            <div className="mb-8 flex items-center gap-5 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-slate-700/50 dark:bg-slate-900/30">
              <img
                src={`${providers.APIUrl}/images/${inputs.photo}`}
                alt="Aperçu du profil"
                className="h-20 w-20 rounded-full border-2 border-white object-cover shadow-md dark:border-slate-700"
              />
              <div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Photo de profil chargée</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">L'image a été correctement envoyée au serveur.</p>
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
                    <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {e.requireField && <span className="mr-1 text-amber-500 font-bold">*</span>}
                      {e.label}
                    </label>

                    {!e.selectedInput ? (
                      <input
                        type={e.type}
                        value={inputs[e.alias] ?? ""}
                        maxLength={e.type === "tel" ? 9 : undefined}
                        placeholder={e.placeholder}
                        onChange={async (v) => {
                          let field = e.alias;
                          if (e.type === "file") {
                            const files = v.target.files?.[0];
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
                        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition-all placeholder:text-slate-400 focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
                      />
                    ) : (
                      <select
                        value={inputs[e.alias] ?? ""}
                        onChange={(v) => {
                          let field = e.alias;
                          const fieldValue = {
                            ...inputs,
                            [field]: e.type === "number" ? parseInt(v.target.value) : v.target.value
                          };
                          setInputs(fieldValue);
                          localStorage.setItem("inputMemoryOfAddUserPage", JSON.stringify(fieldValue));
                        }}
                        className={cn(
                          "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 shadow-sm transition-all focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:focus:border-blue-500 dark:focus:ring-blue-900/40"
                        )}
                      >
                        <option value="" className="text-slate-400 dark:bg-slate-800">
                          {e.placeholder}
                        </option>
                        {e.dynamicOptions?.status
                          ? dynamicArrayData
                            .find((item: any) => item.alias === e.alias)
                            ?.arrayData?.map((option: any) => (
                              <option key={option.value} value={option.value} className="text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                                {option.title}
                              </option>
                            ))
                          : staticArrayData
                            .find((item: any) => item.alias === e.alias)
                            ?.arrayData?.map((option: any) => (
                              <option key={option.value} value={option.value} className="text-slate-700 dark:bg-slate-800 dark:text-slate-200">
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
          <div className="mt-8 flex justify-end border-t border-slate-200/80 pt-6 dark:border-slate-700/60">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 min-w-[140px] rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-blue-700 hover:shadow active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-blue-600 dark:hover:bg-blue-700"
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