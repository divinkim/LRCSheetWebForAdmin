"use client";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { ReactNode } from "react";

interface CellProps {
  label: string;
  action?: ReactNode;
  error?: string | null;
  icon: IconDefinition;
  children: ReactNode;
}

export default function Cell({
  label,
  action = null, // Valeur par défaut
  error,
  icon,
  children,
}: CellProps) {
  return (
    <div>
      <div
        className={`
          group relative rounded-lg border bg-white transition
          focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-600/20
          ${error ? "border-red-400" : "border-slate-300 hover:border-slate-400"}
        `}
      >
        {/* En-tête de la cellule */}
        <div className="flex items-center justify-between rounded-t-lg border-b border-slate-200 bg-slate-50 px-3 py-1.5">
          <span className="text-xs font-semibold text-slate-600">{label}</span>
          {action}
        </div>

        {/* Zone de saisie */}
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
            <FontAwesomeIcon
              icon={icon}
              className="text-sm text-slate-400 transition-colors group-focus-within:text-blue-600"
            />
          </div>
          {children}
        </div>

        {/* Poignée de recopie */}
        <span className="pointer-events-none absolute -bottom-1 -right-1 h-2 w-2 border border-white bg-blue-600 opacity-0 transition-opacity group-focus-within:opacity-100" />
      </div>

      {error && (
        <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-red-500">
          <span className="font-bold">•</span>
          {error}
        </p>
      )}
    </div>
  );
}