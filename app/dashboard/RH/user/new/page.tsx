"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faUserPlus, faImage, faCircleCheck } from "@fortawesome/free-solid-svg-icons";
import { formElements } from "@/components/FormElements/forms";
import { providers } from "@/index";
import { cn } from "@/lib/utils";
import AddUserHookModal from "./hook";
import { UploadFileResponseDto } from "@/types/global";

const FIELD_BASE =
  "w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm font-medium text-slate-800 shadow-sm outline-none transition-all placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-slate-600 dark:focus:bg-slate-800";

export default function AddUser() {
  const { dynamicOptions, staticOptions, inputs, setInputs, isLoading, handleSubmit, adminRole } =
    AddUserHookModal();

  return (
    <main className="min-h-screen bg-slate-50 p-4 text-slate-800 transition-colors duration-200 dark:bg-slate-950 dark:text-slate-100 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        {/* HEADER & NAVIGATION */}
        {formElements.map((element, idx) => (
          <div key={idx} className="flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-slate-800">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-500 text-white shadow-lg shadow-blue-600/25 ring-1 ring-inset ring-white/20">
                <FontAwesomeIcon icon={faUserPlus} className="text-lg" />
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Ajouter un nouveau collaborateur
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Renseignez les informations ci-dessous pour créer un nouvel utilisateur.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {element.addOrUpdateUser.navigationLinks.map((navItem, index) => {
                if (index === 2 && adminRole !== "Super-Admin") return null;

                return (
                  <Link
                    key={index}
                    href={navItem.href}
                    className="group inline-flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:border-blue-200 hover:bg-blue-50/50 hover:text-slate-900 active:scale-95 dark:border-slate-700/60 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-700 dark:hover:text-white"
                  >
                    <FontAwesomeIcon icon={navItem.icon} className="text-sm text-blue-600 dark:text-blue-400" />
                    <span>{navItem.title}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}

        {/* FORM CARD */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04),0_12px_32px_-16px_rgba(15,23,42,0.12)] ring-1 ring-slate-900/[0.02] transition-all duration-200 dark:border-slate-800 dark:bg-slate-900/50 dark:shadow-xl dark:ring-white/[0.02]">
          <div className="h-0.5 bg-gradient-to-r from-blue-600 via-blue-500 to-amber-400" />

          {/* Card Header */}
          {formElements.map((element, idx) => (
            <div
              key={idx}
              className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 px-6 py-5 dark:border-slate-800"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 ring-1 ring-inset ring-blue-500/20 dark:text-blue-400">
                  <FontAwesomeIcon icon={faUserPlus} className="text-sm" />
                </div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  {element.addOrUpdateUser.addUserTitleForm}
                </h2>
              </div>
              <p className="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                <span className="font-bold text-amber-500">*</span> Champs obligatoires
              </p>
            </div>
          ))}

          <div className="p-6 sm:p-8">
            {/* Preview Photo */}
            {inputs.photo && (
              <div className="mb-8 flex items-center gap-4 rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/80 to-transparent p-4 transition-all dark:border-blue-900/40 dark:from-blue-950/30 dark:to-transparent">
                <img
                  src={`${providers.ImageUrl}/${inputs.photo}`}
                  alt="Aperçu du profil"
                  className="h-16 w-16 rounded-full border-2 border-blue-500 object-cover shadow-md ring-4 ring-blue-500/10"
                />
                <div>
                  <p className="flex items-center gap-2 text-sm font-bold text-slate-800 dark:text-slate-200">
                    <FontAwesomeIcon icon={faImage} className="text-blue-500" />
                    Photo de profil téléchargée
                    <FontAwesomeIcon icon={faCircleCheck} className="text-emerald-500" />
                  </p>
                  <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                    L'image a été correctement enregistrée sur le serveur.
                  </p>
                </div>
              </div>
            )}

            {/* Champs */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 xl:grid-cols-3">
              {formElements.map((element) =>
                element.addOrUpdateUser.inputs.map((e) => {
                  const isUserAdminRole = [
                    "Super_Admin_Platform",
                    "Super_Admin_Enterprise",
                    "Enterprise_Admin",
                  ].includes(String(inputs.role));

                  return (
                    <div
                      key={e.alias}
                      className={
                        isUserAdminRole && e.alias === "adminService"
                          ? "flex flex-col gap-2"
                          : !isUserAdminRole && e.alias === "adminService"
                          ? "hidden"
                          : "flex flex-col gap-2"
                      }
                    >
                      <label className="text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {e.requireField && <span className="mr-1 font-bold text-amber-500">*</span>}
                        {e.label}
                      </label>

                      {!e.selectedInput ? (
                        <input
                          type={e.type}
                          value={
                            e.type !== "file"
                              ? typeof inputs[e.alias] === "boolean"
                                ? String(inputs[e.alias])
                                : ((inputs[e.alias] ?? "") as string | number)
                              : undefined
                          }
                          maxLength={e.type === "tel" ? 9 : undefined}
                          placeholder={e.placeholder}
                          onChange={async (v) => {
                            if (e.type === "file") {
                              const file = v.target.files?.[0];
                              if (file) {
                                const response = await providers.API.post<UploadFileResponseDto>(
                                  providers.APIUrl,
                                  "/media/upload-single",
                                  null,
                                  { file }
                                );
                                setInputs({
                                  ...inputs,
                                  [e.alias]: response.filename,
                                });
                              }
                              return;
                            }
                            setInputs({
                              ...inputs,
                              [e.alias]: v.target.value,
                            });
                          }}
                          className={cn(
                            FIELD_BASE,
                            e.type === "file" &&
                              "cursor-pointer file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-600 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-400"
                          )}
                        />
                      ) : (
                        <select
                          value={(inputs[e.alias] ?? "") as string | number}
                          onChange={(v) => {
                            setInputs({
                              ...inputs,
                              [e.alias]: e.type === "number" ? parseInt(v.target.value) || 0 : v.target.value,
                            });
                          }}
                          className={cn(FIELD_BASE, "cursor-pointer")}
                        >
                          <option value="" disabled className="text-slate-400 dark:bg-slate-900">
                            {e.placeholder}
                          </option>
                          {e.dynamicOptions?.status
                            ? dynamicOptions
                                .find((item) => item.alias === e.alias)
                                ?.arrayData?.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                    className="text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                  >
                                    {option.title}
                                  </option>
                                ))
                            : staticOptions
                                .find((item) => item.alias === e.alias)
                                ?.arrayData.map((option) => (
                                  <option
                                    key={option.value}
                                    value={option.value}
                                    className={
                                      e.alias === "role" && option?.status
                                        ? "text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                        : e.alias === "role" && !option.status
                                        ? "hidden"
                                        : "text-slate-800 dark:bg-slate-900 dark:text-slate-200"
                                    }
                                  >
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

            {/* Footer actions */}
            <div className="mt-10 flex justify-end border-t border-slate-200 pt-6 dark:border-slate-800">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="inline-flex w-full min-w-[160px] items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/25 ring-1 ring-inset ring-white/10 transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-blue-600 dark:hover:bg-blue-500 sm:w-auto"
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
