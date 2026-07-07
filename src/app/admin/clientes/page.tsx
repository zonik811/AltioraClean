"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Search,
    Plus,
    Filter,
    User,
    Phone,
    Mail,
    Edit,
    Trash2,
    Building2,
    Home,
    Loader2,
    Eye,
    X,
} from "lucide-react";
import {
    obtenerClientes,
    crearCliente,
    actualizarCliente,
    eliminarCliente,
} from "@/lib/actions/clientes";
import { formatearPrecio } from "@/lib/utils";
import type { Cliente, PaginatedResponse } from "@/types";
import { TipoCliente, FrecuenciaCliente } from "@/types";
import { TableSkeleton } from "@/components/admin/table-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ClientesPage() {
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [cursor, setCursor] = useState<string | undefined>(undefined);
    const [hasMore, setHasMore] = useState(false);
    const [showDialog, setShowDialog] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [guardando, setGuardando] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);

    const [filters, setFilters] = useState({
        search: "",
        ciudad: "todas",
        tipo: "todos",
    });

    const [formData, setFormData] = useState({
        id: "",
        nombre: "",
        telefono: "",
        email: "",
        direccion: "",
        ciudad: "",
        tipoCliente: TipoCliente.RESIDENCIAL,
        frecuenciaPreferida: FrecuenciaCliente.UNICA,
        notasImportantes: "",
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            setLoading(true);
            const data = await obtenerClientes({ limit: 20 });
            setClientes(data.documents);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch {
            toast.error("Error al cargar clientes");
        } finally {
            setLoading(false);
        }
    };

    const cargarMas = async () => {
        if (!cursor || !hasMore) return;
        try {
            setLoadingMore(true);
            const data = await obtenerClientes({ limit: 20, cursor });
            setClientes(prev => [...prev, ...data.documents]);
            setCursor(data.nextCursor);
            setHasMore(data.hasMore);
        } catch {
            toast.error("Error al cargar más clientes");
        } finally {
            setLoadingMore(false);
        }
    };

    const filteredClientes = useMemo(() => {
        let resultado = [...clientes];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            resultado = resultado.filter(c =>
                c.nombre.toLowerCase().includes(searchLower) ||
                c.email.toLowerCase().includes(searchLower) ||
                c.telefono.includes(searchLower)
            );
        }

        if (filters.ciudad !== "todas") {
            resultado = resultado.filter(c => c.ciudad === filters.ciudad);
        }

        if (filters.tipo !== "todos") {
            resultado = resultado.filter(c => c.tipoCliente === filters.tipo);
        }

        return resultado;
    }, [clientes, filters]);

    const ciudades = useMemo(
        () => Array.from(new Set(clientes.map(c => c.ciudad))).filter(Boolean).sort(),
        [clientes]
    );

    const totalClientes = clientes.length;
    const clientesActivos = clientes.filter(c => c.activo).length;
    const totalResidencial = clientes.filter(c => c.tipoCliente === TipoCliente.RESIDENCIAL).length;

    const handleEdit = (cliente: Cliente) => {
        setFormData({
            id: cliente.$id,
            nombre: cliente.nombre,
            telefono: cliente.telefono,
            email: cliente.email,
            direccion: cliente.direccion,
            ciudad: cliente.ciudad,
            tipoCliente: cliente.tipoCliente,
            frecuenciaPreferida: cliente.frecuenciaPreferida || FrecuenciaCliente.UNICA,
            notasImportantes: cliente.notasImportantes || "",
        });
        setIsEditing(true);
        setShowDialog(true);
    };

    const handleCreate = () => {
        setFormData({
            id: "",
            nombre: "",
            telefono: "",
            email: "",
            direccion: "",
            ciudad: "",
            tipoCliente: TipoCliente.RESIDENCIAL,
            frecuenciaPreferida: FrecuenciaCliente.UNICA,
            notasImportantes: "",
        });
        setIsEditing(false);
        setShowDialog(true);
    };

    const handleSubmit = async () => {
        if (!formData.nombre) {
            toast.error("El nombre es requerido");
            return;
        }
        setGuardando(true);
        try {
            if (isEditing) {
                const result = await actualizarCliente(formData.id, {
                    nombre: formData.nombre,
                    telefono: formData.telefono,
                    email: formData.email,
                    direccion: formData.direccion,
                    ciudad: formData.ciudad,
                    tipoCliente: formData.tipoCliente,
                    frecuenciaPreferida: formData.frecuenciaPreferida,
                    notasImportantes: formData.notasImportantes,
                });
                if (result.success) {
                    toast.success("Cliente actualizado");
                }
            } else {
                const result = await crearCliente({
                    nombre: formData.nombre,
                    telefono: formData.telefono,
                    email: formData.email,
                    direccion: formData.direccion,
                    ciudad: formData.ciudad,
                    tipoCliente: formData.tipoCliente,
                    frecuenciaPreferida: formData.frecuenciaPreferida,
                    notasImportantes: formData.notasImportantes,
                });
                if (result.success) {
                    toast.success("Cliente creado");
                }
            }
            setShowDialog(false);
            cargarDatos();
        } catch {
            toast.error("Error al guardar cliente");
        } finally {
            setGuardando(false);
        }
    };

    const handleDelete = async () => {
        if (!showConfirmDelete) return;
        try {
            const result = await eliminarCliente(showConfirmDelete);
            if (result.success) {
                toast.success("Cliente eliminado");
                setShowConfirmDelete(null);
                cargarDatos();
            }
        } catch {
            toast.error("Error al eliminar cliente");
        }
    };

    if (loading) {
        return <TableSkeleton rows={6} columns={5} hasAvatar />;
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gestión de Clientes</h1>
                    <p className="text-gray-500 mt-1">Administra tu base de datos de clientes y contactos</p>
                </div>
                <Button onClick={handleCreate} className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" /> Nuevo Cliente
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="border-none shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white relative overflow-hidden">
                    <CardHeader className="pb-2 relative z-10">
                        <CardTitle className="text-blue-100 font-medium text-sm flex items-center">
                            <User className="mr-2 h-4 w-4" /> Total Clientes
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="relative z-10">
                        <div className="text-4xl font-bold">{totalClientes}</div>
                        <p className="text-blue-100/80 text-sm mt-1">{clientesActivos} activos actualmente</p>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-gray-500 font-medium text-sm flex items-center">
                            <Home className="mr-2 h-4 w-4" /> Residenciales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{totalResidencial}</div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${totalClientes ? (totalResidencial / totalClientes) * 100 : 0}%` }}></div>
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-none shadow-md bg-white">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-gray-500 font-medium text-sm flex items-center">
                            <Building2 className="mr-2 h-4 w-4" /> Comerciales
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{totalClientes - totalResidencial}</div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${totalClientes ? ((totalClientes - totalResidencial) / totalClientes) * 100 : 0}%` }}></div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-gray-500">
                    <Filter className="h-4 w-4" />
                    <span className="text-sm font-medium">Filtrar:</span>
                </div>
                <select
                    value={filters.ciudad}
                    onChange={(e) => setFilters({ ...filters, ciudad: e.target.value })}
                    className="h-9 px-3 bg-gray-50 border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[140px]"
                >
                    <option value="todas">Todas las Ciudades</option>
                    {ciudades.map(ciudad => (
                        <option key={ciudad} value={ciudad}>{ciudad}</option>
                    ))}
                </select>
                <select
                    value={filters.tipo}
                    onChange={(e) => setFilters({ ...filters, tipo: e.target.value })}
                    className="h-9 px-3 bg-gray-50 border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                    <option value="todos">Todos los Tipos</option>
                    <option value={TipoCliente.RESIDENCIAL}>Residencial</option>
                    <option value={TipoCliente.COMERCIAL}>Comercial</option>
                </select>
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Buscar por nombre, teléfono o email..."
                        value={filters.search}
                        onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                        className="w-full h-9 pl-9 bg-gray-50 focus:bg-white"
                    />
                </div>
            </div>

            <Card className="border-none shadow-md overflow-hidden bg-white">
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-gray-50/50">
                            <TableRow>
                                <TableHead className="font-semibold text-gray-600 pl-6">Cliente</TableHead>
                                <TableHead className="font-semibold text-gray-600">Contacto</TableHead>
                                <TableHead className="font-semibold text-gray-600">Ubicación</TableHead>
                                <TableHead className="font-semibold text-gray-600">Tipo</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-center">Servicios</TableHead>
                                <TableHead className="font-semibold text-gray-600 text-right pr-6">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredClientes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-12">
                                        <EmptyState
                                            title="No hay clientes"
                                            description="Los clientes aparecerán aquí cuando agenden servicios"
                                            action={{ label: "Nuevo Cliente", onClick: handleCreate }}
                                        />
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredClientes.map((cliente) => (
                                    <TableRow key={cliente.$id} className="hover:bg-gray-50/50 transition-colors group">
                                        <TableCell className="pl-6">
                                            <Link href={`/admin/clientes/${cliente.$id}`} className="flex items-center space-x-3 group/link">
                                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold shrink-0">
                                                    {cliente.nombre.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900 group-hover/link:text-primary transition-colors">{cliente.nombre}</div>
                                                    <div className="text-xs text-gray-500">ID: ...{cliente.$id.slice(-4)}</div>
                                                </div>
                                            </Link>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col space-y-1">
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Phone className="h-3 w-3 mr-2 shrink-0" /> {cliente.telefono}
                                                </div>
                                                <div className="flex items-center text-sm text-gray-500">
                                                    <Mail className="h-3 w-3 mr-2 shrink-0" /> {cliente.email}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm text-gray-700">{cliente.ciudad}</span>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                cliente.tipoCliente === TipoCliente.RESIDENCIAL
                                                    ? "bg-blue-50 text-blue-700 border-blue-200"
                                                    : "bg-indigo-50 text-indigo-700 border-indigo-200"
                                            }>
                                                {cliente.tipoCliente}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                {cliente.totalServicios}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right pr-6">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link href={`/admin/clientes/${cliente.$id}`}>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                </Link>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary" onClick={() => handleEdit(cliente)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-500" onClick={() => setShowConfirmDelete(cliente.$id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {hasMore && filteredClientes.length >= 20 && (
                <div className="flex justify-center mt-6">
                    <Button variant="outline" onClick={cargarMas} disabled={loadingMore} className="min-w-[150px]">
                        {loadingMore ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando...</>
                        ) : "Cargar más"}
                    </Button>
                </div>
            )}

            <Dialog open={showDialog} onOpenChange={setShowDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{isEditing ? "Editar Cliente" : "Nuevo Cliente"}</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="col-span-2">
                            <Label>Nombre Completo</Label>
                            <Input value={formData.nombre} onChange={(e) => setFormData({ ...formData, nombre: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Teléfono</Label>
                                <Input value={formData.telefono} onChange={(e) => setFormData({ ...formData, telefono: e.target.value })} />
                            </div>
                            <div>
                                <Label>Email</Label>
                                <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label>Dirección</Label>
                            <Input value={formData.direccion} onChange={(e) => setFormData({ ...formData, direccion: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Ciudad</Label>
                                <Input value={formData.ciudad} onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })} />
                            </div>
                            <div>
                                <Label>Tipo Cliente</Label>
                                <select value={formData.tipoCliente} onChange={(e) => setFormData({ ...formData, tipoCliente: e.target.value as TipoCliente })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                                    <option value={TipoCliente.RESIDENCIAL}>Residencial</option>
                                    <option value={TipoCliente.COMERCIAL}>Comercial</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <Label>Notas</Label>
                            <Input value={formData.notasImportantes} onChange={(e) => setFormData({ ...formData, notasImportantes: e.target.value })} />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDialog(false)} disabled={guardando}>Cancelar</Button>
                        <Button onClick={handleSubmit} disabled={guardando}>
                            {guardando ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Guardando...</> : isEditing ? "Guardar Cambios" : "Crear Cliente"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete Dialog */}
            {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-6 text-center">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">¿Eliminar cliente?</h3>
                            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer. Los datos asociados al cliente se eliminarán permanentemente.</p>
                            <div className="flex gap-3 justify-center">
                                <Button variant="outline" onClick={() => setShowConfirmDelete(null)} className="h-10 px-6">Cancelar</Button>
                                <Button variant="destructive" onClick={handleDelete} className="h-10 px-6">Eliminar Cliente</Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
