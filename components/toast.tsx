"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    useCallback,
} from "react";

type ToastType = "success" | "error" | "info";

type ToastItem = {
    id: number;
    title: string;
    message: string;
    type: ToastType;
};

type ToastContextType = {
    success: (title: string, message: string) => void;
    error: (title: string, message: string) => void;
    info: (title: string, message: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItem[]>([]);

    const pushToast = useCallback(
        (type: ToastType, title: string, message: string) => {
            const id = Date.now();

            const newToast: ToastItem = {
                id,
                type,
                title,
                message,
            };

            setToasts((prev) => [...prev, newToast]);

            setTimeout(() => {
                setToasts((prev) => prev.filter((t) => t.id !== id));
            }, 3000);
        },
        []
    );

    const success = useCallback(
        (title: string, message: string) => {
            pushToast("success", title, message);
        },
        [pushToast]
    );

    const error = useCallback(
        (title: string, message: string) => {
            pushToast("error", title, message);
        },
        [pushToast]
    );

    const info = useCallback(
        (title: string, message: string) => {
            pushToast("info", title, message);
        },
        [pushToast]
    );

    return (
        <ToastContext.Provider value={{ success, error, info }}>
            {children}

            {/* UI */}
            <div className="fixed bottom-10 right-5 z-50 space-y-2">
                {toasts.map((t) => (
                    <div
                        key={t.id}
                        className={`min-w-[280px] rounded-lg border p-4 shadow-lg animate-in slide-in-from-right ${
                            t.type === "success"
                                ? "border-green-200 bg-green-50"
                                : t.type === "error"
                                ? "border-red-200 bg-red-50"
                                : "border-blue-200 bg-blue-50"
                        }`}
                    >
                        <p
                            className={`font-semibold ${
                                t.type === "success"
                                    ? "text-green-800"
                                    : t.type === "error"
                                    ? "text-red-800"
                                    : "text-blue-800"
                            }`}
                        >
                            {t.type === "success"
                                ? "✅"
                                : t.type === "error"
                                ? "⛔"
                                : "ℹ️"}{" "}
                            {t.title}
                        </p>

                        <p
                            className={`text-sm ${
                                t.type === "success"
                                    ? "text-green-700"
                                    : t.type === "error"
                                    ? "text-red-700"
                                    : "text-blue-700"
                            }`}
                        >
                            {t.message}
                        </p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);

    if (!context) {
        throw new Error("useToast must be used inside ToastProvider");
    }

    return {
        success: context.success,
        error: context.error,
        info: context.info,
    };
}