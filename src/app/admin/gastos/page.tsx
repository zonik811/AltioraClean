"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DollarSign,
    TrendingDown,
    Filter,
    Calendar as CalendarIcon,
    Plus,
    Search,
    Edit2,
    X
} from "lucide-react";
import { TestNotification } from "@/components/admin/TestNotification";
import { obtenerTodosLosGastos, registrarGasto, actualizarGasto, obtenerGastosPorCategoria } from "@/lib/actions/gastos";
import type { Gasto } from "@/types";
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

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

export default function GastosPage() {
    const [gastos, setGastos] = useState<Gasto[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [statsPorCategoria, setStatsPorCategoria] = useState<{ [key: string]: number }>({});
    const [filtros, setFiltros] = useState({
        categoria: "todos",
        anio: new Date().getFullYear().toString(),
        mes: (new Date().getMonth() + 1).toString(),
        tipo: "mes" // "mes", "anio", "dia"
    });
    const [fechaEspecifica, setFechaEspecifica] = useState(new Date().toISOString().split('T')[0]);
    const [editingGasto, setEditingGasto] = useState<Gasto | null>(null);

    const [nuevoGasto, setNuevoGasto] = useState({
        categoria: "materiales",
        concepto: "",
        monto: 0,
        metodoPago: "efectivo",
        proveedor: "",
        fecha: new Date().toISOString().split("T")[0],
        notas: ""
    });

    useEffect(() => {
        cargarDatos();
    }, [filtros, fechaEspecifica]);

    const cargarDatos = async () => {
        try {
            setLoading(true);

            // Construir fechas de inicio y fin según el filtro
            let fechaInicio = "";
            let fechaFin = "";

            if (filtros.tipo === "dia") {
                fechaInicio = fechaEspecifica;
                fechaFin = fechaEspecifica;
            } else if (filtros.tipo === "mes") {
                const year = parseInt(filtros.anio);
                const month = parseInt(filtros.mes) - 1; // 0-indexed
                const start = new Date(year, month, 1);
                const end = new Date(year, month + 1, 0); // Last day of month

                // Formato YYYY-MM-DD
                fechaInicio = start.toISOString().split('T')[0];
                fechaFin = end.toISOString().split('T')[0];
            } else if (filtros.tipo === "anio") {
                fechaInicio = `${filtros.anio}-01-01`;
                fechaFin = `${filtros.anio}-12-31`;
            }

            const [gastosData, stats] = await Promise.all([
                obtenerTodosLosGastos({
                    categoria: filtros.categoria,
                    fechaInicio,
                    fechaFin
                }),
                obtenerGastosPorCategoria()
            ]);
            setGastos(gastosData);
            setStatsPorCategoria(stats);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarGasto = async () => {
        if (!nuevoGasto.concepto || nuevoGasto.monto <= 0) return;

        try {
            let result;

            if (editingGasto) {
                result = await actualizarGasto(editingGasto.$id, nuevoGasto);
            } else {
                result = await registrarGasto(nuevoGasto);
            }

            if (result.success) {
                cerrarDialogo();
                cargarDatos();
            }
        } catch (error) {
            console.error("Error guardando gasto:", error);
        }
    };

    const iniciarEdicion = (gasto: Gasto) => {
        setEditingGasto(gasto);
        setNuevoGasto({
            categoria: gasto.categoria,
            concepto: gasto.concepto,
            monto: gasto.monto,
            metodoPago: gasto.metodoPago,
            proveedor: gasto.proveedor || "",
            fecha: gasto.fecha.split('T')[0],
            notas: gasto.notas || ""
        });
        setShowDialog(true);
    };

    const cerrarDialogo = () => {
        setShowDialog(false);
        setEditingGasto(null);
        setNuevoGasto({
            categoria: "materiales",
            concepto: "",
            monto: 0,
            metodoPago: "efectivo",
            proveedor: "",
            fecha: new Date().toISOString().split("T")[0],
            notas: ""
        });
    };

    const totalGastos = gastos.reduce((sum, g) => sum + g.monto, 0);
    const chartData = Object.entries(statsPorCategoria).map(([categoria, monto]) => ({
        name: categoria.replace("_", " "),
        monto: monto
    })).sort((a, b) => b.monto - a.monto);

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Control de Gastos</h1>
                    <p className="text-gray-500 mt-1">Gestiona y visualiza los egresos operativos</p>
                </div>
                <div className="flex items-center gap-2">
                    <TestNotification />
                    <Button
                        onClick={() => setShowDialog(true)}
                        className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all hover:scale-105"
                    >
                        <Plus className="mr-2 h-4 w-4" /> Registrar Gasto
                    </Button>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <div className="space-y-6 lg:col-span-1">
                    <Card className="border-none shadow-md bg-gradient-to-br from-red-500 to-rose-600 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 p-8 bg-white/10 rounded-full blur-2xl"></div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-red-100 font-medium text-sm flex items-center">
                                <TrendingDown className="mr-2 h-4 w-4" /> Total Gastos
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold">{formatearPrecio(totalGastos)}</div>
                            <p className="text-red-100/80 text-sm mt-1">
                                {gastos.length} registros encontrados
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-700 text-sm font-medium">Categorías Más Altas</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {chartData.slice(0, 3).map((item, index) => (
                                <div key={item.name} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-sm font-medium text-gray-600 capitalize">{item.name}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900">{formatearPrecio(item.monto)}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>

                {/* Chart */}
                <Card className="lg:col-span-2 border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-gray-800">Distribución de Gastos</CardTitle>
                        <CardDescription>Gastos acumulados por categoría</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} layout="vertical" margin={{ left: 20 }}>
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
                                    <Bar dataKey="monto" radius={[0, 4, 4, 0]} barSize={32}>
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

            {/* Filters & Table Section */}
            <div className="space-y-4">
                {/* Filters Toolbar */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-gray-500">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Filtrar por:</span>
                    </div>

                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {["dia", "mes", "anio"].map((type) => (
                            <button
                                key={type}
                                onClick={() => setFiltros({ ...filtros, tipo: type })}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${filtros.tipo === type
                                    ? "bg-white text-primary shadow-sm"
                                    : "text-gray-500 hover:text-gray-900"
                                    }`}
                            >
                                {type === "dia" ? "Día" : type === "mes" ? "Mes" : "Año"}
                            </button>
                        ))}
                    </div>

                    {filtros.tipo === "dia" && (
                        <div className="relative">
                            <CalendarIcon className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                            <Input
                                type="date"
                                value={fechaEspecifica}
                                onChange={(e) => setFechaEspecifica(e.target.value)}
                                className="w-40 pl-9 h-9 text-sm"
                            />
                        </div>
                    )}

                    {filtros.tipo !== "dia" && (
                        <select
                            value={filtros.anio}
                            onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
                            className="h-9 px-3 py-1 bg-white border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>
                    )}

                    {filtros.tipo === "mes" && (
                        <select
                            value={filtros.mes}
                            onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
                            className="h-9 px-3 py-1 bg-white border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                        >
                            {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                                <option key={i} value={i + 1}>{m}</option>
                            ))}
                        </select>
                    )}

                    <div className="w-px h-6 bg-gray-200 mx-2 hidden md:block"></div>

                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        <select
                            value={filtros.categoria}
                            onChange={(e) => setFiltros({ ...filtros, categoria: e.target.value })}
                            className="w-full h-9 pl-9 pr-3 py-1 bg-white border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none appearance-none"
                        >
                            <option value="todos">Todas las categorías</option>
                            <option value="transporte">Transporte</option>
                            <option value="materiales">Materiales</option>
                            <option value="arriendo">Arriendo</option>
                            <option value="servicios">Servicios</option>
                            <option value="otros">Otros</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <Card className="border-none shadow-md overflow-hidden bg-white">
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    <TableHead className="font-semibold text-gray-600">Fecha</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Categoría</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Concepto</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Proveedor</TableHead>
                                    <TableHead className="font-semibold text-gray-600">Método</TableHead>
                                    <TableHead className="text-right font-semibold text-gray-600">Monto</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                                            Cargando datos...
                                        </TableCell>
                                    </TableRow>
                                ) : gastos.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-12 text-gray-500">
                                            <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                                <TrendingDown className="h-8 w-8 text-gray-300" />
                                            </div>
                                            <p className="font-medium text-gray-900">No hay gastos registrados</p>
                                            <p className="text-sm mt-1">Intenta cambiar los filtros o registra un nuevo gasto</p>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    gastos.map((gasto) => (
                                        <TableRow key={gasto.$id} className="hover:bg-gray-50/50 transition-colors">
                                            <TableCell className="font-medium text-gray-900">{formatearFecha(gasto.fecha)}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant="outline"
                                                    className="capitalize font-normal"
                                                    style={{
                                                        borderColor: COLORS[Math.abs(gasto.categoria.length) % COLORS.length] + '40',
                                                        backgroundColor: COLORS[Math.abs(gasto.categoria.length) % COLORS.length] + '10',
                                                        color: COLORS[Math.abs(gasto.categoria.length) % COLORS.length]
                                                    }}
                                                >
                                                    {gasto.categoria.replace("_", " ")}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-600">{gasto.concepto}</TableCell>
                                            <TableCell className="text-gray-500 text-sm">{gasto.proveedor || "-"}</TableCell>
                                            <TableCell className="text-gray-500 text-sm capitalize">{gasto.metodoPago}</TableCell>
                                            <TableCell className="text-right font-bold text-gray-900">
                                                {formatearPrecio(gasto.monto)}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 hover:bg-gray-100 text-gray-400 hover:text-primary"
                                                    onClick={() => iniciarEdicion(gasto)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Modal Form */}
            {showDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">
                                    {editingGasto ? "Editar Gasto" : "Nuevo Gasto"}
                                </h3>
                                <p className="text-sm text-gray-500">Ingresa los detalles del movimiento</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={cerrarDialogo} className="rounded-full hover:bg-gray-200/50">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Categoría</label>
                                <select
                                    value={nuevoGasto.categoria}
                                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, categoria: e.target.value })}
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                >
                                    <option value="transporte">Transporte</option>
                                    <option value="materiales">Materiales</option>
                                    <option value="arriendo">Arriendo</option>
                                    <option value="servicios">Servicios</option>
                                    <option value="otros">Otros</option>
                                </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Monto</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        value={nuevoGasto.monto}
                                        onChange={(e) => setNuevoGasto({ ...nuevoGasto, monto: parseInt(e.target.value) || 0 })}
                                        className="pl-9 h-10 bg-gray-50/50 focus:bg-white"
                                        placeholder="0"
                                    />
                                </div>
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Concepto</label>
                                <Input
                                    value={nuevoGasto.concepto}
                                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, concepto: e.target.value })}
                                    placeholder="Ej: Compra de insumos de limpieza"
                                    className="h-10 bg-gray-50/50 focus:bg-white"
                                />
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Método de Pago</label>
                                <select
                                    value={nuevoGasto.metodoPago}
                                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, metodoPago: e.target.value })}
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
                                >
                                    <option value="efectivo">Efectivo</option>
                                    <option value="transferencia">Transferencia</option>
                                    <option value="nequi">Nequi</option>
                                    <option value="tarjeta">Tarjeta</option>
                                </select>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Fecha</label>
                                <Input
                                    type="date"
                                    value={nuevoGasto.fecha}
                                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, fecha: e.target.value })}
                                    className="h-10 bg-gray-50/50 focus:bg-white"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Proveedor (Opcional)</label>
                                <Input
                                    value={nuevoGasto.proveedor}
                                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, proveedor: e.target.value })}
                                    placeholder="Nombre del proveedor o tienda"
                                    className="h-10 bg-gray-50/50 focus:bg-white"
                                />
                            </div>
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Notas (Opcional)</label>
                                <Input
                                    value={nuevoGasto.notas}
                                    onChange={(e) => setNuevoGasto({ ...nuevoGasto, notas: e.target.value })}
                                    placeholder="Detalles adicionales..."
                                    className="h-10 bg-gray-50/50 focus:bg-white"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                            <Button variant="outline" onClick={cerrarDialogo} className="h-10 px-6">
                                Cancelar
                            </Button>
                            <Button onClick={handleGuardarGasto} className="h-10 px-6 bg-primary hover:bg-primary/90">
                                {editingGasto ? "Actualizar" : "Guardar Gasto"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
