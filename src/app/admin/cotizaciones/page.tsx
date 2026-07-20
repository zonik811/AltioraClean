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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Plus,
    Search,
    Trash2,
    Loader2,
    Eye,
} from "lucide-react";
import {
    obtenerCotizaciones,
    eliminarCotizacion,
} from "@/lib/actions/cotizaciones";
import type { Cotizacion } from "@/types";
import { EstadoCotizacion } from "@/types";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { formatearPrecio, formatearFecha } from "@/lib/utils";
import Link from "next/link";

const ESTADOS = [
    { value: EstadoCotizacion.BORRADOR, label: "Borrador", color: "bg-gray-100 text-gray-600" },
    { value: EstadoCotizacion.ENVIADA, label: "Enviada", color: "bg-blue-100 text-blue-700" },
    { value: EstadoCotizacion.APROBADA, label: "Aprobada", color: "bg-green-100 text-green-700" },
    { value: EstadoCotizacion.RECHAZADA, label: "Rechazada", color: "bg-red-100 text-red-700" },
    { value: EstadoCotizacion.CONVERTIDA, label: "Convertida", color: "bg-purple-100 text-purple-700" },
];

export default function CotizacionesPage() {
    const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState<string>("");
    const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

    useEffect(() => {
        cargarCotizaciones();
    }, []);

    const cargarCotizaciones = async () => {
        try {
            setLoading(true);
            const data = await obtenerCotizaciones(undefined, { limit: 20 });
            setCotizaciones(data.documents);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch {
            toast.error("Error al cargar cotizaciones");
        } finally {
            setLoading(false);
        }
    };

    const cargarMas = async () => {
        if (!cursor || !hasMore) return;
        try {
            setLoadingMore(true);
            const data = await obtenerCotizaciones(
                filtroEstado ? { estado: filtroEstado } : undefined,
                { limit: 20, cursor }
            );
            setCotizaciones(prev => [...prev, ...data.documents]);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch {
            toast.error("Error al cargar más cotizaciones");
        } finally {
            setLoadingMore(false);
        }
    };

    const filtradas = useMemo(() => {
        let r = cotizaciones;
        if (filtroEstado) r = r.filter(c => c.estado === filtroEstado);
        if (busqueda) {
            const q = busqueda.toLowerCase();
            r = r.filter(c =>
                c.nombre.toLowerCase().includes(q) ||
                c.servicioNombre?.toLowerCase().includes(q) ||
                c.email.includes(q)
            );
        }
        return r;
    }, [cotizaciones, filtroEstado, busqueda]);

    const handleEliminar = async () => {
        if (!showConfirmDelete) return;
        const result = await eliminarCotizacion(showConfirmDelete);
        if (result.success) {
            toast.success("Cotización eliminada");
            setShowConfirmDelete(null);
            cargarCotizaciones();
        }
    };

    if (loading) return <TableSkeleton rows={6} columns={5} />;

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Cotizaciones</h1>
                    <p className="text-gray-500 mt-1">Crea y gestiona cotizaciones para tus clientes</p>
                </div>
                <Link href="/admin/cotizaciones/nueva">
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                        <Plus className="mr-2 h-4 w-4" /> Nueva Cotización
                    </Button>
                </Link>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border bg-white text-gray-700">
                    <option value="">Todos los estados</option>
                    {ESTADOS.map(e => <option key={e.value} value={e.value}>{e.label}</option>)}
                </select>
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input placeholder="Buscar cotizaciones..." value={busqueda} onChange={e => setBusqueda(e.target.value)} className="w-full pl-9 h-9 text-sm" />
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600">Cliente</TableHead>
                                <TableHead className="font-semibold text-gray-600">Servicio</TableHead>
                                <TableHead className="font-semibold text-gray-600">Total</TableHead>
                                <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                                <TableHead className="font-semibold text-gray-600">Fecha</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filtradas.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <EmptyState title="No hay cotizaciones" description="Crea tu primera cotización"
                                            action={{ label: "Nueva Cotización", href: "/admin/cotizaciones/nueva" }} />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtradas.map((cot) => {
                                    const ec = ESTADOS.find(e => e.value === cot.estado) || ESTADOS[0];
                                    return (
                                        <TableRow key={cot.$id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell>
                                                <Link href={`/admin/cotizaciones/${cot.$id}`} className="font-medium text-gray-900 hover:text-primary transition-colors">
                                                    {cot.nombre}
                                                </Link>
                                                <p className="text-xs text-gray-500">{cot.email}</p>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-600">
                                                {cot.servicioNombre || "—"}
                                            </TableCell>
                                            <TableCell className="font-bold text-gray-900">
                                                {formatearPrecio(cot.total)}
                                            </TableCell>
                                            <TableCell>
                                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${ec.color}`}>
                                                    {ec.label}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-sm text-gray-500">
                                                {formatearFecha(cot.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <Link href={`/admin/cotizaciones/${cot.$id}`}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100 text-gray-400 hover:text-primary">
                                                            <Eye className="h-4 w-4" />
                                                        </Button>
                                                    </Link>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-50 text-gray-400 hover:text-red-500"
                                                        onClick={() => setShowConfirmDelete(cot.$id)}>
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

            {hasMore && filtradas.length >= 20 && (
                <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={cargarMas} disabled={loadingMore} className="min-w-[150px]">
                        {loadingMore ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</> : "Cargar más"}
                    </Button>
                </div>
            )}

            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 text-center">
                        <Trash2 className="h-8 w-8 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">Eliminar Cotización</h3>
                        <p className="text-gray-500 mb-6">¿Estás seguro? Esta acción no se puede deshacer.</p>
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
