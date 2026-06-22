"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastItemProps {
    toast: Toast;
    onRemove: (id: string) => void;
}

const typeConfig = {
    success: {
        icon: CheckCircle2,
        bg: "bg-green-50 border-green-200",
        iconColor: "text-green-500",
        titleColor: "text-green-900",
        messageColor: "text-green-700",
    },
    error: {
        icon: XCircle,
        bg: "bg-red-50 border-red-200",
        iconColor: "text-red-500",
        titleColor: "text-red-900",
        messageColor: "text-red-700",
    },
    warning: {
        icon: AlertCircle,
        bg: "bg-yellow-50 border-yellow-200",
        iconColor: "text-yellow-500",
        titleColor: "text-yellow-900",
        messageColor: "text-yellow-700",
    },
    info: {
        icon: Info,
        bg: "bg-blue-50 border-blue-200",
        iconColor: "text-blue-500",
        titleColor: "text-blue-900",
        messageColor: "text-blue-700",
    },
};

function ToastItem({ toast, onRemove }: ToastItemProps) {
    const config = typeConfig[toast.type];
    const Icon = config.icon;

    useEffect(() => {
        const duration = toast.duration || 5000;
        const timer = setTimeout(() => {
            onRemove(toast.id);
        }, duration);

        return () => clearTimeout(timer);
    }, [toast.id, toast.duration, onRemove]);

    return (
        <div
            className={cn(
                "flex items-start gap-3 p-4 rounded-lg border shadow-lg min-w-[320px] max-w-[420px] animate-in slide-in-from-right-full fade-in duration-300",
                config.bg
            )}
            role="alert"
        >
            <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", config.iconColor)} />
            <div className="flex-1 min-w-0">
                <p className={cn("font-semibold text-sm", config.titleColor)}>
                    {toast.title}
                </p>
                {toast.message && (
                    <p className={cn("text-sm mt-1", config.messageColor)}>
                        {toast.message}
                    </p>
                )}
            </div>
            <button
                onClick={() => onRemove(toast.id)}
                className="shrink-0 p-1 rounded-md hover:bg-black/5 transition-colors"
                aria-label="Cerrar notificación"
            >
                <X className="h-4 w-4 text-gray-500" />
            </button>
        </div>
    );
}

interface ToastContainerProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}
