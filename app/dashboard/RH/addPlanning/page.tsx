'use client';
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClipLoader } from "react-spinners";
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

    return (
        <main className="bg-white dark:bg-transparent min-h-screen">
            <div className="mx-auto  px-4 py-6">
                
                {/* Header Épuré avec Fil d'Ariane et Puce Orange */}
                <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between dark:border-slate-800">
                    <div>
                        <h1 className="text-xl font-bold tracking-tight text-slate-700 dark:text-slate-100">
                            Ajouter un nouveau planning
                        </h1>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                            <p className="text-sm font-medium text-blue-700 dark:text-blue-400">
                                Dashboard / RH / Ajouter un planning
                            </p>
                        </div>
                    </div>
                </div>

                {/* Conteneur du Formulaire */}
                <div className="mt-10 mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-950">
                    
                    {/* Titre du Formulaire */}
                    {formElements.map((element, idx) => (
                        <div key={idx} className="flex flex-wrap items-center justify-between gap-2 mb-4 text-slate-700 dark:text-slate-300">
                            <h2 className="text-base font-bold text-slate-800 dark:text-slate-200">
                                {element.addPlanning.titleForm}
                            </h2>
                            <p className="text-xs font-medium text-slate-500 dark:text-slate-400"> 
                                <span className="text-orange-500">*</span> Champs obligatoires
                            </p>
                        </div>
                    ))}
                    
                    <hr className="border-0 h-[1px] bg-slate-100 dark:bg-slate-800" />

                    {/* Grille des Champs */}
                    <div className="grid grid-cols-1 mt-6 gap-x-5 gap-y-4 md:grid-cols-2 w-full">
                        {formElements.map((element) => (
                            element.addPlanning.inputs.map((e, index) => (
                                <div key={index} className="w-full">
                                    <label className="mb-2 block text-base font-semibold text-slate-600 dark:text-slate-300">
                                        {e.requireField && <span className="text-orange-500 mr-1">*</span>}
                                        {e.label}
                                    </label>

                                    {/* Rendu Input Classique */}
                                    {!e.selectedInput && !e.textarea && (
                                        <input 
                                            value={inputs[e.alias] ?? ""} 
                                            onChange={(v) => {
                                                const updated = { ...inputs, [e.alias]: v.target.value };
                                                setInputs(updated);
                                                localStorage.setItem("inputMemoryOfAddPlanningPage", JSON.stringify(updated));
                                            }} 
                                            type={e.type} 
                                            maxLength={e.type === "tel" ? 9 : undefined} 
                                            placeholder={e.placeholder} 
                                            className="w-full h-11 outline-none rounded-xl p-3 bg-transparent border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-base font-medium transition-colors focus:border-blue-600 dark:focus:border-blue-500" 
                                        />
                                    )}

                                    {/* Rendu Textarea */}
                                    {e.textarea && !e.selectedInput && (
                                        <textarea 
                                            value={inputs[e.alias] ?? ""} 
                                            onChange={(v) => {
                                                const updated = { ...inputs, [e.alias]: v.target.value };
                                                setInputs(updated);
                                                localStorage.setItem("inputMemoryOfAddPlanningPage", JSON.stringify(updated));
                                            }} 
                                            placeholder={e.placeholder} 
                                            rows={3}
                                            className="w-full outline-none rounded-xl p-3 bg-transparent border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-600 text-base font-medium transition-colors focus:border-blue-600 dark:focus:border-blue-500 resize-none"
                                        />
                                    )}

                                    {/* Rendu Select */}
                                    {e.selectedInput && (
                                        <select 
                                            value={inputs[e.alias] ?? ""} 
                                            onChange={(v) => {
                                                const field = e.alias;
                                                const fieldValue = {
                                                    ...inputs,
                                                    [field]: e.type === "number" ? parseInt(v.target.value) : v.target.value
                                                };
                                                setInputs(fieldValue);
                                                localStorage.setItem("inputMemoryOfAddPlanningPage", JSON.stringify(fieldValue));
                                            }} 
                                            className="w-full h-11 outline-none rounded-xl px-3 bg-transparent border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 text-base font-medium transition-colors focus:border-blue-600 dark:focus:border-blue-500"
                                        >
                                            <option value="" className="dark:bg-slate-900">
                                                {e.placeholder}
                                            </option>
                                            {e.dynamicOptions?.status && dynamicArrayData
                                                .find((item: any) => item.alias === e.alias)
                                                ?.arrayData
                                                ?.map((option: any, oIdx) => (
                                                    <option key={oIdx} className="text-slate-700 dark:bg-slate-900 dark:text-slate-200" value={option.value}>
                                                        {option.title}
                                                    </option>
                                                ))
                                            }
                                        </select>
                                    )}
                                </div>
                            ))
                        ))}
                    </div>

                    {/* Zone Bouton Soumettre */}
                    <div className="flex w-full justify-end mt-6 pt-4 border-t border-slate-200 dark:border-slate-800">
                        <button 
                            type="button" 
                            disabled={isLoading}
                            onClick={() => handleSubmit()} 
                            className="inline-flex h-11 items-center justify-center rounded-xl bg-blue-600 px-6 text-base font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:pointer-events-none disabled:opacity-50 min-w-[120px]"
                        >
                            {!isLoading ? (
                                <span>Exécuter</span>
                            ) : (
                                <ClipLoader color="#fff" size={16} />
                            )}
                        </button>
                    </div>
                </div>

            </div>
        </main>
    );
}