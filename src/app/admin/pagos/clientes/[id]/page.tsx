"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    ArrowLeft,
    DollarSign,
    User,
    Calendar,
    CreditCard,
    FileText,
    Trash2,
    Building,
} from "lucide-react";
import { obtenerPagoClientePorId, eliminarPagoCliente, type PagoCliente } from "@/lib/actions/pagos-clientes";
import { formatearPrecio, formatearFecha } from "@/lib/utils";
import { toast } from "sonner";

export default function DetallePagoClientePage() {
    const params = useParams();
    const router = useRouter();
    const pagoId = params.id as string;
    const [pago, setPago] = useState<PagoCliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        cargarDatos();
    }, [pagoId]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const data = await obtenerPagoClientePorId(pagoId);
            setPago(data);
        } catch (error) {
            console.error("Error cargando pago:", error);
            toast.error("Error al cargar el pago");
        } finally {
            setLoading(false);
        }
    };

    const handleEliminar = async () => {
        try {
            const result = await eliminarPagoCliente(pagoId);
            if (result.success) {
                toast.success("Cobro eliminado correctamente");
                router.push("/admin/pagos/clientes");
            } else {
                toast.error(result.error || "Error al eliminar el cobro");
            }
        } catch {
            toast.error("Error al eliminar el cobro");
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-in fade-in duration-500">
                <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
                <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
            </div>
        );
    }

    if (!pago) {
        return (
            <div className="text-center py-20">
                <p className="text-gray-500">Pago no encontrado</p>
                <Link href="/admin/pagos/clientes">
                    <Button variant="outline" className="mt-4">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/pagos/clientes">
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Detalle del Cobro</h1>
                        <p className="text-sm text-gray-500">ID: {pago.$id}</p>
                    </div>
                </div>
                <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                >
                    <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <DollarSign className="h-5 w-5 text-blue-600" />
                            Información del Cobro
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <p className="text-sm text-gray-500">Monto</p>
                                <p className="text-2xl font-bold text-gray-900">{formatearPrecio(pago.monto)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Estado</p>
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                                    {pago.estado}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Método de Pago</p>
                                <p className="font-medium text-gray-900 capitalize flex items-center gap-2 mt-1">
                                    <CreditCard className="h-4 w-4 text-gray-400" />
                                    {pago.metodoPago}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Fecha de Pago</p>
                                <p className="font-medium text-gray-900 flex items-center gap-2 mt-1">
                                    <Calendar className="h-4 w-4 text-gray-400" />
                                    {formatearFecha(pago.fechaPago)}
                                </p>
                            </div>
                        </div>

                        <Separator />

                        <div>
                            <p className="text-sm text-gray-500 mb-2">Cita Asociada</p>
                            <div className="flex items-center gap-2 text-gray-900 font-medium">
                                <Building className="h-4 w-4 text-gray-400" />
                                ID de Cita: {(pago.citaId as unknown as string) || "No disponible"}
                            </div>
                        </div>

                        {pago.notas && (
                            <>
                                <Separator />
                                <div>
                                    <p className="text-sm text-gray-500 mb-2">Notas</p>
                                    <p className="text-gray-700 bg-gray-50 rounded-lg p-4">{pago.notas}</p>
                                </div>
                            </>
                        )}
                    </CardContent>
                </Card>

                <Card className="border-none shadow-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <User className="h-5 w-5 text-blue-600" />
                            Cliente
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">ID: {pago.clienteId}</p>
                                <p className="text-sm text-gray-500">Cliente asociado al cobro</p>
                            </div>
                        </div>
                        {pago.comprobante && (
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Comprobante</p>
                                <p className="text-sm font-medium text-blue-600 truncate">{pago.comprobante}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {showDeleteDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar cobro?</h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Esta acción no se puede deshacer. Si la cita estaba pagada, volverá a pendiente.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                Cancelar
                            </Button>
                            <Button variant="destructive" onClick={handleEliminar}>
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
