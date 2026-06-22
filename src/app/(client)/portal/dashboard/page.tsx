"use client";

import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Calendar,
    Award,
    Star,
    MapPin,
    Trash2,
    Home,
    Building2,
    Clock,
    CheckCircle2,
    Search,
    Plus,
    Sparkles,
} from "lucide-react";
import Link from "next/link";
import { NivelFidelidad, Cita, HistorialPuntos, Cliente } from "@/types";
import { obtenerMisCitas } from "@/lib/actions/citas";
import { obtenerClientePorEmail } from "@/lib/actions/clientes";
import { obtenerHistorialPuntos } from "@/lib/actions/puntos";
import { obtenerDireccionesCliente, eliminarDireccion } from "@/lib/actions/direcciones";
import type { Direccion } from "@/types";
import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { formatearPrecio } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/lib/hooks/use-toast";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

// Skeleton Components
function DashboardSkeleton() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-48" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <Skeleton className="h-10 w-40" />
            </div>

            {/* Membership Card Skeleton */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 p-6 md:p-8">
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <Skeleton className="h-4 w-32 bg-slate-700" />
                        <Skeleton className="h-12 w-48 bg-slate-700" />
                        <Skeleton className="h-4 w-64 bg-slate-700" />
                        <div className="flex gap-4">
                            <Skeleton className="h-16 w-24 bg-slate-700" />
                            <Skeleton className="h-16 w-24 bg-slate-700" />
                        </div>
                    </div>
                    <Skeleton className="h-40 w-full bg-slate-700 rounded-xl" />
                </div>
            </div>

            {/* Tabs Skeleton */}
            <div className="space-y-4">
                <div className="flex gap-6 border-b">
                    <Skeleton className="h-10 w-20" />
                    <Skeleton className="h-10 w-28" />
                    <Skeleton className="h-10 w-32" />
                    <Skeleton className="h-10 w-24" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        </div>
    );
}

