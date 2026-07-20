"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Calendar,
    Award,
    Edit2,
    Trash2,
    XCircle,
    Save,
    X,
    Loader2,
    Home,
    Building2,
    Sparkles,
} from "lucide-react";
import {
    obtenerCliente,
    actualizarCliente,
    eliminarCliente,
} from "@/lib/actions/clientes";
import {
    obtenerPlanes,
    asignarPlanACliente,
    cancelarPlan,
} from "@/lib/actions/planes";
import { formatearPrecio, formatearFecha } from "@/lib/utils";
import type { Cliente, TipoCliente, FrecuenciaCliente, Plan } from "@/types";
import { toast } from "sonner";

export default function DetalleClientePage() {
    const params = useParams();
    const clienteId = params.id as string;
    const router = useRouter();

    const [cliente, setCliente] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [showPlanDialog, setShowPlanDialog] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState("");

    const [editForm, setEditForm] = useState({
        nombre: "",
        telefono: "",
        email: "",
        direccion: "",
        ciudad: "",
        tipoCliente: "residencial" as string,
        frecuenciaPreferida: "unica" as string,
        notasImportantes: "",
    });

    useEffect(() => {
        cargarCliente();
        cargarPlanes();
    }, [clienteId]);

    const cargarPlanes = async () => {
        const data = await obtenerPlanes(true);
        setPlanes(data.documents);
    };

    const handleAsignarPlan = async () => {
        if (!selectedPlanId) return;
        try {
            const result = await asignarPlanACliente(clienteId, selectedPlanId);
            if (result.success) {
                toast.success("Plan asignado");
                setShowPlanDialog(false);
                cargarCliente();
            }
        } catch {
            toast.error("Error al asignar plan");
        }
    };

    const handleCancelarPlan = async () => {
        try {
            const result = await cancelarPlan(clienteId);
            if (result.success) {
                toast.success("Plan cancelado");
                cargarCliente();
            }
        } catch {
            toast.error("Error al cancelar plan");
        }
    };

    const cargarCliente = async () => {
        try {
            setLoading(true);
            const data = await obtenerCliente(clienteId);
            setCliente(data);
            setEditForm({
                nombre: data.nombre,
                telefono: data.telefono,
                email: data.email,
                direccion: data.direccion,
                ciudad: data.ciudad,
                tipoCliente: data.tipoCliente,
                frecuenciaPreferida: data.frecuenciaPreferida || "unica",
                notasImportantes: data.notasImportantes || "",
            });
        } catch {
            toast.error("Error al cargar cliente");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!cliente) return;
        try {
            const result = await actualizarCliente(clienteId, {
                nombre: editForm.nombre,
                telefono: editForm.telefono,
                email: editForm.email,
                direccion: editForm.direccion,
                ciudad: editForm.ciudad,
                tipoCliente: editForm.tipoCliente as TipoCliente,
                frecuenciaPreferida: editForm.frecuenciaPreferida as FrecuenciaCliente,
                notasImportantes: editForm.notasImportantes || undefined,
            });
            if (result.success) {
                toast.success("Cliente actualizado");
                setShowEdit(false);
                cargarCliente();
            }
        } catch {
            toast.error("Error al actualizar");
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const result = await eliminarCliente(clienteId);
            if (result.success) {
                toast.success("Cliente eliminado");
                router.push("/admin/clientes");
            }
        } catch {
            toast.error("Error al eliminar");
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return <DetalleSkeleton />;
    }

    if (!cliente) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <XCircle className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Cliente no encontrado</h2>
                <p className="text-gray-500 mb-6">El cliente que buscas no existe o ha sido eliminado.</p>
                <Link href="/admin/clientes"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Clientes</Button></Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/clientes">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="h-14 w-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                        {cliente.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{cliente.nombre}</h1>
                        <p className="text-sm text-gray-500">Cliente desde {formatearFecha(cliente.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => setShowEdit(true)}>
                        <Edit2 className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button variant="outline" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setShowConfirmDelete(true)}>
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Contacto</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Teléfono</p>
                                    <p className="font-medium text-gray-900">{cliente.telefono}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Email</p>
                                    <p className="font-medium text-gray-900">{cliente.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <div>
                                    <p className="text-xs text-gray-400">Dirección</p>
                                    <p className="font-medium text-gray-900">{cliente.direccion}</p>
                                    <p className="text-sm text-gray-500">{cliente.ciudad}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Clasificación</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Tipo</span>
                                <Badge variant="outline" className={
                                    cliente.tipoCliente === "residencial"
                                        ? "bg-blue-50 text-blue-700 border-blue-200"
                                        : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                }>
                                    {cliente.tipoCliente === "residencial" ? "Residencial" : "Comercial"}
                                </Badge>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Frecuencia</span>
                                <span className="text-sm font-medium capitalize text-gray-900">{cliente.frecuenciaPreferida || "N/A"}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Estado</span>
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${cliente.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                    {cliente.activo ? "Activo" : "Inactivo"}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Estadísticas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{cliente.totalServicios || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Servicios</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-emerald-600">{cliente.serviciosCompletados || 0}</p>
                                    <p className="text-xs text-gray-500 mt-1">Completados</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{formatearPrecio(cliente.totalGastado || 0)}</p>
                                    <p className="text-xs text-gray-500 mt-1">Total Gastado</p>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-primary flex items-center justify-center gap-1">
                                        <Award className="h-5 w-5" /> {cliente.puntosAcumulados || 0}
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">Puntos</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {cliente.notasImportantes ? (
                                <p className="text-gray-700">{cliente.notasImportantes}</p>
                            ) : (
                                <p className="text-gray-400 text-sm">Sin notas registradas.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-400" />
                                Fidelidad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                    <p className="text-slate-400 text-sm">Nivel</p>
                                    <p className="text-xl font-bold text-yellow-400">{(cliente.nivelFidelidad || "bronce").toUpperCase()}</p>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                    <p className="text-slate-400 text-sm">Puntos</p>
                                    <p className="text-xl font-bold text-white">{cliente.puntosAcumulados || 0}</p>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                    <p className="text-slate-400 text-sm">Valor Total</p>
                                    <p className="text-xl font-bold text-white">{formatearPrecio(cliente.totalGastado || 0)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Plan Recurrente</CardTitle>
                                {cliente.planId ? (
                                    <Button variant="ghost" size="sm" className="h-7 text-xs text-red-500 hover:text-red-700" onClick={handleCancelarPlan}>
                                        Cancelar Plan
                                    </Button>
                                ) : (
                                    <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => {
                                        setSelectedPlanId("");
                                        setShowPlanDialog(true);
                                    }}>
                                        Asignar Plan
                                    </Button>
                                )}
                            </div>
                        </CardHeader>
                        <CardContent>
                            {cliente.planId ? (
                                <div className="space-y-3">
                                    <p className="text-sm text-gray-700">
                                        Plan activo desde {cliente.planInicio ? formatearFecha(cliente.planInicio) : "desconocido"}
                                    </p>
                                    {cliente.proximaCitaAuto && (
                                        <p className="text-sm text-gray-500">
                                            Próxima visita: {formatearFecha(cliente.proximaCitaAuto)}
                                        </p>
                                    )}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400">Sin plan recurrente asignado</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {showPlanDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-lg text-gray-900">Asignar Plan Recurrente</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowPlanDialog(false)} className="rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <p className="text-sm text-gray-500">Selecciona un plan para {cliente.nombre}</p>
                            <select
                                value={selectedPlanId}
                                onChange={(e) => setSelectedPlanId(e.target.value)}
                                className="w-full h-11 px-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            >
                                <option value="">Seleccionar plan...</option>
                                {planes.map((p) => (
                                    <option key={p.$id} value={p.$id}>
                                        {p.nombre} — {formatearPrecio(p.precioPorVisita)} / visita ({p.frecuencia})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowPlanDialog(false)}>Cancelar</Button>
                            <Button onClick={handleAsignarPlan} disabled={!selectedPlanId}>Asignar Plan</Button>
                        </div>
                    </div>
                </div>
            )}

            {showEdit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">Editar Cliente</h3>
                                <p className="text-sm text-gray-500">{cliente.nombre}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowEdit(false)} className="rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-6 grid gap-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Nombre</label>
                                <Input value={editForm.nombre} onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Teléfono</label>
                                    <Input value={editForm.telefono} onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email</label>
                                    <Input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Dirección</label>
                                <Input value={editForm.direccion} onChange={(e) => setEditForm({ ...editForm, direccion: e.target.value })} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Ciudad</label>
                                    <Input value={editForm.ciudad} onChange={(e) => setEditForm({ ...editForm, ciudad: e.target.value })} />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Tipo</label>
                                    <select value={editForm.tipoCliente} onChange={(e) => setEditForm({ ...editForm, tipoCliente: e.target.value })} className="w-full h-10 px-3 border rounded-lg text-sm">
                                        <option value="residencial">Residencial</option>
                                        <option value="comercial">Comercial</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Notas</label>
                                <textarea value={editForm.notasImportantes} onChange={(e) => setEditForm({ ...editForm, notasImportantes: e.target.value })} rows={3} className="w-full rounded-lg border border-input px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowEdit(false)} className="h-10 px-6">Cancelar</Button>
                            <Button onClick={handleSaveEdit} className="h-10 px-6 bg-primary hover:bg-primary/90"><Save className="mr-2 h-4 w-4" /> Guardar</Button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar cliente?</h3>
                            <p className="text-sm text-gray-500 mb-6">Esta acción eliminará permanentemente a <strong>{cliente.nombre}</strong> y no se puede deshacer.</p>
                            <div className="flex gap-3 justify-center">
                                <Button variant="outline" onClick={() => setShowConfirmDelete(false)} className="h-10 px-6">Cancelar</Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="h-10 px-6">
                                    {deleting ? "Eliminando..." : "Eliminar Cliente"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function DetalleSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-14 w-14 rounded-full" />
                <div>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card><CardContent className="pt-6 space-y-4">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</CardContent></Card>
                    <Card><CardContent className="pt-6 space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-8 w-full" />)}</CardContent></Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                    <Card><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
                </div>
            </div>
        </div>
    );
}
