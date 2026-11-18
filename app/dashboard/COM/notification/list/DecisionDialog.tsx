"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, XCircle, X, Loader2 } from "lucide-react";

export type DecisionAction = "ACCEPTED" | "DENIED";

interface DecisionDialogProps {
    open: boolean;
    action: DecisionAction;
    notificationTitle: string;
    submitting: boolean;
    error: string | null;
    onConfirm: (comment: string) => void;
    onClose: () => void;
}

export default function DecisionDialog({
    open,
    action,
    notificationTitle,
    submitting,
    error,
    onConfirm,
    onClose,
}: DecisionDialogProps) {
    const [comment, setComment] = useState("");
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const isAccept = action === "ACCEPTED";
    // Commentaire facultatif pour une acceptation, obligatoire pour un refus
    const commentRequired = !isAccept;
    const canSubmit = !submitting && (!commentRequired || comment.trim().length > 0);

    // Réinitialise le champ à chaque ouverture + focus
    useEffect(() => {
        if (open) {
            setComment("");
            setTimeout(() => textareaRef.current?.focus(), 0);
        }
    }, [open, action]);

    // Fermeture avec Échap
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === "Escape" && !submitting) onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, submitting, onClose]);

    if (!open) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="decision-dialog-title"
        >
            {/* Fond */}
            <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                onClick={() => !submitting && onClose()}
            />

            {/* Contenu */}
            <div className="relative w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <button
                    onClick={onClose}
                    disabled={submitting}
                    aria-label="Fermer"
                    className="absolute right-4 top-4 rounded-full p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-blue-700 disabled:opacity-50 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
                >
                    <X className="h-4 w-4" />
                </button>

                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                            isAccept
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}
                    >
                        {isAccept ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                    </div>
                    <div className="min-w-0">
                        <h2
                            id="decision-dialog-title"
                            className="text-lg font-semibold text-blue-700 dark:text-white"
                        >
                            {isAccept ? "Accepter la demande" : "Refuser la demande"}
                        </h2>
                        <p className="mt-0.5 truncate text-sm text-gray-500 dark:text-slate-400">
                            {notificationTitle || "Notification sans titre"}
                        </p>
                    </div>
                </div>

                <label
                    htmlFor="decision-comment"
                    className="mt-5 block text-sm font-medium text-gray-700 dark:text-slate-300"
                >
                    Commentaire {commentRequired ? <span className="text-red-600">*</span> : "(facultatif)"}
                </label>
                <textarea
                    id="decision-comment"
                    ref={textareaRef}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    disabled={submitting}
                    rows={4}
                    placeholder={
                        isAccept
                            ? "Ajoutez un message pour l'utilisateur…"
                            : "Expliquez la raison du refus…"
                    }
                    className="mt-1.5 w-full resize-none rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-sm text-gray-700 outline-none transition-all placeholder:text-gray-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 disabled:opacity-60 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-blue-500 dark:focus:ring-blue-500/15"
                />

                {error && (
                    <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-full px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-50 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Annuler
                    </button>
                    <button
                        onClick={() => onConfirm(comment.trim())}
                        disabled={!canSubmit}
                        className={`inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white shadow-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isAccept
                                ? "bg-emerald-600 hover:bg-emerald-700 focus-visible:ring-emerald-600"
                                : "bg-red-600 hover:bg-red-700 focus-visible:ring-red-600"
                        }`}
                    >
                        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                        {isAccept ? "Confirmer l'acceptation" : "Confirmer le refus"}
                    </button>
                </div>
            </div>
        </div>
    );
}