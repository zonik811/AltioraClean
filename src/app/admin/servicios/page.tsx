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
    Sparkles,
    Building2,
    Zap,
    Edit2,
    X,
    DollarSign,
    Clock,
    Users,
    Search,
    LayoutList,
    LayoutGrid,
    Trash2,
    ImageIcon,
    Loader2,
} from "lucide-react";
import {
    obtenerServicios,
    crearServicio,
    actualizarServicio,
    eliminarServicio,
    obtenerServicioPorSlug,
} from "@/lib/actions/servicios";
import { subirArchivo, obtenerURLArchivo } from "@/lib/appwrite";
import type { Servicio } from "@/types";
import { formatearPrecio } from "@/lib/utils";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

type Vista = "tabla" | "tarjetas";
type FiltroEstado = "activos" | "todos" | "inactivos";

const CATEGORIAS = [
    { value: "residencial", label: "Residencial" },
    { value: "comercial", label: "Comercial" },
    { value: "especializado", label: "Especializado" },
];

const UNIDADES_PRECIO = [
    { value: "hora", label: "Por Hora" },
    { value: "metrocuadrado", label: "Por Metro²" },
    { value: "servicio", label: "Por Servicio" },
];

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

interface FormDataState {
    nombre: string;
    slug: string;
    descripcion: string;
    descripcionCorta: string;
    categoria: string;
    precioBase: number;
    unidadPrecio: "hora" | "metrocuadrado" | "servicio";
    duracionEstimada: number;
    caracteristicas: string;
    requierePersonal: number;
    imagenFile: File | null;
}

const FORM_DEFAULTS: FormDataState = {
    nombre: "",
    slug: "",
    descripcion: "",
    descripcionCorta: "",
    categoria: "residencial",
    precioBase: 0,
    unidadPrecio: "servicio",
    duracionEstimada: 60,
    caracteristicas: "",
    requierePersonal: 1,
    imagenFile: null,
};

function slugify(text: string): string {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
}