export default function ClientDashboard() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const { success, error: toastError } = useToast();
    const [citas, setCitas] = useState<Cita[]>([]);
    const [puntosHistory, setPuntosHistory] = useState<HistorialPuntos[]>([]);
    const [savedAddresses, setSavedAddresses] = useState<Direccion[]>([]);
    const [loading, setLoading] = useState(true);
    const [profileData, setProfileData] = useState<Cliente | null>(profile as Cliente | null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
    const [deletingAddress, setDeletingAddress] = useState(false);

    // Filters
    const [serviceFilter, setServiceFilter] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");

    // Initial sync
    useEffect(() => {
        if (profile) setProfileData(profile as Cliente);
    }, [profile]);

    useEffect(() => {
        async function fetchDashboardData() {
            if (user?.email) {
                try {
                    const [citasData, freshProfile] = await Promise.all([
                        obtenerMisCitas(user.email),
                        obtenerClientePorEmail(user.email)
                    ]);

                    setCitas(citasData);
                    if (freshProfile) {
                        setProfileData(freshProfile);
                        const history = await obtenerHistorialPuntos(freshProfile.$id);
                        setPuntosHistory(history);
                        const addresses = await obtenerDireccionesCliente(freshProfile.$id);
                        setSavedAddresses(addresses);
                    }
                } catch (error) {
                    console.error("Error fetching dashboard data:", error);
                    toastError("Error", "No se pudieron cargar tus datos");
                } finally {
                    setLoading(false);
                }
            }
        }
        fetchDashboardData();
    }, [user, toastError]);

    // Derived State
    const proximaCita = citas.find(c => ["pendiente", "confirmada", "en-progreso"].includes(c.estado));
    const citasCompletadas = citas.filter(c => c.estado === "completada");

    // Filtered Services
    const filteredServices = citas.filter(cita => {
        const matchesStatus = serviceFilter === "all" || cita.estado === serviceFilter;
        const matchesSearch = searchTerm === "" ||
            cita.direccion.toLowerCase().includes(searchTerm.toLowerCase()) ||
            cita.tipoPropiedad.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const nivel = profileData?.nivelFidelidad || NivelFidelidad.BRONCE;
    const puntos = profileData?.puntosAcumulados || 0;
    const nombre = profileData?.nombre || user?.name || "Cliente";

    // Progress Logic
    const getProgress = () => {
        if (nivel === NivelFidelidad.ORO) return 100;
        if (nivel === NivelFidelidad.PLATA) return Math.min(100, (puntos / 20) * 100);
        return Math.min(100, (puntos / 10) * 100);
    };

    const getNextLevelInfo = () => {
        if (nivel === NivelFidelidad.ORO) return { name: "ORO", pointsNeeded: 0 };
        if (nivel === NivelFidelidad.PLATA) return { name: "ORO", pointsNeeded: 20 - puntos };
        return { name: "PLATA", pointsNeeded: 10 - puntos };
    };

    const handleDeleteAddressClick = (id: string) => {
        setAddressToDelete(id);
        setDeleteDialogOpen(true);
    };

    const handleDeleteAddress = async () => {
        if (!addressToDelete) return;
        
        setDeletingAddress(true);
        try {
            const res = await eliminarDireccion(addressToDelete);
            if (res.success) {
                setSavedAddresses(prev => prev.filter(addr => addr.$id !== addressToDelete));
                success("Dirección eliminada", "La dirección ha sido eliminada correctamente");
            } else {
                toastError("Error", "No se pudo eliminar la dirección");
            }
        } catch {
            toastError("Error", "Ocurrió un error al eliminar la dirección");
        } finally {
            setDeletingAddress(false);
            setDeleteDialogOpen(false);
            setAddressToDelete(null);
        }
    };

    if (loading) {
        return <DashboardSkeleton />;
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completada': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Completada</Badge>;
            case 'confirmada': return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Confirmada</Badge>;
            case 'pendiente': return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">Pendiente</Badge>;
            case 'cancelada': return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Cancelada</Badge>;
            default: return <Badge variant="outline">{status}</Badge>;
        }
    };

    const nextLevelInfo = getNextLevelInfo();

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Hola, {nombre.split(' ')[0]}</h1>
                    <p className="text-gray-500">Bienvenido a tu portal de cliente</p>
                </div>
                <Link href="/agendar">
                    <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                        <Calendar className="mr-2 h-4 w-4" />
                        Nueva Solicitud
                    </Button>
                </Link>
            </div>

            {/* Premium Membership Card */}
            <div className="relative overflow-hidden rounded-2xl bg-slate-900 text-white shadow-2xl">
                <div className="absolute top-0 right-0 p-32 bg-sky-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 p-24 bg-amber-500/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3"></div>

                <div className="relative z-10 p-6 md:p-8 grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-sky-400">
                            <Award className="h-5 w-5" />
                            <span className="text-sm font-semibold tracking-wider uppercase">Nivel de Fidelidad</span>
                        </div>
                        <div>
                            <h2 className="text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-600 mb-2">
                                {nivel.toUpperCase()}
                            </h2>
                            <p className="text-slate-400">
                                Acumula puntos con cada servicio y desbloquea beneficios exclusivos.
                            </p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 backdrop-blur-sm">
                                <span className="text-xs text-slate-400 block">Puntos Actuales</span>
                                <span className="text-xl font-bold text-white">{puntos} Pts</span>
                            </div>
                            <div className="bg-slate-800/50 px-4 py-2 rounded-lg border border-slate-700 backdrop-blur-sm">
                                <span className="text-xs text-slate-400 block">Servicios Completados</span>
                                <span className="text-xl font-bold text-white">{citasCompletadas.length}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 backdrop-blur-sm">
                        <div className="flex justify-between items-end mb-4">
                            <div>
                                <h3 className="text-lg font-semibold">Progreso de Nivel</h3>
                                <p className="text-sm text-slate-400">
                                    {nivel === NivelFidelidad.ORO
                                        ? "¡Has alcanzado el máximo nivel!"
                                        : `Faltan ${nextLevelInfo.pointsNeeded} puntos para ${nextLevelInfo.name}`
                                    }
                                </p>
                            </div>
                            <span className="text-2xl font-bold text-sky-400">{Math.round(getProgress())}%</span>
                        </div>
                        <Progress value={getProgress()} className="h-3 bg-slate-700" />
                    </div>
                </div>
            </div>

            {/* Dashboard Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList className="bg-white border-b w-full justify-start rounded-none h-auto p-0 space-x-6 overflow-x-auto">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1">
                        Resumen
                    </TabsTrigger>
                    <TabsTrigger value="services" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1">
                        Mis Servicios
                    </TabsTrigger>
                    <TabsTrigger value="points" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1">
                        Puntos y Premios
                    </TabsTrigger>
                    <TabsTrigger value="addresses" className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-3 px-1">
                        Direcciones
                    </TabsTrigger>
                </TabsList>

                {/* Tab: Overview */}
                <TabsContent value="overview" className="animate-in slide-in-from-bottom-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Next Appointment */}
                        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <Clock className="w-5 h-5 text-primary" /> Próximo Servicio
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {proximaCita ? (
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <h3 className="text-2xl font-bold text-gray-900">
                                                    {new Date(proximaCita.fechaCita).toLocaleDateString("es-CO", { weekday: 'long', day: 'numeric', month: 'long' })}
                                                </h3>
                                                <p className="text-lg text-gray-600">{proximaCita.horaCita}</p>
                                            </div>
                                            {getStatusBadge(proximaCita.estado)}
                                        </div>
                                        <div className="flex items-center gap-2 text-gray-500 bg-gray-50 p-3 rounded-lg">
                                            <MapPin className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm line-clamp-1">{proximaCita.direccion}</span>
                                        </div>
                                        <div className="flex items-center justify-between text-sm">
                                            <span className="text-gray-500 capitalize">{proximaCita.tipoPropiedad}</span>
                                            <span className="font-semibold text-gray-900">{formatearPrecio(proximaCita.precioAcordado)}</span>
                                        </div>
                                    </div>
                                ) : (
                                    <EmptyState
                                        variant="appointments"
                                        title="Sin servicios programados"
                                        description="Agenda tu primer servicio y comienza a disfrutar"
                                        action={{
                                            label: "Agendar Ahora",
                                            href: "/agendar"
                                        }}
                                        className="border-0 shadow-none"
                                    />
                                )}
                            </CardContent>
                        </Card>

                        {/* Quick Stats or Promo */}
                        <Card className="bg-gradient-to-br from-white to-orange-50/50 border-orange-100 shadow-sm">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2 text-orange-700">
                                    <Star className="w-5 h-5" /> Beneficios Activos
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="font-medium text-gray-900">Prioridad en agendamiento</span>
                                            <p className="text-xs text-gray-500">Acceso preferencial a franjas horarias</p>
                                        </div>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                        <div>
                                            <span className="font-medium text-gray-900">Acumulación de puntos</span>
                                            <p className="text-xs text-gray-500">Gana 1 punto por cada servicio completado</p>
                                        </div>
                                    </li>
                                    {nivel !== NivelFidelidad.BRONCE && (
                                        <li className="flex items-start gap-2">
                                            <CheckCircle2 className="w-5 h-5 text-green-500 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <span className="font-medium text-gray-900">Descuentos exclusivos</span>
                                                <p className="text-xs text-gray-500">5% off en servicios adicionales</p>
                                            </div>
                                        </li>
                                    )}
                                </ul>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Recent Activity */}
                    {citasCompletadas.length > 0 && (
                        <Card className="mt-6">
                            <CardHeader>
                                <CardTitle className="text-lg">Actividad Reciente</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {citasCompletadas.slice(0, 3).map(cita => (
                                        <div key={cita.$id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900 capitalize">{cita.tipoPropiedad}</p>
                                                    <p className="text-sm text-gray-500">{new Date(cita.fechaCita).toLocaleDateString("es-CO")}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-semibold text-gray-900">{formatearPrecio(cita.precioAcordado)}</p>
                                                <p className="text-xs text-green-600">+1 punto</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Tab: Services */}
                <TabsContent value="services" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 w-full md:w-auto">
                            <div className="relative w-full md:w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                                <Input
                                    placeholder="Buscar por dirección..."
                                    className="pl-9"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <Select value={serviceFilter} onValueChange={setServiceFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Estado" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Todos</SelectItem>
                                    <SelectItem value="completada">Completados</SelectItem>
                                    <SelectItem value="pendiente">Pendientes</SelectItem>
                                    <SelectItem value="confirmada">Confirmados</SelectItem>
                                    <SelectItem value="cancelada">Cancelados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Link href="/agendar">
                            <Button variant="outline">
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Servicio
                            </Button>
                        </Link>
                    </div>

                    {filteredServices.length > 0 ? (
                        <Card>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Fecha</TableHead>
                                        <TableHead>Servicio</TableHead>
                                        <TableHead className="hidden md:table-cell">Dirección</TableHead>
                                        <TableHead>Valor</TableHead>
                                        <TableHead>Estado</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredServices.map((cita) => (
                                        <TableRow key={cita.$id} className="cursor-pointer hover:bg-gray-50">
                                            <TableCell className="font-medium">
                                                {new Date(cita.fechaCita).toLocaleDateString("es-CO")}
                                                <div className="text-xs text-gray-500">{cita.horaCita}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="capitalize">{cita.tipoPropiedad}</span>
                                                {cita.metrosCuadrados && (
                                                    <div className="text-xs text-gray-400">{cita.metrosCuadrados}m²</div>
                                                )}
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell max-w-[200px] truncate" title={cita.direccion}>
                                                {cita.direccion}, {cita.ciudad}
                                            </TableCell>
                                            <TableCell className="font-semibold">{formatearPrecio(cita.precioAcordado)}</TableCell>
                                            <TableCell>{getStatusBadge(cita.estado)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </Card>
                    ) : (
                        <EmptyState
                            variant={searchTerm || serviceFilter !== "all" ? "search" : "appointments"}
                            title={searchTerm || serviceFilter !== "all" ? "Sin resultados" : "Sin servicios aún"}
                            description={
                                searchTerm || serviceFilter !== "all"
                                    ? "No se encontraron servicios con los filtros seleccionados"
                                    : "Agenda tu primer servicio y comienza a disfrutar"
                            }
                            action={!searchTerm && serviceFilter === "all" ? {
                                label: "Agendar Servicio",
                                href: "/agendar"
                            } : undefined}
                            secondaryAction={(searchTerm || serviceFilter !== "all") ? {
                                label: "Limpiar filtros",
                                onClick: () => {
                                    setSearchTerm("");
                                    setServiceFilter("all");
                                }
                            } : undefined}
                        />
                    )}
                </TabsContent>

                {/* Tab: Points */}
                <TabsContent value="points" className="space-y-4 animate-in slide-in-from-bottom-2 duration-300">
                    {/* Benefits Explanation Card */}
                    <Card className="bg-gradient-to-r from-slate-900 to-slate-800 text-white border-none">
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <CardTitle className="text-xl flex items-center gap-2">
                                        <Award className="h-6 w-6 text-yellow-400" />
                                        Programa de Fidelidad
                                    </CardTitle>
                                    <CardDescription className="text-slate-400 mt-1">
                                        Conoce los beneficios de cada nivel y sube de categoría acumulando puntos.
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Bronze */}
                                <div className={`p-4 rounded-xl border ${nivel === NivelFidelidad.BRONCE ? 'bg-orange-500/20 border-orange-500 ring-1 ring-orange-500' : 'bg-slate-800 border-slate-700 opacity-70'} transition-all`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-orange-600"></div>
                                        <h3 className="font-bold text-orange-200">BRONCE</h3>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3">0 - 9 Puntos</p>
                                    <ul className="text-sm space-y-2 text-slate-300">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-orange-500" /> Acumula puntos
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-orange-500" /> Agendamiento web
                                        </li>
                                    </ul>
                                </div>

                                {/* Silver */}
                                <div className={`p-4 rounded-xl border ${nivel === NivelFidelidad.PLATA ? 'bg-slate-400/20 border-slate-400 ring-1 ring-slate-400' : 'bg-slate-800 border-slate-700'} transition-all`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-slate-400"></div>
                                        <h3 className="font-bold text-slate-200">PLATA</h3>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3">10 - 19 Puntos</p>
                                    <ul className="text-sm space-y-2 text-slate-300">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-slate-400" /> Beneficios Bronce
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-slate-400" /> Prioridad de Agenda
                                        </li>
                                    </ul>
                                </div>

                                {/* Gold */}
                                <div className={`p-4 rounded-xl border ${nivel === NivelFidelidad.ORO ? 'bg-yellow-500/20 border-yellow-500 ring-1 ring-yellow-500' : 'bg-slate-800 border-slate-700'} transition-all`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="h-2 w-2 rounded-full bg-yellow-400"></div>
                                        <h3 className="font-bold text-yellow-200">ORO</h3>
                                    </div>
                                    <p className="text-xs text-slate-400 mb-3">20+ Puntos</p>
                                    <ul className="text-sm space-y-2 text-slate-300">
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-yellow-400" /> Prioridad Total
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-yellow-400" /> 5% Descuento
                                        </li>
                                        <li className="flex items-center gap-2">
                                            <CheckCircle2 className="h-3 w-3 text-yellow-400" /> Atención VIP
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Historial de Puntos</CardTitle>
                            <CardDescription>Detalle de tus movimientos de puntos de fidelidad</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {puntosHistory.length > 0 ? (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Fecha</TableHead>
                                            <TableHead>Concepto</TableHead>
                                            <TableHead className="text-right">Puntos</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {puntosHistory.map((item) => (
                                            <TableRow key={item.$id}>
                                                <TableCell>{new Date(item.fecha).toLocaleDateString("es-CO")}</TableCell>
                                                <TableCell>
                                                    <div className="font-medium">{item.motivo}</div>
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Badge variant="outline" className="text-green-600 bg-green-50 border-green-200">
                                                        +{item.puntos} Pts
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            ) : (
                                <EmptyState
                                    variant="default"
                                    title="Sin movimientos aún"
                                    description="Completa tu primer servicio para comenzar a acumular puntos"
                                    className="border-0 shadow-none"
                                />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab: Addresses */}
                <TabsContent value="addresses" className="animate-in slide-in-from-bottom-2 duration-300">
                    {savedAddresses.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {savedAddresses.map((addr) => (
                                <Card key={addr.$id} className="group hover:border-primary/50 transition-colors">
                                    <CardHeader className="pb-3">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            {addr.tipo === 'apartamento' ? <Building2 className="w-4 h-4 text-blue-500" /> : <Home className="w-4 h-4 text-green-500" />}
                                            {addr.nombre}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-600 mb-1">{addr.direccion}</p>
                                        <p className="text-xs text-gray-400">{addr.ciudad}</p>
                                    </CardContent>
                                    <CardFooter className="pt-0 flex justify-between">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.push(`/agendar?direccion=${addr.$id}`)}
                                        >
                                            Usar
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                            onClick={() => handleDeleteAddressClick(addr.$id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
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
                            description="Tus direcciones se guardarán automáticamente al agendar un servicio"
                            action={{
                                label: "Agendar Servicio",
                                href: "/agendar"
                            }}
                        />
                    )}
                </TabsContent>
            </Tabs>

            {/* Delete Address Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Eliminar dirección</DialogTitle>
                        <DialogDescription>
                            ¿Estás seguro de que quieres eliminar esta dirección? Esta acción no se puede deshacer.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setDeleteDialogOpen(false)}
                            disabled={deletingAddress}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteAddress}
                            disabled={deletingAddress}
                        >
                            {deletingAddress ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                                    Eliminando...
                                </>
                            ) : (
                                "Eliminar"
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
