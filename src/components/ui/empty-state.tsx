"use client";

import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Inbox, Search, CalendarOff, Users, FileX, Package, AlertCircle } from "lucide-react";
import Link from "next/link";

type EmptyStateVariant = "default" | "search" | "appointments" | "employees" | "clients" | "reports" | "payments";

interface EmptyStateProps {
    variant?: EmptyStateVariant;
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    secondaryAction?: {
        label: string;
        href?: string;
        onClick?: () => void;
    };
    className?: string;
}

const variantConfig: Record<EmptyStateVariant, { icon: ReactNode; title: string; description: string }> = {
    default: {
        icon: <Inbox className="h-12 w-12 text-gray-400" />,
        title: "No hay datos",
        description: "No se encontraron elementos para mostrar.",
    },
    search: {
        icon: <Search className="h-12 w-12 text-gray-400" />,
        title: "Sin resultados",
        description: "No se encontraron resultados para tu búsqueda. Intenta con otros términos.",
    },
    appointments: {
        icon: <CalendarOff className="h-12 w-12 text-gray-400" />,
        title: "No hay citas",
        description: "Aún no tienes citas programadas. ¡Agenda tu primer servicio!",
    },
    employees: {
        icon: <Users className="h-12 w-12 text-gray-400" />,
        title: "No hay empleados",
        description: "Tu equipo está vacío. Comienza agregando a tu primer empleado.",
    },
    clients: {
        icon: <Users className="h-12 w-12 text-gray-400" />,
        title: "No hay clientes",
        description: "Aún no tienes clientes registrados. Los clientes aparecerán aquí cuando agenden servicios.",
    },
    reports: {
        icon: <FileX className="h-12 w-12 text-gray-400" />,
        title: "Sin datos para reportar",
        description: "No hay datos suficientes para generar el reporte. Intenta ampliar el rango de fechas.",
    },
    payments: {
        icon: <Package className="h-12 w-12 text-gray-400" />,
        title: "No hay pagos",
        description: "No se encontraron pagos registrados.",
    },
};

export function EmptyState({
    variant = "default",
    title,
    description,
    icon,
    action,
    secondaryAction,
    className = "",
}: EmptyStateProps) {
    const config = variantConfig[variant];

    return (
        <Card className={`border-dashed border-2 bg-gray-50/50 ${className}`}>
            <CardContent className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="w-20 h-20 bg-white rounded-full shadow-sm flex items-center justify-center mb-6">
                    {icon || config.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {title || config.title}
                </h3>
                <p className="text-gray-500 max-w-sm mb-8">
                    {description || config.description}
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                    {action && (
                        action.href ? (
                            <Link href={action.href}>
                                <Button size="lg">
                                    {action.label}
                                </Button>
                            </Link>
                        ) : (
                            <Button size="lg" onClick={action.onClick}>
                                {action.label}
                            </Button>
                        )
                    )}
                    {secondaryAction && (
                        secondaryAction.href ? (
                            <Link href={secondaryAction.href}>
                                <Button size="lg" variant="outline">
                                    {secondaryAction.label}
                                </Button>
                            </Link>
                        ) : (
                            <Button size="lg" variant="outline" onClick={secondaryAction.onClick}>
                                {secondaryAction.label}
                            </Button>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export function EmptyTableState({ message = "No hay datos para mostrar" }: { message?: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Inbox className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-500">{message}</p>
        </div>
    );
}

export function ErrorState({ 
    title = "Error al cargar datos", 
    message = "Ocurrió un error inesperado. Por favor, intenta de nuevo.",
    onRetry 
}: { 
    title?: string; 
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <Card className="border-red-200 bg-red-50/50">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-red-900 mb-2">{title}</h3>
                <p className="text-red-700 max-w-sm mb-6">{message}</p>
                {onRetry && (
                    <Button variant="outline" onClick={onRetry} className="border-red-300 text-red-700 hover:bg-red-100">
                        Intentar de nuevo
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}
