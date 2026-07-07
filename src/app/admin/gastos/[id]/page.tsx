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
    TrendingDown,
    DollarSign,
    Calendar,
    Edit2,
    Trash2,
    XCircle,
    Save,
    X,
    Loader2,
    Building2,
    User,
} from "lucide-react";
import {
    obtenerGastoPorId,
    actualizarGasto,
    eliminarGasto,
} from "@/lib/actions/gastos";
import { formatearPrecio, formatearFecha } from "@/lib/utils";
import type { Gasto } from "@/types";
import { toast } from "sonner";

export default function DetalleGastoPage() {
    const params = useParams();
    const gastoId = params.id as string;
    const router = useRouter();

    const [gasto, setGasto] = useState<Gasto | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [editForm, setEditForm] = useState({
        categoria: "materiales",
        concepto: "",
        monto: 0,
        metodoPago: "efectivo",
        proveedor: "",
        fecha: "",
        notas: "",
    });

    useEffect(() => {
        cargarGasto();
    }, [gastoId]);

    const cargarGasto = async () => {
        try {
            setLoading(true);
            const data = await obtenerGastoPorId(gastoId);
            if (data) {
                setGasto(data);
                setEditForm({
                    categoria: data.categoria,
                    concepto: data.concepto,
                    monto: data.monto,
                    metodoPago: data.metodoPago,
                    proveedor: data.proveedor || "",
                    fecha: data.fecha.split("T")[0],
                    notas: data.notas || "",
                });
            }
        } catch {
            toast.error("Error al cargar gasto");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!gasto) return;
        try {
            const result = await actualizarGasto(gastoId, editForm);
            if (result.success) {
                toast.success("Gasto actualizado");
                setShowEdit(false);
                cargarGasto();
            } else {
                toast.error(result.error || "Error al actualizar");
            }
        } catch {
            toast.error("Error al guardar");
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const result = await eliminarGasto(gastoId);
            if (result.success) {
                toast.success("Gasto eliminado");
                router.push("/admin/gastos");
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

    if (!gasto) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <XCircle className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Gasto no encontrado</h2>
                <p className="text-gray-500 mb-6">El gasto que buscas no existe o ha sido eliminado.</p>
                <Link href="/admin/gastos"><Button variant="outline"><ArrowLeft className="mr-2 h-4 w-4" /> Volver a Gastos</Button></Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/gastos">
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                        <TrendingDown className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">{gasto.concepto}</h1>
                        <p className="text-sm text-gray-500">{formatearFecha(gasto.fecha)}</p>
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
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Monto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-4xl font-bold text-red-600">{formatearPrecio(gasto.monto)}</p>
                            <Badge variant="outline" className="mt-3 capitalize">
                                {gasto.categoria.replace(/_/g, " ")}
                            </Badge>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Detalles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Método de pago</span>
                                <span className="text-sm font-medium capitalize text-gray-900">{gasto.metodoPago}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Proveedor</span>
                                <span className="text-sm font-medium text-gray-900">{gasto.proveedor || "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Fecha</span>
                                <span className="text-sm font-medium text-gray-900">{formatearFecha(gasto.fecha)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Concepto</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 text-lg">{gasto.concepto}</p>
                        </CardContent>
                    </Card>

                    {gasto.notas && (
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Notas</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-gray-700">{gasto.notas}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>

            {showEdit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">Editar Gasto</h3>
                                <p className="text-sm text-gray-500">{gasto.concepto}</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowEdit(false)} className="rounded-full">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Concepto</label>
                                <Input value={editForm.concepto} onChange={(e) => setEditForm({ ...editForm, concepto: e.target.value })} className="h-10" />
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Categoría</label>
                                <select value={editForm.categoria} onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })} className="w-full h-10 px-3 border rounded-lg text-sm">
                                    <option value="transporte">Transporte</option>
                                    <option value="materiales">Materiales</option>
                                    <option value="arriendo">Arriendo</option>
                                    <option value="servicios">Servicios</option>
                                    <option value="otros">Otros</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Monto</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input type="number" value={editForm.monto} onChange={(e) => setEditForm({ ...editForm, monto: parseInt(e.target.value) || 0 })} className="pl-9 h-10" />
                                </div>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Método</label>
                                <select value={editForm.metodoPago} onChange={(e) => setEditForm({ ...editForm, metodoPago: e.target.value })} className="w-full h-10 px-3 border rounded-lg text-sm">
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="nequi">Nequi</option>
                                    <option value="tarjeta">Tarjeta</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Fecha</label>
                                <Input type="date" value={editForm.fecha} onChange={(e) => setEditForm({ ...editForm, fecha: e.target.value })} className="h-10" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Proveedor</label>
                                <Input value={editForm.proveedor} onChange={(e) => setEditForm({ ...editForm, proveedor: e.target.value })} placeholder="Opcional" className="h-10" />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Notas</label>
                                <textarea value={editForm.notas} onChange={(e) => setEditForm({ ...editForm, notas: e.target.value })} rows={3} className="w-full rounded-lg border border-input px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20" />
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
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar gasto?</h3>
                            <p className="text-sm text-gray-500 mb-6">Esta acción eliminará permanentemente <strong>{gasto.concepto}</strong>.</p>
                            <div className="flex gap-3 justify-center">
                                <Button variant="outline" onClick={() => setShowConfirmDelete(false)} className="h-10 px-6">Cancelar</Button>
                                <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="h-10 px-6">
                                    {deleting ? "Eliminando..." : "Eliminar Gasto"}
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
                <Skeleton className="h-12 w-12 rounded-xl" />
                <div>
                    <Skeleton className="h-7 w-48 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card><CardContent className="pt-6"><Skeleton className="h-32 w-full" /></CardContent></Card>
                <div className="lg:col-span-2 space-y-6">
                    <Card><CardContent className="pt-6"><Skeleton className="h-24 w-full" /></CardContent></Card>
                </div>
            </div>
        </div>
    );
}
