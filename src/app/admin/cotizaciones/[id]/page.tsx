"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    obtenerCotizacion,
    actualizarCotizacion,
    eliminarCotizacion,
    convertirCotizacionEnCita,
} from "@/lib/actions/cotizaciones";
import type { Cotizacion } from "@/types";
import { EstadoCotizacion } from "@/types";
import { toast } from "sonner";
import { formatearPrecio, formatearFecha } from "@/lib/utils";
import { PDFPreview } from "@/components/admin/cotizaciones/pdf-cotizacion";
import { GenerarPDFButton } from "@/components/admin/cotizaciones/generar-pdf";
import {
    ArrowLeft,
    Trash2,
    Loader2,
    Send,
    CheckCircle,
    XCircle,
    Calendar,
    Edit2,
} from "lucide-react";
import Link from "next/link";

const ESTADOS = [
    { value: EstadoCotizacion.BORRADOR, label: "Borrador", color: "bg-gray-100 text-gray-600" },
    { value: EstadoCotizacion.ENVIADA, label: "Enviada", color: "bg-blue-100 text-blue-700" },
    { value: EstadoCotizacion.APROBADA, label: "Aprobada", color: "bg-green-100 text-green-700" },
    { value: EstadoCotizacion.RECHAZADA, label: "Rechazada", color: "bg-red-100 text-red-700" },
    { value: EstadoCotizacion.CONVERTIDA, label: "Convertida", color: "bg-purple-100 text-purple-700" },
];

