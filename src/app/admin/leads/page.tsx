"use client";

import { useEffect, useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Phone,
    Mail,
    MapPin,
    Trash2,
    Loader2,
    UserPlus,
} from "lucide-react";
import {
    obtenerLeads,
    crearLead,
    actualizarLead,
    eliminarLead,
    convertirLeadACliente,
} from "@/lib/actions/leads";
import type { Lead } from "@/types";
import { EstadoLead, FuenteLead } from "@/types";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { formatearFecha } from "@/lib/utils";
import Link from "next/link";

const ESTADOS = [
    { value: EstadoLead.NUEVO, label: "Nuevo", color: "bg-blue-100 text-blue-700" },
    { value: EstadoLead.CONTACTADO, label: "Contactado", color: "bg-yellow-100 text-yellow-700" },
    { value: EstadoLead.CALIFICADO, label: "Calificado", color: "bg-purple-100 text-purple-700" },
    { value: EstadoLead.COTIZADO, label: "Cotizado", color: "bg-indigo-100 text-indigo-700" },
    { value: EstadoLead.CONVERTIDO, label: "Convertido", color: "bg-green-100 text-green-700" },
    { value: EstadoLead.PERDIDO, label: "Perdido", color: "bg-gray-100 text-gray-500" },
];

const FUENTES = [
    { value: FuenteLead.WEB, label: "Web" },
    { value: FuenteLead.REFERENCIA, label: "Referencia" },
    { value: FuenteLead.LLAMADA, label: "Llamada" },
    { value: FuenteLead.WHATSAPP, label: "WhatsApp" },
    { value: FuenteLead.REDES, label: "Redes" },
    { value: FuenteLead.OTRO, label: "Otro" },
];

