"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    ArrowLeft,
    Sparkles,
    Building2,
    Zap,
    Clock,
    Users,
    DollarSign,
    CheckCircle2,
    XCircle,
    Edit2,
    Trash2,
    ImageIcon,
    X,
    Save,
} from "lucide-react";
import Link from "next/link";
import {
    obtenerServicioPorId,
    actualizarServicio,
    eliminarServicio,
} from "@/lib/actions/servicios";
import { obtenerURLArchivo } from "@/lib/appwrite";
import { formatearPrecio } from "@/lib/utils";
import type { Servicio } from "@/types";
import { toast } from "sonner";

const ICONOS_CATEGORIA: Record<string, React.ComponentType<{ className?: string }>> = {
    residencial: Sparkles,
    comercial: Building2,
    especializado: Zap,
};

const COLORES_CATEGORIA: Record<string, string> = {
    residencial: "from-sky-500 to-blue-600",
    comercial: "from-emerald-500 to-green-600",
    especializado: "from-purple-500 to-violet-600",
};

export default function DetalleServicioPage() {
    const params = useParams();
    const servicioId = params.id as string;
    const router = useRouter();

    const [servicio, setServicio] = useState<Servicio | null>(null);
    const [loading, setLoading] = useState(true);
    const [showEdit, setShowEdit] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);

    const [editForm, setEditForm] = useState({
        nombre: "",
        slug: "",
        descripcionCorta: "",
        descripcion: "",
        categoria: "residencial",
        precioBase: 0,
        unidadPrecio: "servicio" as "hora" | "metrocuadrado" | "servicio",
        duracionEstimada: 60,
        requierePersonal: 1,
        caracteristicas: "",
    });

    useEffect(() => {
        cargarServicio();
    }, [servicioId]);

    const cargarServicio = async () => {
        try {
            setLoading(true);
            const data = await obtenerServicioPorId(servicioId);
            setServicio(data);
            if (data) {
                setEditForm({
                    nombre: data.nombre,
                    slug: data.slug,
                    descripcionCorta: data.descripcionCorta,
                    descripcion: data.descripcion,
                    categoria: data.categoria,
                    precioBase: data.precioBase,
                    unidadPrecio: data.unidadPrecio,
                    duracionEstimada: data.duracionEstimada,
                    requierePersonal: data.requierePersonal,
                    caracteristicas: data.caracteristicas.join("\n"),
                });
            }
        } catch {
            toast.error("Error al cargar el servicio");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActivo = async () => {
        if (!servicio) return;
        try {
            const result = await actualizarServicio(servicio.$id, {
                activo: !servicio.activo,
            });
            if (result.success) {
                toast.success(
                    servicio.activo
                        ? "Servicio desactivado"
                        : "Servicio activado"
                );
                cargarServicio();
            }
        } catch {
            toast.error("Error al cambiar estado");
        }
    };

    const handleSaveEdit = async () => {
        if (!servicio) return;
        try {
            const result = await actualizarServicio(servicio.$id, {
                ...editForm,
                caracteristicas: editForm.caracteristicas
                    .split("\n")
                    .map((c) => c.trim())
                    .filter(Boolean),
            });
            if (result.success) {
                toast.success("Servicio actualizado");
                setShowEdit(false);
                cargarServicio();
            } else {
                toast.error(result.error || "Error al actualizar");
            }
        } catch {
            toast.error("Error al guardar");
        }
    };

    const handleDelete = async () => {
        if (!servicio) return;
        try {
            setDeleting(true);
            const result = await eliminarServicio(servicio.$id);
            if (result.success) {
                toast.success("Servicio eliminado");
                router.push("/admin/servicios");
            } else {
                toast.error(result.error || "Error al eliminar");
            }
        } catch {
            toast.error("Error al eliminar");
        } finally {
            setDeleting(false);
            setShowConfirmDelete(false);
        }
    };

    if (loading) {
        return <DetalleSkeleton />;
    }

    if (!servicio) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <XCircle className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Servicio no encontrado
                </h2>
                <p className="text-gray-500 mb-6">
                    El servicio que buscas no existe o ha sido eliminado.
                </p>
                <Link href="/admin/servicios">
                    <Button variant="outline">
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Servicios
                    </Button>
                </Link>
            </div>
        );
    }

    const IconComponent = ICONOS_CATEGORIA[servicio.categoria] || Sparkles;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/admin/servicios">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="rounded-full hover:bg-gray-100"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div
                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${COLORES_CATEGORIA[servicio.categoria] || "from-sky-500 to-blue-600"} flex items-center justify-center`}
                    >
                        <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {servicio.nombre}
                            </h1>
                            <button
                                onClick={handleToggleActivo}
                                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                    servicio.activo
                                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                }`}
                            >
                                {servicio.activo ? "Activo" : "Inactivo"}
                            </button>
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {servicio.descripcionCorta}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setShowEdit(true)}
                    >
                        <Edit2 className="mr-2 h-4 w-4" /> Editar
                    </Button>
                    <Button
                        variant="outline"
                        className="text-red-500 border-red-200 hover:bg-red-50"
                        onClick={() => setShowConfirmDelete(true)}
                    >
                        <Trash2 className="mr-2 h-4 w-4" /> Eliminar
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center text-center">
                                <div
                                    className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${COLORES_CATEGORIA[servicio.categoria] || "from-sky-500 to-blue-600"} flex items-center justify-center mb-4`}
                                >
                                    <IconComponent className="h-12 w-12 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900">
                                    {servicio.nombre}
                                </h3>
                                <Badge
                                    variant="outline"
                                    className="mt-2 capitalize"
                                >
                                    {servicio.categoria}
                                </Badge>
                                <p className="text-sm text-gray-500 mt-4 font-mono">
                                    /{servicio.slug}
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Información
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <p className="text-xs text-gray-400 uppercase tracking-wider">
                                    Precio
                                </p>
                                <p className="text-2xl font-bold text-primary mt-1">
                                    {formatearPrecio(servicio.precioBase)}
                                    <span className="text-sm text-gray-500 font-normal ml-1">
                                        /
                                        {servicio.unidadPrecio === "hora"
                                            ? "hora"
                                            : servicio.unidadPrecio ===
                                                "metrocuadrado"
                                              ? "m²"
                                              : "servicio"}
                                    </span>
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                                        Duración
                                    </p>
                                    <p className="flex items-center gap-1 mt-1 font-medium text-gray-700">
                                        <Clock className="h-4 w-4 text-gray-400" />
                                        {servicio.duracionEstimada} min
                                    </p>
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs text-gray-400 uppercase tracking-wider">
                                        Personal
                                    </p>
                                    <p className="flex items-center gap-1 mt-1 font-medium text-gray-700">
                                        <Users className="h-4 w-4 text-gray-400" />
                                        {servicio.requierePersonal}{" "}
                                        {servicio.requierePersonal === 1
                                            ? "persona"
                                            : "personas"}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Descripción
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-gray-700 leading-relaxed">
                                {servicio.descripcion ||
                                    "Sin descripción disponible."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                                Características
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {servicio.caracteristicas.length > 0 ? (
                                <ul className="space-y-2">
                                    {servicio.caracteristicas.map(
                                        (caracteristica, idx) => (
                                            <li
                                                key={idx}
                                                className="flex items-start gap-2"
                                            >
                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                                                <span className="text-gray-700">
                                                    {caracteristica}
                                                </span>
                                            </li>
                                        )
                                    )}
                                </ul>
                            ) : (
                                <p className="text-gray-400 text-sm">
                                    Sin características registradas.
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {showEdit && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                    Editar Servicio
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {servicio.nombre}
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowEdit(false)}
                                className="rounded-full hover:bg-gray-200/50"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Nombre
                                </label>
                                <Input
                                    value={editForm.nombre}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            nombre: e.target.value,
                                        })
                                    }
                                    className="h-10"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Slug
                                </label>
                                <Input
                                    value={editForm.slug}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            slug: e.target.value,
                                        })
                                    }
                                    className="h-10 font-mono text-sm"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Descripción Corta
                                </label>
                                <Input
                                    value={editForm.descripcionCorta}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            descripcionCorta: e.target.value,
                                        })
                                    }
                                    className="h-10"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Descripción Completa
                                </label>
                                <textarea
                                    value={editForm.descripcion}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            descripcion: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    className="w-full rounded-lg border border-input bg-gray-50/50 px-4 py-3 text-sm focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Categoría
                                </label>
                                <select
                                    value={editForm.categoria}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            categoria: e.target.value,
                                        })
                                    }
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                >
                                    <option value="residencial">
                                        Residencial
                                    </option>
                                    <option value="comercial">Comercial</option>
                                    <option value="especializado">
                                        Especializado
                                    </option>
                                </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Unidad de Precio
                                </label>
                                <select
                                    value={editForm.unidadPrecio}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            unidadPrecio: e.target.value as
                                                | "hora"
                                                | "metrocuadrado"
                                                | "servicio",
                                        })
                                    }
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                >
                                    <option value="hora">Por Hora</option>
                                    <option value="metrocuadrado">
                                        Por Metro²
                                    </option>
                                    <option value="servicio">
                                        Por Servicio
                                    </option>
                                </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Precio Base
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        value={editForm.precioBase}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                precioBase:
                                                    parseInt(
                                                        e.target.value
                                                    ) || 0,
                                            })
                                        }
                                        className="pl-9 h-10"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Duración (min)
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        value={editForm.duracionEstimada}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                duracionEstimada:
                                                    parseInt(
                                                        e.target.value
                                                    ) || 60,
                                            })
                                        }
                                        className="pl-9 h-10"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Personal Requerido
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        min={1}
                                        value={editForm.requierePersonal}
                                        onChange={(e) =>
                                            setEditForm({
                                                ...editForm,
                                                requierePersonal:
                                                    parseInt(
                                                        e.target.value
                                                    ) || 1,
                                            })
                                        }
                                        className="pl-9 h-10"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Características (una por línea)
                                </label>
                                <textarea
                                    value={editForm.caracteristicas}
                                    onChange={(e) =>
                                        setEditForm({
                                            ...editForm,
                                            caracteristicas: e.target.value,
                                        })
                                    }
                                    rows={4}
                                    className="w-full rounded-lg border border-input bg-gray-50/50 px-4 py-3 text-sm focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0">
                            <Button
                                variant="outline"
                                onClick={() => setShowEdit(false)}
                                className="h-10 px-6"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleSaveEdit}
                                className="h-10 px-6 bg-primary hover:bg-primary/90"
                            >
                                <Save className="mr-2 h-4 w-4" /> Guardar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                ¿Eliminar servicio?
                            </h3>
                            <p className="text-sm text-gray-500 mb-6">
                                Esta acción eliminará permanentemente{" "}
                                <strong>{servicio.nombre}</strong>. Los servicios
                                asociados a citas existentes no se verán
                                afectados.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowConfirmDelete(false)}
                                    className="h-10 px-6"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="h-10 px-6"
                                >
                                    {deleting
                                        ? "Eliminando..."
                                        : "Eliminar Servicio"}
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
                    <Skeleton className="h-4 w-64" />
                </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col items-center">
                                <Skeleton className="h-24 w-24 rounded-2xl mb-4" />
                                <Skeleton className="h-5 w-32 mb-2" />
                                <Skeleton className="h-5 w-20 rounded-full" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Skeleton className="h-8 w-40" />
                            <div className="flex gap-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </CardContent>
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-20 w-full" />
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-4 w-24" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-5 w-full" />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