export default function CotizacionDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [cotizacion, setCotizacion] = useState<Cotizacion | null>(null);
    const [loading, setLoading] = useState(true);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showConvertDialog, setShowConvertDialog] = useState(false);
    const [fechaCita, setFechaCita] = useState("");
    const [horaCita, setHoraCita] = useState("");
    const [editando, setEditando] = useState(false);
    const [editNotas, setEditNotas] = useState("");
    const [editTerminos, setEditTerminos] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [convirtiendo, setConvirtiendo] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, [id]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const data = await obtenerCotizacion(id);
            if (data) {
                setCotizacion(data);
                setEditNotas(data.notas || "");
                setEditTerminos(data.terminos || "");
                const hoy = new Date().toISOString().split("T")[0];
                setFechaCita(hoy);
                setHoraCita("09:00");
            }
        } catch {
            toast.error("Error al cargar cotización");
        } finally {
            setLoading(false);
        }
    };

    const handleCambiarEstado = async (estado: EstadoCotizacion) => {
        if (!cotizacion) return;
        const result = await actualizarCotizacion(cotizacion.$id, { estado });
        if (result.success) {
            toast.success("Estado actualizado");
            cargarDatos();
        }
    };

    const handleGuardarEdicion = async () => {
        if (!cotizacion) return;
        setGuardando(true);
        const result = await actualizarCotizacion(cotizacion.$id, { notas: editNotas, terminos: editTerminos });
        if (result.success) {
            toast.success("Cotización actualizada");
            setEditando(false);
            cargarDatos();
        }
        setGuardando(false);
    };

    const handleConvertir = async () => {
        if (!cotizacion || !fechaCita || !horaCita) {
            toast.error("Selecciona fecha y hora para la cita");
            return;
        }
        setConvirtiendo(true);
        const result = await convertirCotizacionEnCita(cotizacion.$id, fechaCita, horaCita);
        if (result.success) {
            toast.success("Cotización convertida a cita");
            setShowConvertDialog(false);
            cargarDatos();
        } else {
            toast.error(result.error || "Error al convertir");
        }
        setConvirtiendo(false);
    };

    const handleEliminar = async () => {
        if (!cotizacion) return;
        const result = await eliminarCotizacion(cotizacion.$id);
        if (result.success) {
            toast.success("Cotización eliminada");
            router.push("/admin/cotizaciones");
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-48" />
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <Skeleton className="h-64 lg:col-span-1" />
                    <Skeleton className="h-[600px] lg:col-span-3" />
                </div>
            </div>
        );
    }

    if (!cotizacion) {
        return <p className="text-gray-500 py-12 text-center">Cotización no encontrada</p>;
    }

    const estadoCfg = ESTADOS.find(e => e.value === cotizacion.estado) || ESTADOS[0];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                    <Link href="/admin/cotizaciones" className="text-gray-400 hover:text-gray-600">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Cotización {cotizacion.$id.slice(0, 8).toUpperCase()}</h1>
                        <p className="text-gray-500 text-sm">Creada el {formatearFecha(cotizacion.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <GenerarPDFButton cotizacion={cotizacion} />
                    {cotizacion.estado !== EstadoCotizacion.CONVERTIDA && (
                        <Button variant="outline" onClick={() => setShowConvertDialog(true)}>
                            <Calendar className="h-4 w-4 mr-2" /> Convertir a Cita
                        </Button>
                    )}
                    <Button variant="destructive" size="sm" onClick={() => setShowConfirmDelete(true)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="space-y-4">
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <select value={cotizacion.estado} onChange={e => handleCambiarEstado(e.target.value as EstadoCotizacion)}
                                className={`w-full text-sm font-medium rounded-full px-3 py-1.5 border-0 cursor-pointer ${estadoCfg.color}`}>
                                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                            </select>

                            {cotizacion.estado === EstadoCotizacion.BORRADOR && (
                                <Button size="sm" className="w-full" onClick={() => handleCambiarEstado(EstadoCotizacion.ENVIADA)}>
                                    <Send className="h-4 w-4 mr-1" /> Marcar como Enviada
                                </Button>
                            )}
                            {cotizacion.estado === EstadoCotizacion.ENVIADA && (
                                <div className="space-y-2">
                                    <Button size="sm" className="w-full bg-green-600 hover:bg-green-700" onClick={() => handleCambiarEstado(EstadoCotizacion.APROBADA)}>
                                        <CheckCircle className="h-4 w-4 mr-1" /> Aprobar
                                    </Button>
                                    <Button size="sm" variant="outline" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={() => handleCambiarEstado(EstadoCotizacion.RECHAZADA)}>
                                        <XCircle className="h-4 w-4 mr-1" /> Rechazar
                                    </Button>
                                </div>
                            )}
                            {cotizacion.pdfGenerado && (
                                <Badge variant="outline" className="w-full justify-center text-green-600 border-green-200 bg-green-50">
                                    PDF generado
                                </Badge>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Resumen</CardTitle></CardHeader>
                        <CardContent className="space-y-2">
                            <div className="flex justify-between text-sm"><span className="text-gray-500">Subtotal</span><span>{formatearPrecio(cotizacion.subtotal)}</span></div>
                            {cotizacion.descuento > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500">Descuento</span><span className="text-red-500">-{formatearPrecio(cotizacion.descuento)}</span></div>}
                            <div className="flex justify-between text-lg font-bold border-t pt-2"><span>Total</span><span className="text-primary">{formatearPrecio(cotizacion.total)}</span></div>
                            {cotizacion.fechaVencimiento && <p className="text-xs text-gray-400 mt-4">Válida hasta: {formatearFecha(cotizacion.fechaVencimiento)}</p>}
                        </CardContent>
                    </Card>

                    {cotizacion.leadId && (
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Lead</CardTitle></CardHeader>
                            <CardContent>
                                <Link href={`/admin/leads/${cotizacion.leadId}`} className="text-sm text-primary hover:underline">
                                    Ver lead relacionado →
                                </Link>
                            </CardContent>
                        </Card>
                    )}

                    <Button variant="outline" size="sm" className="w-full" onClick={() => setEditando(!editando)}>
                        <Edit2 className="h-4 w-4 mr-2" /> {editando ? "Cerrar edición" : "Editar notas/términos"}
                    </Button>
                </div>

                <div className="lg:col-span-3">
                    {editando ? (
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Editar Notas y Términos</CardTitle></CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Notas</label>
                                    <textarea value={editNotas} onChange={e => setEditNotas(e.target.value)} rows={4} className="w-full rounded-lg border border-input px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Términos</label>
                                    <textarea value={editTerminos} onChange={e => setEditTerminos(e.target.value)} rows={3} className="w-full rounded-lg border border-input px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={handleGuardarEdicion} disabled={guardando}>
                                        {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Guardar
                                    </Button>
                                    <Button variant="outline" onClick={() => setEditando(false)}>Cancelar</Button>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="overflow-x-auto">
                            <PDFPreview cotizacion={cotizacion} />
                        </div>
                    )}
                </div>
            </div>

            {showConvertDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Convertir a Cita</h3>
                        <p className="text-gray-500 text-sm mb-4">Se creará una cita con los datos de esta cotización por <strong>{formatearPrecio(cotizacion.total)}</strong>.</p>
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Fecha de la Cita *</label>
                                <Input type="date" value={fechaCita} onChange={e => setFechaCita(e.target.value)} />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 mb-1.5 block">Hora *</label>
                                <Input type="time" value={horaCita} onChange={e => setHoraCita(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <Button variant="outline" onClick={() => setShowConvertDialog(false)}>Cancelar</Button>
                            <Button onClick={handleConvertir} disabled={convirtiendo}>
                                {convirtiendo ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Crear Cita
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
                        <Trash2 className="h-8 w-8 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Eliminar Cotización</h3>
                        <p className="text-gray-500 mb-6">¿Estás seguro? Esta acción no se puede deshacer.</p>
                        <div className="flex justify-center gap-3">
                            <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>Cancelar</Button>
                            <Button variant="destructive" onClick={handleEliminar}>Eliminar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