export default function LeadsPage() {
    const [leads, setLeads] = useState<Lead[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<string>("");
    const [showDialog, setShowDialog] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        telefono: "",
        direccion: "",
        ciudad: "",
        descripcion: "",
        fuente: FuenteLead.WEB,
    });

    useEffect(() => {
        cargarLeads();
    }, []);

    const cargarLeads = async () => {
        try {
            setLoading(true);
            const data = await obtenerLeads(undefined, { limit: 20 });
            setLeads(data.documents);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch {
            toast.error("Error al cargar leads");
        } finally {
            setLoading(false);
        }
    };

    const cargarMas = async () => {
        if (!cursor || !hasMore) return;
        try {
            setLoadingMore(true);
            const data = await obtenerLeads(
                filtroEstado ? { estado: filtroEstado } : undefined,
                { limit: 20, cursor }
            );
            setLeads(prev => [...prev, ...data.documents]);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch {
            toast.error("Error al cargar más leads");
        } finally {
            setLoadingMore(false);
        }
    };

    const leadsFiltrados = useMemo(() => {
        let filtrados = leads;
        if (filtroEstado) {
            filtrados = filtrados.filter(l => l.estado === filtroEstado);
        }
        if (busqueda) {
            const q = busqueda.toLowerCase();
            filtrados = filtrados.filter(l =>
                l.nombre.toLowerCase().includes(q) ||
                l.email.toLowerCase().includes(q) ||
                l.telefono.includes(q)
            );
        }
        return filtrados;
    }, [leads, filtroEstado, busqueda]);

    const handleGuardar = async () => {
        if (!formData.nombre || !formData.email || !formData.telefono) {
            toast.error("Nombre, email y teléfono son requeridos");
            return;
        }
        setGuardando(true);
        try {
            const result = await crearLead(formData);
            if (result.success) {
                toast.success("Lead creado");
                setShowDialog(false);
                setFormData({ nombre: "", email: "", telefono: "", direccion: "", ciudad: "", descripcion: "", fuente: FuenteLead.WEB });
                cargarLeads();
            } else {
                toast.error(result.error || "Error al crear lead");
            }
        } catch {
            toast.error("Error al guardar");
        } finally {
            setGuardando(false);
        }
    };

    const handleCambiarEstado = async (id: string, estado: EstadoLead) => {
        try {
            const result = await actualizarLead(id, { estado });
            if (result.success) {
                toast.success("Estado actualizado");
                cargarLeads();
            }
        } catch {
            toast.error("Error al cambiar estado");
        }
    };

    const handleConvertirACliente = async (id: string) => {
        try {
            const result = await convertirLeadACliente(id);
            if (result.success) {
                toast.success("Lead convertido a cliente");
                cargarLeads();
            } else {
                toast.error(result.error || "Error al convertir");
            }
        } catch {
            toast.error("Error al convertir");
        }
    };

    const handleEliminar = async () => {
        if (!showConfirmDelete) return;
        try {
            const result = await eliminarLead(showConfirmDelete);
            if (result.success) {
                toast.success("Lead eliminado");
                setShowConfirmDelete(null);
                cargarLeads();
            }
        } catch {
            toast.error("Error al eliminar");
        }
    };

    if (loading) return <TableSkeleton rows={6} columns={5} />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Leads</h1>
                    <p className="text-gray-500 mt-1">Gestiona prospectos y clientes potenciales</p>
                </div>
                <Button onClick={() => setShowDialog(true)} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Lead
                </Button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-white text-gray-700"
                >
                    <option value="">Todos los estados</option>
                    {ESTADOS.map(e => (
                        <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                </select>
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar leads..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full pl-9 h-9 text-sm" />
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600">Nombre</TableHead>
                                <TableHead className="font-semibold text-gray-600">Contacto</TableHead>
                                <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                                <TableHead className="font-semibold text-gray-600">Fuente</TableHead>
                                <TableHead className="font-semibold text-gray-600">Creado</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {leadsFiltrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <EmptyState title="No hay leads" description="Registra tu primer lead para empezar" action={{ label: "Nuevo Lead", onClick: () => setShowDialog(true) }} />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                leadsFiltrados.map((lead) => {
                                    const estadoCfg = ESTADOS.find(e => e.value === lead.estado) || ESTADOS[0];
                                    return (
                                        <TableRow key={lead.$id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell>
                                                <Link href={`/admin/leads/${lead.$id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                                                    {lead.nombre}
                                                </Link>
                                                {lead.ciudad && (
                                                    <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                        <MapPin className="h-3 w-3" /> {lead.ciudad}
                                                    </p>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <p className="flex items-center gap-1 text-sm text-gray-600">
                                                    <Mail className="h-3.5 w-3.5 text-gray-400" /> {lead.email}
                                                </p>
                                                <p className="flex items-center gap-1 text-sm text-gray-600 mt-0.5">
                                                    <Phone className="h-3.5 w-3.5 text-gray-400" /> {lead.telefono}
                                                </p>
                                            </TableCell>
                                            <TableCell>
                                                <select
                                                    value={lead.estado}
                                                    onChange={(e) => handleCambiarEstado(lead.$id, e.target.value as EstadoLead)}
                                                    className={`text-xs font-medium rounded-full px-2.5 py-1 border-0 cursor-pointer ${estadoCfg.color}`}
                                                >
                                                    {ESTADOS.map(e => (
                                                        <option key={e.value} value={e.value}>{e.label}</option>
                                                    ))}
                                                </select>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs font-normal">
                                                    {FUENTES.find(f => f.value === lead.fuente)?.label || lead.fuente}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {formatearFecha(lead.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    {lead.estado === EstadoLead.CALIFICADO && (
                                                        <Button variant="ghost" size="sm" className="h-8 text-xs text-green-600 hover:bg-green-50"
                                                            onClick={() => handleConvertirACliente(lead.$id)}>
                                                            <UserPlus className="h-3.5 w-3.5 mr-1" /> Convertir
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 text-gray-400 hover:text-red-500"
                                                        onClick={() => setShowConfirmDelete(lead.$id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {hasMore && leadsFiltrados.length >= 20 && (
                <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={cargarMas} disabled={loadingMore} className="min-w-[150px]">
                        {loadingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</> : "Cargar más"}
                    </Button>
                </div>
            )}

            {showDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="font-semibold text-lg text-gray-900">Nuevo Lead</h3>
                            <Button variant="ghost" size="icon" onClick={() => setShowDialog(false)} className="rounded-full">
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </Button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Nombre *</label>
                                <Input value={formData.nombre} onChange={e => setFormData({ ...formData, nombre: e.target.value })} placeholder="Nombre completo" className="h-10" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Email *</label>
                                    <Input type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="correo@ejemplo.com" className="h-10" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Teléfono *</label>
                                    <Input value={formData.telefono} onChange={e => setFormData({ ...formData, telefono: e.target.value })} placeholder="300 123 4567" className="h-10" />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Dirección</label>
                                    <Input value={formData.direccion} onChange={e => setFormData({ ...formData, direccion: e.target.value })} placeholder="Dirección" className="h-10" />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Ciudad</label>
                                    <Input value={formData.ciudad} onChange={e => setFormData({ ...formData, ciudad: e.target.value })} placeholder="Ciudad" className="h-10" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Fuente</label>
                                <select value={formData.fuente} onChange={e => setFormData({ ...formData, fuente: e.target.value as FuenteLead })} className="w-full h-10 px-3 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary/20">
                                    {FUENTES.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Descripción / Comentarios</label>
                                <textarea value={formData.descripcion} onChange={e => setFormData({ ...formData, descripcion: e.target.value })} rows={3} placeholder="¿Qué servicio está buscando?" className="w-full rounded-lg border border-input px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20" />
                            </div>
                        </div>
                        <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                            <Button onClick={handleGuardar} disabled={guardando}>
                                {guardando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Guardar Lead
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 className="h-8 w-8 text-red-500" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar Lead</h3>
                        <p className="text-gray-500 mb-6">¿Estás seguro de eliminar este lead? Esta acción no se puede deshacer.</p>
                        <div className="flex justify-center gap-3">
                            <Button variant="outline" onClick={() => setShowConfirmDelete(null)}>Cancelar</Button>
                            <Button variant="destructive" onClick={handleEliminar}>Eliminar</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
