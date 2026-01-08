"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Plus, Search, Users as UsersIcon, ChevronRight, Filter, Eye } from "lucide-react";
import { obtenerEmpleados } from "@/lib/actions/empleados";
import { obtenerURLArchivo } from "@/lib/appwrite";
import { nombreCompleto } from "@/lib/utils";
import type { Empleado } from "@/types";
import { Input } from "@/components/ui/input";

export default function PersonalPage() {
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [empleadosFiltrados, setEmpleadosFiltrados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState<"todos" | "activos" | "inactivos">("activos");

    useEffect(() => {
        cargarEmpleados();
    }, []);

    useEffect(() => {
        filtrarEmpleados();
    }, [empleados, busqueda, filtro]);

    const cargarEmpleados = async () => {
        try {
            setLoading(true);
            const data = await obtenerEmpleados();
            setEmpleados(data);
        } catch (error) {
            console.error("Error cargando empleados:", error);
        } finally {
            setLoading(false);
        }
    };

    const filtrarEmpleados = () => {
        let filtrados = empleados;

        if (filtro === "activos") {
            filtrados = filtrados.filter((e) => e.activo);
        } else if (filtro === "inactivos") {
            filtrados = filtrados.filter((e) => !e.activo);
        }

        if (busqueda) {
            filtrados = filtrados.filter((e) =>
                nombreCompleto(e.nombre, e.apellido)
                    .toLowerCase()
                    .includes(busqueda.toLowerCase())
            );
        }

        setEmpleadosFiltrados(filtrados);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-900 border-t-transparent" />
                    <p className="text-sm text-gray-500 font-medium">Cargando equipo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b pb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Personal</h1>
                    <p className="text-gray-500 text-base mt-1">
                        Gestiona y supervisa a tu equipo de trabajo ({empleadosFiltrados.length} miembros)
                    </p>
                </div>
                <Link href="/admin/personal/nuevo">
                    <Button size="lg" className="bg-gray-900 text-white hover:bg-black font-medium shadow-md transition-all hover:shadow-lg w-full md:w-auto">
                        <Plus className="h-4 w-4 mr-2" />
                        Nuevo Empleado
                    </Button>
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-1 rounded-xl">
                <div className="relative w-full sm:max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    <Input
                        placeholder="Buscar por nombre, documento..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="pl-10 h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors text-base"
                    />
                </div>
                <div className="flex bg-gray-100 p-1.5 rounded-lg w-full sm:w-auto">
                    {(["activos", "todos", "inactivos"] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFiltro(f)}
                            className={`flex-1 sm:flex-none px-6 py-2 text-sm font-medium rounded-md transition-all ${filtro === f
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                                } capitalize`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Employee Table */}
            <Card className="border border-gray-200 shadow-sm bg-white overflow-hidden rounded-xl">
                {empleadosFiltrados.length === 0 ? (
                    <div className="text-center py-20">
                        <div className="bg-gray-50 p-4 rounded-full shadow-inner inline-block mb-4">
                            <UsersIcon className="h-10 w-10 text-gray-300" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">No se encontraron empleados</h3>
                        <p className="text-gray-500 mt-2 max-w-sm mx-auto">
                            {busqueda
                                ? `No hay resultados para "${busqueda}"`
                                : "Tu equipo está vacío. Comienza agregando un nuevo empleado."}
                        </p>
                        {!busqueda && (
                            <Link href="/admin/personal/nuevo">
                                <Button variant="outline" className="mt-6 border-gray-300">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Registrar Primer Empleado
                                </Button>
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50 border-b border-gray-100">
                                <TableRow>
                                    <TableHead className="w-[350px] pl-6 py-4 font-semibold text-gray-700">Empleado</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Cargo</TableHead>
                                    <TableHead className="font-semibold text-gray-700">Especialidades</TableHead>
                                    <TableHead className="text-center font-semibold text-gray-700">Servicios</TableHead>
                                    <TableHead className="text-center font-semibold text-gray-700">Estado</TableHead>
                                    <TableHead className="text-right pr-6 font-semibold text-gray-700">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {empleadosFiltrados.map((empleado) => (
                                    <TableRow key={empleado.$id} className="hover:bg-gray-50/80 transition-colors border-b border-gray-100 last:border-0 group">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex items-center space-x-4">
                                                <Avatar className="h-11 w-11 border-2 border-white shadow-sm ring-1 ring-gray-100">
                                                    {empleado.foto ? (
                                                        <AvatarImage
                                                            src={obtenerURLArchivo(empleado.foto || "")}
                                                            alt={nombreCompleto(empleado.nombre, empleado.apellido)}
                                                            className="object-cover"
                                                        />
                                                    ) : (
                                                        <AvatarFallback className="bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600 font-medium">
                                                            {empleado.nombre[0]}{empleado.apellido[0]}
                                                        </AvatarFallback>
                                                    )}
                                                </Avatar>
                                                <div>
                                                    <p className="font-semibold text-gray-900 group-hover:text-primary transition-colors">
                                                        {nombreCompleto(empleado.nombre, empleado.apellido)}
                                                    </p>
                                                    <p className="text-sm text-gray-500 font-mono tracking-tight">{empleado.documento}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`font-medium capitalize px-3 py-1 bg-white shadow-sm ${empleado.cargo === "supervisor" ? "text-violet-700 border-violet-200 bg-violet-50" :
                                                empleado.cargo === "especialista" ? "text-blue-700 border-blue-200 bg-blue-50" :
                                                    "text-gray-700 border-gray-200 bg-gray-50"
                                                }`}>
                                                {empleado.cargo}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                                                {empleado.especialidades.slice(0, 2).map((esp, i) => (
                                                    <span key={i} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                                                        {esp.replace(/_/g, " ")}
                                                    </span>
                                                ))}
                                                {empleado.especialidades.length > 2 && (
                                                    <span className="inline-flex items-center px-1.5 py-1 rounded text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200" title={empleado.especialidades.slice(2).join(", ")}>
                                                        +{empleado.especialidades.length - 2}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center font-semibold text-gray-700 text-base">
                                            {empleado.serviciosRealizados || 0}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center">
                                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${empleado.activo
                                                    ? "bg-emerald-100/50 text-emerald-700 border border-emerald-200"
                                                    : "bg-gray-100 text-gray-600 border border-gray-200"
                                                    }`}>
                                                    <span className={`h-1.5 w-1.5 rounded-full ${empleado.activo ? "bg-emerald-500" : "bg-gray-400"}`}></span>
                                                    {empleado.activo ? "Activo" : "Inactivo"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <Link href={`/admin/personal/${empleado.$id}`}>
                                                <Button variant="ghost" size="icon" className="h-9 w-9 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all">
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
        </div>
    );
}
