"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
    MapPin,
    Home,
    Building2,
    Trash2,
    Plus,
    X,
    Save,
    Loader2,
} from "lucide-react";
import {
    obtenerDireccionesCliente,
    crearDireccion,
    eliminarDireccion,
} from "@/lib/actions/direcciones";
import { obtenerClientePorEmail } from "@/lib/actions/clientes";
import type { Direccion, TipoPropiedad } from "@/types";
import { toast } from "sonner";

function DireccionesSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-44" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                    <Card key={i}>
                        <CardContent className="pt-6">
                            <Skeleton className="h-5 w-32 mb-3" />
                            <Skeleton className="h-4 w-full mb-1" />
                            <Skeleton className="h-4 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}

export default function DireccionesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [direcciones, setDirecciones] = useState<Direccion[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [clienteId, setClienteId] = useState<string | null>(null);

    const [nuevaDireccion, setNuevaDireccion] = useState({
        nombre: "",
        direccion: "",
        ciudad: "Bogotá",
        barrio: "",
        tipo: "casa" as TipoPropiedad | string,
    });

    useEffect(() => {
        if (user?.email) {
            cargarDatos();
        }
    }, [user]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const profile = await obtenerClientePorEmail(user!.email);
            if (profile) {
                setClienteId(profile.$id);
                const addrs = await obtenerDireccionesCliente(profile.$id);
                setDirecciones(addrs);
            }
        } catch {
            toast.error("Error al cargar direcciones");
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setNuevaDireccion({
            nombre: "",
            direccion: "",
            ciudad: "Bogotá",
            barrio: "",
            tipo: "casa",
        });
        setShowForm(false);
    };

    const handleGuardar = async () => {
        if (!nuevaDireccion.nombre || !nuevaDireccion.direccion || !clienteId) {
            toast.error("Nombre y dirección son requeridos");
            return;
        }

        setGuardando(true);
        try {
            const result = await crearDireccion({
                clienteId,
                nombre: nuevaDireccion.nombre,
                direccion: nuevaDireccion.direccion,
                ciudad: nuevaDireccion.ciudad,
                barrio: nuevaDireccion.barrio || undefined,
                tipo: nuevaDireccion.tipo as TipoPropiedad,
            });

            if (result.success) {
                toast.success("Dirección guardada");
                resetForm();
                cargarDatos();
            } else {
                toast.error(result.error || "Error al guardar");
            }
        } catch {
            toast.error("Error al guardar la dirección");
        } finally {
            setGuardando(false);
        }
    };

    const handleEliminar = async (id: string) => {
        setDeletingId(id);
        try {
            const result = await eliminarDireccion(id);
            if (result.success) {
                toast.success("Dirección eliminada");
                setDirecciones((prev) => prev.filter((d) => d.$id !== id));
            }
        } catch {
            toast.error("Error al eliminar");
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) return <DireccionesSkeleton />;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        Mis Direcciones
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Administra tus direcciones de servicio
                    </p>
                </div>
                <Button
                    onClick={() => setShowForm(true)}
                    className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                >
                    <Plus className="mr-2 h-4 w-4" /> Nueva Dirección
                </Button>
            </div>

            {showForm && (
                <Card className="border-2 border-primary/30 bg-primary/5">
                    <CardContent className="pt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Nombre *
                                </label>
                                <Input
                                    value={nuevaDireccion.nombre}
                                    onChange={(e) =>
                                        setNuevaDireccion({
                                            ...nuevaDireccion,
                                            nombre: e.target.value,
                                        })
                                    }
                                    placeholder="Ej: Casa, Oficina, Apartamento"
                                    className="h-10 bg-white"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Tipo
                                </label>
                                <select
                                    value={nuevaDireccion.tipo}
                                    onChange={(e) =>
                                        setNuevaDireccion({
                                            ...nuevaDireccion,
                                            tipo: e.target.value,
                                        })
                                    }
                                    className="w-full h-10 px-3 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="casa">Casa</option>
                                    <option value="apartamento">
                                        Apartamento
                                    </option>
                                    <option value="oficina">Oficina</option>
                                    <option value="local">
                                        Local Comercial
                                    </option>
                                </select>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Dirección *
                                </label>
                                <Input
                                    value={nuevaDireccion.direccion}
                                    onChange={(e) =>
                                        setNuevaDireccion({
                                            ...nuevaDireccion,
                                            direccion: e.target.value,
                                        })
                                    }
                                    placeholder="Calle 123 # 45 - 67"
                                    className="h-10 bg-white"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Ciudad
                                </label>
                                <select
                                    value={nuevaDireccion.ciudad}
                                    onChange={(e) =>
                                        setNuevaDireccion({
                                            ...nuevaDireccion,
                                            ciudad: e.target.value,
                                        })
                                    }
                                    className="w-full h-10 px-3 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                >
                                    <option value="Bogotá">Bogotá</option>
                                    <option value="Mosquera">Mosquera</option>
                                    <option value="Funza">Funza</option>
                                    <option value="Fusagasugá">
                                        Fusagasugá
                                    </option>
                                    <option value="Soacha">Soacha</option>
                                </select>
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Barrio (opcional)
                                </label>
                                <Input
                                    value={nuevaDireccion.barrio}
                                    onChange={(e) =>
                                        setNuevaDireccion({
                                            ...nuevaDireccion,
                                            barrio: e.target.value,
                                        })
                                    }
                                    placeholder="Nombre del barrio"
                                    className="h-10 bg-white"
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 justify-end mt-6">
                            <Button
                                variant="outline"
                                onClick={resetForm}
                                disabled={guardando}
                                className="h-10 px-6"
                            >
                                <X className="mr-2 h-4 w-4" /> Cancelar
                            </Button>
                            <Button
                                onClick={handleGuardar}
                                disabled={guardando}
                                className="h-10 px-6 bg-primary hover:bg-primary/90"
                            >
                                {guardando ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="mr-2 h-4 w-4" />{" "}
                                        Guardar
                                    </>
                                )}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {direcciones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {direcciones.map((addr) => (
                        <Card
                            key={addr.$id}
                            className="group hover:border-primary/50 transition-colors"
                        >
                            <CardHeader className="pb-3">
                                <CardTitle className="text-base flex items-center gap-2">
                                    {addr.tipo === "apartamento" ? (
                                        <Building2 className="w-4 h-4 text-blue-500" />
                                    ) : (
                                        <Home className="w-4 h-4 text-green-500" />
                                    )}
                                    {addr.nombre}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-1">
                                    {addr.direccion}
                                </p>
                                <p className="text-xs text-gray-400">
                                    {addr.ciudad}
                                    {addr.barrio && ` • ${addr.barrio}`}
                                </p>
                            </CardContent>
                            <CardFooter className="pt-0 flex justify-between">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        router.push(
                                            `/agendar?direccion=${addr.$id}`
                                        )
                                    }
                                >
                                    Usar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleEliminar(addr.$id)}
                                    disabled={deletingId === addr.$id}
                                >
                                    {deletingId === addr.$id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Trash2 className="w-4 h-4" />
                                    )}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState
                    variant="default"
                    icon={<MapPin className="h-12 w-12 text-gray-400" />}
                    title="Sin direcciones guardadas"
                    description="Agrega tu primera dirección para agendar servicios más rápido"
                    action={{
                        label: "Agregar Dirección",
                        onClick: () => setShowForm(true),
                    }}
                />
            )}
        </div>
    );
}
