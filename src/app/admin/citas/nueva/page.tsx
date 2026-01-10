"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { crearCita } from "@/lib/actions/citas";
import { obtenerEmpleados } from "@/lib/actions/empleados";
import { obtenerClientes } from "@/lib/actions/clientes";
import { TipoPropiedad, MetodoPago, type Empleado, type Cliente } from "@/types";
import { calcularDuracionEstimada } from "@/lib/utils/precio-calculator";

export default function NuevaCitaPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [empleados, setEmpleados] = useState<Empleado[]>([]);
    const [clientes, setClientes] = useState<Cliente[]>([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState<string>("");

    const [formData, setFormData] = useState({
        servicioId: "servicio-basico",
        clienteId: "",
        clienteNombre: "",
        clienteTelefono: "",
        clienteEmail: "",
        direccion: "",
        ciudad: "",
        tipoPropiedad: "casa" as TipoPropiedad,
        metrosCuadrados: 0,
        habitaciones: 0,
        banos: 0,
        fechaCita: "",
        horaCita: "",
        empleadosAsignados: [] as string[],
        precioCliente: 50000,
        metodoPago: "efectivo" as MetodoPago,
        detallesAdicionales: "",
        notasInternas: "",
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    useEffect(() => {
        if (clienteSeleccionado && clienteSeleccionado !== "nuevo") {
            const cliente = clientes.find((c) => c.$id === clienteSeleccionado);
            if (cliente) {
                setFormData((prev) => ({
                    ...prev,
                    clienteId: cliente.$id,
                    clienteNombre: cliente.nombre,
                    clienteTelefono: cliente.telefono,
                    clienteEmail: cliente.email,
                    direccion: cliente.direccion,
                    ciudad: cliente.ciudad,
                }));
            }
        } else if (clienteSeleccionado === "nuevo") {
            setFormData((prev) => ({
                ...prev,
                clienteId: "",
                clienteNombre: "",
                clienteTelefono: "",
                clienteEmail: "",
                direccion: "",
                ciudad: "",
            }));
        }
    }, [clienteSeleccionado, clientes]);

    const cargarDatos = async () => {
        try {
            const [empleadosData, clientesData] = await Promise.all([
                obtenerEmpleados({ activo: true }),
                obtenerClientes(),
            ]);
            setEmpleados(empleadosData);
            setClientes(clientesData);
        } catch (error) {
            console.error("Error cargando datos:", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const duracionEstimada = calcularDuracionEstimada({
                tipoPropiedad: formData.tipoPropiedad,
                metrosCuadrados: formData.metrosCuadrados,
                habitaciones: formData.habitaciones,
                tipoServicio: "basico",
            });

            const response = await crearCita({
                ...formData,
                duracionEstimada,
                precioAcordado: formData.precioCliente,
            });

            if (response.success) {
                router.push("/admin/citas");
            } else {
                setError(response.error || "Error al crear la cita");
            }
        } catch (err: any) {
            setError(err.message || "Error al crear la cita");
        } finally {
            setLoading(false);
        }
    };

    const toggleEmpleado = (empleadoId: string) => {
        setFormData((prev) => ({
            ...prev,
            empleadosAsignados: prev.empleadosAsignados.includes(empleadoId)
                ? prev.empleadosAsignados.filter((id) => id !== empleadoId)
                : [...prev.empleadosAsignados, empleadoId],
        }));
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div className="flex items-center space-x-4">
                <Link href="/admin/citas">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Nueva Cita</h1>
                    <p className="text-gray-600 mt-1">Agendar un servicio manualmente</p>
                </div>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                    {/* Cliente */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Información del Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="cliente">Seleccionar Cliente</Label>
                                <select
                                    id="cliente"
                                    value={clienteSeleccionado}
                                    onChange={(e) => setClienteSeleccionado(e.target.value)}
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                >
                                    <option value="">-- Seleccionar --</option>
                                    <option value="nuevo">+ Nuevo Cliente</option>
                                    {clientes.map((cliente) => (
                                        <option key={cliente.$id} value={cliente.$id}>
                                            {cliente.nombre} - {cliente.telefono}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {(clienteSeleccionado === "nuevo" || !clienteSeleccionado) && (
                                <>
                                    <div className="space-y-2">
                                        <Label htmlFor="clienteNombre">Nombre Completo *</Label>
                                        <Input
                                            id="clienteNombre"
                                            required
                                            value={formData.clienteNombre}
                                            onChange={(e) =>
                                                setFormData({ ...formData, clienteNombre: e.target.value })
                                            }
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="clienteTelefono">Teléfono *</Label>
                                            <Input
                                                id="clienteTelefono"
                                                type="tel"
                                                required
                                                value={formData.clienteTelefono}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, clienteTelefono: e.target.value })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="clienteEmail">Email *</Label>
                                            <Input
                                                id="clienteEmail"
                                                type="email"
                                                required
                                                value={formData.clienteEmail}
                                                onChange={(e) =>
                                                    setFormData({ ...formData, clienteEmail: e.target.value })
                                                }
                                            />
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>

                    {/* Ubicación */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ubicación del Servicio</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="direccion">Dirección *</Label>
                                    <Input
                                        id="direccion"
                                        required
                                        value={formData.direccion}
                                        onChange={(e) =>
                                            setFormData({ ...formData, direccion: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="ciudad">Ciudad *</Label>
                                    <select
                                        id="ciudad"
                                        required
                                        value={formData.ciudad}
                                        onChange={(e) =>
                                            setFormData({ ...formData, ciudad: e.target.value })
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="">Seleccionar ciudad</option>
                                        <option value="Bogotá">Bogotá</option>
                                        <option value="Mosquera">Mosquera</option>
                                        <option value="Funza">Funza</option>
                                        <option value="Fusagasugá">Fusagasugá</option>
                                        <option value="Soacha">Soacha</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="tipoPropiedad">Tipo de Propiedad *</Label>
                                <select
                                    id="tipoPropiedad"
                                    required
                                    value={formData.tipoPropiedad}
                                    onChange={(e) =>
                                        setFormData({ ...formData, tipoPropiedad: e.target.value as TipoPropiedad })
                                    }
                                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                >
                                    <option value="casa">Casa</option>
                                    <option value="apartamento">Apartamento</option>
                                    <option value="oficina">Oficina</option>
                                    <option value="local">Local</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="metrosCuadrados">M²</Label>
                                    <Input
                                        id="metrosCuadrados"
                                        type="number"
                                        min="0"
                                        value={formData.metrosCuadrados || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, metrosCuadrados: Number(e.target.value) })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="habitaciones">Habitaciones</Label>
                                    <Input
                                        id="habitaciones"
                                        type="number"
                                        min="0"
                                        value={formData.habitaciones || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, habitaciones: Number(e.target.value) })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="banos">Baños</Label>
                                    <Input
                                        id="banos"
                                        type="number"
                                        min="0"
                                        value={formData.banos || ""}
                                        onChange={(e) =>
                                            setFormData({ ...formData, banos: Number(e.target.value) })
                                        }
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Fecha y Asignación */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Fecha y Empleados</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fechaCita">Fecha *</Label>
                                    <Input
                                        id="fechaCita"
                                        type="date"
                                        required
                                        value={formData.fechaCita}
                                        onChange={(e) =>
                                            setFormData({ ...formData, fechaCita: e.target.value })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="horaCita">Hora *</Label>
                                    <Input
                                        id="horaCita"
                                        type="time"
                                        required
                                        value={formData.horaCita}
                                        onChange={(e) =>
                                            setFormData({ ...formData, horaCita: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Asignar Empleados</Label>
                                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                                    {empleados.map((empleado) => (
                                        <label
                                            key={empleado.$id}
                                            className="flex items-center space-x-2 cursor-pointer p-2 hover:bg-gray-50 rounded"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.empleadosAsignados.includes(empleado.$id)}
                                                onChange={() => toggleEmpleado(empleado.$id)}
                                                className="rounded border-gray-300"
                                            />
                                            <span className="text-sm">
                                                {empleado.nombre} {empleado.apellido}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Pago y Detalles */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Pago y Detalles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="precioCliente">Precio *</Label>
                                    <Input
                                        id="precioCliente"
                                        type="number"
                                        required
                                        min="1000"
                                        value={formData.precioCliente}
                                        onChange={(e) =>
                                            setFormData({ ...formData, precioCliente: Number(e.target.value) })
                                        }
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="metodoPago">Método de Pago *</Label>
                                    <select
                                        id="metodoPago"
                                        required
                                        value={formData.metodoPago}
                                        onChange={(e) =>
                                            setFormData({ ...formData, metodoPago: e.target.value as MetodoPago })
                                        }
                                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                                    >
                                        <option value="efectivo">Efectivo</option>
                                        <option value="transferencia">Transferencia</option>
                                        <option value="nequi">Nequi</option>
                                        <option value="bancolombia">Bancolombia</option>
                                        <option value="por_cobrar">Por Cobrar</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="detallesAdicionales">Detalles Adicionales</Label>
                                <textarea
                                    id="detallesAdicionales"
                                    rows={2}
                                    value={formData.detallesAdicionales}
                                    onChange={(e) =>
                                        setFormData({ ...formData, detallesAdicionales: e.target.value })
                                    }
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="notasInternas">Notas Internas</Label>
                                <textarea
                                    id="notasInternas"
                                    rows={2}
                                    value={formData.notasInternas}
                                    onChange={(e) =>
                                        setFormData({ ...formData, notasInternas: e.target.value })
                                    }
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                                    placeholder="Notas solo para el equipo admin"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {error && (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <div className="flex justify-end space-x-4">
                        <Link href="/admin/citas">
                            <Button type="button" variant="outline" disabled={loading}>
                                Cancelar
                            </Button>
                        </Link>
                        <Button type="submit" disabled={loading}>
                            {loading ? (
                                "Guardando..."
                            ) : (
                                <>
                                    <Save className="h-4 w-4 mr-2" />
                                    Crear Cita
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </form>
        </div>
    );
}
