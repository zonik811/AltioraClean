"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
    Edit2,
    X,
    DollarSign,
    Clock,
    Search,
    Trash2,
    Loader2,
    Calendar,
    Star,
} from "lucide-react";
import {
    obtenerPlanes,
    crearPlan,
    actualizarPlan,
    eliminarPlan,
} from "@/lib/actions/planes";
import type { Plan } from "@/types";
import { FrecuenciaCliente } from "@/types";
import { formatearPrecio } from "@/lib/utils";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";

const FRECUENCIAS: { value: string; label: string }[] = [
    { value: FrecuenciaCliente.SEMANAL, label: "Semanal" },
    { value: FrecuenciaCliente.QUINCENAL, label: "Quincenal" },
    { value: FrecuenciaCliente.MENSUAL, label: "Mensual" },
];

const ICONOS_FRECUENCIA: Record<string, string> = {
    semanal: "bg-blue-500/10 text-blue-600",
    quincenal: "bg-purple-500/10 text-purple-600",
    mensual: "bg-emerald-500/10 text-emerald-600",
};

interface FormDataState {
    nombre: string;
    descripcion: string;
    servicioId: string;
    frecuencia: FrecuenciaCliente;
    precioPorVisita: number;
    precioSugerido: number;
    sesionesPorMes: number;
    destacado: boolean;
}

const FORM_DEFAULTS: FormDataState = {
    nombre: "",
    descripcion: "",
    servicioId: "",
    frecuencia: FrecuenciaCliente.SEMANAL,
    precioPorVisita: 0,
    precioSugerido: 0,
    sesionesPorMes: 4,
    destacado: false,
};