export default function ServiciosPage() {
    const router = useRouter();
    const [servicios, setServicios] = useState<Servicio[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    const [vista, setVista] = useState<Vista>("tabla");
    const [showDialog, setShowDialog] = useState(false);
    const [editingServicio, setEditingServicio] = useState<Servicio | null>(null);
    const [busqueda, setBusqueda] = useState("");
    const [filtroActivo, setFiltroActivo] = useState<FiltroEstado>("activos");
    const [guardando, setGuardando] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<Servicio | null>(null);
    const [slugChecking, setSlugChecking] = useState(false);
    const [slugExists, setSlugExists] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const [formData, setFormData] = useState<FormDataState>({ ...FORM_DEFAULTS });

    useEffect(() => {
        cargarServicios();
    }, []);

    const cargarServicios = async () => {
        try {
            setLoading(true);
            const data = await obtenerServicios(undefined, { limit: 20 });
            setServicios(data.documents);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch {
            toast.error("Error al cargar servicios");
        } finally {
            setLoading(false);
        }
    };

    const cargarMas = async () => {
        if (!cursor || !hasMore) return;
        try {
            setLoadingMore(true);
            const estado =
                filtroActivo === "activos"
                    ? true
                    : filtroActivo === "inactivos"
                      ? false
                      : undefined;
            const data = await obtenerServicios(estado, { limit: 20, cursor });
            setServicios((prev) => [...prev, ...data.documents]);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch {
            toast.error("Error al cargar más servicios");
        } finally {
            setLoadingMore(false);
        }
    };

    const serviciosFiltrados = useMemo(() => {
        let filtrados = servicios;

        if (filtroActivo === "activos") {
            filtrados = filtrados.filter((s) => s.activo);
        } else if (filtroActivo === "inactivos") {
            filtrados = filtrados.filter((s) => !s.activo);
        }

        if (busqueda) {
            const q = busqueda.toLowerCase();
            filtrados = filtrados.filter(
                (s) =>
                    s.nombre.toLowerCase().includes(q) ||
                    s.descripcionCorta.toLowerCase().includes(q) ||
                    s.categoria.toLowerCase().includes(q)
            );
        }

        return filtrados;
    }, [servicios, filtroActivo, busqueda]);

    const abrirDialogo = (servicio?: Servicio) => {
        if (servicio) {
            setEditingServicio(servicio);
            setFormData({
                nombre: servicio.nombre,
                slug: servicio.slug,
                descripcion: servicio.descripcion,
                descripcionCorta: servicio.descripcionCorta,
                categoria: servicio.categoria,
                precioBase: servicio.precioBase,
                unidadPrecio: servicio.unidadPrecio,
                duracionEstimada: servicio.duracionEstimada,
                caracteristicas: servicio.caracteristicas.join("\n"),
                requierePersonal: servicio.requierePersonal,
                imagenFile: null,
            });
            setImagePreview(
                servicio.imagen
                    ? obtenerURLArchivo(servicio.imagen)
                    : null
            );
            setSlugExists(false);
        } else {
            setEditingServicio(null);
            setFormData({ ...FORM_DEFAULTS });
            setImagePreview(null);
            setSlugExists(false);
        }
        setShowDialog(true);
    };

    const cerrarDialogo = () => {
        setShowDialog(false);
        setEditingServicio(null);
        setImagePreview(null);
        setSlugExists(false);
    };

    const handleImagenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData({ ...formData, imagenFile: file });
            const reader = new FileReader();
            reader.onload = (ev) =>
                setImagePreview(ev.target?.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleNombreChange = (nombre: string) => {
        setFormData({
            ...formData,
            nombre,
            slug: editingServicio ? formData.slug : slugify(nombre),
        });
    };

    const handleSlugChange = async (slug: string) => {
        setFormData({ ...formData, slug });
        if (slug.length < 2) {
            setSlugExists(false);
            return;
        }
        setSlugChecking(true);
        try {
            const existing = await obtenerServicioPorSlug(slug);
            if (existing && existing.$id !== editingServicio?.$id) {
                setSlugExists(true);
            } else {
                setSlugExists(false);
            }
        } catch {
            setSlugExists(false);
        } finally {
            setSlugChecking(false);
        }
    };

    const handleGuardar = async () => {
        if (!formData.nombre || formData.precioBase <= 0) {
            toast.error("Nombre y precio base son requeridos");
            return;
        }
        if (!formData.slug) {
            toast.error("El slug es requerido");
            return;
        }
        if (slugExists) {
            toast.error("Ya existe otro servicio con este slug");
            return;
        }

        setGuardando(true);
        try {
            let imagenId = editingServicio?.imagen;

            if (formData.imagenFile) {
                const uploaded = await subirArchivo(formData.imagenFile);
                imagenId = uploaded;
            }

            const payload = {
                nombre: formData.nombre,
                slug: formData.slug,
                descripcion: formData.descripcion,
                descripcionCorta: formData.descripcionCorta,
                categoria: formData.categoria,
                precioBase: formData.precioBase,
                unidadPrecio: formData.unidadPrecio,
                duracionEstimada: formData.duracionEstimada,
                caracteristicas: formData.caracteristicas
                    .split("\n")
                    .map((c) => c.trim())
                    .filter(Boolean),
                requierePersonal: formData.requierePersonal,
                imagen: imagenId,
            };

            let result;
            if (editingServicio) {
                result = await actualizarServicio(
                    editingServicio.$id,
                    payload
                );
            } else {
                result = await crearServicio(payload);
            }

            if (result.success) {
                toast.success(
                    editingServicio
                        ? "Servicio actualizado"
                        : "Servicio creado"
                );
                cerrarDialogo();
                cargarServicios();
            } else {
                toast.error(result.error || "Error al guardar");
            }
        } catch {
            toast.error("Error al guardar el servicio");
        } finally {
            setGuardando(false);
        }
    };

    const handleToggleActivo = async (servicio: Servicio) => {
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
                cargarServicios();
            }
        } catch {
            toast.error("Error al cambiar estado");
        }
    };

    const handleEliminarConfirmado = async () => {
        if (!showConfirmDelete) return;
        try {
            const result = await eliminarServicio(showConfirmDelete.$id);
            if (result.success) {
                toast.success("Servicio eliminado");
                setShowConfirmDelete(null);
                cargarServicios();
            }
        } catch {
            toast.error("Error al eliminar");
        }
    };

    if (loading) {
        return <TableSkeleton rows={6} columns={5} hasAvatar={false} />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Gestión de Servicios
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Catálogo de servicios ofrecidos
                    </p>
                </div>
                <Button
                    onClick={() => abrirDialogo()}
                    className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105"
                >
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Servicio
                </Button>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    {(["activos", "todos", "inactivos"] as const).map(
                        (tipo) => (
                            <button
                                key={tipo}
                                onClick={() => setFiltroActivo(tipo)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                                    filtroActivo === tipo
                                        ? "bg-white text-primary shadow-sm"
                                        : "text-gray-500 hover:text-gray-900"
                                }`}
                            >
                                {tipo === "activos"
                                    ? "Activos"
                                    : tipo === "todos"
                                      ? "Todos"
                                      : "Inactivos"}
                            </button>
                        )
                    )}
                </div>

                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar servicios..."
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className="w-full pl-9 h-9 text-sm"
                    />
                </div>

                <div className="flex bg-gray-100 p-1 rounded-lg ml-auto">
                    <button
                        onClick={() => setVista("tabla")}
                        className={`p-1.5 rounded-md transition-all ${
                            vista === "tabla"
                                ? "bg-white text-primary shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
                        }`}
                        title="Vista tabla"
                    >
                        <LayoutList className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => setVista("tarjetas")}
                        className={`p-1.5 rounded-md transition-all ${
                            vista === "tarjetas"
                                ? "bg-white text-primary shadow-sm"
                                : "text-gray-400 hover:text-gray-600"
                        }`}
                        title="Vista tarjetas"
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {vista === "tabla" ? (
                <Card className="border-none shadow-md overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-600">
                                        Servicio
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">
                                        Categoría
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">
                                        Precio
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">
                                        Duración
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">
                                        Personal
                                    </TableHead>
                                    <TableHead className="font-semibold text-gray-600">
                                        Estado
                                    </TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {serviciosFiltrados.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
                                            className="text-center py-12"
                                        >
                                            <EmptyState
                                                title="No hay servicios"
                                                description="Crea tu primer servicio para empezar"
                                                action={{
                                                    label: "Crear Servicio",
                                                    onClick: () =>
                                                        abrirDialogo(),
                                                }}
                                            />
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    serviciosFiltrados.map((servicio) => {
                                        const Icon =
                                            ICONOS_CATEGORIA[
                                                servicio.categoria
                                            ] || Sparkles;
                                        return (
                                            <TableRow
                                                key={servicio.$id}
                                                className="hover:bg-gray-50/50 transition-colors"
                                            >
                                                <TableCell>
                                                    <Link
                                                        href={`/admin/servicios/${servicio.$id}`}
                                                        className="flex items-center gap-3 group"
                                                    >
                                                        <div
                                                            className={`w-9 h-9 rounded-lg bg-gradient-to-br ${COLORES_CATEGORIA[servicio.categoria] || "from-sky-500 to-blue-600"} flex items-center justify-center shrink-0`}
                                                        >
                                                            <Icon className="h-4 w-4 text-white" />
                                                        </div>
                                                        <div>
                                                            <p className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                                                                {
                                                                    servicio.nombre
                                                                }
                                                            </p>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {
                                                                    servicio.descripcionCorta
                                                                }
                                                            </p>
                                                        </div>
                                                    </Link>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="capitalize font-normal"
                                                    >
                                                        {servicio.categoria}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="font-bold text-gray-900">
                                                    {formatearPrecio(
                                                        servicio.precioBase
                                                    )}
                                                    <span className="text-xs text-gray-500 font-normal ml-1">
                                                        /
                                                        {servicio.unidadPrecio ===
                                                        "hora"
                                                            ? "hora"
                                                            : servicio.unidadPrecio ===
                                                                "metrocuadrado"
                                                              ? "m²"
                                                              : "servicio"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                                                        {servicio.duracionEstimada}{" "}
                                                        min
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-gray-600">
                                                    <span className="flex items-center gap-1">
                                                        <Users className="h-3.5 w-3.5 text-gray-400" />
                                                        {servicio.requierePersonal}{" "}
                                                        pers.
                                                    </span>
                                                </TableCell>
                                                <TableCell>
                                                    <button
                                                        onClick={() =>
                                                            handleToggleActivo(
                                                                servicio
                                                            )
                                                        }
                                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                                                            servicio.activo
                                                                ? "bg-green-100 text-green-700 hover:bg-green-200"
                                                                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                                                        }`}
                                                    >
                                                        {servicio.activo
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </button>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-gray-100 text-gray-400 hover:text-primary"
                                                            onClick={() =>
                                                                abrirDialogo(
                                                                    servicio
                                                                )
                                                            }
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 hover:bg-red-50 text-gray-400 hover:text-red-500"
                                                            onClick={() =>
                                                                setShowConfirmDelete(
                                                                    servicio
                                                                )
                                                            }
                                                        >
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
            ) : (
                <>
                    {serviciosFiltrados.length === 0 ? (
                        <EmptyState
                            title="No hay servicios"
                            description="Crea tu primer servicio para empezar"
                            action={{
                                label: "Crear Servicio",
                                onClick: () => abrirDialogo(),
                            }}
                        />
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {serviciosFiltrados.map((servicio) => {
                                const Icon =
                                    ICONOS_CATEGORIA[servicio.categoria] ||
                                    Sparkles;
                                const color =
                                    COLORES_CATEGORIA[servicio.categoria] ||
                                    "from-sky-500 to-blue-600";
                                return (
                                    <Link
                                        key={servicio.$id}
                                        href={`/admin/servicios/${servicio.$id}`}
                                        className="block"
                                    >
                                        <Card className="border-2 border-transparent hover:border-primary/30 hover:shadow-lg transition-all duration-200 group h-full">
                                            <CardContent className="p-5">
                                                <div className="flex items-start justify-between mb-4">
                                                    <div
                                                        className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center`}
                                                    >
                                                        <Icon className="h-6 w-6 text-white" />
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            handleToggleActivo(
                                                                servicio
                                                            );
                                                        }}
                                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                                                            servicio.activo
                                                                ? "bg-green-100 text-green-700"
                                                                : "bg-gray-100 text-gray-500"
                                                        }`}
                                                    >
                                                        {servicio.activo
                                                            ? "Activo"
                                                            : "Inactivo"}
                                                    </button>
                                                </div>

                                                <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">
                                                    {servicio.nombre}
                                                </h3>
                                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                                    {servicio.descripcionCorta}
                                                </p>

                                                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                                                    <div>
                                                        <span className="text-lg font-bold text-primary">
                                                            {formatearPrecio(
                                                                servicio.precioBase
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-gray-400 ml-1">
                                                            /
                                                            {servicio.unidadPrecio ===
                                                            "hora"
                                                                ? "hora"
                                                                : servicio.unidadPrecio ===
                                                                    "metrocuadrado"
                                                                  ? "m²"
                                                                  : "serv."}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-3 text-xs text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="h-3 w-3" />
                                                            {servicio.duracionEstimada}
                                                            m
                                                        </span>
                                                        <span className="flex items-center gap-1">
                                                            <Users className="h-3 w-3" />
                                                            {servicio.requierePersonal}
                                                        </span>
                                                    </div>
                                                </div>

                                                <Badge
                                                    variant="outline"
                                                    className="mt-3 capitalize text-xs"
                                                >
                                                    {servicio.categoria}
                                                </Badge>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {hasMore && serviciosFiltrados.length >= 20 && (
                <div className="flex justify-center mt-6">
                    <Button
                        variant="outline"
                        onClick={cargarMas}
                        disabled={loadingMore}
                        className="min-w-[150px]"
                    >
                        {loadingMore ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Cargando...
                            </>
                        ) : (
                            "Cargar más"
                        )}
                    </Button>
                </div>
            )}

            {showDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                    {editingServicio
                                        ? "Editar Servicio"
                                        : "Nuevo Servicio"}
                                </h3>
                                <p className="text-sm text-gray-500">
                                    {editingServicio
                                        ? "Modifica los datos del servicio"
                                        : "Ingresa los datos del nuevo servicio"}
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
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Nombre *
                                </label>
                                <Input
                                    value={formData.nombre}
                                    onChange={(e) =>
                                        handleNombreChange(e.target.value)
                                    }
                                    placeholder="Ej: Limpieza Residencial"
                                    className="h-10 bg-gray-50/50 focus:bg-white"
                                />
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Slug *
                                </label>
                                <div className="relative">
                                    <Input
                                        value={formData.slug}
                                        onChange={(e) =>
                                            handleSlugChange(e.target.value)
                                        }
                                        placeholder="limpieza-residencial"
                                        className={`h-10 bg-gray-50/50 focus:bg-white font-mono text-sm pr-8 ${
                                            slugExists
                                                ? "border-red-400 focus:border-red-500"
                                                : ""
                                        }`}
                                    />
                                    {slugChecking ? (
                                        <Loader2 className="absolute right-2.5 top-3 h-4 w-4 animate-spin text-gray-400" />
                                    ) : slugExists ? (
                                        <X className="absolute right-2.5 top-3 h-4 w-4 text-red-500" />
                                    ) : formData.slug.length > 2 ? (
                                        <svg
                                            className="absolute right-2.5 top-3 h-4 w-4 text-green-500"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M5 13l4 4L19 7"
                                            />
                                        </svg>
                                    ) : null}
                                </div>
                                {slugExists && (
                                    <p className="text-xs text-red-500 mt-1">
                                        Ya existe otro servicio con este slug
                                    </p>
                                )}
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Descripción Corta *
                                </label>
                                <Input
                                    value={formData.descripcionCorta}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            descripcionCorta: e.target.value,
                                        })
                                    }
                                    placeholder="Breve descripción del servicio"
                                    className="h-10 bg-gray-50/50 focus:bg-white"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Descripción Completa
                                </label>
                                <textarea
                                    value={formData.descripcion}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            descripcion: e.target.value,
                                        })
                                    }
                                    rows={3}
                                    placeholder="Descripción detallada del servicio..."
                                    className="w-full rounded-lg border border-input bg-gray-50/50 px-4 py-3 text-sm focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                                />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Categoría *
                                </label>
                                <select
                                    value={formData.categoria}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            categoria: e.target.value,
                                        })
                                    }
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                >
                                    {CATEGORIAS.map((cat) => (
                                        <option
                                            key={cat.value}
                                            value={cat.value}
                                        >
                                            {cat.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Unidad de Precio *
                                </label>
                                <select
                                    value={formData.unidadPrecio}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            unidadPrecio: e.target.value as
                                                | "hora"
                                                | "metrocuadrado"
                                                | "servicio",
                                        })
                                    }
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                >
                                    {UNIDADES_PRECIO.map((unidad) => (
                                        <option
                                            key={unidad.value}
                                            value={unidad.value}
                                        >
                                            {unidad.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Precio Base *
                                </label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        value={formData.precioBase}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                precioBase:
                                                    parseInt(
                                                        e.target.value
                                                    ) || 0,
                                            })
                                        }
                                        className="pl-9 h-10 bg-gray-50/50 focus:bg-white"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Duración (min) *
                                </label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        value={formData.duracionEstimada}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                duracionEstimada:
                                                    parseInt(
                                                        e.target.value
                                                    ) || 60,
                                            })
                                        }
                                        className="pl-9 h-10 bg-gray-50/50 focus:bg-white"
                                        placeholder="60"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Personal Requerido *
                                </label>
                                <div className="relative">
                                    <Users className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        min={1}
                                        value={formData.requierePersonal}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                requierePersonal:
                                                    parseInt(
                                                        e.target.value
                                                    ) || 1,
                                            })
                                        }
                                        className="pl-9 h-10 bg-gray-50/50 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Imagen del servicio
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleImagenChange}
                                            className="h-10 bg-gray-50/50 focus:bg-white file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-primary/10 file:text-primary file:text-xs file:font-medium hover:file:bg-primary/20"
                                        />
                                    </div>
                                    {imagePreview && (
                                        <div className="relative shrink-0">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-16 h-16 rounded-lg object-cover border"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        imagenFile: null,
                                                    });
                                                    setImagePreview(null);
                                                }}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    )}
                                    {!imagePreview && (
                                        <div className="w-16 h-16 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                                            <ImageIcon className="h-6 w-6 text-gray-300" />
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Características (una por línea)
                                </label>
                                <textarea
                                    value={formData.caracteristicas}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            caracteristicas: e.target.value,
                                        })
                                    }
                                    rows={4}
                                    placeholder="Incluye productos biodegradables&#10;Personal capacitado y certificado&#10;Garantía de satisfacción"
                                    className="w-full rounded-lg border border-input bg-gray-50/50 px-4 py-3 text-sm focus:bg-white focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end sticky bottom-0">
                            <Button
                                variant="outline"
                                onClick={cerrarDialogo}
                                disabled={guardando}
                                className="h-10 px-6"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleGuardar}
                                disabled={guardando || slugExists}
                                className="h-10 px-6 bg-primary hover:bg-primary/90"
                            >
                                {guardando ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : editingServicio ? (
                                    "Actualizar"
                                ) : (
                                    "Crear Servicio"
                                )}
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
                                <strong>{showConfirmDelete.nombre}</strong>.
                                Los servicios asociados a citas existentes no se
                                verán afectados.
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowConfirmDelete(null)}
                                    className="h-10 px-6"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleEliminarConfirmado}
                                    className="h-10 px-6"
                                >
                                    Eliminar Servicio
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
