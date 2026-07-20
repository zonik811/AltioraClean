"use client";

import { ReportsSkeleton } from "@/components/admin/reports-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { toast } from "sonner";
import { useEffect, useState, useCallback } from "react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
} from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    obtenerResumenFinanciero,
    obtenerEstadisticasServicios,
    obtenerRendimientoPersonal,
    obtenerMejoresClientes,
    obtenerCartera,
    obtenerEstadoNomina,
    obtenerCrecimientoMensual,
    obtenerRetencionClientes,
    obtenerTasaCancelacion,
    obtenerDistribucionGeografica,
    obtenerComparativaAnual,
    obtenerRentabilidadPorServicio,
    obtenerMetricasFidelidad,
    obtenerTiempoServicio,
    obtenerEstacionalidad,
    obtenerTicketPromedio,
    obtenerConcentracionRiesgo,
    obtenerMetricasPlanes,
    type ReporteFinancieroMes,
    type EstadisticaServicio,
    type RendimientoEmpleado,
    type ClienteTop,
    type CarteraEstado,
    type EstadoNomina,
    type CrecimientoMensual,
    type RetencionClientes,
    type TasaCancelacion,
    type DistribucionGeografica,
    type ComparativaAnual,
    type RentabilidadServicio,
    type MetricasFidelidad,
    type TiempoServicio,
    type Estacionalidad,
    type TicketPromedio,
    type ConcentracionRiesgo,
    type MetricasPlanes,
} from "@/lib/actions/reportes";
import { formatearPrecio } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { tooltipContentStyle, labelStyle, itemStyle, GradientCard } from "@/components/admin/reportes/tooltip-styles";
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    Calendar,
    Wallet,
    AlertTriangle,
    RefreshCw,
    Trophy,
    MapPin,
    Users,
    XCircle,
    CheckCircle2,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    Award,
    Timer,
    PieChart as PieChartIcon,
    ShieldAlert,
    Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function ReportesPage() {
    const [finanzas, setFinanzas] = useState<ReporteFinancieroMes[]>([]);
    const [servicios, setServicios] = useState<EstadisticaServicio[]>([]);
    const [personal, setPersonal] = useState<RendimientoEmpleado[]>([]);
    const [clientes, setClientes] = useState<ClienteTop[]>([]);
    const [cartera, setCartera] = useState<CarteraEstado | null>(null);
    const [nomina, setNomina] = useState<EstadoNomina | null>(null);
    const [crecimiento, setCrecimiento] = useState<CrecimientoMensual[]>([]);
    const [retencion, setRetencion] = useState<RetencionClientes | null>(null);
    const [cancelacion, setCancelacion] = useState<TasaCancelacion | null>(null);
    const [geografia, setGeografia] = useState<DistribucionGeografica[]>([]);
    const [comparativa, setComparativa] = useState<ComparativaAnual[]>([]);
    const [rentabilidad, setRentabilidad] = useState<RentabilidadServicio[]>([]);
    const [fidelidad, setFidelidad] = useState<MetricasFidelidad | null>(null);
    const [tiempoServicio, setTiempoServicio] = useState<TiempoServicio[]>([]);
    const [estacionalidad, setEstacionalidad] = useState<Estacionalidad[]>([]);
    const [ticketPromedio, setTicketPromedio] = useState<TicketPromedio[]>([]);
    const [concentracion, setConcentracion] = useState<ConcentracionRiesgo | null>(null);
    const [metricasPlanes, setMetricasPlanes] = useState<MetricasPlanes | null>(null);

    const currentYear = new Date().getFullYear();
    const [selectedYear, setSelectedYear] = useState<string>(currentYear.toString());
    const [selectedMonth, setSelectedMonth] = useState<string>("all");
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const cargarDatos = useCallback(async (isRefresh = false) => {
        try {
            if (isRefresh) setRefreshing(true);
            else setLoading(true);

            const year = parseInt(selectedYear);
            let startDate: Date;
            let endDate: Date;

            if (selectedMonth === "all") {
                startDate = new Date(year, 0, 1);
                endDate = new Date(year, 11, 31, 23, 59, 59);
            } else {
                const month = parseInt(selectedMonth);
                startDate = new Date(year, month, 1);
                endDate = new Date(year, month + 1, 0, 23, 59, 59);
            }

            const [
                finanzasData,
                serviciosData,
                personalData,
                clientesData,
                carteraData,
                nominaData,
                crecimientoData,
                retencionData,
                cancelacionData,
                geografiaData,
                comparativaData,
                rentabilidadData,
                fidelidadData,
                tiempoData,
                estacionalidadData,
                ticketData,
                concentracionData,
            ] = await Promise.all([
                obtenerResumenFinanciero(year),
                obtenerEstadisticasServicios(startDate, endDate),
                obtenerRendimientoPersonal(startDate, endDate),
                obtenerMejoresClientes(startDate, endDate),
                obtenerCartera(startDate, endDate),
                obtenerEstadoNomina(startDate, endDate),
                obtenerCrecimientoMensual(year),
                obtenerRetencionClientes(startDate, endDate),
                obtenerTasaCancelacion(startDate, endDate),
                obtenerDistribucionGeografica(startDate, endDate),
                obtenerComparativaAnual(year),
                obtenerRentabilidadPorServicio(startDate, endDate),
                obtenerMetricasFidelidad(),
                obtenerTiempoServicio(startDate, endDate),
                obtenerEstacionalidad(year),
                obtenerTicketPromedio(year),
                obtenerConcentracionRiesgo(startDate, endDate),
            ]);

            setFinanzas(finanzasData);
            setServicios(serviciosData);
            setPersonal(personalData);
            setClientes(clientesData);
            setCartera(carteraData);
            setNomina(nominaData);
            setCrecimiento(crecimientoData);
            setRetencion(retencionData);
            setCancelacion(cancelacionData);
            setGeografia(geografiaData);
            setComparativa(comparativaData);
            setRentabilidad(rentabilidadData);
            setFidelidad(fidelidadData);
            setTiempoServicio(tiempoData);
            setEstacionalidad(estacionalidadData);
            setTicketPromedio(ticketData);
            setConcentracion(concentracionData);

            const planesData = await obtenerMetricasPlanes();
            setMetricasPlanes(planesData);
        } catch (error) {
            console.error("Error cargando reportes:", error);
            toast.error("No se pudieron cargar los reportes");
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [selectedYear, selectedMonth]);

    useEffect(() => {
        cargarDatos();
    }, [cargarDatos]);

    const totalIngresos = finanzas.reduce((acc, curr) => acc + curr.ingresos, 0);
    const totalGastos = finanzas.reduce((acc, curr) => acc + curr.gastos, 0);
    const beneficioNeto = totalIngresos - totalGastos;
    const margenNeto = totalIngresos > 0 ? (beneficioNeto / totalIngresos) * 100 : 0;

    // Generar años disponibles (desde 2024 hasta el año actual + 1)
    const yearsAvailable = Array.from(
        { length: currentYear - 2024 + 2 },
        (_, i) => (2024 + i).toString()
    ).reverse();

    const nominaPercent = nomina?.totalGenerado
        ? Math.round((nomina.totalPagado / nomina.totalGenerado) * 100)
        : 0;

    const hasData = finanzas.length > 0 || servicios.length > 0 || personal.length > 0 || clientes.length > 0 || geografia.length > 0;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 pb-20">
            {/* Hero Header con gradiente */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-primary text-white shadow-xl">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full blur-3xl translate-x-1/3 -translate-y-1/3"></div>
                    <div className="absolute bottom-0 left-1/3 w-72 h-72 bg-secondary rounded-full blur-3xl"></div>
                </div>

                <div className="relative z-10 p-6 md:p-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/20 shadow-lg">
                                <TrendingUp className="h-7 w-7 text-white" />
                            </div>
                            <div>
                                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Reportes Avanzados</h1>
                                <p className="text-sm text-slate-300 mt-0.5">Inteligencia de negocios y análisis detallado</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => cargarDatos(true)}
                                disabled={refreshing}
                                className="gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                                {refreshing ? "Actualizando..." : "Actualizar"}
                            </Button>

                            <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm p-1 rounded-lg border border-white/20">
                                <Calendar className="h-4 w-4 text-white/60 ml-2" />

                                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                    <SelectTrigger className="w-[130px] border-none shadow-none focus:ring-0 bg-transparent text-white text-sm">
                                        <SelectValue placeholder="Mes" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todo el Año</SelectItem>
                                        {months.map((m, i) => (
                                            <SelectItem key={i} value={i.toString()}>
                                                {m}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="w-px h-5 bg-white/20" />

                                <Select value={selectedYear} onValueChange={setSelectedYear}>
                                    <SelectTrigger className="w-[90px] border-none shadow-none focus:ring-0 bg-transparent text-white text-sm">
                                        <SelectValue placeholder="Año" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {yearsAvailable.map((y) => (
                                            <SelectItem key={y} value={y}>
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {loading ? (
                <ReportsSkeleton />
            ) : !hasData ? (
                <EmptyState
                    variant="reports"
                    title="Sin datos para reportar"
                    description={`No hay datos disponibles para ${selectedMonth === "all" ? selectedYear : `${months[parseInt(selectedMonth)]} ${selectedYear}`}. Intenta con otro periodo.`}
                    action={{
                        label: "Ver Todo el Año",
                        onClick: () => setSelectedMonth("all"),
                    }}
                    className="min-h-[400px]"
                />
            ) : (
                <>
                    {/* KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Cuentas por Cobrar */}
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "0ms" }}>
                            <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-orange-50 to-white">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl group-hover:bg-orange-500/10 transition-colors"></div>
                                <CardHeader className="pb-2 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                                            <AlertTriangle className="h-5 w-5 text-orange-600" />
                                        </div>
                                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Cobranza</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formatearPrecio(cartera?.totalPorCobrar || 0)}
                                    </div>
                                    <div className="flex justify-between items-end mt-2">
                                        <p className="text-xs text-gray-500">
                                            {cartera?.citasPendientesPago || 0} facturas
                                        </p>
                                        <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-medium">
                                            {cartera?.antiguedadPromedioDias || 0}d prom
                                        </span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Facturación */}
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "100ms" }}>
                            <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-blue-50 to-white">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:bg-blue-500/10 transition-colors"></div>
                                <CardHeader className="pb-2 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                            <DollarSign className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Ingresos</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formatearPrecio(totalIngresos)}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">
                                        {selectedMonth === "all" ? "Total anual" : months[parseInt(selectedMonth)]}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Nómina */}
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "200ms" }}>
                            <Card className="group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-gradient-to-br from-violet-50 to-white">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl group-hover:bg-violet-500/10 transition-colors"></div>
                                <CardHeader className="pb-2 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                                            <Wallet className="h-5 w-5 text-violet-600" />
                                        </div>
                                        <span className="text-[10px] font-bold text-violet-600 uppercase tracking-wider">Nómina</span>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className="text-2xl font-bold text-gray-900">
                                        {formatearPrecio(nomina?.totalGenerado || 0)}
                                    </div>
                                    <Progress
                                        value={nominaPercent}
                                        className="h-1.5 mt-2"
                                        indicatorClassName="bg-violet-500"
                                    />
                                    <p className="text-[10px] text-violet-600/80 mt-1 text-right">
                                        {nominaPercent}% pagado
                                    </p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Beneficio Neto */}
                        <div className="animate-in fade-in slide-in-from-bottom-3 duration-500" style={{ animationDelay: "300ms" }}>
                            <Card className={`group relative overflow-hidden border-0 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
                                beneficioNeto >= 0
                                    ? "bg-gradient-to-br from-emerald-50 to-white"
                                    : "bg-gradient-to-br from-rose-50 to-white"
                            }`}>
                                <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl transition-colors ${
                                    beneficioNeto >= 0
                                        ? "bg-emerald-500/5 group-hover:bg-emerald-500/10"
                                        : "bg-rose-500/5 group-hover:bg-rose-500/10"
                                }`}></div>
                                <CardHeader className="pb-2 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                            beneficioNeto >= 0 ? "bg-emerald-100" : "bg-rose-100"
                                        }`}>
                                            {beneficioNeto >= 0
                                                ? <TrendingUp className="h-5 w-5 text-emerald-600" />
                                                : <TrendingDown className="h-5 w-5 text-rose-600" />
                                            }
                                        </div>
                                        <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                            beneficioNeto >= 0 ? "text-emerald-600" : "text-rose-600"
                                        }`}>
                                            Beneficio
                                        </span>
                                    </div>
                                </CardHeader>
                                <CardContent className="relative z-10">
                                    <div className={`text-2xl font-bold ${beneficioNeto >= 0 ? "text-gray-900" : "text-rose-600"}`}>
                                        {beneficioNeto >= 0 ? "+" : ""}{formatearPrecio(beneficioNeto)}
                                    </div>
                                    <p className={`text-xs mt-2 ${beneficioNeto >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                        Margen: {margenNeto.toFixed(1)}%
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>

                    <Tabs defaultValue="overview" className="space-y-6">
                        <TabsList className="bg-white border border-gray-200 p-1.5 rounded-xl w-full overflow-x-auto justify-start gap-1 shadow-sm h-auto flex-wrap">
                            <TabsTrigger value="overview" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Resumen
                            </TabsTrigger>
                            <TabsTrigger value="growth" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Crecimiento
                            </TabsTrigger>
                            <TabsTrigger value="retention" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Retención
                            </TabsTrigger>
                            <TabsTrigger value="geography" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Geografía
                            </TabsTrigger>
                            <TabsTrigger value="profitability" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Rentabilidad
                            </TabsTrigger>
                            <TabsTrigger value="loyalty" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Fidelidad
                            </TabsTrigger>
                            <TabsTrigger value="efficiency" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Eficiencia
                            </TabsTrigger>
                            <TabsTrigger value="seasonality" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Estacionalidad
                            </TabsTrigger>
                            <TabsTrigger value="risk" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Riesgo
                            </TabsTrigger>
                            <TabsTrigger value="clients" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Clientes
                            </TabsTrigger>
                            <TabsTrigger value="services" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Servicios
                            </TabsTrigger>
                            <TabsTrigger value="team" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Equipo
                            </TabsTrigger>
                            <TabsTrigger value="planes" className="rounded-lg px-3 py-2 text-sm font-medium data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all whitespace-nowrap">
                                Planes
                            </TabsTrigger>
                        </TabsList>

                        {/* Tab: Resumen General */}
                        <TabsContent value="overview" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                {/* Flujo de Caja */}
                                <div className="lg:col-span-2">
                                    <GradientCard accent="blue">
                                        <CardHeader className="relative z-10 border-b border-white/10">
                                            <CardTitle className="text-white flex items-center gap-2">
                                                <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                                                    <DollarSign className="h-4 w-4 text-blue-400" />
                                                </div>
                                                Flujo de Caja
                                            </CardTitle>
                                            <CardDescription className="text-slate-400">Ingresos vs Gastos Mensuales</CardDescription>
                                        </CardHeader>
                                        <CardContent className="h-[400px] relative z-10">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={finanzas}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                                                    <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis
                                                        stroke="rgba(255,255,255,0.5)"
                                                        fontSize={12}
                                                        tickLine={false}
                                                        axisLine={false}
                                                        tickFormatter={(v) => `$${v / 1000}k`}
                                                    />
                                                    <Tooltip
                                                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                                    contentStyle={tooltipContentStyle}
                                                    labelStyle={labelStyle}
                                                    itemStyle={itemStyle}
                                                        formatter={(value: unknown) => [formatearPrecio(value as number), ""]}
                                                    />
                                                    <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                                                    <defs>
                                                        <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                                                        </linearGradient>
                                                        <linearGradient id="gradGastos" x1="0" y1="0" x2="0" y2="1">
                                                            <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#be123c" stopOpacity={0.8} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Bar dataKey="ingresos" name="Ingresos" fill="url(#gradIngresos)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                                    <Bar dataKey="gastos" name="Gastos" fill="url(#gradGastos)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                                </BarChart>
                                                </ResponsiveContainer>
                                            </CardContent>
                                    </GradientCard>
                                </div>

                                {/* Sidebar: Top Clientes + Distribución */}
                                <div className="space-y-6">
                                    <Card>
                                        <CardHeader>
                                            <CardTitle className="text-base flex items-center gap-2">
                                                <Trophy className="h-4 w-4 text-yellow-500" /> Top 3 Clientes
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {clientes.length > 0 ? (
                                                clientes.slice(0, 3).map((cliente, i) => (
                                                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                                                        <div
                                                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${
                                                                i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-400" : "bg-orange-400"
                                                            }`}
                                                        >
                                                            {i + 1}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-medium truncate">{cliente.nombre}</p>
                                                            <p className="text-xs text-gray-500">{cliente.serviciosContratados} servicios</p>
                                                        </div>
                                                        <div className="font-semibold text-sm">{formatearPrecio(cliente.totalGastado)}</div>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-gray-400 text-center py-6">Sin datos</p>
                                            )}
                                        </CardContent>
                                    </Card>

                                    <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                                        <div className="absolute top-0 right-0 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl"></div>
                                        <CardHeader className="relative z-10 border-b border-white/10">
                                            <CardTitle className="text-white text-base flex items-center gap-2">
                                                <div className="w-8 h-8 bg-violet-500/20 rounded-lg flex items-center justify-center">
                                                    <TrendingUp className="h-4 w-4 text-violet-400" />
                                                </div>
                                                Distribución
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="h-[200px] relative z-10">
                                            {servicios.length > 0 ? (
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <PieChart>
                                                        <Pie
                                                            data={servicios as unknown as Array<Record<string, unknown>>}
                                                            cx="50%"
                                                            cy="50%"
                                                            innerRadius={40}
                                                            outerRadius={70}
                                                            paddingAngle={3}
                                                            dataKey="cantidad"
                                                        >
                                                            {servicios.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={entry.fill} strokeWidth={0} />
                                                            ))}
                                                        </Pie>
                                                        <Tooltip
                                                            contentStyle={{
                                                                borderRadius: "12px",
                                                                border: "1px solid rgba(255,255,255,0.1)",
                                                                background: "rgba(15,23,42,0.95)",
                                                                boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                                                color: "#fff",
                                                            }}
                                                            labelStyle={{ color: "#94a3b8" }}
                                                            itemStyle={{ color: "#fff" }}
                                                            formatter={(value: unknown) => [`${value} servicios`, "Cantidad"]}
                                                        />
                                                    </PieChart>
                                                </ResponsiveContainer>
                                            ) : (
                                                <p className="text-sm text-slate-400 text-center pt-20">Sin datos</p>
                                            )}
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        </TabsContent>

                        {/* Tab: Crecimiento */}
                        <TabsContent value="growth" className="space-y-6">
                            {/* KPIs de crecimiento */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            Crecimiento Promedio
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-2xl font-bold flex items-center gap-2 ${
                                            crecimiento.filter(c => c.crecimiento > 0).length >= crecimiento.filter(c => c.crecimiento < 0).length
                                                ? "text-emerald-600" : "text-rose-600"
                                        }`}>
                                            {(() => {
                                                const conDatos = crecimiento.filter(c => c.ingresosAnterior > 0);
                                                if (conDatos.length === 0) return "—";
                                                const avg = conDatos.reduce((sum, c) => sum + c.porcentajeCrecimiento, 0) / conDatos.length;
                                                return `${avg >= 0 ? "+" : ""}${avg.toFixed(1)}%`;
                                            })()}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Mes a mes en {selectedYear}</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            Mejor Mes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-emerald-600">
                                            {(() => {
                                                const mejor = crecimiento.filter(c => c.ingresosAnterior > 0).sort((a, b) => b.porcentajeCrecimiento - a.porcentajeCrecimiento)[0];
                                                return mejor ? `${mejor.mes} (+${mejor.porcentajeCrecimiento}%)` : "—";
                                            })()}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Mayor crecimiento vs mes anterior</p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                                            Peor Mes
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold text-rose-600">
                                            {(() => {
                                                const peor = crecimiento.filter(c => c.ingresosAnterior > 0).sort((a, b) => a.porcentajeCrecimiento - b.porcentajeCrecimiento)[0];
                                                return peor ? `${peor.mes} (${peor.porcentajeCrecimiento}%)` : "—";
                                            })()}
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">Mayor caída vs mes anterior</p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Gráfico de crecimiento */}
                            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>
                                <CardHeader className="relative z-10 border-b border-white/10">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                                            <TrendingUp className="h-4 w-4 text-emerald-400" />
                                        </div>
                                        Crecimiento Mensual
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">Ingresos del mes actual vs mes anterior</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px] relative z-10">
                                    {crecimiento.some(c => c.ingresosActual > 0 || c.ingresosAnterior > 0) ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={crecimiento}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                                                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                                                <Tooltip
                                                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                                    contentStyle={{
                                                        borderRadius: "12px",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                        background: "rgba(15,23,42,0.95)",
                                                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                                        color: "#fff",
                                                    }}
                                                    labelStyle={{ color: "#94a3b8" }}
                                                    itemStyle={{ color: "#fff" }}
                                                    formatter={(value: unknown, name: string | undefined) => [formatearPrecio(value as number), name === "ingresosActual" ? `${selectedYear}` : `${parseInt(selectedYear) - 1}`]}
                                                />
                                                <Legend wrapperStyle={{ color: "#cbd5e1" }} formatter={(value) => value === "ingresosActual" ? selectedYear : `${parseInt(selectedYear) - 1}`} />
                                                <defs>
                                                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                                                    </linearGradient>
                                                    <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#64748b" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#475569" stopOpacity={0.8} />
                                                    </linearGradient>
                                                </defs>
                                                <Bar dataKey="ingresosAnterior" name="ingresosAnterior" fill="url(#gradAnterior)" radius={[6, 6, 0, 0]} maxBarSize={30} />
                                                <Bar dataKey="ingresosActual" name="ingresosActual" fill="url(#gradActual)" radius={[6, 6, 0, 0]} maxBarSize={30} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState variant="reports" title="Sin datos de crecimiento" description="No hay datos suficientes para calcular crecimiento." className="border-0 shadow-none" />
                                    )}
                                </CardContent>
                            </Card>

                            {/* Tabla detallada */}
                            <Card>
                                <CardHeader>
                                    <CardTitle>Detalle Mensual</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-1">
                                        <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 border-b mb-2 px-2">
                                            <div className="col-span-2">Mes</div>
                                            <div className="col-span-3 text-right">Actual</div>
                                            <div className="col-span-3 text-right">Anterior</div>
                                            <div className="col-span-2 text-right">Diferencia</div>
                                            <div className="col-span-2 text-right">%</div>
                                        </div>
                                        {crecimiento.map((c) => (
                                            <div key={c.mes} className="grid grid-cols-12 items-center hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                                <div className="col-span-2 font-medium">{c.mes}</div>
                                                <div className="col-span-3 text-right font-semibold">{formatearPrecio(c.ingresosActual)}</div>
                                                <div className="col-span-3 text-right text-gray-500">{formatearPrecio(c.ingresosAnterior)}</div>
                                                <div className={`col-span-2 text-right font-medium ${c.crecimiento >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                    {c.crecimiento >= 0 ? "+" : ""}{formatearPrecio(c.crecimiento)}
                                                </div>
                                                <div className={`col-span-2 text-right flex items-center justify-end gap-1 ${c.porcentajeCrecimiento >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                    {c.porcentajeCrecimiento >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                                    {c.porcentajeCrecimiento >= 0 ? "+" : ""}{c.porcentajeCrecimiento}%
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: Retención y Cancelación */}
                        <TabsContent value="retention" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Retención de Clientes */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <Users className="h-5 w-5 text-primary" /> Retención de Clientes
                                        </CardTitle>
                                        <CardDescription>Clientes nuevos vs recurrentes</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {retencion && retencion.totalClientes > 0 ? (
                                            <>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="p-4 bg-blue-50 rounded-lg">
                                                        <p className="text-xs text-blue-600 font-medium uppercase">Nuevos</p>
                                                        <p className="text-2xl font-bold text-blue-700">{retencion.clientesNuevos}</p>
                                                    </div>
                                                    <div className="p-4 bg-emerald-50 rounded-lg">
                                                        <p className="text-xs text-emerald-600 font-medium uppercase">Recurrentes</p>
                                                        <p className="text-2xl font-bold text-emerald-700">{retencion.clientesRecurrentes}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Tasa de Retención</span>
                                                        <span className="font-bold text-emerald-600">{retencion.tasaRetencion}%</span>
                                                    </div>
                                                    <Progress value={retencion.tasaRetencion} className="h-2" indicatorClassName="bg-emerald-500" />
                                                </div>
                                                <div className="pt-2 text-sm text-gray-500">
                                                    Total de clientes únicos: <span className="font-bold text-gray-900">{retencion.totalClientes}</span>
                                                </div>
                                            </>
                                        ) : (
                                            <EmptyState variant="reports" title="Sin datos de retención" description="No hay clientes con servicios completados en este periodo." className="border-0 shadow-none" />
                                        )}
                                    </CardContent>
                                </Card>

                                {/* Tasa de Cancelación */}
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2">
                                            <XCircle className="h-5 w-5 text-rose-500" /> Tasa de Cancelación
                                        </CardTitle>
                                        <CardDescription>Citas canceladas vs completadas</CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {cancelacion && cancelacion.totalCitas > 0 ? (
                                            <>
                                                <div className="grid grid-cols-3 gap-3">
                                                    <div className="p-3 bg-emerald-50 rounded-lg text-center">
                                                        <CheckCircle2 className="h-5 w-5 text-emerald-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-emerald-700">{cancelacion.citasCompletadas}</p>
                                                        <p className="text-[10px] text-emerald-600">Completadas</p>
                                                    </div>
                                                    <div className="p-3 bg-amber-50 rounded-lg text-center">
                                                        <Clock className="h-5 w-5 text-amber-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-amber-700">{cancelacion.citasPendientes}</p>
                                                        <p className="text-[10px] text-amber-600">Pendientes</p>
                                                    </div>
                                                    <div className="p-3 bg-rose-50 rounded-lg text-center">
                                                        <XCircle className="h-5 w-5 text-rose-600 mx-auto mb-1" />
                                                        <p className="text-lg font-bold text-rose-700">{cancelacion.citasCanceladas}</p>
                                                        <p className="text-[10px] text-rose-600">Canceladas</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Tasa de Cancelación</span>
                                                        <span className="font-bold text-rose-600">{cancelacion.tasaCancelacion}%</span>
                                                    </div>
                                                    <Progress value={cancelacion.tasaCancelacion} className="h-2" indicatorClassName="bg-rose-500" />
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-500">Tasa de Completación</span>
                                                        <span className="font-bold text-emerald-600">{cancelacion.tasaCompletacion}%</span>
                                                    </div>
                                                    <Progress value={cancelacion.tasaCompletacion} className="h-2" indicatorClassName="bg-emerald-500" />
                                                </div>
                                            </>
                                        ) : (
                                            <EmptyState variant="reports" title="Sin datos de cancelación" description="No hay citas en este periodo." className="border-0 shadow-none" />
                                        )}
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Comparativa Anual */}
                            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl"></div>
                                <CardHeader className="relative z-10 border-b border-white/10">
                                    <CardTitle className="text-white">Comparativa Anual</CardTitle>
                                    <CardDescription className="text-slate-400">{selectedYear} vs {parseInt(selectedYear) - 1}</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[350px] relative z-10">
                                    {comparativa.some(c => c.ingresosActual > 0 || c.ingresosAnterior > 0) ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={comparativa}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                                                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                                                <Tooltip
                                                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                                    contentStyle={{
                                                        borderRadius: "12px",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                        background: "rgba(15,23,42,0.95)",
                                                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                                        color: "#fff",
                                                    }}
                                                    labelStyle={{ color: "#94a3b8" }}
                                                    itemStyle={{ color: "#fff" }}
                                                    formatter={(value: unknown, name: string | undefined) => [formatearPrecio(value as number), name === "ingresosActual" ? selectedYear : `${parseInt(selectedYear) - 1}`]}
                                                />
                                                <Legend wrapperStyle={{ color: "#cbd5e1" }} formatter={(value) => value === "ingresosActual" ? selectedYear : `${parseInt(selectedYear) - 1}`} />
                                                <defs>
                                                    <linearGradient id="gradCompActual" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#0284c7" stopOpacity={0.8} />
                                                    </linearGradient>
                                                    <linearGradient id="gradCompAnterior" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#cbd5e1" stopOpacity={0.8} />
                                                        <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.6} />
                                                    </linearGradient>
                                                </defs>
                                                <Bar dataKey="ingresosAnterior" name="ingresosAnterior" fill="url(#gradCompAnterior)" radius={[6, 6, 0, 0]} maxBarSize={30} />
                                                <Bar dataKey="ingresosActual" name="ingresosActual" fill="url(#gradCompActual)" radius={[6, 6, 0, 0]} maxBarSize={30} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState variant="reports" title="Sin datos comparativos" description="No hay datos suficientes para comparar años." className="border-0 shadow-none" />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: Geografía */}
                        <TabsContent value="geography" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-sky-500/10 rounded-full blur-3xl"></div>
                                    <CardHeader className="relative z-10 border-b border-white/10">
                                        <CardTitle className="text-white flex items-center gap-2">
                                            <div className="w-8 h-8 bg-sky-500/20 rounded-lg flex items-center justify-center">
                                                <MapPin className="h-4 w-4 text-sky-400" />
                                            </div>
                                            Distribución Geográfica
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">Demanda de servicios por ciudad</CardDescription>
                                    </CardHeader>
                                    <CardContent className="h-[350px] relative z-10">
                                        {geografia.length > 0 ? (
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={geografia} layout="vertical" margin={{ left: 20, right: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.08)" />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="ciudad" type="category" width={80} tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }} />
                                                    <Tooltip
                                                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                                        contentStyle={{
                                                            borderRadius: "12px",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            background: "rgba(15,23,42,0.95)",
                                                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                                            color: "#fff",
                                                        }}
                                                        labelStyle={{ color: "#94a3b8" }}
                                                        itemStyle={{ color: "#fff" }}
                                                        formatter={(value: unknown) => [`${value} citas`, "Total"]}
                                                    />
                                                    <defs>
                                                        <linearGradient id="gradGeo" x1="0" y1="0" x2="1" y2="0">
                                                            <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#0284c7" stopOpacity={0.7} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Bar dataKey="totalCitas" fill="url(#gradGeo)" radius={[0, 6, 6, 0]} barSize={30} />
                                                </BarChart>
                                            </ResponsiveContainer>
                                        ) : (
                                            <EmptyState variant="reports" title="Sin datos geográficos" description="No hay citas en este periodo." className="border-0 shadow-none" />
                                        )}
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle>Ingresos por Ciudad</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {geografia.length > 0 ? (
                                            <div className="space-y-3">
                                                {geografia.map((g) => (
                                                    <div key={g.ciudad} className="space-y-1">
                                                        <div className="flex justify-between text-sm">
                                                            <span className="font-medium text-gray-700 flex items-center gap-2">
                                                                <MapPin className="h-3.5 w-3.5 text-gray-400" />
                                                                {g.ciudad}
                                                            </span>
                                                            <span className="font-bold text-gray-900">{formatearPrecio(g.ingresos)}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Progress value={g.porcentaje} className="h-2" indicatorClassName="bg-primary" />
                                                            <span className="text-xs text-gray-500 w-10">{g.porcentaje}%</span>
                                                        </div>
                                                        <p className="text-xs text-gray-400">{g.totalCitas} citas</p>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <EmptyState variant="reports" title="Sin datos" description="No hay ciudades con datos." className="border-0 shadow-none" />
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Tab: Rentabilidad */}
                        <TabsContent value="profitability" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <DollarSign className="h-5 w-5 text-emerald-500" /> Rentabilidad por Servicio
                                    </CardTitle>
                                    <CardDescription>Ingresos vs costo de nómina por tipo de propiedad</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {rentabilidad.length > 0 ? (
                                        <div className="space-y-4">
                                            {rentabilidad.map((r) => (
                                                <div key={r.tipoPropiedad} className="p-4 border border-gray-100 rounded-xl space-y-3">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="font-bold text-gray-900 capitalize">{r.tipoPropiedad}</h4>
                                                        <Badge variant={r.margen >= 30 ? "default" : r.margen >= 0 ? "secondary" : "destructive"} className="text-xs">
                                                            Margen: {r.margen}%
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Ingresos</p>
                                                            <p className="font-semibold text-emerald-600">{formatearPrecio(r.ingresos)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Costo Nómina</p>
                                                            <p className="font-semibold text-rose-600">{formatearPrecio(r.costoNomina)}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Beneficio</p>
                                                            <p className={`font-semibold ${r.beneficio >= 0 ? "text-emerald-600" : "text-rose-600"}`}>
                                                                {r.beneficio >= 0 ? "+" : ""}{formatearPrecio(r.beneficio)}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Citas</p>
                                                            <p className="font-semibold text-gray-900">{r.totalCitas}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Progress value={Math.max(r.margen, 0)} className="h-2" indicatorClassName={r.margen >= 30 ? "bg-emerald-500" : r.margen >= 0 ? "bg-amber-500" : "bg-rose-500"} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState variant="reports" title="Sin datos de rentabilidad" description="No hay servicios completados en este periodo." className="border-0 shadow-none" />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: Fidelidad */}
                        <TabsContent value="loyalty" className="space-y-6">
                            {fidelidad && fidelidad.totalClientes > 0 ? (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <Card className="bg-gradient-to-br from-orange-50 to-white border-orange-100">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-bold text-orange-600 uppercase flex items-center gap-1">
                                                    <Award className="h-3 w-3" /> Bronce
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold text-gray-900">{fidelidad.bronce}</p>
                                                <p className="text-xs text-gray-500">{fidelidad.totalClientes > 0 ? Math.round((fidelidad.bronce / fidelidad.totalClientes) * 100) : 0}% del total</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-bold text-slate-600 uppercase flex items-center gap-1">
                                                    <Award className="h-3 w-3" /> Plata
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold text-gray-900">{fidelidad.plata}</p>
                                                <p className="text-xs text-gray-500">{fidelidad.totalClientes > 0 ? Math.round((fidelidad.plata / fidelidad.totalClientes) * 100) : 0}% del total</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-br from-yellow-50 to-white border-yellow-200">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-bold text-yellow-600 uppercase flex items-center gap-1">
                                                    <Award className="h-3 w-3" /> Oro
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold text-gray-900">{fidelidad.oro}</p>
                                                <p className="text-xs text-gray-500">{fidelidad.totalClientes > 0 ? Math.round((fidelidad.oro / fidelidad.totalClientes) * 100) : 0}% del total</p>
                                            </CardContent>
                                        </Card>
                                        <Card className="bg-gradient-to-br from-primary/5 to-white border-primary/20">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-xs font-bold text-primary uppercase flex items-center gap-1">
                                                    <Star className="h-3 w-3" /> Puntos
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-3xl font-bold text-gray-900">{fidelidad.puntosOtorgados}</p>
                                                <p className="text-xs text-gray-500">Total otorgados</p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Distribución de Niveles</CardTitle>
                                            <CardDescription>Programa de fidelidad de clientes</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            {[
                                                { label: "Bronce", value: fidelidad.bronce, color: "bg-orange-500" },
                                                { label: "Plata", value: fidelidad.plata, color: "bg-slate-400" },
                                                { label: "Oro", value: fidelidad.oro, color: "bg-yellow-400" },
                                            ].map((nivel) => (
                                                <div key={nivel.label} className="space-y-1">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-gray-600">{nivel.label}</span>
                                                        <span className="font-medium">{nivel.value} clientes</span>
                                                    </div>
                                                    <Progress
                                                        value={fidelidad.totalClientes > 0 ? (nivel.value / fidelidad.totalClientes) * 100 : 0}
                                                        className="h-3"
                                                        indicatorClassName={nivel.color}
                                                    />
                                                </div>
                                            ))}
                                            <div className="pt-4 border-t flex justify-between items-center">
                                                <span className="text-sm text-gray-500">Ticket promedio de clientes recurrentes</span>
                                                <span className="font-bold text-primary text-lg">{formatearPrecio(fidelidad.ticketPromedioFiel)}</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </>
                            ) : (
                                <EmptyState variant="reports" title="Sin datos de fidelidad" description="No hay clientes registrados." className="min-h-[300px]" />
                            )}
                        </TabsContent>

                        {/* Tab: Eficiencia */}
                        <TabsContent value="efficiency" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Timer className="h-5 w-5 text-primary" /> Tiempo de Servicio
                                    </CardTitle>
                                    <CardDescription>Duración estimada vs real por tipo de propiedad</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {tiempoServicio.length > 0 ? (
                                        <div className="space-y-4">
                                            {tiempoServicio.map((t) => (
                                                <div key={t.tipoPropiedad} className="p-4 border border-gray-100 rounded-xl">
                                                    <div className="flex items-center justify-between mb-3">
                                                        <h4 className="font-bold text-gray-900 capitalize">{t.tipoPropiedad}</h4>
                                                        <Badge variant={t.eficiencia >= 90 ? "default" : t.eficiencia >= 70 ? "secondary" : "destructive"} className="text-xs">
                                                            {t.eficiencia}% eficiencia
                                                        </Badge>
                                                    </div>
                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm mb-3">
                                                        <div>
                                                            <p className="text-xs text-gray-500">Estimado</p>
                                                            <p className="font-semibold">{t.duracionEstimada} h</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Real</p>
                                                            <p className="font-semibold">{t.duracionReal} h</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Diferencia</p>
                                                            <p className={`font-semibold ${t.diferencia > 0 ? "text-rose-600" : "text-emerald-600"}`}>
                                                                {t.diferencia > 0 ? "+" : ""}{t.diferencia} h
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <p className="text-xs text-gray-500">Citas</p>
                                                            <p className="font-semibold text-gray-900">{t.totalCitas}</p>
                                                        </div>
                                                    </div>
                                                    <Progress value={t.eficiencia} className="h-2" indicatorClassName={t.eficiencia >= 90 ? "bg-emerald-500" : t.eficiencia >= 70 ? "bg-amber-500" : "bg-rose-500"} />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState variant="reports" title="Sin datos de eficiencia" description="No hay servicios completados con datos de duración." className="border-0 shadow-none" />
                                    )}
                                </CardContent>
                            </Card>

                            {/* Ticket Promedio */}
                            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl"></div>
                                <CardHeader className="relative z-10 border-b border-white/10">
                                    <CardTitle className="text-white">Ticket Promedio Mensual</CardTitle>
                                    <CardDescription className="text-slate-400">Valor promedio por servicio completado</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[300px] relative z-10">
                                    {ticketPromedio.some(t => t.ticketPromedio > 0) ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={ticketPromedio}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                                                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v / 1000}k`} />
                                                <Tooltip
                                                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                                    contentStyle={{
                                                        borderRadius: "12px",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                        background: "rgba(15,23,42,0.95)",
                                                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                                        color: "#fff",
                                                    }}
                                                    labelStyle={{ color: "#94a3b8" }}
                                                    itemStyle={{ color: "#fff" }}
                                                    formatter={(value: unknown) => [formatearPrecio(value as number), "Ticket Promedio"]}
                                                />
                                                <defs>
                                                    <linearGradient id="gradTicket" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#6d28d9" stopOpacity={0.8} />
                                                    </linearGradient>
                                                </defs>
                                                <Bar dataKey="ticketPromedio" fill="url(#gradTicket)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState variant="reports" title="Sin datos" description="No hay servicios completados este año." className="border-0 shadow-none" />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: Estacionalidad */}
                        <TabsContent value="seasonality" className="space-y-6">
                            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl"></div>
                                <CardHeader className="relative z-10 border-b border-white/10">
                                    <CardTitle className="text-white flex items-center gap-2">
                                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                                            <Calendar className="h-4 w-4 text-primary" />
                                        </div>
                                        Estacionalidad de Demanda
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">Identifica meses pico y valle</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px] relative z-10">
                                    {estacionalidad.some(e => e.totalCitas > 0) ? (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <BarChart data={estacionalidad}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                                                <XAxis dataKey="mes" stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={12} tickLine={false} axisLine={false} />
                                                <Tooltip
                                                    cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                                    contentStyle={{
                                                        borderRadius: "12px",
                                                        border: "1px solid rgba(255,255,255,0.1)",
                                                        background: "rgba(15,23,42,0.95)",
                                                        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                                        color: "#fff",
                                                    }}
                                                    labelStyle={{ color: "#94a3b8" }}
                                                    itemStyle={{ color: "#fff" }}
                                                    formatter={(value: unknown, _name: string | undefined, props: { payload?: Estacionalidad }) => [
                                                        `${value} citas`,
                                                        props?.payload?.esPico ? "Pico" : props?.payload?.esValle ? "Valle" : "Normal",
                                                    ]}
                                                />
                                                <defs>
                                                    <linearGradient id="gradPico" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#047857" stopOpacity={0.8} />
                                                    </linearGradient>
                                                    <linearGradient id="gradValle" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#f43f5e" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#be123c" stopOpacity={0.8} />
                                                    </linearGradient>
                                                    <linearGradient id="gradNormal" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={1} />
                                                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity={0.8} />
                                                    </linearGradient>
                                                </defs>
                                                <Bar dataKey="totalCitas" radius={[6, 6, 0, 0]} maxBarSize={50}>
                                                    {estacionalidad.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={entry.esPico ? "url(#gradPico)" : entry.esValle ? "url(#gradValle)" : "url(#gradNormal)"}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                    ) : (
                                        <EmptyState variant="reports" title="Sin datos de estacionalidad" description="No hay citas en este año." className="border-0 shadow-none" />
                                    )}
                                </CardContent>
                            </Card>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card className="bg-gradient-to-br from-emerald-50 to-white border-emerald-200">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2 text-emerald-700">
                                            <TrendingUp className="h-4 w-4" /> Mes Pico
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const pico = estacionalidad.find(e => e.esPico);
                                            return pico ? (
                                                <>
                                                    <p className="text-3xl font-bold text-emerald-600">{pico.mes}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{pico.totalCitas} citas • {formatearPrecio(pico.ingresos)}</p>
                                                </>
                                            ) : <p className="text-gray-400">Sin datos</p>;
                                        })()}
                                    </CardContent>
                                </Card>
                                <Card className="bg-gradient-to-br from-rose-50 to-white border-rose-200">
                                    <CardHeader>
                                        <CardTitle className="text-base flex items-center gap-2 text-rose-700">
                                            <TrendingDown className="h-4 w-4" /> Mes Valle
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {(() => {
                                            const valle = estacionalidad.find(e => e.esValle);
                                            return valle ? (
                                                <>
                                                    <p className="text-3xl font-bold text-rose-600">{valle.mes}</p>
                                                    <p className="text-sm text-gray-600 mt-1">{valle.totalCitas} citas • {formatearPrecio(valle.ingresos)}</p>
                                                </>
                                            ) : <p className="text-gray-400">Sin datos</p>;
                                        })()}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Tab: Riesgo */}
                        <TabsContent value="risk" className="space-y-6">
                            {concentracion && concentracion.totalIngresos > 0 ? (
                                <>
                                    <Card className={concentracion.nivelRiesgo === "Alto" ? "border-rose-200 bg-rose-50/30" : concentracion.nivelRiesgo === "Medio" ? "border-amber-200 bg-amber-50/30" : "border-emerald-200 bg-emerald-50/30"}>
                                        <CardHeader>
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="flex items-center gap-2">
                                                    <ShieldAlert className={`h-5 w-5 ${concentracion.nivelRiesgo === "Alto" ? "text-rose-500" : concentracion.nivelRiesgo === "Medio" ? "text-amber-500" : "text-emerald-500"}`} />
                                                    Concentración de Riesgo
                                                </CardTitle>
                                                <Badge variant={concentracion.nivelRiesgo === "Alto" ? "destructive" : concentracion.nivelRiesgo === "Medio" ? "secondary" : "default"}>
                                                    Riesgo {concentracion.nivelRiesgo}
                                                </Badge>
                                            </div>
                                            <CardDescription>% de ingresos que dependen del top 5 clientes</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-6">
                                            <div className="text-center py-6">
                                                <p className={`text-6xl font-bold ${concentracion.nivelRiesgo === "Alto" ? "text-rose-600" : concentracion.nivelRiesgo === "Medio" ? "text-amber-600" : "text-emerald-600"}`}>
                                                    {concentracion.porcentajeConcentracion}%
                                                </p>
                                                <p className="text-sm text-gray-500 mt-2">
                                                    de tus ingresos vienen de 5 clientes
                                                </p>
                                            </div>
                                            <Progress
                                                value={concentracion.porcentajeConcentracion}
                                                className="h-3"
                                                indicatorClassName={concentracion.nivelRiesgo === "Alto" ? "bg-rose-500" : concentracion.nivelRiesgo === "Medio" ? "bg-amber-500" : "bg-emerald-500"}
                                            />
                                            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                                                <div>
                                                    <p className="text-xs text-gray-500">Top 5 clientes generan</p>
                                                    <p className="text-xl font-bold text-gray-900">{formatearPrecio(concentracion.top5Ingresos)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Ingresos totales</p>
                                                    <p className="text-xl font-bold text-gray-900">{formatearPrecio(concentracion.totalIngresos)}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card>
                                        <CardHeader>
                                            <CardTitle>Top 5 Clientes - Dependencia</CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3">
                                            {concentracion.clientesTop.map((cliente, i) => (
                                                <div key={i} className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-xs ${i === 0 ? "bg-yellow-400" : i === 1 ? "bg-gray-400" : "bg-orange-400"}`}>
                                                        {i + 1}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-medium truncate">{cliente.nombre}</p>
                                                        <Progress value={cliente.porcentaje} className="h-1.5 mt-1" indicatorClassName="bg-primary" />
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-semibold text-sm">{formatearPrecio(cliente.totalGastado)}</p>
                                                        <p className="text-xs text-gray-500">{cliente.porcentaje}%</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </CardContent>
                                    </Card>

                                    {concentracion.nivelRiesgo === "Alto" && (
                                        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-3">
                                            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="font-medium text-rose-900">Riesgo Alto de Concentración</p>
                                                <p className="text-sm text-rose-700 mt-1">
                                                    Más del 70% de tus ingresos dependen de 5 clientes. Si uno se va, tu negocio se verá muy afectado.
                                                    Considera estrategias para diversificar tu base de clientes.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <EmptyState variant="reports" title="Sin datos de riesgo" description="No hay ingresos en este periodo." className="min-h-[300px]" />
                            )}
                        </TabsContent>

                        {/* Tab: Mejores Clientes */}
                        <TabsContent value="clients" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Mejores Clientes</CardTitle>
                                    <CardDescription>Clientes que más ingresos generan al negocio</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {clientes.length > 0 ? (
                                        <div className="space-y-1">
                                            <div className="grid grid-cols-12 text-xs font-semibold text-gray-500 uppercase tracking-wider pb-3 border-b mb-2 px-2">
                                                <div className="col-span-1">#</div>
                                                <div className="col-span-5">Cliente</div>
                                                <div className="col-span-3 text-right">Servicios</div>
                                                <div className="col-span-3 text-right">Total Facturado</div>
                                            </div>
                                            {clientes.map((cliente, i) => (
                                                <div
                                                    key={i}
                                                    className="grid grid-cols-12 items-center hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                                >
                                                    <div className="col-span-1 font-bold text-gray-400">#{i + 1}</div>
                                                    <div className="col-span-5 font-medium text-gray-900 flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">
                                                            {cliente.nombre.substring(0, 2).toUpperCase()}
                                                        </div>
                                                        {cliente.nombre}
                                                    </div>
                                                    <div className="col-span-3 text-right text-gray-600">
                                                        {cliente.serviciosContratados}
                                                    </div>
                                                    <div className="col-span-3 text-right font-bold text-gray-900">
                                                        {formatearPrecio(cliente.totalGastado)}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            variant="reports"
                                            title="Sin datos de clientes"
                                            description="No hay clientes con servicios completados en este periodo."
                                            className="border-0 shadow-none"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: Desempeño Equipo */}
                        <TabsContent value="team" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Productividad del Equipo</CardTitle>
                                    <CardDescription>
                                        Rendimiento basado en servicios completados e ingresos generados
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {personal.length > 0 ? (
                                        <div className="space-y-4">
                                            {personal.map((emp) => (
                                                <div
                                                    key={emp.empleadoId}
                                                    className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <Avatar>
                                                            <AvatarFallback className="bg-slate-100 text-slate-600 font-bold">
                                                                {emp.nombre.substring(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <div className="font-bold text-gray-900">{emp.nombre}</div>
                                                            <div className="text-xs text-gray-500">
                                                                {emp.serviciosCompletados} servicios completados
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right space-y-1">
                                                        <div className="text-sm font-semibold text-emerald-600">
                                                            {formatearPrecio(emp.totalGenerado)}
                                                        </div>
                                                        {emp.serviciosCompletados > 0 && (
                                                            <Badge variant="outline" className="text-[10px]">
                                                                {formatearPrecio(emp.totalGenerado / emp.serviciosCompletados)}/servicio
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <EmptyState
                                            variant="reports"
                                            title="Sin datos del equipo"
                                            description="No hay servicios completados por el equipo en este periodo."
                                            className="border-0 shadow-none"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Tab: Planes */}
                        <TabsContent value="planes" className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="border-0 shadow-md bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                                    <CardContent className="p-6">
                                        <p className="text-sm text-blue-100">Planes Activos</p>
                                        <p className="text-3xl font-bold">{metricasPlanes?.planesActivos ?? 0}</p>
                                        <p className="text-xs text-blue-100">de {metricasPlanes?.totalPlanes ?? 0} totales</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-md bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
                                    <CardContent className="p-6">
                                        <p className="text-sm text-emerald-100">Clientes Suscritos</p>
                                        <p className="text-3xl font-bold">{metricasPlanes?.clientesConPlan ?? 0}</p>
                                        <p className="text-xs text-emerald-100">con plan activo</p>
                                    </CardContent>
                                </Card>
                                <Card className="border-0 shadow-md bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                                    <CardContent className="p-6">
                                        <p className="text-sm text-purple-100">Ingresos Recurrentes</p>
                                        <p className="text-3xl font-bold">{metricasPlanes ? `${metricasPlanes.porcentajeRecurrente}%` : "0%"}</p>
                                        <p className="text-xs text-purple-100">del total de ingresos</p>
                                    </CardContent>
                                </Card>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Ingresos: Recurrente vs Puntual</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600">Recurrente</span>
                                                    <span className="font-bold text-emerald-600">{formatearPrecio(metricasPlanes?.ingresosRecurrentes ?? 0)}</span>
                                                </div>
                                                <Progress value={metricasPlanes?.porcentajeRecurrente ?? 0} className="h-2.5 bg-gray-100" indicatorClassName="bg-emerald-500" />
                                            </div>
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span className="text-gray-600">Puntual</span>
                                                    <span className="font-bold text-blue-600">{formatearPrecio(metricasPlanes?.ingresosPuntuales ?? 0)}</span>
                                                </div>
                                                <Progress value={metricasPlanes ? 100 - metricasPlanes.porcentajeRecurrente : 0} className="h-2.5 bg-gray-100" indicatorClassName="bg-blue-500" />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="text-base">Desglose por Plan</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        {metricasPlanes?.planes && metricasPlanes.planes.length > 0 ? (
                                            <div className="space-y-3">
                                                {metricasPlanes.planes.map((p) => (
                                                    <div key={p.nombre} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <p className="font-medium text-gray-900 text-sm">{p.nombre}</p>
                                                            <p className="text-xs text-gray-500">{p.clientes} clientes</p>
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-900">{formatearPrecio(p.ingresosMensuales)}/mes</span>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-sm text-gray-500 text-center py-8">No hay planes configurados</p>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        {/* Tab: Servicios */}
                        <TabsContent value="services" className="space-y-6">
                            <Card className="relative overflow-hidden border-0 shadow-xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-pink-500/10 rounded-full blur-3xl"></div>
                                <CardHeader className="relative z-10 border-b border-white/10">
                                    <CardTitle className="text-white">Análisis de Servicios</CardTitle>
                                    <CardDescription className="text-slate-400">Distribución de servicios por tipo de propiedad</CardDescription>
                                </CardHeader>
                                <CardContent className="h-[400px] relative z-10">
                                    {servicios.length > 0 ? (
                                        <div className="h-full">
                                            <ResponsiveContainer width="100%" height="100%">
                                                <BarChart data={servicios} layout="vertical" margin={{ left: 20, right: 20 }}>
                                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="rgba(255,255,255,0.08)" />
                                                    <XAxis type="number" hide />
                                                    <YAxis dataKey="nombre" type="category" width={100} tick={{ fontSize: 12, fill: "rgba(255,255,255,0.6)" }} />
                                                    <Tooltip
                                                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                                                        contentStyle={{
                                                            borderRadius: "12px",
                                                            border: "1px solid rgba(255,255,255,0.1)",
                                                            background: "rgba(15,23,42,0.95)",
                                                            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
                                                            color: "#fff",
                                                        }}
                                                        labelStyle={{ color: "#94a3b8" }}
                                                        itemStyle={{ color: "#fff" }}
                                                        formatter={(value: unknown) => [`${value} servicios`, "Cantidad"]}
                                                    />
                                                    <defs>
                                                        <linearGradient id="gradServicios" x1="0" y1="0" x2="1" y2="0">
                                                            <stop offset="0%" stopColor="#ec4899" stopOpacity={1} />
                                                            <stop offset="100%" stopColor="#db2777" stopOpacity={0.7} />
                                                        </linearGradient>
                                                    </defs>
                                                    <Bar dataKey="cantidad" fill="url(#gradServicios)" radius={[0, 6, 6, 0]} barSize={30}>
                                                        {servicios.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    ) : (
                                        <EmptyState
                                            variant="reports"
                                            title="Sin datos de servicios"
                                            description="No hay servicios completados en este periodo."
                                            className="border-0 shadow-none min-h-[300px]"
                                        />
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </>
            )}
        </div>
    );
}
