"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Calendar,
    Star,
    Edit2,
    Users,
    Phone,
} from "lucide-react";
import { obtenerPlan, obtenerClientesPorPlan } from "@/lib/actions/planes";
import type { Plan, Cliente } from "@/types";
import { formatearPrecio, formatearFecha } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import Link from "next/link";

export default function PlanDetailPage() {
    const params = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            cargarDatos(params.id as string);
        }
    }, [params.id]);

    const cargarDatos = async (id: string) => {
        try {
            setLoading(true);
            const [data, clientesData] = await Promise.all([
                obtenerPlan(id),
                obtenerClientesPorPlan(id),
            ]);
            if (!data) {
                toast.error("Plan no encontrado");
                router.push("/admin/planes");
                return;
            }
            setPlan(data);
            setClientes(clientesData);
        } catch {
            toast.error("Error al cargar plan");
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-64 w-full rounded-xl" />
            </div>
        );
    }

    if (!plan) return null;

    const ahorroPorVisita =
        plan.precioSugerido > 0
            ? plan.precioSugerido - plan.precioPorVisita
            : 0;
    const ahorroPorcentaje =
        plan.precioSugerido > 0
            ? Math.round((ahorroPorVisita / plan.precioSugerido) * 100)
            : 0;
    const costoMensual = plan.precioPorVisita * plan.sesionesPorMes;
    const costoSinPlan = plan.precioSugerido * plan.sesionesPorMes;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                            {plan.nombre}
                            {plan.destacado && (
                                <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
                            )}
                        </h1>
                        <p className="text-sm text-gray-500">{plan.descripcion}</p>
                    </div>
                </div>
                <Link href="/admin/planes">
                    <Button variant="outline" size="sm">
                        <Edit2 className="h-4 w-4 mr-2" /> Editar
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-blue-100 mb-1">Precio por Visita</p>
                        <p className="text-3xl font-bold">{formatearPrecio(plan.precioPorVisita)}</p>
                        <p className="text-xs text-blue-100 mt-1">
                            {plan.sesionesPorMes} visitas al mes
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-500 mb-1">Costo Mensual</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {formatearPrecio(costoMensual)}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                            {formatearPrecio(plan.precioPorVisita)} x {plan.sesionesPorMes} visitas
                        </p>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md">
                    <CardContent className="p-6">
                        <p className="text-sm text-gray-500 mb-1">Frecuencia</p>
                        <p className="text-3xl font-bold text-gray-900 capitalize">
                            {plan.frecuencia}
                        </p>
                        <Badge
                            variant="outline"
                            className={`mt-2 ${
                                plan.activo
                                    ? "bg-green-100 text-green-700 border-green-200"
                                    : "bg-gray-100 text-gray-500"
                            }`}
                        >
                            {plan.activo ? "Activo" : "Inactivo"}
                        </Badge>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-6">
                        <p className="text-sm text-emerald-100 mb-1">Clientes Suscritos</p>
                        <p className="text-3xl font-bold">{clientes.length}</p>
                        <p className="text-xs text-emerald-100 mt-1">
                            {clientes.length === 1 ? "1 cliente activo" : `${clientes.length} clientes activos`}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {ahorroPorVisita > 0 && (
                <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-emerald-100 mb-1">Ahorro con este plan</p>
                                <p className="text-3xl font-bold">
                                    {formatearPrecio(ahorroPorVisita)} por visita
                                </p>
                                <p className="text-sm text-emerald-100 mt-1">
                                    {ahorroPorcentaje}% de descuento vs{" "}
                                    {formatearPrecio(plan.precioSugerido)} (precio regular)
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm text-emerald-100">Ahorro mensual</p>
                                <p className="text-2xl font-bold">
                                    {formatearPrecio(costoSinPlan - costoMensual)}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-gray-400" />
                            Información del Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Frecuencia</span>
                            <span className="font-medium capitalize">{plan.frecuencia}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Sesiones por mes</span>
                            <span className="font-medium">{plan.sesionesPorMes}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Precio por visita</span>
                            <span className="font-medium">{formatearPrecio(plan.precioPorVisita)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Precio sugerido</span>
                            <span className="font-medium">
                                {plan.precioSugerido > 0 ? formatearPrecio(plan.precioSugerido) : "—"}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Destacado</span>
                            <span className="font-medium">
                                {plan.destacado ? (
                                    <Badge className="bg-amber-100 text-amber-700 border-0">Sí</Badge>
                                ) : (
                                    "No"
                                )}
                            </span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-500">Creado</span>
                            <span className="font-medium">
                                {formatearFecha(plan.createdAt)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-400" />
                            Clientes en este Plan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {clientes.length === 0 ? (
                            <p className="text-sm text-gray-500 text-center py-8">
                                No hay clientes asignados a este plan
                            </p>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {clientes.map((cliente) => (
                                    <Link
                                        key={cliente.$id}
                                        href={`/admin/clientes/${cliente.$id}`}
                                        className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors group"
                                    >
                                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0">
                                            {cliente.nombre.charAt(0)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 text-sm group-hover:text-primary transition-colors truncate">
                                                {cliente.nombre}
                                            </p>
                                            <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                <span className="flex items-center gap-1">
                                                    <Phone className="h-3 w-3" />
                                                    {cliente.telefono}
                                                </span>
                                                {cliente.proximaCitaAuto && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="h-3 w-3" />
                                                        Próxima: {formatearFecha(cliente.proximaCitaAuto)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <Badge variant="outline" className="text-[10px]">
                                            {cliente.totalServicios || 0} servicios
                                        </Badge>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
