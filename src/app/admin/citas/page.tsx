"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import {
    Plus,
    Calendar as CalendarIcon,
    Search,
    MapPin,
    Clock,
    User,
    ChevronRight,
    Users,
    LayoutGrid,
    List
} from "lucide-react";
import { obtenerCitas } from "@/lib/actions/citas";
import { obtenerTodosLosEmpleados } from "@/lib/actions/empleados";
import { formatearFecha, formatearPrecio, nombreCompleto } from "@/lib/utils";
import { obtenerURLArchivo } from "@/lib/appwrite";
import { EstadoCita, type Cita, type Empleado } from "@/types";
import { CalendarView } from "@/components/citas/calendar-view";

export default function CitasPage() {
    const [citas, setCitas] = useState<Cita[]>([]);
    const [empleadosMap, setEmpleadosMap] = useState<Record<string, Empleado>>({});
    const [citasFiltradas, setCitasFiltradas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<EstadoCita | "todos">("todos");
    const [view, setView] = useState("list");

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        filtrarCitas();
    }, [citas, filtroEstado, busqueda]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [citasData, empleadosData] = await Promise.all([
                obtenerCitas(),
                obtenerTodosLosEmpleados()
            ]);

            // Create a map for faster employee lookup
            const empMap: Record<string, Empleado> = {};
            empleadosData.forEach(emp => {
                empMap[emp.$id] = emp;
            });

            setEmpleadosMap(empMap);
            setCitas(citasData);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    };

    const filtrarCitas = () => {
        let filtradas = citas;

        if (filtroEstado !== "todos") {
            filtradas = filtradas.filter((c) => c.estado === filtroEstado);
        }

        if (busqueda) {
            const query = busqueda.toLowerCase();
            filtradas = filtradas.filter((c) =>
                c.clienteNombre.toLowerCase().includes(query) ||
                c.direccion.toLowerCase().includes(query) ||
                c.ciudad.toLowerCase().includes(query)
            );
        }

        setCitasFiltradas(filtradas);
    };

    const getEstadoBadge = (estado: EstadoCita) => {
        const styles = {
            [EstadoCita.PENDIENTE]: "bg-amber-500/20 text-amber-300 border-0",
            [EstadoCita.CONFIRMADA]: "bg-blue-500/20 text-blue-300 border-0",
            [EstadoCita.EN_PROGRESO]: "bg-violet-500/20 text-violet-300 border-0",
            [EstadoCita.COMPLETADA]: "bg-emerald-500/20 text-emerald-300 border-0",
            [EstadoCita.CANCELADA]: "bg-rose-500/20 text-rose-300 border-0",
        };

        return (
            <Badge variant="outline" className={`capitalize font-semibold px-3 py-1 ${styles[estado] || "bg-white/10 text-slate-400 border-0"}`}>
                {estado.replace("-", " ")}
            </Badge>
        );
    };

    if (loading) {
        return <TableSkeleton rows={6} columns={5} hasAvatar />;
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-primary text-white shadow-xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-secondary rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                <CalendarIcon className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Agenda de Servicios</h1>
                                <p className="text-sm text-slate-300 mt-0.5">
                                    Gestiona y visualiza todas tus citas programadas ({citasFiltradas.length})
                                </p>
                            </div>
                        </div>

                        <Link href="/admin/citas/nueva" className="w-full sm:w-auto">
                            <Button size="lg" className="font-medium shadow-lg gap-2 w-full sm:w-auto">
                                <Plus className="h-4 w-4" />
                                Nueva Cita
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Main Tabs */}
            <Tabs defaultValue="list" value={view} onValueChange={setView} className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    {/* View Switcher */}
                    <TabsList className="bg-white border border-gray-200 p-1.5 rounded-xl gap-1 shadow-sm h-auto">
                        <TabsTrigger value="list" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            <List className="h-4 w-4 mr-2" />
                            Lista
                        </TabsTrigger>
                        <TabsTrigger value="calendar" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all">
                            <LayoutGrid className="h-4 w-4 mr-2" />
                            Calendario
                        </TabsTrigger>
                    </TabsList>

                    {/* Filter Bar */}
                    <div className="flex bg-white border border-gray-200 p-1 rounded-lg w-full sm:w-auto overflow-x-auto shadow-sm">
                        {[
                            { label: "Todas", value: "todos" },
                            { label: "Pendientes", value: EstadoCita.PENDIENTE },
                            { label: "Confirmadas", value: EstadoCita.CONFIRMADA },
                            { label: "Completadas", value: EstadoCita.COMPLETADA },
                        ].map((f) => (
                            <button
                                key={f.value}
                                onClick={() => setFiltroEstado(f.value as EstadoCita | "todos")}
                                className={`flex-1 sm:flex-none px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                                    filtroEstado === f.value
                                        ? "bg-primary text-white shadow-md"
                                        : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {f.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Search Bar */}
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                        placeholder="Buscar por cliente, dirección o ciudad..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-10 h-11 bg-white border-gray-200 shadow-sm focus:bg-white transition-colors text-base"
                    />
                </div>

                <TabsContent value="list" className="mt-0">
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                        {citasFiltradas.length === 0 ? (
                            <EmptyState
                                variant={busqueda ? "search" : "appointments"}
                                title={busqueda ? "Sin resultados" : "No hay citas"}
                                description={
                                    busqueda
                                        ? `No se encontraron citas para "${busqueda}". Intenta con otros términos.`
                                        : filtroEstado !== "todos"
                                            ? "No hay citas con este filtro. Prueba seleccionando otro estado."
                                            : "Aún no tienes citas programadas. ¡Crea tu primera cita!"
                                }
                                action={!busqueda && filtroEstado === "todos" ? {
                                    label: "Nueva Cita",
                                    href: "/admin/citas/nueva"
                                } : undefined}
                                secondaryAction={busqueda || filtroEstado !== "todos" ? {
                                    label: "Limpiar filtros",
                                    onClick: () => {
                                        setBusqueda("");
                                        setFiltroEstado("todos");
                                    }
                                } : undefined}
                                className="border-0"
                            />
                        ) : (
                            <div className="overflow-x-auto relative z-10">
                                <Table>
                                    <TableHeader className="bg-white/5 border-b border-white/10">
                                        <TableRow className="border-white/10 hover:bg-transparent">
                                            <TableHead className="w-[300px] pl-6 py-4 font-semibold text-slate-400 uppercase text-xs tracking-wider">Cliente & Ubicación</TableHead>
                                            <TableHead className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Fecha y Hora</TableHead>
                                            <TableHead className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Estado</TableHead>
                                            <TableHead className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Precio</TableHead>
                                            <TableHead className="font-semibold text-slate-400 uppercase text-xs tracking-wider">Personal</TableHead>
                                            <TableHead className="text-right pr-6 font-semibold text-slate-400 uppercase text-xs tracking-wider">Acciones</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {citasFiltradas.map((cita) => (
                                            <TableRow key={cita.$id} className="hover:bg-white/5 transition-colors border-b border-white/5 last:border-0 group">
                                                <TableCell className="pl-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <User className="h-4 w-4 text-slate-500" />
                                                            <span className="font-semibold text-white">{cita.clienteNombre}</span>
                                                        </div>
                                                        <div className="flex items-start gap-2 text-sm text-slate-400">
                                                            <MapPin className="h-3.5 w-3.5 mt-0.5 text-slate-500 shrink-0" />
                                                            <span className="line-clamp-1" title={`${cita.direccion}, ${cita.ciudad}`}>
                                                                {cita.direccion}, {cita.ciudad}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <div className="flex items-center gap-2 text-white font-medium">
                                                            <CalendarIcon className="h-4 w-4 text-primary" />
                                                            {formatearFecha(cita.fechaCita)}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-sm text-slate-400 mt-0.5 ml-6">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {cita.horaCita}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {getEstadoBadge(cita.estado)}
                                                </TableCell>
                                                <TableCell>
                                                    <span className="font-bold text-white text-base">
                                                        {formatearPrecio(cita.precioAcordado)}
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    {cita.empleadosAsignados && cita.empleadosAsignados.length > 0 ? (
                                                        <div className="flex items-center -space-x-2 overflow-hidden hover:space-x-1 transition-all">
                                                            {cita.empleadosAsignados.slice(0, 3).map((empId, i) => {
                                                                const empleado = empleadosMap[empId];
                                                                if (!empleado) return null;

                                                                const initials = (empleado.nombre?.[0] || "") + (empleado.apellido?.[0] || "");

                                                                return (
                                                                    <div key={i} className="group/avatar relative" title={nombreCompleto(empleado.nombre || "", empleado.apellido || "")}>
                                                                        <Avatar className="h-8 w-8 border-2 border-slate-800 ring-1 ring-white/10 transition-transform group-hover/avatar:scale-110 z-10">
                                                                            {empleado.foto && <AvatarImage src={obtenerURLArchivo(empleado.foto)} className="object-cover" />}
                                                                            <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-[10px] font-bold">
                                                                                {initials}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                    </div>
                                                                );
                                                            })}
                                                            {cita.empleadosAsignados.length > 3 && (
                                                                <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-slate-800 bg-white/10 ring-1 ring-white/10 z-0">
                                                                    <span className="text-[10px] font-medium text-slate-400">
                                                                        +{cita.empleadosAsignados.length - 3}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-sm text-slate-500 italic">Sin asignar</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <Link href={`/admin/citas/${cita.$id}`}>
                                                        <Button variant="ghost" size="icon" className="h-9 w-9 text-slate-500 hover:text-primary hover:bg-primary/10 rounded-full transition-all">
                                                            <ChevronRight className="h-5 w-5" />
                                                        </Button>
                                                    </Link>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </Card>
                </TabsContent>

                <TabsContent value="calendar" className="mt-0">
                    <CalendarView citas={citasFiltradas} empleadosMap={empleadosMap} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