export default function PlanesPage() {
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [guardando, setGuardando] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<Plan | null>(null);
    const [formData, setFormData] = useState<FormDataState>({ ...FORM_DEFAULTS });

    useEffect(() => {
        cargarPlanes();
    }, []);

    const cargarPlanes = async () => {
        try {
            setLoading(true);
            const data = await obtenerPlanes();
            setPlanes(data.documents);
        } catch {
            toast.error("Error al cargar planes");
        } finally {
            setLoading(false);
        }
    };

    const planesFiltrados = useMemo(() => {
        if (!busqueda) return planes;
        const q = busqueda.toLowerCase();
        return planes.filter(
            (p) =>
                p.nombre.toLowerCase().includes(q) ||
                p.descripcion.toLowerCase().includes(q) ||
                p.frecuencia.toLowerCase().includes(q)
        );
    }, [planes, busqueda]);

    const abrirDialogo = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                nombre: plan.nombre,
                descripcion: plan.descripcion,
                servicioId: plan.servicioId,
                frecuencia: plan.frecuencia,
                precioPorVisita: plan.precioPorVisita,
                precioSugerido: plan.precioSugerido,
                sesionesPorMes: plan.sesionesPorMes,
                destacado: plan.destacado,
            });
        } else {
            setEditingPlan(null);
            setFormData({ ...FORM_DEFAULTS });
        }
        setShowDialog(true);
    };

    const cerrarDialogo = () => {
        setShowDialog(false);
        setEditingPlan(null);
    };

    const handleGuardar = async () => {
        if (!formData.nombre || formData.precioPorVisita <= 0) {
            toast.error("Nombre y precio por visita son requeridos");
            return;
        }

        setGuardando(true);
        try {
            const payload = { ...formData };

            let result;
            if (editingPlan) {
                result = await actualizarPlan(editingPlan.$id, payload);
            } else {
                result = await crearPlan(payload);
            }

            if (result.success) {
                toast.success(editingPlan ? "Plan actualizado" : "Plan creado");
                cerrarDialogo();
                cargarPlanes();
            } else {
                toast.error(result.error || "Error al guardar");
            }
        } catch {
            toast.error("Error al guardar el plan");
        } finally {
            setGuardando(false);
        }
    };

    const handleToggleActivo = async (plan: Plan) => {
        try {
            const result = await actualizarPlan(plan.$id, {
                activo: !plan.activo,
            });
            if (result.success) {
                toast.success(plan.activo ? "Plan desactivado" : "Plan activado");
                cargarPlanes();
            }
        } catch {
            toast.error("Error al cambiar estado");
        }
    };

    const handleEliminar = async () => {
        if (!showConfirmDelete) return;
        try {
            const result = await eliminarPlan(showConfirmDelete.$id);
            if (result.success) {
                toast.success("Plan eliminado");
                setShowConfirmDelete(null);
                cargarPlanes();
            }
        } catch {
            toast.error("Error al eliminar");
        }
    };

    if (loading) {
        return <TableSkeleton rows={5} columns={5} hasAvatar={false} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Planes Recurrentes
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Configura planes semanales, quincenales y mensuales
                    </p>
                </div>
                <Button
                    onClick={() => abrirDialogo()}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105"
                >
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Plan
                </Button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar planes..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-9 h-9 text-sm"
                    />
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600">Plan</TableHead>
                                <TableHead className="font-semibold text-gray-600">Frecuencia</TableHead>
                                <TableHead className="font-semibold text-gray-600">Precio / Visita</TableHead>
                                <TableHead className="font-semibold text-gray-600">Precio Sugerido</TableHead>
                                <TableHead className="font-semibold text-gray-600">Sesiones / Mes</TableHead>
                                <TableHead className="font-semibold text-gray-600">Estado</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {planesFiltrados.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-12">
                                        <EmptyState
                                            title="No hay planes"
                                            description="Crea tu primer plan recurrente"
                                            action={{
                                                label: "Crear Plan",
                                                onClick: () => abrirDialogo(),
                                            }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                planesFiltrados.map((plan) => (
                                    <TableRow
                                        key={plan.$id}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <TableCell>
                                            <Link
                                                href={`/admin/planes/${plan.$id}`}
                                                className="flex items-center gap-3 group"
                                            >
                                                <div className={`w-9 h-9 rounded-lg ${ICONOS_FRECUENCIA[plan.frecuencia] || "bg-gray-100 text-gray-600"} flex items-center justify-center shrink-0`}>
                                                    <Calendar className="h-4 w-4" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 group-hover:text-primary transition-colors flex items-center gap-1.5">
                                                        {plan.nombre}
                                                        {plan.destacado && (
                                                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">
                                                        {plan.descripcion}
                                                    </p>
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize font-normal">
                                                {plan.frecuencia}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="font-bold text-gray-900">
                                            {formatearPrecio(plan.precioPorVisita)}
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {plan.precioSugerido > 0 ? formatearPrecio(plan.precioSugerido) : "—"}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                {plan.sesionesPorMes} / mes
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <button
                                                onClick={() => handleToggleActivo(plan)}
                                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                                    plan.activo
                                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                }`}
                                            >
                                                {plan.activo ? "Activo" : "Inactivo"}
                                            </button>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-gray-100 text-gray-400 hover:text-primary"
                                                    onClick={() => abrirDialogo(plan)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-red-50 text-gray-400 hover:text-red-500"
                                                    onClick={() => setShowConfirmDelete(plan)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {showDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                    {editingPlan ? "Editar Plan" : "Nuevo Plan"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {editingPlan
                                        ? "Modifica los datos del plan recurrente"
                                        : "Configura un nuevo plan recurrente"}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={cerrarDialogo}
                                className="rounded-full hover:bg-gray-200/50"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Nombre del Plan *
                                </label>
                                <Input
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        setFormData({ ...formData, nombre: e.target.value })
                                    }
                                    placeholder="Ej: Plan Semanal Básico"
                                    className="h-10 bg-gray-50/50 focus:bg-white"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Descripción
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) =>
                                        setFormData({ ...formData, descripcion: e.target.value })
                                    }
                                    rows={2}
                                    placeholder="Describe los beneficios del plan..."
                                    className="w-full rounded-lg border border-input bg-gray-50/50 px-4 py-3 text-sm focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                                />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Frecuencia *
                                </label>
                                <select
                                    value={formData.frecuencia}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            frecuencia: e.target.value as FrecuenciaCliente,
                                        })
                                    }
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                >
                                    {FRECUENCIAS.map((f) => (
                                        <option key={f.value} value={f.value}>
                                            {f.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Sesiones por Mes *
                                </label>
                                <Input
                                    type="number"
                                    min={1}
                                    max={31}
                                    value={formData.sesionesPorMes}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            sesionesPorMes: parseInt(e.target.value) || 1,
                                        })
                                    }
                                    className="h-10 bg-gray-50/50 focus:bg-white"
                                />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Precio por Visita *
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.precioPorVisita}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                precioPorVisita: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        className="pl-9 h-10 bg-gray-50/50 focus:bg-white"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Precio Sugerido (sin plan)
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        min={0}
                                        value={formData.precioSugerido}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                precioSugerido: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                        className="pl-9 h-10 bg-gray-50/50 focus:bg-white"
                                        placeholder="0"
                                    />
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Para mostrar el ahorro versus el precio regular
                                </p>
                            </div>

                            <div className="col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.destacado}
                                        onChange={(e) =>
                                            setFormData({ ...formData, destacado: e.target.checked })
                                        }
                                        className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                    />
                                    <div>
                                        <span className="text-sm font-medium text-gray-900">Plan destacado</span>
                                        <p className="text-xs text-gray-500">
                                            Mostrar este plan con prioridad en el formulario de agendar
                                        </p>
                                    </div>
                                </label>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <Button variant="outline" onClick={cerrarDialogo}>
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleGuardar}
                                disabled={guardando}
                                className="bg-primary hover:bg-primary/90 text-white"
                            >
                                {guardando ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : editingPlan ? (
                                    "Guardar Cambios"
                                ) : (
                                    "Crear Plan"
                                )}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            ¿Eliminar plan?
                        </h3>
                        <p className="text-sm text-gray-500 mb-6">
                            Se eliminar&aacute; permanentemente &ldquo;{showConfirmDelete.nombre}&rdquo;. Los clientes
                            asignados a este plan dejar&aacute;n de tener plan activo.
                        </p>
                        <div className="flex justify-end gap-3">
                            <Button variant="outline" onClick={() => setShowConfirmDelete(null)}>
                                Cancelar
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleEliminar}
                            >
                                Eliminar
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
