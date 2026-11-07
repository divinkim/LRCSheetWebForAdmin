"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { ClipLoader } from "react-spinners";
import { formElements } from "@/components/FormElements/forms";
import { providers } from "@/index";
import { cn } from "@/lib/utils";
import useAddLeave from "./hook";

/* -------------------------------------------------------------------------- */
/*  SearchableSelect : select avec barre de recherche                          */
/* -------------------------------------------------------------------------- */

type SelectOption = { value: string | number; title: string };

type SearchableSelectProps = {
  value: string | number | null | undefined;
  options: SelectOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  onChange: (value: string) => void;
};

// Ignore la casse et les accents : "Hélène" correspond à "helene"
const normalize = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

function SearchableSelect({
  value,
  options,
  placeholder = "Sélectionner",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun résultat",
  onChange,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find(
    (o) => value !== null && value !== undefined && String(o.value) === String(value)
  );

  const filtered = useMemo(() => {
    const q = normalize(query);
    if (!q) return options;
    return options.filter((o) => normalize(o.title).includes(q));
  }, [options, query]);

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const choose = (option: SelectOption) => {
    onChange(String(option.value));
    close();
  };

  // Fermer au clic en dehors
  useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        close();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus sur la recherche à l'ouverture + placer l'élément actif sur la sélection
  useEffect(() => {
    if (!open) return;
    const selectedIndex = options.findIndex(
      (o) => value !== null && value !== undefined && String(o.value) === String(value)
    );
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    searchRef.current?.focus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Revenir au premier résultat quand la recherche change
  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  // Garder l'élément actif visible pendant la navigation clavier
  useEffect(() => {
    if (!open || !listRef.current) return;
    const el = listRef.current.children[activeIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, open]);

  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActiveIndex((i) => (filtered.length ? (i + 1) % filtered.length : 0));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActiveIndex((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0));
        break;
      case "Enter":
        event.preventDefault();
        if (filtered[activeIndex]) choose(filtered[activeIndex]);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        close();
        break;
    }
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Bouton d'ouverture */}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex w-full items-center rounded-xl border bg-slate-50 dark:bg-slate-800/60 px-4 py-3 pr-16 text-left text-sm font-medium shadow-sm transition-all cursor-pointer",
          "focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
          open
            ? "border-blue-500 bg-white dark:bg-slate-800 ring-2 ring-blue-500/20"
            : "border-slate-200 dark:border-slate-700/80"
        )}
      >
        <span
          className={cn(
            "truncate",
            selected
              ? "text-slate-800 dark:text-slate-100"
              : "text-slate-400 dark:text-slate-500"
          )}
        >
          {selected ? selected.title : placeholder}
        </span>
      </button>

      {/* Effacer la sélection */}
      {selected && (
        <button
          type="button"
          aria-label="Effacer la sélection"
          onClick={() => {
            onChange("");
            close();
          }}
          className="absolute right-10 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700 dark:hover:bg-slate-700 dark:hover:text-slate-200"
        >
          <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      )}

      {/* Chevron */}
      <svg
        viewBox="0 0 20 20"
        className={cn(
          "pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform duration-200",
          open && "rotate-180"
        )}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 7.5l5 5 5-5" />
      </svg>

      {/* Panneau déroulant */}
      {open && (
        <div className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
          {/* Barre de recherche */}
          <div className="relative border-b border-slate-200 dark:border-slate-800 p-2">
            <svg
              viewBox="0 0 20 20"
              className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <circle cx="9" cy="9" r="5.5" />
              <path d="M13.5 13.5L17 17" />
            </svg>
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(ev) => setQuery(ev.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder={searchPlaceholder}
              autoComplete="off"
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
            />
          </div>

          {/* Liste des options */}
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
              {emptyMessage}
            </p>
          ) : (
            <ul ref={listRef} role="listbox" className="max-h-60 overflow-y-auto py-1">
              {filtered.map((option, i) => {
                const isSelected = selected && String(selected.value) === String(option.value);
                return (
                  <li
                    key={option.value}
                    role="option"
                    aria-selected={!!isSelected}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseDown={(ev) => ev.preventDefault()}
                    onClick={() => choose(option)}
                    className={cn(
                      "flex cursor-pointer items-center justify-between gap-3 px-4 py-2.5 text-sm",
                      i === activeIndex && "bg-slate-100 dark:bg-slate-800",
                      isSelected
                        ? "font-semibold text-blue-600 dark:text-blue-400"
                        : "text-slate-800 dark:text-slate-200"
                    )}
                  >
                    <span className="truncate">{option.title}</span>
                    {isSelected && (
                      <svg viewBox="0 0 20 20" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4.5 10.5l3.5 3.5 7.5-8" />
                      </svg>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                       */
/* -------------------------------------------------------------------------- */

export default function AddLeave() {
  const {
    dynamicArrayData,
    staticArrayData,
    inputs,
    setInputs,
    isLoading,
    handleSubmit,
    adminRole,
    LOCAL_KEY
  } = useAddLeave();

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800 dark:bg-slate-950 dark:text-slate-100 p-4 sm:p-6 lg:p-8 transition-colors duration-200">
      <div className="mx-auto max-w-7xl space-y-8">

        {/* 📌 HEADER & NAVIGATION */}
        {formElements.map((element, idx) => (
          <div key={idx} className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                  Ajouter un nouveau congé
                </h1>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Renseignez les détails ci-dessous pour créer une nouvelle fiche de congé.
                </p>
              </div>
            </div>

            {/* Action Links Bar */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              {element.addOrEditLeave.navigationLinks.map((navItem, index) => {
                // Masquer selon le rôle si nécessaire
                if (index === 1 && adminRole !== "Super_Admin_Platform") return null;

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

        {/* 📝 FORM CARD CONTAINER
            overflow-visible : nécessaire pour que la liste déroulante du select
            ne soit pas coupée par les bords de la carte */}
        <div className="overflow-visible rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 shadow-sm dark:shadow-xl transition-all duration-200">
          {/* Card Header */}
          {formElements.map((element, idx) => (
            <div key={idx} className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 px-6 py-5">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {element.addOrEditLeave.addPostTitlePage}
              </h2>
              <p className="flex items-center gap-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                <span className="text-amber-500 font-bold">*</span> Champs obligatoires
              </p>
            </div>
          ))}

          <div className="p-6 sm:p-8">

            {/* Form Fields Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {formElements.map((element) =>
                element.addOrEditLeave.inputs.map((e) => {
                  // Règle de masquage
                  // const isHidden = e.alias === "adminService" && inputs.role === null;
                  // if (isHidden) return null;

                  // Options du select (dynamiques ou statiques)
                  const selectOptions: SelectOption[] = e.selectedInput
                    ? ((e.dynamicOptions?.status ? dynamicArrayData : staticArrayData).find(
                        (item: any) => item.alias === e.alias
                      )?.arrayData ?? [])
                    : [];

                  return (
                    <div
                      key={e.alias}
                      className={cn(
                        "flex flex-col gap-2",
                        e.textarea && "md:col-span-2" // Met le textarea sur toute la largeur sur grand écran
                      )}
                    >
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                        {e.requireField && <span className="mr-1 text-amber-500 font-bold">*</span>}
                        {e.label}
                      </label>

                      {/* Champ Input Standard */}
                      {!e.selectedInput && !e.textarea && (
                        <input
                          type={e.type}
                          value={e.type === "file" ? undefined : inputs?.[e.alias] ?? ""}
                          maxLength={e.type === "tel" ? 9 : undefined}
                          placeholder={e.placeholder}
                          onChange={async (v) => {
                            let field = e.alias;
                            // if (e.type === "file") {
                            //   const files = v.target.files?.[0];
                            //   if (!files) return;
                            //   const response = await providers.API.post(providers.APIUrl, "sendFiles", null, { files });
                            //   if (response.status) {
                            //     const updatedInputs = { ...inputs, [field]: response.filename };
                            //     setInputs(updatedInputs);
                            //     localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedInputs));
                            //     return;
                            //   }
                            // }
                           
                            const updatedInputs = {
                              ...inputs,
                              [field]: v.target.value
                            };
                            setInputs(updatedInputs);
                            localStorage.setItem(LOCAL_KEY, JSON.stringify(updatedInputs));
                          }}
                          className={cn(
                            "w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                            e.type === "file" && "file:mr-4 file:rounded-lg file:border-0 file:bg-blue-50 dark:file:bg-blue-900/30 file:px-3 file:py-1 file:text-sm file:font-semibold file:text-blue-600 dark:file:text-blue-400 hover:file:bg-blue-100"
                          )}
                        />
                      )}

                      {/* Champ Select avec barre de recherche */}
                      {e.selectedInput && !e.textarea && (
                        <SearchableSelect
                          value={inputs?.[e.alias]}
                          options={selectOptions}
                          placeholder={e.placeholder}
                          searchPlaceholder="Rechercher..."
                          emptyMessage="Aucun résultat"
                          onChange={(raw) => {
                            
                            let field = e.alias;
                            const fieldValue = {
                              ...inputs,
                              [field]:
                                raw !== "" && e.type === "number" ? parseInt(raw) : raw
                            };
                            setInputs(fieldValue);
                            localStorage.setItem(LOCAL_KEY, JSON.stringify(fieldValue));
                          }}
                        />
                      )}

                      {/* Champ Textarea */}
                      {!e.selectedInput && e.textarea && (
                        <textarea
                          rows={4}
                          value={inputs?.[e.alias] ?? ""}
                          placeholder={e.placeholder}
                          onChange={(v) => {
                            let field = e.alias;
                            const fieldValue = {
                              ...inputs,
                              [field]: e.type === "number" ? parseInt(v.target.value) : v.target.value
                            };
                            setInputs(fieldValue);
                            localStorage.setItem(LOCAL_KEY, JSON.stringify(fieldValue));
                          }}
                          className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm font-medium text-slate-800 dark:text-slate-100 shadow-sm transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
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
                className="inline-flex w-full sm:w-auto min-w-[150px] items-center justify-center gap-2.5 rounded-xl bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:bg-blue-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 dark:bg-blue-600 dark:hover:bg-blue-500"
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
      </div>
    </main>
  );
}
