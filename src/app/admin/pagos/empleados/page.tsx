"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
    DollarSign,
    Calendar as CalendarIcon,
    Plus,
    Search,
    User,
    Wallet,
    CheckCircle2,
    X,
    AlertCircle,
    Filter,
    ArrowUpRight,
    ArrowDownLeft,
    MoreHorizontal,
    Trash2
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { obtenerPagosEmpleado, registrarPago, eliminarPago, type Pago } from "@/lib/actions/pagos";
import { obtenerTodosLosEmpleados, obtenerEstadisticasEmpleado } from "@/lib/actions/empleados";
import type { Empleado, EstadisticasEmpleado } from "@/types";
import { formatearPrecio, formatearFecha } from "@/lib/utils";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

const COLORS = ['#10B981', '#3b82f6', '#f97316', '#eab308', '#8b5cf6', '#ef4444'];

export default function PagosEmpleadosPage() {
    const router = useRouter();
    const [pagos, setPagos] = useState<Pago[]>([]);
    const [filteredPagos, setFilteredPagos] = useState<Pago[]>([]);
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedEmpleadoInfo, setSelectedEmpleadoInfo] = useState<EstadisticasEmpleado | null>(null);
    const [stats, setStats] = useState({
        totalPagado: 0,
        pagosCount: 0,
        promedioPago: 0
    });

    // Filtros
    const [filtros, setFiltros] = useState({
        empleadoId: "todos",
        mes: (new Date().getMonth() + 1).toString(),
        anio: new Date().getFullYear().toString(),
        search: ""
    });

    const [nuevoPago, setNuevoPago] = useState({
        empleadoId: "",
        monto: 0,
        concepto: "servicio",
        metodoPago: "transferencia",
        periodo: new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
        fechaPago: new Date().toISOString().split("T")[0],
        notas: ""
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [filtros, pagos]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const empleadosData = await obtenerTodosLosEmpleados();
            setEmpleados(empleadosData);

            const allPagosPromises = empleadosData.map(emp => obtenerPagosEmpleado(emp.$id));
            const allPagosResults = await Promise.all(allPagosPromises);
            const allPagos = allPagosResults.flat().sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());

            setPagos(allPagos);
        } catch (error) {
            console.error("Error cargando datos:", error);
            toast.error("Error al cargar los datos");
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let resultado = [...pagos];

        // Filtro por Empleado
        if (filtros.empleadoId !== "todos") {
            resultado = resultado.filter(p => p.empleadoId === filtros.empleadoId);
        }

        // Filtro por Fecha (Mes/Año)
        if (filtros.mes && filtros.anio) {
            resultado = resultado.filter(p => {
                const fecha = new Date(p.fechaPago);
                const mesPago = fecha.getMonth() + 1;
                const anioPago = fecha.getFullYear();
                return mesPago.toString() === filtros.mes && anioPago.toString() === filtros.anio;
            });
        }

        // Búsqueda global
        if (filtros.search) {
            const searchLower = filtros.search.toLowerCase();
            resultado = resultado.filter(p =>
                p.concepto.toLowerCase().includes(searchLower) ||
                p.notas?.toLowerCase().includes(searchLower)
            );
        }

        setFilteredPagos(resultado);

        const total = resultado.reduce((sum, p) => sum + p.monto, 0);
        setStats({
            totalPagado: total,
            pagosCount: resultado.length,
            promedioPago: resultado.length > 0 ? total / resultado.length : 0
        });
    };

    const handleEmpleadoChange = async (empleadoId: string) => {
        setNuevoPago({ ...nuevoPago, empleadoId });
        if (empleadoId) {
            try {
                const estadisticas = await obtenerEstadisticasEmpleado(empleadoId);
                setSelectedEmpleadoInfo(estadisticas);
                if (estadisticas.pendientePorPagar > 0) {
                    setNuevoPago(prev => ({ ...prev, empleadoId, monto: estadisticas.pendientePorPagar }));
                }
            } catch (error) {
                console.error("Error obteniendo estadísticas del empleado:", error);
            }
        } else {
            setSelectedEmpleadoInfo(null);
        }
    };

    const handleRegistrarPago = async () => {
        if (!nuevoPago.empleadoId || nuevoPago.monto <= 0) return;

        try {
            const result = await registrarPago(nuevoPago);
            if (result.success) {
                toast.success("Pago registrado correctamente");
                setShowDialog(false);
                setNuevoPago({
                    empleadoId: "",
                    monto: 0,
                    concepto: "servicio",
                    metodoPago: "transferencia",
                    periodo: new Date().toLocaleDateString("es-ES", { month: "long", year: "numeric" }),
                    fechaPago: new Date().toISOString().split("T")[0],
                    notas: ""
                });
                setSelectedEmpleadoInfo(null);
                cargarDatos();
            } else {
                toast.error(result.error || "Error al registrar pago");
            }
        } catch (error) {
            console.error("Error registrando pago:", error);
            toast.error("Error al registrar pago");
        }
    };

    const handleEliminarPago = async (pagoId: string) => {
        if (confirm("¿Estás seguro de eliminar este pago? Se recalculará el saldo pendiente del empleado.")) {
            try {
                setLoading(true);
                await eliminarPago(pagoId);
                toast.success("Pago eliminado correctamente");
                await cargarDatos();
            } catch (error) {
                console.error("Error eliminando pago:", error);
                toast.error("Error al eliminar el pago");
            } finally {
                setLoading(false);
            }
        }
    };

    const chartData = empleados.map(emp => {
        const pagosEmpleadoEnPeriodo = filteredPagos.filter(p => p.empleadoId === emp.$id);
        const total = pagosEmpleadoEnPeriodo.reduce((sum, p) => sum + p.monto, 0);
        return {
            name: `${emp.nombre.split(' ')[0]} ${emp.apellido.split(' ')[0]}`,
            monto: total
        };
    })
        .filter(item => item.monto > 0)
        .sort((a, b) => b.monto - a.monto)
        .slice(0, 10);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pagos a Empleados</h1>
                    <p className="text-gray-500 mt-1">Gestión de nómina y pagos por servicios</p>
                </div>
                <Button
                    onClick={() => setShowDialog(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 transition-all hover:scale-105"
                >
                    <Plus className="mr-2 h-4 w-4" /> Registrar Pago
                </Button>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6 lg:col-span-1">
                    <Card className="border-none shadow-md bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 p-8 bg-white/10 rounded-full blur-2xl"></div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-emerald-100 font-medium text-sm flex items-center">
                                <Wallet className="mr-2 h-4 w-4" /> Total Pagado
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold">{formatearPrecio(stats.totalPagado)}</div>
                            <p className="text-emerald-100/80 text-sm mt-1">
                                En el periodo seleccionado
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-gray-500 font-medium text-sm">Resumen del Periodo</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Transacciones</span>
                                <span className="text-sm font-bold text-gray-900">{stats.pagosCount}</span>
                            </div>
                            <div className="h-px bg-gray-100"></div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Promedio</span>
                                <span className="text-sm font-bold text-gray-900">{formatearPrecio(stats.promedioPago)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2 border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-gray-800">Pagos por Empleado</CardTitle>
                        <CardDescription>Distribución de nómina en este periodo</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="name"
                                        type="category"
                                        width={100}
                                        tick={{ fill: '#6B7280', fontSize: 12 }}
                                        axisLine={false}
                                        tickLine={false}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#F3F4F6' }}
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Bar dataKey="monto" radius={[0, 4, 4, 0]} barSize={24}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500 w-full md:w-auto">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filtrar:</span>
                </div>

                <div className="flex gap-2 w-full md:w-auto">
                    <select
                        value={filtros.mes}
                        onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
                        className="h-9 px-3 bg-gray-50 border-gray-200 border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none flex-1 md:flex-none"
                    >
                        {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                            <option key={i} value={(i + 1).toString()}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={filtros.anio}
                        onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
                        className="h-9 px-3 bg-gray-50 border-gray-200 border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none flex-1 md:flex-none"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y.toString()}>{y}</option>
                        ))}
                    </select>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

                <div className="relative flex-1 w-full">
                    <User className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <select
                        value={filtros.empleadoId}
                        onChange={(e) => setFiltros({ ...filtros, empleadoId: e.target.value })}
                        className="w-full h-9 pl-9 pr-3 bg-gray-50 border-gray-200 border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none appearance-none"
                    >
                        <option value="todos">Todos los empleados</option>
                        {empleados.map(emp => (
                            <option key={emp.$id} value={emp.$id}>{emp.nombre} {emp.apellido}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Table Section */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600 pl-6">Empleado</TableHead>
                                <TableHead className="font-semibold text-gray-600">Concepto</TableHead>
                                <TableHead className="font-semibold text-gray-600">Fecha y Periodo</TableHead>
                                <TableHead className="font-semibold text-gray-600">Método</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600">Monto</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500 mx-auto mb-2"></div>
                                        Cargando nómina...
                                    </TableCell>
                                </TableRow>
                            ) : filteredPagos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                        <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                            <Wallet className="h-8 w-8 text-gray-300" />
                                        </div>
                                        <p className="font-medium text-gray-900">No hay pagos encontrados</p>
                                        <p className="text-sm mt-1">Ajusta los filtros para ver más resultados</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPagos.map((pago) => {
                                    const empleado = empleados.find(e => e.$id === pago.empleadoId);
                                    return (
                                        <TableRow
                                            key={pago.$id}
                                            className="hover:bg-gray-50/50 transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/admin/pagos/empleados/${pago.$id}`)}
                                        >
                                            <TableCell className="pl-6">
                                                <div className="flex items-center space-x-3">
                                                    <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs ring-2 ring-white shadow-sm">
                                                        {empleado ? `${empleado.nombre[0]}${empleado.apellido[0]}` : 'EM'}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">
                                                            {empleado ? `${empleado.nombre} ${empleado.apellido}` : 'Empleado Desconocido'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">ID: ...{pago.empleadoId.slice(-4)}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize font-normal bg-gray-50">
                                                    {pago.concepto.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-700">{formatearFecha(pago.fechaPago)}</span>
                                                    <span className="text-xs text-gray-500">{pago.periodo}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="text-sm text-gray-600 capitalize flex items-center gap-1.5">
                                                    {pago.metodoPago === 'transferencia' ? <ArrowUpRight className="h-3 w-3" /> :
                                                        pago.metodoPago === 'efectivo' ? <Wallet className="h-3 w-3" /> :
                                                            <ArrowDownLeft className="h-3 w-3" />}
                                                    {pago.metodoPago}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right font-bold text-gray-900">
                                                {formatearPrecio(pago.monto)}
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 group-hover:text-gray-600" onClick={(e) => e.stopPropagation()}>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                                                        <DropdownMenuItem className="text-red-600 focus:text-red-600" onClick={() => handleEliminarPago(pago.$id)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Eliminar Pago
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Create Dialog */}
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Registrar Pago</DialogTitle>
                        <DialogDescription>
                            Registra un nuevo pago para un empleado. Asegúrate de verificar el monto y el concepto.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <Label>Empleado</Label>
                                <select
                                    value={nuevoPago.empleadoId}
                                    onChange={(e) => handleEmpleadoChange(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="">Seleccionar Empleado...</option>
                                    {empleados.map((emp) => (
                                        <option key={emp.$id} value={emp.$id}>
                                            {emp.nombre} {emp.apellido}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {selectedEmpleadoInfo && (
                                <div className="col-span-2 bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-start gap-3">
                                    <CheckCircle2 className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div className="w-full">
                                        <p className="text-sm font-medium text-blue-900">Estado Financiero</p>
                                        <div className="text-xs text-blue-700 mt-1 grid grid-cols-2 gap-2">
                                            <span>Ganado: {formatearPrecio(selectedEmpleadoInfo.totalGanado)}</span>
                                            <span>Pendiente: <strong>{formatearPrecio(selectedEmpleadoInfo.pendientePorPagar)}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <Label>Monto</Label>
                                <div className="relative">
                                    <DollarSign className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        value={nuevoPago.monto}
                                        onChange={(e) => setNuevoPago({ ...nuevoPago, monto: parseInt(e.target.value) || 0 })}
                                        className="pl-8"
                                    />
                                </div>
                            </div>

                            <div>
                                <Label>Fecha de Pago</Label>
                                <Input
                                    type="date"
                                    value={nuevoPago.fechaPago}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, fechaPago: e.target.value })}
                                />
                            </div>

                            <div>
                                <Label>Concepto</Label>
                                <select
                                    value={nuevoPago.concepto}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, concepto: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="servicio">Pago por Servicio</option>
                                    <option value="pago_mensual">Pago Mensual/Quincenal</option>
                                    <option value="anticipo">Anticipo</option>
                                    <option value="bono">Bono / Extra</option>
                                    <option value="deduccion">Deducción</option>
                                </select>
                            </div>

                            <div>
                                <Label>Método</Label>
                                <select
                                    value={nuevoPago.metodoPago}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, metodoPago: e.target.value })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="transferencia">Transferencia</option>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="nequi">Nequi</option>
                                    <option value="daviplata">Daviplata</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <Label>Periodo / Notas</Label>
                                <Input
                                    value={nuevoPago.periodo}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, periodo: e.target.value })}
                                    placeholder="Ej: Nomina Enero 2024"
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
                        <Button onClick={handleRegistrarPago} className="bg-emerald-600 hover:bg-emerald-700">Registrar Pago</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
