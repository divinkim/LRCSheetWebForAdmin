"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { formElements } from "@/components/FormElements/forms";
import AddUserHookModal from "./hook";

export default function AddPlanning() {
  const {
    dynamicArrayData,
    inputs,
    setInputs,
    isLoading,
    handleSubmit,
  } = AddUserHookModal();

  const currentFormConfig = formElements[0]?.addPlanning;
  const formTitle = currentFormConfig?.titleForm || "Formulaire de planning";
  const inputList = currentFormConfig?.inputs || [];

  const handleInputChange = (alias: string, value: any) => {
    const updatedInputs = { ...inputs, [alias]: value };
    setInputs(updatedInputs);
    try {
      localStorage.setItem("inputMemoryOfAddPlanningPage", JSON.stringify(updatedInputs));
    } catch (e) {
      console.error("Erreur d'écriture dans localStorage", e);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50/50 p-4 sm:p-6 lg:p-8 dark:bg-slate-900/50">
      <div className="mx-auto max-w-4xl space-y-6">
        
        {/* Header Dashboard & Fil d'Ariane */}
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200/80 pb-5 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
              <Link href="/dashboard" className="hover:text-blue-600 transition-colors">Dashboard</Link>
              <span>/</span>
              <span>RH</span>
              <span>/</span>
              <span className="text-blue-600 dark:text-blue-400">Nouveau Planning</span>
            </div>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Ajouter un nouveau planning
            </h1>
          </div>

          <Link
            href="/dashboard/rh/planning"
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-900"
          >
            ← Retour à la liste
          </Link>
        </div>

        {/* Conteneur principal du formulaire */}
        <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950">
          
          {/* Header de la carte */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 px-6 py-4 dark:border-slate-800/60">
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                {formTitle}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Remplissez les informations ci-dessous pour planifier les sessions.
              </p>
            </div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="text-amber-500 font-bold">*</span> Champs obligatoires
            </p>
          </div>

          {/* Corps du Formulaire */}
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="p-6 space-y-6"
          >
            {/* Grille responsive */}
            <div className="grid grid-cols-1 gap-x-6 gap-y-5 md:grid-cols-2">
              {inputList.map((e: any, index: number) => {
                const value = inputs[e.alias] ?? "";

                return (
                  <div key={index} className={`w-full ${e.textarea ? "md:col-span-2" : ""}`}>
                    <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {e.label}
                      {e.requireField && <span className="ml-1 text-amber-500">*</span>}
                    </label>

                    {/* Input Standard */}
                    {!e.selectedInput && !e.textarea && (
                      <input
                        type={e.type || "text"}
                        value={value}
                        maxLength={e.type === "tel" ? 9 : undefined}
                        placeholder={e.placeholder}
                        onChange={(v) => handleInputChange(e.alias, v.target.value)}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-900"
                      />
                    )}

                    {/* Textarea */}
                    {e.textarea && !e.selectedInput && (
                      <textarea
                        rows={3}
                        value={value}
                        placeholder={e.placeholder}
                        onChange={(v) => handleInputChange(e.alias, v.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 text-sm font-medium text-slate-800 outline-none transition-all resize-none placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:placeholder:text-slate-600 dark:focus:border-blue-500 dark:focus:bg-slate-900"
                      />
                    )}

                    {/* Select */}
                    {e.selectedInput && (
                      <select
                        value={value}
                        onChange={(v) => {
                          const val = e.type === "number" ? parseInt(v.target.value) : v.target.value;
                          handleInputChange(e.alias, val);
                        }}
                        className="w-full h-11 rounded-xl border border-slate-200 bg-slate-50/50 px-3.5 text-sm font-medium text-slate-800 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-200 dark:focus:border-blue-500 dark:focus:bg-slate-900"
                      >
                        <option value="" disabled className="dark:bg-slate-900">
                          {e.placeholder}
                        </option>
                        {e.dynamicOptions?.status &&
                          dynamicArrayData
                            ?.find((item: any) => item.alias === e.alias)
                            ?.arrayData?.map((option: any, oIdx: number) => (
                              <option key={oIdx} value={option.value} className="dark:bg-slate-900 text-slate-800 dark:text-slate-200">
                                {option.title}
                              </option>
                            ))}
                      </select>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions du Formulaire */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/60">
              <button
                type="button"
                onClick={() => setInputs({})}
                className="h-11 px-5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-900"
              >
                Réinitialiser
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className={`inline-flex h-11 min-w-[130px] items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-500/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 ${
                  isLoading ? "opacity-50" : ""
                }`}
              >
                {isLoading ? (
                  <FontAwesomeIcon icon={faSpinner} spin className="text-white text-base" />
                ) : (
                  <span>Enregistrer</span>
                )}
              </button>
            </div>
          </form>

        </div>
      </div>
    </main>
  );
}