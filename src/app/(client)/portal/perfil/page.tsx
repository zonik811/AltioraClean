"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
    UserCircle,
    Mail,
    Phone,
    MapPin,
    Save,
    Loader2,
    Award,
} from "lucide-react";
import {
    obtenerClientePorEmail,
    actualizarCliente,
} from "@/lib/actions/clientes";
import type { Cliente, TipoCliente, FrecuenciaCliente } from "@/types";
import { formatearPrecio } from "@/lib/utils";
import { toast } from "sonner";

function PerfilSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-8 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center">
                        <Skeleton className="h-24 w-24 rounded-full mb-4" />
                        <Skeleton className="h-5 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                    </CardContent>
                </Card>
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <Skeleton className="h-5 w-32" />
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {[1, 2, 3, 4].map((i) => (
                                <Skeleton key={i} className="h-10 w-full" />
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

export default function PerfilPage() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<Cliente | null>(null);
    const [loading, setLoading] = useState(true);
    const [guardando, setGuardando] = useState(false);

    const [formData, setFormData] = useState({
        nombre: "",
        telefono: "",
        direccion: "",
        ciudad: "Bogotá",
        tipoCliente: "residencial" as TipoCliente | string,
        frecuenciaPreferida: "unica" as FrecuenciaCliente | string,
        notasImportantes: "",
    });

    useEffect(() => {
        if (user?.email) {
            cargarPerfil();
        }
    }, [user]);

    const cargarPerfil = async () => {
        try {
            setLoading(true);
            const data = await obtenerClientePorEmail(user!.email);
            if (data) {
                setProfile(data);
                setFormData({
                    nombre: data.nombre || "",
                    telefono: data.telefono || "",
                    direccion: data.direccion || "",
                    ciudad: data.ciudad || "Bogotá",
                    tipoCliente: data.tipoCliente || "residencial",
                    frecuenciaPreferida:
                        data.frecuenciaPreferida || "unica",
                    notasImportantes: data.notasImportantes || "",
                });
            }
        } catch {
            toast.error("Error al cargar perfil");
        } finally {
            setLoading(false);
        }
    };

    const handleGuardar = async () => {
        if (!profile || !formData.nombre) {
            toast.error("El nombre es requerido");
            return;
        }

        setGuardando(true);
        try {
            const result = await actualizarCliente(profile.$id, {
                nombre: formData.nombre,
                telefono: formData.telefono,
                direccion: formData.direccion,
                ciudad: formData.ciudad,
                tipoCliente: formData.tipoCliente as TipoCliente,
                frecuenciaPreferida:
                    formData.frecuenciaPreferida as FrecuenciaCliente,
                notasImportantes: formData.notasImportantes || undefined,
            });

            if (result.success) {
                toast.success("Perfil actualizado");
                cargarPerfil();
            } else {
                toast.error(result.error || "Error al actualizar");
            }
        } catch {
            toast.error("Error al guardar el perfil");
        } finally {
            setGuardando(false);
        }
    };

    if (loading) return <PerfilSkeleton />;

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <UserCircle className="h-16 w-16 text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-700 mb-2">
                    Perfil no encontrado
                </h2>
                <p className="text-gray-500">
                    No pudimos encontrar tu perfil. Intenta recargar la página.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                    Mi Perfil
                </h1>
                <p className="text-gray-500 mt-1">
                    Administra tu información personal
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="pt-6 flex flex-col items-center text-center">
                        <div className="w-24 h-24 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mb-4 shadow-lg">
                            <UserCircle className="h-12 w-12 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {profile.nombre || "Cliente"}
                        </h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <Mail className="h-3 w-3" />
                            {profile.email}
                        </p>

                        <div className="mt-6 w-full space-y-3 pt-4 border-t border-gray-100">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Servicios
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {profile.serviciosCompletados ||
                                        profile.totalServicios ||
                                        0}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">
                                    Total Gastado
                                </span>
                                <span className="font-semibold text-gray-900">
                                    {formatearPrecio(
                                        profile.totalGastado || 0
                                    )}
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Puntos</span>
                                <span className="font-semibold text-primary flex items-center gap-1">
                                    <Award className="h-3 w-3" />
                                    {profile.puntosAcumulados || 0}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">
                                Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        Nombre Completo
                                    </label>
                                    <Input
                                        value={formData.nombre}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                nombre: e.target.value,
                                            })
                                        }
                                        className="h-10"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        Teléfono
                                    </label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            value={formData.telefono}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    telefono: e.target.value,
                                                })
                                            }
                                            className="pl-9 h-10"
                                            placeholder="300 123 4567"
                                        />
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        Dirección
                                    </label>
                                    <div className="relative">
                                        <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                        <Input
                                            value={formData.direccion}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    direccion: e.target.value,
                                                })
                                            }
                                            className="pl-9 h-10"
                                            placeholder="Calle 123 # 45 - 67"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        Ciudad
                                    </label>
                                    <select
                                        value={formData.ciudad}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                ciudad: e.target.value,
                                            })
                                        }
                                        className="w-full h-10 px-3 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="Bogotá">Bogotá</option>
                                        <option value="Mosquera">
                                            Mosquera
                                        </option>
                                        <option value="Funza">Funza</option>
                                        <option value="Fusagasugá">
                                            Fusagasugá
                                        </option>
                                        <option value="Soacha">Soacha</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        Tipo de Cliente
                                    </label>
                                    <select
                                        value={formData.tipoCliente}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                tipoCliente: e.target.value,
                                            })
                                        }
                                        className="w-full h-10 px-3 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="residencial">
                                            Residencial
                                        </option>
                                        <option value="comercial">
                                            Comercial
                                        </option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        Frecuencia Preferida
                                    </label>
                                    <select
                                        value={formData.frecuenciaPreferida}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                frecuenciaPreferida:
                                                    e.target.value,
                                            })
                                        }
                                        className="w-full h-10 px-3 border rounded-lg bg-white text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                                    >
                                        <option value="unica">Única</option>
                                        <option value="semanal">Semanal</option>
                                        <option value="quincenal">
                                            Quincenal
                                        </option>
                                        <option value="mensual">Mensual</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">
                                        Notas importantes
                                    </label>
                                    <textarea
                                        value={formData.notasImportantes}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                notasImportantes:
                                                    e.target.value,
                                            })
                                        }
                                        rows={3}
                                        placeholder="Alergias, instrucciones especiales, etc."
                                        className="w-full rounded-lg border border-input bg-white px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button
                                    onClick={handleGuardar}
                                    disabled={guardando}
                                    className="h-10 px-8 bg-primary hover:bg-primary/90"
                                >
                                    {guardando ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Guardando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />{" "}
                                            Guardar Cambios
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-yellow-400" />
                                Programa de Fidelidad
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                    <p className="text-slate-400">Nivel Actual</p>
                                    <p className="text-lg font-bold text-yellow-400">
                                        {(
                                            profile.nivelFidelidad || "bronce"
                                        ).toUpperCase()}
                                    </p>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                    <p className="text-slate-400">
                                        Puntos Acumulados
                                    </p>
                                    <p className="text-lg font-bold text-white">
                                        {profile.puntosAcumulados || 0}
                                    </p>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                    <p className="text-slate-400">
                                        Servicios Completados
                                    </p>
                                    <p className="text-lg font-bold text-white">
                                        {profile.serviciosCompletados ||
                                            profile.totalServicios ||
                                            0}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
