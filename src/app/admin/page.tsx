"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardSkeleton } from "@/components/admin/skeletons";
import { StatsCard } from "@/components/admin/StatsCard";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import {
    Calendar,
    Users,
    DollarSign,
    CheckCircle,
    Clock,
    Plus,
    FileText,
    Wallet,
    ArrowRight,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    AlertCircle,
    Sparkles,
    MapPin,
    Phone,
    Repeat,
} from "lucide-react";
import { obtenerCitasHoy, obtenerCitasSemana, obtenerCitas } from "@/lib/actions/citas";
import { obtenerTodosLosEmpleados } from "@/lib/actions/empleados";
import { obtenerTodosLosGastos } from "@/lib/actions/gastos";
import { contarPlanesActivos, contarClientesConPlan } from "@/lib/actions/planes";
import { formatearPrecio } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import Link from "next/link";
import type { Cita, EstadisticasDashboard } from "@/types";
import { format, differenceInDays } from "date-fns";
import { es } from "date-fns/locale";

export default function AdminDashboard() {
    const [stats, setStats] = useState<EstadisticasDashboard>({
        citasHoy: 0,
        citasEstaSemana: 0,
        citasEsteMes: 0,
        empleadosActivos: 0,
        ingresosMes: 0,
        pagosEmpleadosPendientes: 0,
        serviciosCompletados: 0,
        clientesNuevos: 0,
    });
    const [citasProximas, setCitasProximas] = useState<Cita[]>([]);
    const [citasRecientes, setCitasRecientes] = useState<Cita[]>([]);
    const [gastosMes, setGastosMes] = useState(0);
    const [planesActivos, setPlanesActivos] = useState(0);
    const [clientesConPlan, setClientesConPlan] = useState(0);
    const [proximasRecurrentes, setProximasRecurrentes] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [greeting, setGreeting] = useState("");
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const cargarDashboard = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const inicioMes = new Date();
            inicioMes.setDate(1);
            inicioMes.setHours(0, 0, 0, 0);
            const finMes = new Date(inicioMes.getFullYear(), inicioMes.getMonth() + 1, 0);

            const [citasHoy, citasSemana, empleados, citasMes, gastosData] = await Promise.all([
                obtenerCitasHoy(),
                obtenerCitasSemana(),
                obtenerTodosLosEmpleados({ activo: true }),
                obtenerCitas({ fechaInicio: inicioMes.toISOString().split("T")[0] }),
                obtenerTodosLosGastos({
                    fechaInicio: inicioMes.toISOString().split("T")[0],
                    fechaFin: finMes.toISOString().split("T")[0],
                }),
            ]);

            const ingresosMes = citasMes
                .filter((c) => c.estado === "completada" && c.pagadoPorCliente)
                .reduce((sum, c) => sum + c.precioAcordado, 0);

            const totalGastos = gastosData.reduce((sum, g) => sum + g.monto, 0);
            const serviciosCompletados = citasMes.filter((c) => c.estado === "completada").length;

            // Citas no pagadas del mes
            const citasPendientesPago = citasMes.filter(
                (c) => c.estado === "completada" && !c.pagadoPorCliente
            );
            const totalPendienteCobro = citasPendientesPago.reduce(
                (sum, c) => sum + c.precioAcordado, 0
            );

            setStats({
                citasHoy: citasHoy.length,
                citasEstaSemana: citasSemana.length,
                citasEsteMes: citasMes.length,
                empleadosActivos: empleados.length,
                ingresosMes,
                pagosEmpleadosPendientes: totalPendienteCobro,
                serviciosCompletados,
                clientesNuevos: 0,
            });

            setGastosMes(totalGastos);

            const [pActivos, cConPlan] = await Promise.all([
                contarPlanesActivos(),
                contarClientesConPlan(),
            ]);
            setPlanesActivos(pActivos);
            setClientesConPlan(cConPlan);

            const proximas = citasSemana
                .filter((c) => ["pendiente", "confirmada", "en-progreso"].includes(c.estado))
                .sort(
                    (a, b) =>
                        new Date(a.fechaCita + "T" + a.horaCita).getTime() -
                        new Date(b.fechaCita + "T" + b.horaCita).getTime()
                )
                .slice(0, 5);

            setCitasProximas(proximas);

        const recurrentes = citasSemana
            .filter((c) => c.origen === "plan_recurrente" && ["pendiente", "confirmada"].includes(c.estado))
            .sort((a, b) =>
                new Date(a.fechaCita + "T" + a.horaCita).getTime() -
                new Date(b.fechaCita + "T" + b.horaCita).getTime()
            )
            .slice(0, 5);
        setProximasRecurrentes(recurrentes);

            // Últimas citas completadas
            const recientes = citasMes
                .filter((c) => c.estado === "completada")
                .sort(
                    (a, b) =>
                        new Date(b.fechaCita).getTime() - new Date(a.fechaCita).getTime()
                )
                .slice(0, 4);

            setCitasRecientes(recientes);
            setLastUpdate(new Date());
        } catch (error) {
            console.error("Error cargando dashboard:", error);
            toast.error("No se pudieron cargar los datos del dashboard");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) setGreeting("Buenos días");
        else if (hour < 18) setGreeting("Buenas tardes");
        else setGreeting("Buenas noches");

        cargarDashboard();
    }, [cargarDashboard]);

    if (loading) {
        return <DashboardSkeleton />;
    }

    const netIncome = stats.ingresosMes - gastosMes;
    const gastosPercent = stats.ingresosMes > 0 ? Math.min((gastosMes / stats.ingresosMes) * 100, 100) : 0;
    const margenPercent = stats.ingresosMes > 0 ? Math.round((netIncome / stats.ingresosMes) * 100) : 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-10">
            {/* Hero Header */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-primary text-white shadow-xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-secondary rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                <Sparkles className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <p className="text-sm text-slate-300 mb-0.5">
                                    {format(new Date(), "EEEE, d 'de' MMMM, yyyy", { locale: es })}
                                </p>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                                    {greeting}, Admin
                                </h1>
                                <p className="text-sm text-slate-300 mt-0.5 flex items-center gap-2">
                                    Resumen de tu operación hoy
                                    {lastUpdate && (
                                        <span className="text-xs text-slate-400">
                                            • {format(lastUpdate, "h:mm a")}
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cargarDashboard(true)}
                                disabled={refreshing}
                                className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                                {refreshing ? "Actualizando..." : "Actualizar"}
                            </Button>
                            <Link href="/admin/citas/nueva">
                                <Button className="shadow-lg gap-2">
                                    <Plus className="h-4 w-4" /> Nueva Cita
                                </Button>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "0ms" }}>
                    <StatsCard
                        title="Citas Hoy"
                        value={stats.citasHoy}
                        description={stats.citasHoy === 0 ? "Sin citas hoy" : "Servicios programados"}
                        icon={Calendar}
                        variant="primary"
                    />
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "100ms" }}>
                    <StatsCard
                        title="Ingresos (Mes)"
                        value={formatearPrecio(stats.ingresosMes)}
                        description={`${stats.serviciosCompletados} servicios completados`}
                        icon={DollarSign}
                        variant="default"
                    />
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "200ms" }}>
                    <StatsCard
                        title="Pendiente por Cobrar"
                        value={formatearPrecio(stats.pagosEmpleadosPendientes)}
                        description={stats.pagosEmpleadosPendientes > 0 ? "Requiere atención" : "Todo al día"}
                        icon={Wallet}
                        variant={stats.pagosEmpleadosPendientes > 0 ? "warning" : "secondary"}
                    />
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "300ms" }}>
                    <StatsCard
                        title="Equipo Activo"
                        value={stats.empleadosActivos}
                        description="Disponibles hoy"
                        icon={Users}
                        variant="secondary"
                    />
                </div>
            </div>

            {/* Planes Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "400ms" }}>
                    <StatsCard
                        title="Planes Activos"
                        value={planesActivos}
                        description={clientesConPlan > 0 ? `${clientesConPlan} clientes suscritos` : "Sin clientes aún"}
                        icon={Repeat}
                        variant="primary"
                    />
                </div>
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500" style={{ animationDelay: "500ms" }}>
                    <StatsCard
                        title="Próximas Visitas Recurrentes"
                        value={proximasRecurrentes.length}
                        description={proximasRecurrentes.length > 0 ? "Agendadas para esta semana" : "Sin visitas programadas"}
                        icon={Calendar}
                        variant="secondary"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Left: Appointments */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Próximas Citas */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/10 rounded-full blur-3xl"></div>
                        <CardHeader className="relative z-10 border-b border-white/10 bg-white/5 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg text-white">
                                    <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                        <Clock className="h-4 w-4 text-primary" />
                                    </div>
                                    Próximas Citas
                                </CardTitle>
                                <Link href="/admin/citas">
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary hover:text-primary/80 hover:bg-white/10">
                                        Ver Todo <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 relative z-10">
                            {citasProximas.length === 0 ? (
                                <EmptyState
                                    variant="appointments"
                                    title="Sin citas próximas"
                                    description="No hay citas pendientes o confirmadas para los próximos días."
                                    action={{ label: "Nueva Cita", href: "/admin/citas/nueva" }}
                                    className="border-0 shadow-none"
                                />
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {citasProximas.map((cita) => {
                                        const diasRestantes = differenceInDays(
                                            new Date(cita.fechaCita),
                                            new Date()
                                        );
                                        const esHoy = diasRestantes === 0;
                                        const esManana = diasRestantes === 1;

                                        return (
                                            <Link
                                                key={cita.$id}
                                                href={`/admin/citas/${cita.$id}`}
                                                className="group flex items-center gap-4 p-4 hover:bg-white/5 transition-colors block"
                                            >
                                                {/* Date Box */}
                                                <div className={`flex flex-col items-center justify-center h-14 w-14 rounded-xl border shrink-0 ${
                                                    esHoy
                                                        ? "bg-primary/20 border-primary/40"
                                                        : "bg-white/5 border-white/10"
                                                }`}>
                                                    <span className={`text-xs font-bold uppercase ${
                                                        esHoy ? "text-primary" : "text-slate-400"
                                                    }`}>
                                                        {esHoy ? "Hoy" : esManana ? "Mañ" : format(new Date(cita.fechaCita), "MMM", { locale: es })}
                                                    </span>
                                                    <span className={`text-xl font-bold leading-none ${
                                                        esHoy ? "text-primary" : "text-white"
                                                    }`}>
                                                        {format(new Date(cita.fechaCita), "d")}
                                                    </span>
                                                </div>

                                                {/* Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h4 className="font-semibold text-white truncate pr-2">
                                                            {cita.clienteNombre}
                                                        </h4>
                                                        <Badge
                                                            variant="outline"
                                                            className={`text-[10px] px-2 py-0.5 uppercase tracking-wider font-bold border-0 ${
                                                                cita.estado === "confirmada"
                                                                    ? "bg-blue-500/20 text-blue-300"
                                                                    : cita.estado === "pendiente"
                                                                      ? "bg-amber-500/20 text-amber-300"
                                                                      : "bg-white/10 text-slate-400"
                                                            }`}
                                                        >
                                                            {cita.estado}
                                                        </Badge>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                                        <div className="flex items-center gap-1">
                                                            <Clock className="h-3.5 w-3.5" />
                                                            {cita.horaCita}
                                                        </div>
                                                        <div className="flex items-center gap-1 truncate">
                                                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                                                            <span className="truncate max-w-[150px]">{cita.ciudad}</span>
                                                        </div>
                                                        <span className="font-medium text-slate-300">
                                                            {formatearPrecio(cita.precioAcordado)}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Arrow */}
                                                <ArrowRight className="h-4 w-4 text-slate-600 group-hover:text-primary transition-colors shrink-0" />
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Próximas Visitas Recurrentes */}
                    {proximasRecurrentes.length > 0 && (
                        <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-emerald-900 via-emerald-800 to-emerald-900 text-white">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl"></div>
                            <CardHeader className="relative z-10 border-b border-white/10 bg-white/5 pb-4">
                                <CardTitle className="flex items-center gap-2 text-lg text-white">
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                        <Repeat className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    Próximas Visitas de Planes
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0 relative z-10">
                                <div className="divide-y divide-white/5">
                                    {proximasRecurrentes.map((cita) => {
                                        const diasRestantes = differenceInDays(
                                            new Date(cita.fechaCita),
                                            new Date()
                                        );
                                        const esHoy = diasRestantes === 0;
                                        return (
                                            <div
                                                key={cita.$id}
                                                className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors"
                                            >
                                                <div className={`flex flex-col items-center justify-center h-14 w-14 rounded-xl border shrink-0 ${
                                                    esHoy
                                                        ? "bg-emerald-500/20 border-emerald-500/40"
                                                        : "bg-white/5 border-white/10"
                                                }`}>
                                                    <span className="text-xs font-bold uppercase text-emerald-300">
                                                        {esHoy ? "Hoy" : format(new Date(cita.fechaCita), "MMM", { locale: es })}
                                                    </span>
                                                    <span className="text-xl font-bold leading-none text-white">
                                                        {format(new Date(cita.fechaCita), "d")}
                                                    </span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-semibold text-white truncate">
                                                        {cita.clienteNombre}
                                                    </h4>
                                                    <p className="text-xs text-emerald-300">
                                                        {cita.horaCita} • {cita.ciudad}
                                                    </p>
                                                </div>
                                                <span className="text-sm font-medium text-emerald-300 shrink-0">
                                                    {formatearPrecio(cita.precioAcordado)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Actividad Reciente */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"></div>
                        <CardHeader className="relative z-10 border-b border-white/10 bg-white/5 pb-4">
                            <div className="flex items-center justify-between">
                                <CardTitle className="flex items-center gap-2 text-lg text-white">
                                    <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                        <CheckCircle className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    Actividad Reciente
                                </CardTitle>
                                <Link href="/admin/citas">
                                    <Button variant="ghost" size="sm" className="text-xs font-semibold text-primary hover:text-primary/80 hover:bg-white/10">
                                        Ver Todo <ArrowRight className="h-3 w-3 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0 relative z-10">
                            {citasRecientes.length === 0 ? (
                                <div className="text-center py-10 px-4">
                                    <p className="text-sm text-slate-400">
                                        Aún no hay servicios completados este mes.
                                    </p>
                                </div>
                            ) : (
                                <div className="divide-y divide-white/5">
                                    {citasRecientes.map((cita) => (
                                        <Link
                                            key={cita.$id}
                                            href={`/admin/citas/${cita.$id}`}
                                            className="group flex items-center gap-4 p-4 hover:bg-white/5 transition-colors block"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                                                <CheckCircle className="h-5 w-5 text-emerald-400" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-medium text-white truncate">
                                                    {cita.clienteNombre}
                                                </h4>
                                                <p className="text-xs text-slate-400">
                                                    {formatearPrecio(cita.precioAcordado)} •{" "}
                                                    {format(new Date(cita.fechaCita), "d 'de' MMMM", { locale: es })}
                                                </p>
                                            </div>
                                            {cita.pagadoPorCliente ? (
                                                <Badge className="bg-emerald-500/20 text-emerald-300 border-0 text-[10px]">
                                                    Pagado
                                                </Badge>
                                            ) : (
                                                <Badge className="bg-amber-500/20 text-amber-300 border-0 text-[10px]">
                                                    Pendiente
                                                </Badge>
                                            )}
                                        </Link>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right: Quick Actions & Financial */}
                <div className="space-y-6">
                    {/* Quick Actions */}
                    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
                        <CardHeader className="relative z-10 border-b border-white/10 pb-3">
                            <CardTitle className="text-base font-semibold text-white">Accesos Rápidos</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3 relative z-10">
                            {[
                                { href: "/admin/citas/nueva", label: "Nueva Cita", icon: Plus, color: "bg-blue-500/20 text-blue-400" },
                                { href: "/admin/citas", label: "Agenda", icon: Calendar, color: "bg-indigo-500/20 text-indigo-400" },
                                { href: "/admin/pagos/empleados", label: "Pagos", icon: Wallet, color: "bg-emerald-500/20 text-emerald-400" },
                                { href: "/admin/gastos", label: "Reg. Gasto", icon: FileText, color: "bg-rose-500/20 text-rose-400" },
                                { href: "/admin/personal", label: "Equipo", icon: Users, color: "bg-violet-500/20 text-violet-400" },
                                { href: "/admin/reportes", label: "Reportes", icon: TrendingUp, color: "bg-amber-500/20 text-amber-400" },
                                { href: "/admin/planes", label: "Planes", icon: Repeat, color: "bg-sky-500/20 text-sky-400" },
                            ].map((item) => (
                                <Link key={item.href} href={item.href} className="block">
                                    <Button
                                        variant="outline"
                                        className="w-full h-auto flex-col gap-2 py-4 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20 transition-all"
                                    >
                                        <div className={`p-2 rounded-full ${item.color}`}>
                                            <item.icon className="h-5 w-5" />
                                        </div>
                                        <span className="text-xs font-medium">{item.label}</span>
                                    </Button>
                                </Link>
                            ))}
                        </CardContent>
                    </Card>

                    {/* Financial Summary */}
                    <Card className={`relative overflow-hidden border-0 shadow-xl text-white ${
                        netIncome >= 0
                            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-900/30"
                            : "bg-gradient-to-br from-slate-900 via-slate-800 to-rose-900/30"
                    }`}>
                        <div className={`absolute top-0 right-0 w-48 h-48 rounded-full blur-3xl ${
                            netIncome >= 0 ? "bg-emerald-500/10" : "bg-rose-500/10"
                        }`}></div>
                        <CardHeader className="relative z-10 border-b border-white/10 pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-base font-semibold text-white">Resumen del Mes</CardTitle>
                                <Badge
                                    variant="outline"
                                    className={`text-[10px] border-0 ${
                                        margenPercent >= 20
                                            ? "bg-emerald-500/20 text-emerald-300"
                                            : margenPercent >= 0
                                              ? "bg-amber-500/20 text-amber-300"
                                              : "bg-rose-500/20 text-rose-300"
                                    }`}
                                >
                                    Margen: {margenPercent}%
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4 relative z-10">
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-1">
                                        <TrendingUp className="h-3.5 w-3.5 text-emerald-400" /> Ingresos
                                    </span>
                                    <span className="font-medium text-emerald-400">{formatearPrecio(stats.ingresosMes)}</span>
                                </div>
                                <Progress value={100} className="h-1.5 bg-white/10" indicatorClassName="bg-emerald-500" />
                            </div>
                            <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 flex items-center gap-1">
                                        <TrendingDown className="h-3.5 w-3.5 text-rose-400" /> Gastos
                                    </span>
                                    <span className="font-medium text-rose-400">{formatearPrecio(gastosMes)}</span>
                                </div>
                                <Progress value={gastosPercent} className="h-1.5 bg-white/10" indicatorClassName="bg-rose-500" />
                            </div>

                            <div className="pt-4 mt-2 border-t border-white/10 flex justify-between items-center">
                                <span className="font-semibold text-slate-300">Balance Neto</span>
                                <span
                                    className={`text-lg font-bold ${netIncome >= 0 ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                    {netIncome >= 0 ? "+" : ""}
                                    {formatearPrecio(netIncome)}
                                </span>
                            </div>

                            {stats.pagosEmpleadosPendientes > 0 && (
                                <div className="pt-3 mt-2 border-t border-white/10">
                                    <div className="flex items-start gap-2 p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                        <AlertCircle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-xs font-medium text-amber-200">
                                                {formatearPrecio(stats.pagosEmpleadosPendientes)} pendientes de cobro
                                            </p>
                                            <Link href="/admin/pagos/clientes" className="text-xs text-amber-400 hover:underline">
                                                Ver detalles →
                                            </Link>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
