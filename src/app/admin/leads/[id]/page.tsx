"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
    obtenerLead,
    actualizarLead,
    eliminarLead,
    convertirLeadACliente,
} from "@/lib/actions/leads";
import { obtenerCotizacionesPorLead } from "@/lib/actions/cotizaciones";
import type { Lead, Cotizacion } from "@/types";
import { EstadoLead } from "@/types";
import { toast } from "sonner";
import { formatearFecha } from "@/lib/utils";
import {
    ArrowLeft, Mail, Phone, MapPin, Trash2,
    UserPlus, FileText, Loader2,
} from "lucide-react";
import Link from "next/link";

const ESTADOS = [
    { value: EstadoLead.NUEVO, label: "Nuevo", color: "bg-blue-100 text-blue-700" },
    { value: EstadoLead.CONTACTADO, label: "Contactado", color: "bg-yellow-100 text-yellow-700" },
    { value: EstadoLead.CALIFICADO, label: "Calificado", color: "bg-purple-100 text-purple-700" },
    { value: EstadoLead.COTIZADO, label: "Cotizado", color: "bg-indigo-100 text-indigo-700" },
    { value: EstadoLead.CONVERTIDO, label: "Convertido", color: "bg-green-100 text-green-700" },
    { value: EstadoLead.PERDIDO, label: "Perdido", color: "bg-gray-100 text-gray-500" },
];

export default function LeadDetailPage() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [lead, setLead] = useState<Lead | null>(null);
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [notasInternas, setNotasInternas] = useState("");
    const [guardandoNotas, setGuardandoNotas] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, [id]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [leadData, cotizacionesData] = await Promise.all([
                obtenerLead(id),
                obtenerCotizacionesPorLead(id),
            ]);
            if (leadData) {
                setLead(leadData);
                setNotasInternas(leadData.notasInternas || "");
            }
            setCotizaciones(cotizacionesData);
        } catch {
            toast.error("Error al cargar lead");
        } finally {
            setLoading(false);
        }
    };

    const handleCambiarEstado = async (estado: EstadoLead) => {
        if (!lead) return;
        const result = await actualizarLead(lead.$id, { estado });
        if (result.success) {
            toast.success("Estado actualizado");
            cargarDatos();
        }
    };

    const handleGuardarNotas = async () => {
        if (!lead) return;
        setGuardandoNotas(true);
        const result = await actualizarLead(lead.$id, { notasInternas });
        if (result.success) {
            toast.success("Notas guardadas");
        }
        setGuardandoNotas(false);
    };

    const handleConvertir = async () => {
        if (!lead) return;
        const result = await convertirLeadACliente(lead.$id);
        if (result.success) {
            toast.success("Lead convertido a cliente");
            cargarDatos();
        } else {
            toast.error(result.error || "Error al convertir");
        }
    };

    const handleEliminar = async () => {
        if (!lead) return;
        const result = await eliminarLead(lead.$id);
        if (result.success) {
            toast.success("Lead eliminado");
            router.push("/admin/leads");
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-8 w-32" />
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <Skeleton className="h-64" />
                    <Skeleton className="h-64 lg:col-span-2" />
                </div>
            </div>
        );
    }

    if (!lead) {
        return <p className="text-gray-500 py-12 text-center">Lead no encontrado</p>;
    }

    const estadoCfg = ESTADOS.find(e => e.value === lead.estado) || ESTADOS[0];

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/leads" className="text-gray-400 hover:text-gray-600 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{lead.nombre}</h1>
                        <p className="text-gray-500 text-sm">Lead desde {formatearFecha(lead.createdAt)}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="destructive" size="sm" onClick={() => setShowConfirmDelete(true)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Eliminar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Estado</CardTitle></CardHeader>
                        <CardContent>
                            <select
                                value={lead.estado}
                                onChange={(e) => handleCambiarEstado(e.target.value as EstadoLead)}
                                className={`w-full text-sm font-medium rounded-full px-3 py-1.5 border-0 cursor-pointer ${estadoCfg.color}`}
                            >
                                {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                            </select>
                            {lead.fechaContacto && (
                                <p className="text-xs text-gray-500 mt-2">Último contacto: {formatearFecha(lead.fechaContacto)}</p>
                            )}
                            {lead.estado === EstadoLead.CALIFICADO && (
                                <Button size="sm" className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={handleConvertir}>
                                    <UserPlus className="h-4 w-4 mr-1" /> Convertir a Cliente
                                </Button>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Información</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Mail className="h-4 w-4 text-gray-400" />
                                <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Phone className="h-4 w-4 text-gray-400" />
                                <a href={`tel:${lead.telefono}`} className="text-gray-700">{lead.telefono}</a>
                            </div>
                            {lead.ciudad && (
                                <div className="flex items-center gap-2 text-sm">
                                    <MapPin className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700">{lead.ciudad}{lead.direccion ? `, ${lead.direccion}` : ""}</span>
                                </div>
                            )}
                            {lead.servicioInteresado && (
                                <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-4 w-4 text-gray-400" />
                                    <span className="text-gray-700">Interesado en: {lead.servicioInteresado}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    {lead.descripcion && (
                        <Card>
                            <CardHeader><CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Descripción</CardTitle></CardHeader>
                            <CardContent>
                                <p className="text-gray-700 whitespace-pre-wrap">{lead.descripcion}</p>
                            </CardContent>
                        </Card>
                    )}

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notas Internas</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <textarea
                                value={notasInternas}
                                onChange={(e) => setNotasInternas(e.target.value)}
                                rows={4}
                                placeholder="Agrega notas internas sobre este lead..."
                                className="w-full rounded-lg border border-input px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                            />
                            <Button size="sm" className="mt-3" onClick={handleGuardarNotas} disabled={guardandoNotas}>
                                {guardandoNotas ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Guardar Notas
                            </Button>
                        </CardContent>
                    </Card>

                    {cotizaciones.length > 0 && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                    Cotizaciones ({cotizaciones.length})
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    {cotizaciones.map((cot) => (
                                        <Link key={cot.$id} href={`/admin/cotizaciones/${cot.$id}`}
                                            className="flex items-center justify-between p-3 rounded-lg border hover:border-primary/30 hover:bg-gray-50 transition-all">
                                            <div className="flex items-center gap-3">
                                                <FileText className="h-4 w-4 text-gray-400" />
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900">{cot.servicioNombre || "Cotización"}</p>
                                                    <p className="text-xs text-gray-500">{formatearFecha(cot.createdAt)}</p>
                                                </div>
                                            </div>
                                            <Badge variant="outline" className="text-xs">{cot.estado}</Badge>
                                        </Link>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    <div className="flex justify-center">
                        <Link href={`/admin/cotizaciones/nueva?leadId=${lead.$id}`}>
                            <Button><FileText className="h-4 w-4 mr-2" /> Crear Cotización</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar Lead</h3>
                        <p className="text-gray-500 mb-6">¿Estás seguro de eliminar este lead?</p>
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
