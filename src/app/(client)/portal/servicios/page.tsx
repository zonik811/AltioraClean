"use client";

import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Calendar,
    Search,
    Plus,
    MapPin,
    Clock,
} from "lucide-react";
import Link from "next/link";
import { obtenerMisCitas } from "@/lib/actions/citas";
import { formatearPrecio } from "@/lib/utils";
import type { Cita } from "@/types";
import { toast } from "sonner";

function ServiciosSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>
            <Skeleton className="h-10 w-full max-w-md" />
            <Skeleton className="h-64 w-full rounded-xl" />
        </div>
    );
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
    completada: {
        label: "Completada",
        className: "bg-emerald-100 text-emerald-700",
    },
    confirmada: {
        label: "Confirmada",
        className: "bg-blue-100 text-blue-700",
    },
    pendiente: {
        label: "Pendiente",
        className: "bg-amber-100 text-amber-700",
    },
    "en-progreso": {
        label: "En Progreso",
        className: "bg-purple-100 text-purple-700",
    },
    cancelada: {
        label: "Cancelada",
        className: "bg-red-100 text-red-700",
    },
};

export default function MisServiciosPage() {
    const { user } = useAuth();
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<string>("todas");

    useEffect(() => {
        if (user?.email) {
            cargarCitas();
        }
    }, [user]);

    const cargarCitas = async () => {
        try {
            setLoading(true);
            const data = await obtenerMisCitas(user!.email);
            setCitas(data);
        } catch {
            toast.error("Error al cargar tus servicios");
        } finally {
            setLoading(false);
        }
    };

    const citasFiltradas = useMemo(() => {
        let filtradas = citas;

        if (filtroEstado !== "todas") {
            filtradas = filtradas.filter((c) => c.estado === filtroEstado);
        }

        if (busqueda) {
            const q = busqueda.toLowerCase();
            filtradas = filtradas.filter(
                (c) =>
                    c.direccion.toLowerCase().includes(q) ||
                    c.tipoPropiedad.toLowerCase().includes(q) ||
                    c.clienteNombre.toLowerCase().includes(q)
            );
        }

        return filtradas.sort(
            (a, b) =>
                new Date(b.fechaCita).getTime() -
                new Date(a.fechaCita).getTime()
        );
    }, [citas, filtroEstado, busqueda]);

    const totales = useMemo(() => {
        return {
            total: citas.length,
            completadas: citas.filter((c) => c.estado === "completada").length,
            pendientes: citas.filter((c) =>
                ["pendiente", "confirmada", "en-progreso"].includes(c.estado)
            ).length,
        };
    }, [citas]);

    if (loading) return <ServiciosSkeleton />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Mis Servicios
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Historial completo de tus servicios agendados
                    </p>
                </div>
                <Link href="/agendar">
                    <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Solicitud
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-500">Total Servicios</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {totales.total}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-50 to-transparent border-emerald-200">
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-500">Completados</p>
                        <p className="text-3xl font-bold text-emerald-600">
                            {totales.completadas}
                        </p>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-amber-50 to-transparent border-amber-200">
                    <CardContent className="pt-6">
                        <p className="text-sm text-gray-500">Pendientes</p>
                        <p className="text-3xl font-bold text-amber-600">
                            {totales.pendientes}
                        </p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar por dirección..."
                            className="pl-9 h-9 text-sm"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                        />
                    </div>
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="h-9 px-3 border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none bg-white"
                    >
                        <option value="todas">Todos los estados</option>
                        <option value="completada">Completados</option>
                        <option value="pendiente">Pendientes</option>
                        <option value="confirmada">Confirmados</option>
                        <option value="en-progreso">En Progreso</option>
                        <option value="cancelada">Cancelados</option>
                    </select>
                </div>
            </div>

            {citasFiltradas.length > 0 ? (
                <Card className="border-none shadow-md overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-600">
                                        Fecha
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">
                                        Servicio
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600 hidden md:table-cell">
                                        Dirección
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600 hidden sm:table-cell">
                                        Valor
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">
                                        Estado
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {citasFiltradas.map((cita) => {
                                    const statusConfig =
                                        STATUS_CONFIG[cita.estado] || {
                                            label: cita.estado,
                                            className:
                                                "bg-gray-100 text-gray-700",
                                        };
                                    return (
                                        <TableRow
                                            key={cita.$id}
                                            className="hover:bg-gray-50/50 transition-colors"
                                        >
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-gray-400 shrink-0" />
                                                    <div>
                                                        <p className="font-medium text-gray-900 text-sm">
                                                            {new Date(
                                                                cita.fechaCita
                                                            ).toLocaleDateString(
                                                                "es-CO",
                                                                {
                                                                    day: "numeric",
                                                                    month: "short",
                                                                }
                                                            )}
                                                        </p>
                                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {cita.horaCita}
                                                        </p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium text-gray-900 capitalize text-sm">
                                                    {cita.tipoPropiedad}
                                                </p>
                                                {cita.metrosCuadrados && (
                                                    <p className="text-xs text-gray-400">
                                                        {cita.metrosCuadrados}
                                                        m²
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell max-w-[200px]">
                                                <span
                                                    className="text-sm text-gray-600 truncate block"
                                                    title={cita.direccion}
                                                >
                                                    <MapPin className="h-3 w-3 inline mr-1 text-gray-400" />
                                                    {cita.direccion},{" "}
                                                    {cita.ciudad}
                                                </span>
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <span className="font-semibold text-gray-900 text-sm">
                                                    {formatearPrecio(
                                                        cita.precioAcordado
                                                    )}
                                                </span>
                                            </TableCell>
                                            <TableCell>
                                                <Badge
                                                    className={`${statusConfig.className} border-0 font-medium`}
                                                >
                                                    {statusConfig.label}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            ) : (
                <EmptyState
                    variant={
                        busqueda || filtroEstado !== "todas"
                            ? "search"
                            : "appointments"
                    }
                    title={
                        busqueda || filtroEstado !== "todas"
                            ? "Sin resultados"
                            : "Sin servicios aún"
                    }
                    description={
                        busqueda || filtroEstado !== "todas"
                            ? "No se encontraron servicios con los filtros seleccionados"
                            : "Agenda tu primer servicio para comenzar"
                    }
                    action={
                        !busqueda && filtroEstado === "todas"
                            ? {
                                  label: "Agendar Servicio",
                                  href: "/agendar",
                              }
                            : undefined
                    }
                    secondaryAction={
                        busqueda || filtroEstado !== "todas"
                            ? {
                                  label: "Limpiar filtros",
                                  onClick: () => {
                                      setBusqueda("");
                                      setFiltroEstado("todas");
                                  },
                              }
                            : undefined
                    }
                />
            )}
        </div>
    );
}
