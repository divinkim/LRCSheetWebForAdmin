"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faChevronDown, faSearch } from "@fortawesome/free-solid-svg-icons";
import { cn } from "@/lib/utils";

export type SearchableOption = {
    value: string | number;
    title: string;
    [key: string]: any;
};

type SearchableSelectProps = {
    value: string | number | null | undefined;
    options: SearchableOption[];
    onChange: (value: string | number) => void;
    placeholder?: string;
    searchPlaceholder?: string;
    disabled?: boolean;
    className?: string;
};

const TRIGGER_BASE =
    "flex w-full items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-left text-sm font-medium text-slate-800 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-100 dark:hover:border-slate-600 dark:focus:bg-slate-800";

// Recherche insensible à la casse et aux accents (é = e)
const normalize = (s: string) =>
    String(s ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

type Position = {
    left: number;
    width: number;
    top?: number;
    bottom?: number;
    listMaxHeight: number;
};

export default function SearchableSelect({
    value,
    options,
    onChange,
    placeholder = "Sélectionner...",
    searchPlaceholder = "Rechercher...",
    disabled = false,
    className,
}: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [activeIndex, setActiveIndex] = useState(0);
    const [pos, setPos] = useState<Position | null>(null);

    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const selected = useMemo(
        () => options.find((o) => String(o.value) === String(value ?? "")),
        [options, value]
    );

    const filtered = useMemo(() => {
        const q = normalize(query.trim());
        if (!q) return options;
        return options.filter((o) => normalize(o.title).includes(q));
    }, [options, query]);

    // Positionne le panneau (en "fixed" pour ne pas être coupé par un parent overflow-hidden)
    const updatePosition = useCallback(() => {
        const el = triggerRef.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        const spaceAbove = rect.top;
        const placeAbove = spaceBelow < 300 && spaceAbove > spaceBelow;
        const available = (placeAbove ? spaceAbove : spaceBelow) - 80;

        setPos({
            left: rect.left,
            width: rect.width,
            ...(placeAbove
                ? { bottom: window.innerHeight - rect.top + 6 }
                : { top: rect.bottom + 6 }),
            listMaxHeight: Math.max(120, Math.min(240, available)),
        });
    }, []);

    const close = useCallback(() => {
        setOpen(false);
        setQuery("");
    }, []);

    const openPanel = () => {
        if (disabled) return;
        updatePosition();
        const idx = options.findIndex((o) => String(o.value) === String(value ?? ""));
        setActiveIndex(Math.max(0, idx));
        setOpen(true);
    };

    const select = (option: SearchableOption) => {
        onChange(option.value);
        close();
        triggerRef.current?.focus();
    };

    // Focus du champ de recherche à l'ouverture
    useEffect(() => {
        if (open) requestAnimationFrame(() => inputRef.current?.focus());
    }, [open]);

    // Fermeture au clic extérieur + repositionnement au scroll / resize
    useEffect(() => {
        if (!open) return;

        const onMouseDown = (ev: MouseEvent) => {
            const target = ev.target as Node;
            if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
            close();
        };
        const onReposition = (ev: Event) => {
            // Un scroll dans la liste elle-même ne doit pas déclencher de recalcul
            if (ev.target instanceof Node && panelRef.current?.contains(ev.target)) return;
            updatePosition();
        };

        document.addEventListener("mousedown", onMouseDown);
        window.addEventListener("resize", onReposition);
        window.addEventListener("scroll", onReposition, true);
        return () => {
            document.removeEventListener("mousedown", onMouseDown);
            window.removeEventListener("resize", onReposition);
            window.removeEventListener("scroll", onReposition, true);
        };
    }, [open, close, updatePosition]);

    // Revient au premier résultat quand la recherche change
    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    // Garde l'élément actif visible pendant la navigation au clavier
    useEffect(() => {
        if (!open) return;
        listRef.current
            ?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
            ?.scrollIntoView({ block: "nearest" });
    }, [activeIndex, open]);

    const onSearchKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
        switch (ev.key) {
            case "ArrowDown":
                ev.preventDefault();
                setActiveIndex((i) => Math.min(filtered.length - 1, i + 1));
                break;
            case "ArrowUp":
                ev.preventDefault();
                setActiveIndex((i) => Math.max(0, i - 1));
                break;
            case "Enter":
                ev.preventDefault(); // évite de soumettre le formulaire
                if (filtered[activeIndex]) select(filtered[activeIndex]);
                break;
            case "Escape":
                ev.preventDefault();
                close();
                triggerRef.current?.focus();
                break;
            case "Tab":
                close();
                break;
        }
    };

    return (
        <>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                onClick={() => (open ? close() : openPanel())}
                onKeyDown={(ev) => {
                    if (!open && (ev.key === "ArrowDown" || ev.key === "ArrowUp")) {
                        ev.preventDefault();
                        openPanel();
                    }
                }}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={cn(TRIGGER_BASE, className)}
            >
                <span
                    className={cn(
                        "truncate",
                        !selected && "font-normal text-slate-400 dark:text-slate-500"
                    )}
                >
                    {selected ? selected.title : placeholder}
                </span>
                <FontAwesomeIcon
                    icon={faChevronDown}
                    className={cn(
                        "h-3 w-3 shrink-0 text-slate-400 transition-transform duration-200",
                        open && "rotate-180"
                    )}
                />
            </button>

            {open &&
                pos &&
                createPortal(
                    <div
                        ref={panelRef}
                        style={{
                            position: "fixed",
                            left: pos.left,
                            width: pos.width,
                            top: pos.top,
                            bottom: pos.bottom,
                            zIndex: 9999,
                        }}
                        className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl shadow-slate-900/10 dark:border-slate-700 dark:bg-slate-900 dark:shadow-black/40"
                    >
                        {/* Barre de recherche */}
                        <div className="relative border-b border-slate-200 p-2 dark:border-slate-800">
                            <FontAwesomeIcon
                                icon={faSearch}
                                className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-xs text-slate-400"
                            />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(ev) => setQuery(ev.target.value)}
                                onKeyDown={onSearchKeyDown}
                                placeholder={searchPlaceholder}
                                className="w-full rounded-lg border border-slate-200 bg-slate-50/70 py-2 pl-8 pr-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:bg-slate-800"
                            />
                        </div>

                        {/* Résultats */}
                        <ul
                            ref={listRef}
                            role="listbox"
                            style={{ maxHeight: pos.listMaxHeight }}
                            className="overflow-y-auto p-1"
                        >
                            {filtered.length === 0 ? (
                                <li className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                                    Aucun résultat pour « {query} »
                                </li>
                            ) : (
                                filtered.map((option, index) => {
                                    const isSelected = String(option.value) === String(value ?? "");
                                    return (
                                        <li
                                            key={`${option.value}-${index}`}
                                            data-index={index}
                                            role="option"
                                            aria-selected={isSelected}
                                            onMouseEnter={() => setActiveIndex(index)}
                                            onMouseDown={(ev) => ev.preventDefault()}
                                            onClick={() => select(option)}
                                            className={cn(
                                                "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200",
                                                index === activeIndex && "bg-blue-50 dark:bg-slate-800",
                                                isSelected && "font-semibold text-blue-600 dark:text-blue-400"
                                            )}
                                        >
                                            <span className="truncate">{option.title}</span>
                                            {isSelected && <FontAwesomeIcon icon={faCheck} className="text-xs" />}
                                        </li>
                                    );
                                })
                            )}
                        </ul>
                    </div>,
                    document.body
                )}
        </>
    );
}
