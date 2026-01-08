"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    MapPin,
    Phone,
    Mail,
    Calendar as CalendarIcon,
    Clock,
    DollarSign,
    FileText,
    CheckCircle,
    XCircle,
    User,
    Building,
    CreditCard,
    Users,
    AlertCircle,
    Copy
} from "lucide-react";
import { obtenerCita, cambiarEstadoCita, asignarEmpleados } from "@/lib/actions/citas";
import { obtenerEmpleados } from "@/lib/actions/empleados";
import { formatearFecha, formatearPrecio, nombreCompleto } from "@/lib/utils";
import { obtenerURLArchivo } from "@/lib/appwrite";
import { EstadoCita, type Cita, type Empleado } from "@/types";
import { toast } from "sonner";

export default function DetalleCitaPage() {
    const params = useParams();
    const citaId = params.id as string;
    const [cita, setCita] = useState<Cita | null>(null);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [empleadosSeleccionados, setEmpleadosSeleccionados] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [actualizando, setActualizando] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, [citaId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [citaData, empleadosData] = await Promise.all([
                obtenerCita(citaId),
                obtenerEmpleados({ activo: true }),
            ]);
            setCita(citaData);
            setEmpleadosSeleccionados(citaData.empleadosAsignados || []);
            setEmpleados(empleadosData);
        } catch (error) {
            console.error("Error cargando cita:", error);
            toast.error("Error al cargar la cita");
        } finally {
            setLoading(false);
        }
    };

    const handleCambiarEstado = async (nuevoEstado: EstadoCita) => {
        if (!cita) return;
        setActualizando(true);
        // Optimistic update
        const anteriorEstado = cita.estado;
        setCita({ ...cita, estado: nuevoEstado });

        try {
            const result = await cambiarEstadoCita(cita.$id, nuevoEstado);
            if (result.success) {
                toast.success(`Estado actualizado a ${nuevoEstado.replace("-", " ")}`);
            } else {
                throw new Error(result.error);
            }
        } catch (error) {
            console.error("Error cambiando estado:", error);
            toast.error("Error al actualizar el estado");
            setCita({ ...cita, estado: anteriorEstado }); // Revert
        } finally {
            setActualizando(false);
        }
    };

    const handleAsignarEmpleados = async () => {
        if (!cita) return;
        setActualizando(true);
        try {
            await asignarEmpleados(cita.$id, empleadosSeleccionados);
            setCita({ ...cita, empleadosAsignados: empleadosSeleccionados });
            toast.success("Personal asignado correctamente");
        } catch (error) {
            console.error("Error asignando empleados:", error);
            toast.error("Error al asignar personal");
        } finally {
            setActualizando(false);
        }
    };

    const toggleEmpleado = (empleadoId: string) => {
        setEmpleadosSeleccionados((prev) =>
            prev.includes(empleadoId)
                ? prev.filter((id) => id !== empleadoId)
                : [...prev, empleadoId]
        );
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast.success("Copiado al portapapeles");
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-[calc(100vh-200px)]">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="text-sm text-gray-500 font-medium">Cargando detalles...</p>
                </div>
            </div>
        );
    }

    if (!cita) {
        return (
            <div className="text-center py-20">
                <div className="bg-gray-50 p-4 rounded-full shadow-inner inline-block mb-4">
                    <AlertCircle className="h-10 w-10 text-gray-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900">Cita no encontrada</h2>
                <p className="text-gray-500 mt-2 mb-6">La cita que buscas no existe o ha sido eliminada.</p>
                <Link href="/admin/citas">
                    <Button variant="outline">Volver a la Agenda</Button>
                </Link>
            </div>
        );
    }

    const empleadosAsignadosData = empleados.filter((e) =>
        (cita.empleadosAsignados || []).includes(e.$id)
    );

    const getEstadoBadge = (estado: EstadoCita) => {
        const styles = {
            [EstadoCita.PENDIENTE]: "bg-amber-100 text-amber-700 border-amber-200",
            [EstadoCita.CONFIRMADA]: "bg-blue-100 text-blue-700 border-blue-200",
            [EstadoCita.EN_PROGRESO]: "bg-violet-100 text-violet-700 border-violet-200",
            [EstadoCita.COMPLETADA]: "bg-emerald-100 text-emerald-700 border-emerald-200",
            [EstadoCita.CANCELADA]: "bg-rose-100 text-rose-700 border-rose-200",
        };

        return (
            <Badge variant="outline" className={`capitalize px-3 py-1 text-sm font-semibold shadow-sm ${styles[estado] || "bg-gray-100"}`}>
                {estado.replace("-", " ")}
            </Badge>
        );
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10 max-w-6xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                <div className="flex items-start gap-4">
                    <Link href="/admin/citas">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full border-gray-200 hover:bg-white hover:border-gray-300 shadow-sm transition-all">
                            <ArrowLeft className="h-5 w-5 text-gray-600" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Detalle de Servicio</h1>
                            {getEstadoBadge(cita.estado)}
                        </div>
                        <div className="flex items-center gap-2 text-gray-500 text-sm font-mono bg-gray-100 px-2 py-0.5 rounded w-fit group cursor-pointer hover:bg-gray-200 transition-colors"
                            onClick={() => copyToClipboard(cita.$id)}>
                            <span>ID: {cita.$id}</span>
                            <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                </div>

                {/* Status Control Segmented Button */}
                <div className="bg-gray-100 p-1 rounded-lg flex overflow-x-auto max-w-full">
                    {[
                        { label: "Pendiente", value: EstadoCita.PENDIENTE },
                        { label: "Confirmar", value: EstadoCita.CONFIRMADA },
                        { label: "En Progreso", value: EstadoCita.EN_PROGRESO },
                        { label: "Completar", value: EstadoCita.COMPLETADA },
                        { label: "Cancelar", value: EstadoCita.CANCELADA },
                    ].map((status) => (
                        <button
                            key={status.value}
                            onClick={() => handleCambiarEstado(status.value)}
                            disabled={actualizando}
                            className={`
                                px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap
                                ${cita.estado === status.value
                                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50"}
                                ${status.value === EstadoCita.CANCELADA && cita.estado === status.value ? "!bg-rose-50 !text-rose-700 !ring-rose-200" : ""}
                            `}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column: Details (2/3 width on large screens) */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Client & Service Info */}
                    <Card className="border-gray-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <User className="h-5 w-5 text-primary" />
                                Información del Cliente & Propiedad
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6 p-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Cliente</label>
                                    <div className="mt-1 font-medium text-lg text-gray-900">{cita.clienteNombre}</div>
                                    <div className="flex flex-col gap-1 mt-1">
                                        <a href={`tel:${cita.clienteTelefono}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                                            <Phone className="h-3.5 w-3.5" />
                                            {cita.clienteTelefono}
                                        </a>
                                        <a href={`mailto:${cita.clienteEmail}`} className="flex items-center gap-2 text-sm text-gray-600 hover:text-primary transition-colors">
                                            <Mail className="h-3.5 w-3.5" />
                                            {cita.clienteEmail}
                                        </a>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ubicación</label>
                                    <div className="mt-1 flex items-start gap-2">
                                        <MapPin className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                                        <div>
                                            <div className="font-medium text-gray-900">{cita.direccion}</div>
                                            <div className="text-sm text-gray-500">{cita.ciudad}</div>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Propiedad</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <Building className="h-4 w-4 text-gray-400" />
                                        <span className="capitalize text-gray-900">{cita.tipoPropiedad}</span>
                                        {(cita.metrosCuadrados || 0) > 0 && (
                                            <span className="text-gray-400 text-sm">• {cita.metrosCuadrados} m²</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Details */}
                    <Card className="border-gray-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <CalendarIcon className="h-5 w-5 text-primary" />
                                Detalles del Servicio
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Fecha</label>
                                    <div className="mt-1 font-medium text-gray-900 flex items-center gap-2">
                                        {formatearFecha(cita.fechaCita)}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hora</label>
                                    <div className="mt-1 font-medium text-gray-900 flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        {cita.horaCita}
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Duración</label>
                                    <div className="mt-1 font-medium text-gray-900">{cita.duracionEstimada} min</div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Espacios</label>
                                    <div className="mt-1 font-medium text-gray-900">
                                        {cita.habitaciones} Hab • {cita.banos} Baños
                                    </div>
                                </div>
                            </div>

                            {(cita.detallesAdicionales || cita.notasInternas) && (
                                <>
                                    <Separator className="my-6" />
                                    <div className="space-y-4">
                                        {cita.detallesAdicionales && (
                                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-100">
                                                <h4 className="text-sm font-semibold text-amber-800 mb-1 flex items-center gap-2">
                                                    <FileText className="h-4 w-4" /> Notas del Cliente
                                                </h4>
                                                <p className="text-sm text-amber-900">{cita.detallesAdicionales}</p>
                                            </div>
                                        )}
                                        {cita.notasInternas && (
                                            <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                                                <h4 className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-2">
                                                    <AlertCircle className="h-4 w-4" /> Notas Internas
                                                </h4>
                                                <p className="text-sm text-gray-600">{cita.notasInternas}</p>
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column: Financials & Team (1/3 width) */}
                <div className="space-y-6">
                    {/* Payment Info */}
                    <Card className="border-gray-200 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Pago
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="text-center p-4 bg-primary/5 rounded-xl border border-primary/10">
                                <label className="text-xs font-semibold text-primary/70 uppercase tracking-wider">Total a Cobrar</label>
                                <div className="text-3xl font-bold text-gray-900 mt-1">
                                    {formatearPrecio(cita.precioAcordado)}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                                    <span className="text-sm text-gray-600">Método</span>
                                    <Badge variant="secondary" className="uppercase font-bold tracking-wide text-[10px]">
                                        {cita.metodoPago.replace("_", " ")}
                                    </Badge>
                                </div>
                                <div className="flex justify-between items-center py-2">
                                    <span className="text-sm text-gray-600">Estado</span>
                                    <Badge
                                        variant="outline"
                                        className={cita.pagadoPorCliente
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                            : "bg-gray-100 text-gray-600 border-gray-200"}
                                    >
                                        {cita.pagadoPorCliente ? "PAGADO" : "PENDIENTE"}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Assignment */}
                    <Card className="border-gray-200 shadow-sm overflow-hidden flex flex-col h-auto">
                        <CardHeader className="bg-gray-50/50 border-b border-gray-100 pb-4">
                            <CardTitle className="flex items-center gap-2 text-base font-semibold text-gray-900">
                                <Users className="h-5 w-5 text-primary" />
                                Personal Asignado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 flex-1 flex flex-col gap-4">
                            {empleadosAsignadosData.length > 0 ? (
                                <div className="space-y-3">
                                    {empleadosAsignadosData.map((empleado) => (
                                        <div key={empleado.$id} className="flex items-center gap-3 p-3 bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                            <Avatar className="h-10 w-10 border border-gray-100">
                                                <AvatarImage src={obtenerURLArchivo(empleado.foto || "")} className="object-cover" />
                                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                    {empleado.nombre[0]}{empleado.apellido[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-medium text-gray-900 text-sm truncate">
                                                    {nombreCompleto(empleado.nombre, empleado.apellido)}
                                                </div>
                                                <div className="text-xs text-gray-500 capitalize">{empleado.cargo}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">Sin personal asignado</p>
                                </div>
                            )}

                            <Separator />

                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Gestionar Asignación</label>
                                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg p-1 bg-white">
                                    {empleados.map((empleado) => (
                                        <label
                                            key={empleado.$id}
                                            className="flex items-center space-x-3 cursor-pointer p-2 hover:bg-gray-50 rounded-md transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={empleadosSeleccionados.includes(empleado.$id)}
                                                onChange={() => toggleEmpleado(empleado.$id)}
                                                className="rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                                            />
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={obtenerURLArchivo(empleado.foto || "")} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {empleado.nombre[0]}{empleado.apellido[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm text-gray-700">
                                                    {nombreCompleto(empleado.nombre, empleado.apellido)}
                                                </span>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                                <Button
                                    onClick={handleAsignarEmpleados}
                                    disabled={actualizando}
                                    className="w-full"
                                    size="sm"
                                >
                                    Actualizar Personal
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
