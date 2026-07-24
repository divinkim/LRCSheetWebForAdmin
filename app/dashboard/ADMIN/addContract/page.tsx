'use client';

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClipLoader } from "react-spinners";
import { formElements } from "@/components/FormElements/forms";
import { providers } from "@/index";
import { cn } from "@/lib/utils";
import useAddContract from "./hook";

export default function AddContractType() {
  const {
    dynamicArrayData,
    staticArrayData,
    inputs,
    setInputs,
    isLoading,
    handleSubmit,
    adminRole,
  } = useAddContract();

  return (
    <main className="min-h-screen bg-gray-50/50 p-4 md:p-6 dark:bg-transparent">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* En-tête / Fil d'Ariane */}
        {formElements.map((element, idx) => (
          <div key={`header-${idx}`} className="space-y-4">
            <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-gray-800 dark:text-gray-100">
                  Ajouter un nouveau contrat
                </h1>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                  Dashboard / ADMINISTRATION / Ajouter un contrat
                </p>
              </div>
            </div>
            <hr className="border-gray-200 dark:border-gray-800" />
          </div>
        ))}

        {/* Carte Principale du Formulaire */}
        <div className="mx-auto w-full max-w-4xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/80 dark:shadow-none sm:p-8">
          {/* Titre de la section du formulaire */}
          {formElements.map((element, idx) => (
            <div
              key={`title-${idx}`}
              className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm"
            >
              <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                {element.addContractUser.titleFormContract}
              </h2>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                <span className="text-red-500">*</span> Champs obligatoires
              </p>
            </div>
          ))}

          <hr className="mb-6 border-gray-200 dark:border-gray-800" />

          {/* Aperçu de la photo (si présente) */}
          {inputs.photo && (
            <div className="mb-6 flex justify-center sm:justify-start">
              <div className="relative h-32 w-32 overflow-hidden rounded-full border-2 border-blue-500 shadow-md">
                <img
                  src={`${providers.APIUrl}/images/${inputs.photo}`}
                  alt="Aperçu"
                  className="h-full w-full object-cover"
                />
              </div>
            </div>
          )}

          {/* Grille de champs du formulaire */}
          <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
            {formElements.map((element) =>
              element.addContractUser.inputs.map((e, index) => {
                const isHidden =
                  e.alias === "adminService" &&
                  ["Super-Admin", "Supervisor-Admin", "client", null].includes(
                    inputs.role
                  );

                if (isHidden) return null;

                return (
                  <div
                    key={e.alias || index}
                    className={cn(
                      "flex flex-col space-y-1.5",
                      e.textarea ? "md:col-span-2" : "col-span-1"
                    )}
                  >
                    <label
                      htmlFor={e.alias}
                      className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                    >
                      {e.requireField && (
                        <span className="mr-1 text-red-500">*</span>
                      )}
                      {e.label}
                    </label>

                    {/* Champ Input Standard / Fichier */}
                    {!e.selectedInput && !e.textarea && (
                      <input
                        id={e.alias}
                        type={e.type}
                        value={inputs[e.alias] ?? ""}
                        maxLength={e.type === "tel" ? 9 : undefined}
                        placeholder={e.placeholder}
                        onChange={async (v) => {
                          const field = e.alias;
                          if (e.type === "file") {
                            const files = v.target.files?.[0];
                            const response = await providers.API.post(
                              providers.APIUrl,
                              "sendFiles",
                              null,
                              { files }
                            );
                            if (response.status) {
                              const updated = {
                                ...inputs,
                                [field]: response.filename,
                              };
                              setInputs(updated);
                              localStorage.setItem(
                                "inputMemoryOfAddContractPage",
                                JSON.stringify(updated)
                              );
                              return;
                            }
                          }
                          const updated = {
                            ...inputs,
                            [field]: v.target.value,
                          };
                          setInputs(updated);
                          localStorage.setItem(
                            "inputMemoryOfAddContractPage",
                            JSON.stringify(updated)
                          );
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-400"
                      />
                    )}

                    {/* Champ Liste Déroulante (Select) */}
                    {e.selectedInput && !e.textarea && (
                      <select
                        id={e.alias}
                        value={inputs[e.alias] ?? ""}
                        onChange={(v) => {
                          const field = e.alias;
                          if (e.alias === "status") {
                            const value = v.target.value;
                            const fieldValue = {
                              ...inputs,
                              [e.alias]:
                                value === "Actif"
                                  ? true
                                  : value === "Inactif"
                                  ? false
                                  : null,
                            };
                            setInputs(fieldValue);
                            localStorage.setItem(
                              "inputMemoryOfAddContractPage",
                              JSON.stringify(fieldValue)
                            );
                            return;
                          }
                          const fieldValue = {
                            ...inputs,
                            [field]:
                              e.type === "number"
                                ? parseInt(v.target.value, 10)
                                : v.target.value,
                          };
                          setInputs(fieldValue);
                          localStorage.setItem(
                            "inputMemoryOfAddContractPage",
                            JSON.stringify(fieldValue)
                          );
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white px-3.5 py-2.5 text-sm text-gray-800 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:focus:border-blue-400"
                      >
                        <option value="">{e.placeholder}</option>
                        {e.dynamicOptions?.status
                          ? dynamicArrayData
                              .find((item: any) => item.alias === e.alias)
                              ?.arrayData?.map((option: any, optIdx: number) => (
                                <option key={optIdx} value={option.value}>
                                  {option.title}
                                </option>
                              ))
                          : staticArrayData
                              .find((item: any) => item.alias === e.alias)
                              ?.arrayData.map((option: any, optIdx: number) => (
                                <option key={optIdx} value={option.value}>
                                  {option.title}
                                </option>
                              ))}
                      </select>
                    )}

                    {/* Champ Zone de texte (Textarea) */}
                    {!e.selectedInput && e.textarea && (
                      <textarea
                        id={e.alias}
                        rows={4}
                        value={inputs[e.alias] ?? ""}
                        placeholder={e.placeholder}
                        onChange={(v) => {
                          const field = e.alias;
                          const fieldValue = {
                            ...inputs,
                            [field]: v.target.value,
                          };
                          setInputs(fieldValue);
                          localStorage.setItem(
                            "inputMemoryOfAddContractPage",
                            JSON.stringify(fieldValue)
                          );
                        }}
                        className="w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-800 placeholder-gray-400 transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-blue-400"
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Action / Bouton de soumission */}
          <div className="mt-8 flex w-full justify-end border-t border-gray-100 pt-5 dark:border-gray-800">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleSubmit()}
              className="inline-flex min-w-[140px] items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? (
                <ClipLoader color="#ffffff" size={18} />
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