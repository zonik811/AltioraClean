"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DollarSign,
    TrendingUp,
    Plus,
    X,
    User,
    Calendar,
    Briefcase,
    Filter,
    Search,
    Trash2,
    AlertTriangle
} from "lucide-react";
import { obtenerPagosClientes, registrarPagoCliente, eliminarPagoCliente, type PagoCliente } from "@/lib/actions/pagos-clientes";
import { obtenerCitas } from "@/lib/actions/citas";
import { obtenerClientes } from "@/lib/actions/clientes";
import type { Cliente, Cita } from "@/types";
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

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316'];

export default function PagosClientesPage() {
    const [pagos, setPagos] = useState<PagoCliente[]>([]);
    const [filteredPagos, setFilteredPagos] = useState<PagoCliente[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [citas, setCitas] = useState<Cita[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDialog, setShowDialog] = useState(false);
    const [selectedCitaInfo, setSelectedCitaInfo] = useState<{ precio: number, pagado: number, restante: number } | null>(null);

    // Filtros
    const [filtros, setFiltros] = useState({
        clienteId: "todos",
        mes: (new Date().getMonth() + 1).toString(),
        anio: new Date().getFullYear().toString(),
    });

    // Estados para el formulario
    const [selectedClienteId, setSelectedClienteId] = useState("");
    const [citasCliente, setCitasCliente] = useState<Cita[]>([]);

    const [nuevoPago, setNuevoPago] = useState({
        citaId: "",
        monto: 0,
        metodoPago: "transferencia",
        estado: "pagado",
        fechaPago: new Date().toISOString().split("T")[0],
        notas: ""
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        aplicarFiltros();
    }, [filtros, pagos, citas]);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const [pagosData, clientesData, citasData] = await Promise.all([
                obtenerPagosClientes(),
                obtenerClientes(),
                obtenerCitas()
            ]);
            setPagos(pagosData);
            setClientes(clientesData);
            setCitas(citasData);
        } catch (error) {
            console.error("Error cargando datos:", error);
        } finally {
            setLoading(false);
        }
    };

    const aplicarFiltros = () => {
        let resultado = [...pagos];

        if (filtros.clienteId !== "todos") {
            resultado = resultado.filter(p => {
                const cita = citas.find(c => c.$id === p.citaId || c.$id === p.citaId[0]);
                return cita && cita.clienteId === filtros.clienteId;
            });
        }

        if (filtros.mes && filtros.anio) {
            resultado = resultado.filter(p => {
                const fecha = new Date(p.fechaPago);
                const mesPago = fecha.getMonth() + 1;
                const anioPago = fecha.getFullYear();
                return mesPago.toString() === filtros.mes && anioPago.toString() === filtros.anio;
            });
        }

        setFilteredPagos(resultado);
    };

    const handleClienteChange = async (clienteId: string) => {
        setSelectedClienteId(clienteId);
        setNuevoPago(prev => ({ ...prev, citaId: "", monto: 0 }));
        setSelectedCitaInfo(null);

        if (clienteId) {
            try {
                // Traemos TODAS las citas para calcular parciales correctamente en frontend
                // O filtramos por `pagadoPorCliente: false` si solo queremos mostrar las que deben
                // Pero para permitir pagos parciales múltiples, mejor traer las no pagadas totalmente.
                // Usamos el filtro de API para traer las pendientes de cierre
                const citasDelCliente = await obtenerCitas({
                    clienteId,
                    pagadoPorCliente: false // Solo traer las que faltan por pagar totalmente
                });
                setCitasCliente(citasDelCliente);
            } catch (error) {
                console.error("Error obteniendo citas del cliente:", error);
                setCitasCliente([]);
            }
        } else {
            setCitasCliente([]);
        }
    };

    const handleCitaChange = (citaId: string) => {
        const cita = citasCliente.find(c => c.$id === citaId);

        if (cita) {
            // Calcular cuánto se ha pagado ya por esta cita (buscando en historial de pagos cargados)
            const pagosDeEstaCita = pagos.filter(p => p.citaId === citaId || p.citaId[0] === citaId);
            const totalPagado = pagosDeEstaCita.reduce((s, p) => s + p.monto, 0);
            const precioTotal = cita.precioAcordado || cita.precioCliente || 0;
            const restante = Math.max(0, precioTotal - totalPagado);

            setSelectedCitaInfo({
                precio: precioTotal,
                pagado: totalPagado,
                restante: restante
            });

            setNuevoPago({
                ...nuevoPago,
                citaId,
                monto: restante // Autocompletar con lo que falta
            });
        } else {
            setNuevoPago({ ...nuevoPago, citaId });
            setSelectedCitaInfo(null);
        }
    };

    const handleRegistrarPago = async () => {
        if (!nuevoPago.citaId || nuevoPago.monto <= 0) return;

        // Validación simple
        if (selectedCitaInfo && nuevoPago.monto > selectedCitaInfo.restante) {
            if (!confirm(`El monto ($${nuevoPago.monto}) es mayor al restante calculado ($${selectedCitaInfo.restante}). ¿Deseas continuar igual?`)) {
                return;
            }
        }

        try {
            const result = await registrarPagoCliente({
                clienteId: selectedClienteId,
                citaId: nuevoPago.citaId,
                monto: nuevoPago.monto,
                metodoPago: nuevoPago.metodoPago,
                estado: nuevoPago.estado,
                fechaPago: nuevoPago.fechaPago,
                notas: nuevoPago.notas
            });

            if (result.success) {
                setShowDialog(false);
                setSelectedClienteId("");
                setCitasCliente([]);
                setNuevoPago({
                    citaId: "",
                    monto: 0,
                    metodoPago: "transferencia",
                    estado: "pagado",
                    fechaPago: new Date().toISOString().split("T")[0],
                    notas: ""
                });
                setSelectedCitaInfo(null);
                cargarDatos(); // Recargar para actualizar listas y estados
            }
        } catch (error) {
            console.error("Error registrando pago:", error);
        }
    };

    const handleEliminarPago = async (pagoId: string) => {
        if (!confirm("¿Estás seguro de eliminar este pago? Si la cita estaba pagada, volverá a pendiente.")) return;

        try {
            setLoading(true);
            await eliminarPagoCliente(pagoId);
            await cargarDatos(); // Recargar todo para recalcular
        } catch (error) {
            console.error("Error eliminando pago:", error);
        } finally {
            setLoading(false);
        }
    };

    const totalRecibido = filteredPagos.reduce((sum, p) => sum + p.monto, 0);

    const chartData = clientes.map(cliente => {
        const pagosDelCliente = filteredPagos.filter(p => {
            const cita = citas.find(c => c.$id === p.citaId || c.$id === p.citaId[0]);
            return cita && cita.clienteId === cliente.$id;
        });

        const total = pagosDelCliente.reduce((sum, p) => sum + p.monto, 0);

        return {
            name: cliente.nombre,
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
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Pagos de Clientes</h1>
                    <p className="text-gray-500 mt-1">Ingresos por servicios de limpieza realizados</p>
                </div>
                <Button
                    onClick={() => setShowDialog(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 transition-all hover:scale-105"
                >
                    <Plus className="mr-2 h-4 w-4" /> Registrar Cobro
                </Button>
            </div>

            {/* Filters Toolbar */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filtrar:</span>
                </div>

                <div className="flex gap-2">
                    <select
                        value={filtros.mes}
                        onChange={(e) => setFiltros({ ...filtros, mes: e.target.value })}
                        className="h-9 px-3 bg-gray-50 border-gray-200 border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                        {["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"].map((m, i) => (
                            <option key={i} value={(i + 1).toString()}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={filtros.anio}
                        onChange={(e) => setFiltros({ ...filtros, anio: e.target.value })}
                        className="h-9 px-3 bg-gray-50 border-gray-200 border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                        {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(y => (
                            <option key={y} value={y.toString()}>{y}</option>
                        ))}
                    </select>
                </div>

                <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <select
                        value={filtros.clienteId}
                        onChange={(e) => setFiltros({ ...filtros, clienteId: e.target.value })}
                        className="w-full h-9 pl-9 pr-3 bg-gray-50 border-gray-200 border rounded-md text-sm text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
                    >
                        <option value="todos">Todos los clientes</option>
                        {clientes.map(c => (
                            <option key={c.$id} value={c.$id}>{c.nombre}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Dashboard Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6 lg:col-span-1">
                    <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white overflow-hidden relative">
                        <div className="absolute top-0 right-0 -mt-4 -mr-4 p-8 bg-white/10 rounded-full blur-2xl"></div>
                        <CardHeader className="pb-2 relative z-10">
                            <CardTitle className="text-blue-100 font-medium text-sm flex items-center">
                                <TrendingUp className="mr-2 h-4 w-4" /> Total Recibido
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="relative z-10">
                            <div className="text-4xl font-bold">{formatearPrecio(totalRecibido)}</div>
                            <p className="text-blue-100/80 text-sm mt-1">
                                En el periodo seleccionado
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-none shadow-sm bg-white">
                        <CardHeader>
                            <CardTitle className="text-gray-700 text-sm font-medium">Resumen</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Promedio Ticket</span>
                                <span className="text-sm font-bold text-gray-900">
                                    {formatearPrecio(filteredPagos.length > 0 ? totalRecibido / filteredPagos.length : 0)}
                                </span>
                            </div>
                            <div className="h-px bg-gray-100"></div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-500">Transacciones</span>
                                <span className="text-sm font-bold text-gray-900">{filteredPagos.length}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card className="lg:col-span-2 border-none shadow-md bg-white">
                    <CardHeader>
                        <CardTitle className="text-gray-800">Top Clientes (Ingresos)</CardTitle>
                        <CardDescription>Clientes con mayor facturación en el periodo</CardDescription>
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

            {/* Table */}
            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                        <Briefcase className="h-5 w-5 text-blue-600" />
                        <span>Historial de Cobros</span>
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600">Fecha</TableHead>
                                <TableHead className="font-semibold text-gray-600">Cliente</TableHead>
                                <TableHead className="font-semibold text-gray-600">Servicio/Cita</TableHead>
                                <TableHead className="font-semibold text-gray-600">Método</TableHead>
                                <TableHead className="text-right font-semibold text-gray-600">Monto</TableHead>
                                <TableHead className="w-[50px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
                                        Cargando cobros...
                                    </TableCell>
                                </TableRow>
                            ) : filteredPagos.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12 text-gray-500">
                                        <div className="bg-gray-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                                            <TrendingUp className="h-8 w-8 text-gray-300" />
                                        </div>
                                        <p className="font-medium text-gray-900">No hay cobros con estos filtros</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPagos.map((pago) => {
                                    const cita = citas.find(c => c.$id === pago.citaId[0] || c.$id === pago.citaId);
                                    const clienteNombre = cita ? cita.clienteNombre : "Cliente Desconocido";

                                    return (
                                        <TableRow key={pago.$id} className="hover:bg-gray-50/50 transition-colors group">
                                            <TableCell className="font-medium text-gray-900">{formatearFecha(pago.fechaPago)}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center space-x-2">
                                                    <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xs">
                                                        <User className="h-4 w-4" />
                                                    </div>
                                                    <span className="text-gray-700 font-medium">
                                                        {clienteNombre}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">
                                                {cita ? (
                                                    <div className="flex flex-col">
                                                        <span>{formatearFecha(cita.fechaCita)}</span>
                                                        <span className="text-xs text-gray-400">{cita.tipoPropiedad}</span>
                                                    </div>
                                                ) : <span className="text-red-400 text-xs">Cita eliminada</span>}
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm capitalize">{pago.metodoPago}</TableCell>
                                            <TableCell className="text-right font-bold text-gray-900">
                                                {formatearPrecio(pago.monto)}
                                            </TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                                    onClick={() => handleEliminarPago(pago.$id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Modal Form */}
            {showDialog && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-semibold text-lg text-gray-900">Registrar Cobro</h3>
                                <p className="text-sm text-gray-500">Nuevo pago recibido de cliente</p>
                            </div>
                            <Button variant="ghost" size="icon" onClick={() => setShowDialog(false)} className="rounded-full hover:bg-gray-200/50">
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="p-6 grid grid-cols-2 gap-4">
                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Cliente</label>
                                <select
                                    value={selectedClienteId}
                                    onChange={(e) => handleClienteChange(e.target.value)}
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                >
                                    <option value="">Seleccionar Cliente...</option>
                                    {clientes.map((c) => (
                                        <option key={c.$id} value={c.$id}>
                                            {c.nombre} ({c.telefono})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Cita / Servicio (Pendientes)</label>
                                <select
                                    value={nuevoPago.citaId}
                                    onChange={(e) => handleCitaChange(e.target.value)}
                                    disabled={!selectedClienteId}
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm disabled:opacity-50"
                                >
                                    <option value="">
                                        {selectedClienteId ? (citasCliente.length > 0 ? "Seleccionar Cita..." : "No hay pagos pendientes") : "Primero selecciona un cliente"}
                                    </option>
                                    {citasCliente.map((c) => (
                                        <option key={c.$id} value={c.$id}>
                                            {formatearFecha(c.fechaCita)} - {c.tipoPropiedad} ({formatearPrecio(c.precioAcordado || c.precioCliente)})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Info de Saldos Parciales */}
                            {selectedCitaInfo && (
                                <div className="col-span-2 bg-yellow-50 border border-yellow-100 rounded-lg p-3 flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <div className="w-full">
                                        <p className="text-sm font-medium text-yellow-900">Estado del cobro</p>
                                        <div className="text-xs text-yellow-700 mt-1 grid grid-cols-3 gap-x-2">
                                            <span>Total: <strong>{formatearPrecio(selectedCitaInfo.precio)}</strong></span>
                                            <span>Pagado: <strong>{formatearPrecio(selectedCitaInfo.pagado)}</strong></span>
                                            <span className={selectedCitaInfo.restante === 0 ? "text-green-600 font-bold" : ""}>Restante: <strong>{formatearPrecio(selectedCitaInfo.restante)}</strong></span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Monto Recibido</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                                    <Input
                                        type="number"
                                        value={nuevoPago.monto}
                                        onChange={(e) => setNuevoPago({ ...nuevoPago, monto: parseInt(e.target.value) || 0 })}
                                        className="pl-9 h-10 bg-gray-50/50 focus:bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                    />
                                </div>
                            </div>

                            <div className="col-span-2 sm:col-span-1">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Método de Pago</label>
                                <select
                                    value={nuevoPago.metodoPago}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, metodoPago: e.target.value })}
                                    className="w-full h-10 px-3 border rounded-lg bg-gray-50/50 focus:bg-white transition-colors outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm"
                                >
                                    <option value="transferencia">Transferencia</option>
                                    <option value="efectivo">Efectivo</option>
                                    <option value="nequi">Nequi</option>
                                    <option value="daviplata">Daviplata</option>
                                </select>
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Fecha de Pago</label>
                                <Input
                                    type="date"
                                    value={nuevoPago.fechaPago}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, fechaPago: e.target.value })}
                                    className="h-10 bg-gray-50/50 focus:bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="col-span-2">
                                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block">Notas</label>
                                <Input
                                    value={nuevoPago.notas}
                                    onChange={(e) => setNuevoPago({ ...nuevoPago, notas: e.target.value })}
                                    placeholder="Detalles adicionales..."
                                    className="h-10 bg-gray-50/50 focus:bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                />
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setShowDialog(false)} className="h-10 px-6">
                                Cancelar
                            </Button>
                            <Button onClick={handleRegistrarPago} className="h-10 px-6 bg-blue-600 hover:bg-blue-700">
                                Confirmar Cobro
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
