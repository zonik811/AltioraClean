"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import {
    ArrowLeft,
    Edit,
    Phone,
    Mail,
    MapPin,
    Calendar as CalendarIcon,
    DollarSign,
    Star,
    Clock,
    Briefcase,
    User,
    CheckCircle2,
    Save,
    X,
    Wallet,
    CreditCard,
    Plus
} from "lucide-react";
import Link from "next/link";
import { obtenerEmpleado, obtenerEstadisticasEmpleado, actualizarEmpleado } from "@/lib/actions/empleados";
import { obtenerCitas, actualizarCita } from "@/lib/actions/citas";
import { obtenerPagosEmpleado, registrarPago, type Pago } from "@/lib/actions/pagos";
import { obtenerURLArchivo } from "@/lib/appwrite";
import { nombreCompleto, formatearPrecio, formatearFecha } from "@/lib/utils";
import { type Empleado, type EstadisticasEmpleado, type Cita, type ModalidadPago, EstadoCita, CargoEmpleado } from "@/types";

export default function PerfilEmpleadoPage() {
    const params = useParams();
    const empleadoId = params.id as string;
    const router = useRouter();

    // Estados de Datos
    const [empleado, setEmpleado] = useState<Empleado | null>(null);
    const [stats, setStats] = useState<EstadisticasEmpleado | null>(null);
    const [servicios, setServicios] = useState<Cita[]>([]);
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [loading, setLoading] = useState(true);

    // Estados de Edición de Perfil
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [editData, setEditData] = useState({
        nombre: "",
        apellido: "",
        telefono: "",
        email: "",
        direccion: "",
        cargo: "" as CargoEmpleado | string,
        documento: ""
    });

    // Estados de Edición de Pago/Horas
    const [editingHoras, setEditingHoras] = useState<{ [key: string]: number }>({});
    const [editingPago, setEditingPago] = useState(false);
    const [tarifaPorHora, setTarifaPorHora] = useState(0);
    const [modalidadPago, setModalidadPago] = useState<string>('hora');

    // Estado de Registro de Pago
    const [showPagoDialog, setShowPagoDialog] = useState(false);
    const [nuevoPago, setNuevoPago] = useState({
        monto: 0,
        concepto: 'pago_mensual',
        metodoPago: 'transferencia',
        periodo: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
        fechaPago: new Date().toISOString().split('T')[0],
        notas: ''
    });

    useEffect(() => {
        cargarEmpleado();
    }, [empleadoId]);

    const cargarEmpleado = async () => {
        try {
            setLoading(true);
            const data = await obtenerEmpleado(empleadoId);
            setEmpleado(data);
            setEditData({
                nombre: data.nombre,
                apellido: data.apellido,
                telefono: data.telefono,
                email: data.email,
                direccion: data.direccion,
                cargo: data.cargo,
                documento: data.documento
            });
            setTarifaPorHora(data.tarifaPorHora);
            setModalidadPago(data.modalidadPago);

            const estadisticas = await obtenerEstadisticasEmpleado(empleadoId);
            setStats(estadisticas);

            // Servicios
            const todasCitas = await obtenerCitas();
            const serviciosCompletados = todasCitas.filter(
                (cita: Cita) =>
                    cita.estado === EstadoCita.COMPLETADA &&
                    cita.empleadosAsignados?.includes(empleadoId)
            );
            setServicios(serviciosCompletados);

            // Inicializar horas editables
            const horasIniciales: { [key: string]: number } = {};
            serviciosCompletados.forEach((cita: Cita) => {
                horasIniciales[cita.$id] = cita.horasTrabajadas || 8;
            });
            setEditingHoras(horasIniciales);

            // Pagos
            const historialPagos = await obtenerPagosEmpleado(empleadoId);
            setPagos(historialPagos);
        } catch (error) {
            console.error("Error cargando empleado:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async () => {
        if (!empleado) return;
        try {
            await actualizarEmpleado(empleadoId, {
                ...editData,
                cargo: editData.cargo as CargoEmpleado,
                activo: empleado.activo
            });
            setShowEditProfile(false);
            cargarEmpleado();
        } catch (error) {
            console.error("Error actualizando perfil:", error);
        }
    };

    const handleUpdateHoras = async (citaId: string) => {
        try {
            const horas = editingHoras[citaId];
            await actualizarCita(citaId, { horasTrabajadas: horas });
            cargarEmpleado();
        } catch (error) {
            console.error("Error actualizando horas:", error);
        }
    };

    const handleUpdatePagoSettings = async () => {
        try {
            await actualizarEmpleado(empleadoId, {
                tarifaPorHora,
                modalidadPago: modalidadPago as ModalidadPago
            });
            setEditingPago(false);
            cargarEmpleado();
        } catch (error) {
            console.error("Error actualizando configuración pago:", error);
        }
    };

    const handleRegistrarPago = async () => {
        try {
            const result = await registrarPago({
                empleadoId,
                ...nuevoPago
            });
            if (result.success) {
                setShowPagoDialog(false);
                setNuevoPago({
                    monto: 0,
                    concepto: 'pago_mensual',
                    metodoPago: 'transferencia',
                    periodo: new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' }),
                    fechaPago: new Date().toISOString().split('T')[0],
                    notas: ''
                });
                cargarEmpleado();
            }
        } catch (error) {
            console.error("Error registrando pago:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-50/50">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-gray-500 font-medium">Cargando perfil...</p>
                </div>
            </div>
        );
    }

    if (!empleado) return <div>Empleado no encontrado</div>;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/pagos/empleados">
                        <Button variant="outline" size="icon" className="h-10 w-10 rounded-full bg-white shadow-sm hover:bg-gray-50">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {nombreCompleto(empleado.nombre, empleado.apellido)}
                        </h1>
                        <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="font-normal text-xs bg-gray-100 text-gray-600 border-gray-200">
                                {empleado.cargo || 'Sin cargo'}
                            </Badge>
                            <Badge className={empleado.activo ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-emerald-200" : "bg-red-100 text-red-700 hover:bg-red-200 border-red-200"}>
                                {empleado.activo ? "Activo" : "Inactivo"}
                            </Badge>
                        </div>
                    </div>
                </div>
                <Button
                    onClick={() => setShowEditProfile(true)}
                    className="shadow-sm border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900 w-full md:w-auto"
                    variant="outline"
                >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar Perfil
                </Button>
            </div>

            {/* Main Info Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column: Personal Info */}
                <Card className="lg:col-span-1 border-none shadow-md bg-white overflow-hidden h-fit">
                    <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                    <CardContent className="relative pt-0 pb-8 px-6">
                        <div className="-mt-16 mb-6 flex justify-center">
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                {empleado.foto ? (
                                    <AvatarImage src={obtenerURLArchivo(empleado.foto || "")} className="object-cover" />
                                ) : (
                                    <AvatarFallback className="text-4xl bg-gray-100 text-gray-400">
                                        {empleado.nombre[0]}{empleado.apellido[0]}
                                    </AvatarFallback>
                                )}
                            </Avatar>
                        </div>

                        <div className="space-y-6">
                            <div className="grid gap-4">
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                        <Phone className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Teléfono</p>
                                        <p className="text-sm font-semibold text-gray-900">{empleado.telefono}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                        <Mail className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Email</p>
                                        <p className="text-sm font-semibold text-gray-900 truncate max-w-[200px]" title={empleado.email}>{empleado.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                        <MapPin className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Dirección</p>
                                        <p className="text-sm font-semibold text-gray-900">{empleado.direccion}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                        <CalendarIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Contratado</p>
                                        <p className="text-sm font-semibold text-gray-900">{formatearFecha(empleado.fechaContratacion)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50/80">
                                    <div className="h-10 w-10 rounded-full bg-white flex items-center justify-center text-blue-600 shadow-sm">
                                        <CreditCard className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Documento</p>
                                        <p className="text-sm font-semibold text-gray-900">{empleado.documento}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-3">Especialidades</p>
                                <div className="flex flex-wrap gap-2">
                                    {empleado.especialidades.map((esp, i) => (
                                        <Badge key={i} variant="outline" className="bg-white hover:bg-gray-50 text-gray-600 border-gray-200">
                                            {esp.replace(/_/g, " ")}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Right Column: Stats & Tables */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Stats Grid */}
                    {stats && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <Card className="border-none shadow-sm bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
                                <div className="absolute top-0 right-0 p-4 bg-white/10 rounded-full -mt-2 -mr-2 blur-xl"></div>
                                <CardContent className="p-6 relative z-10">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-emerald-100 text-sm font-medium">Total Ganado Histórico</p>
                                            <h3 className="text-3xl font-bold mt-1">{formatearPrecio(stats.totalGanado)}</h3>
                                        </div>
                                        <div className="bg-white/20 p-2 rounded-lg">
                                            <CheckCircle2 className="h-5 w-5 text-white" />
                                        </div>
                                    </div>
                                    <p className="text-xs text-emerald-100 mt-4 bg-emerald-700/30 inline-block px-2 py-1 rounded">
                                        {empleado.serviciosRealizados} servicios completados
                                    </p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm bg-white overflow-hidden border-orange-100 border">
                                <CardContent className="p-6">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-orange-600 text-sm font-bold uppercase tracking-wide">Pendiente por Pagar</p>
                                            <h3 className="text-3xl font-bold mt-1 text-gray-900">{formatearPrecio(stats.pendientePorPagar)}</h3>
                                        </div>
                                        <div className="bg-orange-50 p-2 rounded-lg">
                                            <Wallet className="h-5 w-5 text-orange-500" />
                                        </div>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            setNuevoPago(prev => ({ ...prev, monto: stats.pendientePorPagar }));
                                            setShowPagoDialog(true);
                                        }}
                                        className="w-full mt-4 bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-100 shadow-none"
                                    >
                                        Saldar Pendiente
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Configuration Card */}
                    <Card className="border-none shadow-sm bg-gray-50 border border-gray-100">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold text-gray-800 flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-gray-500" /> Configuración de Pago
                                </CardTitle>
                                {!editingPago ? (
                                    <Button variant="ghost" size="sm" onClick={() => setEditingPago(true)} className="h-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        Cambiar Tarifa
                                    </Button>
                                ) : (
                                    <div className="flex gap-2">
                                        <Button variant="ghost" size="sm" onClick={() => setEditingPago(false)} className="h-7 text-xs">Cancelar</Button>
                                        <Button size="sm" onClick={handleUpdatePagoSettings} className="h-7 text-xs bg-blue-600 hover:bg-blue-700">Guardar</Button>
                                    </div>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex gap-8 items-center">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Modalidad</p>
                                    {editingPago ? (
                                        <select
                                            className="px-2 py-1 bg-white border rounded text-sm min-w-[120px]"
                                            value={modalidadPago}
                                            onChange={(e) => setModalidadPago(e.target.value)}
                                        >
                                            <option value="hora">Por Hora</option>
                                            <option value="porcentaje">Porcentaje</option>
                                            <option value="fijo">Sueldo Fijo</option>
                                        </select>
                                    ) : (
                                        <p className="font-semibold text-gray-900 capitalize">{empleado.modalidadPago || 'Por Hora'}</p>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Tarifa Base</p>
                                    {editingPago ? (
                                        <Input
                                            type="number"
                                            className="h-8 w-32 bg-white"
                                            value={tarifaPorHora}
                                            onChange={(e) => setTarifaPorHora(parseInt(e.target.value) || 0)}
                                        />
                                    ) : (
                                        <p className="font-semibold text-gray-900">{formatearPrecio(empleado.tarifaPorHora)}</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Services History */}
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                        <CardHeader className="pb-0 border-b border-gray-100 bg-gray-50/30">
                            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2 py-2">
                                <Clock className="h-5 w-5 text-gray-400" />
                                Servicios Realizados
                                <Badge variant="secondary" className="ml-2 bg-gray-100 text-gray-600 border-none">{servicios.length}</Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="w-[100px] pl-6 font-semibold">Fecha</TableHead>
                                            <TableHead className="font-semibold">Cliente</TableHead>
                                            <TableHead className="text-center font-semibold">Horas</TableHead>
                                            <TableHead className="text-right pr-6 font-semibold">Total Calculado</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {servicios.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                                    No hay servicios completados aún
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            servicios.map((cita) => {
                                                const horas = editingHoras[cita.$id] || 8;
                                                const total = horas * empleado.tarifaPorHora;
                                                return (
                                                    <TableRow key={cita.$id} className="hover:bg-gray-50/50">
                                                        <TableCell className="pl-6 font-medium bg-transparent">
                                                            {formatearFecha(cita.fechaCita)}
                                                        </TableCell>
                                                        <TableCell className="text-gray-600">{cita.clienteNombre}</TableCell>
                                                        <TableCell className="text-center">
                                                            <div className="flex items-center justify-center gap-2">
                                                                <Input
                                                                    type="number"
                                                                    value={horas}
                                                                    onChange={(e) => setEditingHoras({
                                                                        ...editingHoras,
                                                                        [cita.$id]: parseInt(e.target.value) || 0
                                                                    })}
                                                                    className="w-14 h-7 text-center px-1 text-sm bg-white"
                                                                    min={0}
                                                                    max={24}
                                                                />
                                                                <Button
                                                                    size="icon"
                                                                    variant="ghost"
                                                                    className="h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                                                    disabled={horas === (cita.horasTrabajadas || 8)}
                                                                    onClick={() => handleUpdateHoras(cita.$id)}
                                                                >
                                                                    <Save className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6 font-semibold text-gray-900">
                                                            {formatearPrecio(total)}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payment History */}
                    <Card className="border-none shadow-md overflow-hidden bg-white">
                        <CardHeader className="pb-0 border-b border-gray-100 bg-gray-50/30 flex flex-row items-center justify-between pr-6">
                            <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2 py-2">
                                <DollarSign className="h-5 w-5 text-gray-400" />
                                Historial de Pagos
                            </CardTitle>
                            <Button size="sm" variant="outline" onClick={() => setShowPagoDialog(true)} className="h-8">
                                <Plus className="h-3.5 w-3.5 mr-1" /> Nuevo Pago
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[300px] overflow-y-auto">
                                <Table>
                                    <TableHeader className="bg-gray-50 sticky top-0 z-10">
                                        <TableRow>
                                            <TableHead className="pl-6 font-semibold">Fecha</TableHead>
                                            <TableHead className="font-semibold">Concepto</TableHead>
                                            <TableHead className="text-right pr-6 font-semibold">Monto</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {pagos.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                                                    No hay pagos registrados
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            pagos.map((pago) => (
                                                <TableRow key={pago.$id} className="hover:bg-gray-50/50">
                                                    <TableCell className="pl-6 text-gray-600">
                                                        {formatearFecha(pago.fechaPago)}
                                                    </TableCell>
                                                    <TableCell>
                                                        <Badge variant="outline" className="font-normal capitalize text-gray-600">
                                                            {pago.concepto.replace("_", " ")}
                                                        </Badge>
                                                        {pago.notas && <p className="text-xs text-gray-400 mt-0.5 max-w-[200px] truncate">{pago.notas}</p>}
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6 font-bold text-emerald-600">
                                                        {formatearPrecio(pago.monto)}
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Dialog Editar Perfil */}
            <Dialog open={showEditProfile} onOpenChange={setShowEditProfile}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Editar Perfil de Empleado</DialogTitle>
                        <DialogDescription>Actualiza la información personal y laboral del empleado.</DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Nombre</Label>
                            <Input value={editData.nombre} onChange={(e) => setEditData({ ...editData, nombre: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Apellido</Label>
                            <Input value={editData.apellido} onChange={(e) => setEditData({ ...editData, apellido: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Documento</Label>
                            <Input value={editData.documento} onChange={(e) => setEditData({ ...editData, documento: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Cargo</Label>
                            <div className="relative">
                                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                <select
                                    className="flex h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                    value={editData.cargo}
                                    onChange={(e) => setEditData({ ...editData, cargo: e.target.value as CargoEmpleado })}
                                >
                                    <option value="limpiador">Limpiador</option>
                                    <option value="supervisor">Supervisor</option>
                                    <option value="especialista">Especialista</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Teléfono</Label>
                            <Input value={editData.telefono} onChange={(e) => setEditData({ ...editData, telefono: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input value={editData.email} onChange={(e) => setEditData({ ...editData, email: e.target.value })} />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Dirección</Label>
                            <Input value={editData.direccion} onChange={(e) => setEditData({ ...editData, direccion: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowEditProfile(false)}>Cancelar</Button>
                        <Button onClick={handleUpdateProfile} className="bg-blue-600 hover:bg-blue-700">Guardar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Dialog Registrar Pago */}
            <Dialog open={showPagoDialog} onOpenChange={setShowPagoDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Pago</DialogTitle>
                        <DialogDescription>Nuevo pago para {empleado.nombre} {empleado.apellido}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Monto</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        className="pl-9"
                                        value={nuevoPago.monto}
                                        onChange={(e) => setNuevoPago({ ...nuevoPago, monto: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>
                            <div>
                                <Label>Fecha</Label>
                                <Input
                                    type="date"
                                    value={nuevoPago.fechaPago}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, fechaPago: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Concepto</Label>
                                <select
                                    className="w-full h-10 px-3 border rounded-md bg-white text-sm"
                                    value={nuevoPago.concepto}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, concepto: e.target.value })}
                                >
                                    <option value="pago_mensual">Mensualidad</option>
                                    <option value="servicio">Servicio</option>
                                    <option value="anticipo">Anticipo</option>
                                    <option value="bono">Bono</option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <Label>Notas</Label>
                                <Input
                                    placeholder="Detalles adicionales..."
                                    value={nuevoPago.notas}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, notas: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowPagoDialog(false)}>Cancelar</Button>
                        <Button onClick={handleRegistrarPago} className="bg-emerald-600 hover:bg-emerald-700">Registrar Pago</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
