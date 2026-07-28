"use client";

import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner, faCalendarPlus, faArrowLeft } from "@fortawesome/free-solid-svg-icons";
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
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="mx-auto max-w-5xl space-y-8">

        {/* 📌 HEADER & FIL D'ARIANE */}
        <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Ajouter un nouveau planning
            </h1>
            {/* Breadcrumb */}
          </div>

          {/* Action Link */}
          <div className="flex items-center gap-3 mt-2">
            <Link
              href="/dashboard/rh/planning"
              className="inline-flex items-center gap-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-200 shadow-sm transition-all duration-200 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white active:scale-95"
            >
              <FontAwesomeIcon icon={faArrowLeft} className="text-sm text-slate-500 dark:text-slate-400" />
              <span>Retour à la liste</span>
            </Link>
          </div>
        </div>

        {/* 📝 FORM CARD CONTAINER */}
        <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-xl transition-all duration-200">

          {/* Card Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <FontAwesomeIcon icon={faCalendarPlus} className="text-sm" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white">
                  {formTitle}
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Remplissez les informations ci-dessous pour planifier les sessions.
                </p>
              </div>
            </div>
            <p className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400">
              <span className="text-amber-500 font-bold">*</span> Champs obligatoires
            </p>
          </div>

          {/* Form Body */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
            className="p-6 sm:p-8 space-y-6"
          >
            {/* Grille responsive */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {inputList.map((e: any, index: number) => {
                const value = inputs[e.alias] ?? "";

                return (
                  <div key={index} className={`flex flex-col gap-2 ${e.textarea ? "md:col-span-2" : ""}`}>
                    <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                      {e.requireField && <span className="mr-1 text-amber-500 font-bold">*</span>}
                      {e.label}
                    </label>

                    {/* Input Standard */}
                    {!e.selectedInput && !e.textarea && (
                      <input
                        type={e.type || "text"}
                        value={value}
                        maxLength={e.type === "tel" ? 9 : undefined}
                        placeholder={e.placeholder}
                        onChange={(v) => handleInputChange(e.alias, v.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                    )}

                    {/* Textarea */}
                    {e.textarea && !e.selectedInput && (
                      <textarea
                        rows={3}
                        value={value}
                        placeholder={e.placeholder}
                        onChange={(v) => handleInputChange(e.alias, v.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 p-4 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all resize-none placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
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
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                      >
                        <option value="" disabled className="text-slate-400 dark:bg-slate-900">
                          {e.placeholder}
                        </option>
                        {e.dynamicOptions?.status &&
                          dynamicArrayData
                            ?.find((item: any) => item.alias === e.alias)
                            ?.arrayData?.map((option: any, oIdx: number) => (
                              <option key={oIdx} value={option.value} className="text-slate-800 dark:bg-slate-900 dark:text-slate-200">
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
            <div className="mt-8 flex items-center justify-end gap-3 border-t border-slate-200 dark:border-slate-800 pt-6">
              <button
                type="button"
                onClick={() => setInputs(
                  {
                    startTime: null,
                    breakingStartTime: null,
                    resumeEndTime: null,
                    endTime: null,
                    description: null,
                    EnterpriseId: null,
                  }
                )}
                className="rounded-xl border border-slate-200 dark:border-slate-700/60 px-5 py-3 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                Réinitialiser
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-w-[140px] items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-blue-600 dark:hover:bg-blue-500"
              >
                {isLoading ? (
                  <>
                    <FontAwesomeIcon icon={faSpinner} className="h-4 w-4 animate-spin text-white" />
                    <span>Enregistrement...</span>
                  </>
                ) : (
                  <span>Enregistrer</span>
                )}
              </button>
            </div>
          </form>

        </div>
      </div >
    </main >
  );
}