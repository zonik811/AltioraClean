"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
    ArrowLeft,
    Save,
    User,
    Briefcase,
    MapPin,
    Phone,
    Mail,
    Calendar,
    CreditCard,
    DollarSign,
    CheckSquare,
    Loader2
} from "lucide-react";
import Link from "next/link";
import { crearEmpleado } from "@/lib/actions/empleados";
import { CargoEmpleado, ModalidadPago } from "@/types";
import { toast } from "sonner";

export default function NuevoEmpleadoPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        documento: "",
        telefono: "",
        email: "",
        direccion: "",
        fechaNacimiento: "",
        fechaContratacion: new Date().toISOString().split("T")[0],
        cargo: "limpiador" as CargoEmpleado,
        especialidades: [] as string[],
        tarifaPorHora: 15000,
        modalidadPago: "hora" as ModalidadPago,
    });

    const especialidadesDisponibles = [
        "limpieza_basica",
        "limpieza_profunda",
        "ventanas",
        "oficinas",
        "post_construccion",
        "organizacion",
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const response = await crearEmpleado(formData);

            if (response.success) {
                toast.success("Empleado creado correctamente");
                router.push("/admin/personal");
            } else {
                setError(response.error || "Error al crear empleado");
                toast.error("Error al crear empleado");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Error al crear empleado";
            setError(errorMessage);
            toast.error("Error inesperado");
        } finally {
            setLoading(false);
        }
    };

    const toggleEspecialidad = (especialidad: string) => {
        setFormData((prev) => ({
            ...prev,
            especialidades: prev.especialidades.includes(especialidad)
                ? prev.especialidades.filter((e) => e !== especialidad)
                : [...prev.especialidades, especialidad],
        }));
    };

    return (
        <div className="max-w-3xl mx-auto space-y-8 py-8 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex items-center gap-4 border-b pb-6">
                <Link href="/admin/personal">
                    <Button variant="ghost" size="icon" className="h-10 w-10 hover:bg-gray-100 rounded-full">
                        <ArrowLeft className="h-6 w-6 text-gray-700" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Nuevo Empleado</h1>
                    <p className="text-gray-500 text-base">Ingresa los datos para registrar un nuevo integrante.</p>
                </div>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSubmit} className="space-y-8">

                {/* Sección 1: Datos Personales */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <User className="h-5 w-5 text-gray-500" />
                        Información Personal
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <div className="space-y-2">
                            <Label htmlFor="nombre">Nombre <span className="text-red-500">*</span></Label>
                            <Input
                                id="nombre"
                                placeholder="Ej. Juan"
                                required
                                value={formData.nombre}
                                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="apellido">Apellido <span className="text-red-500">*</span></Label>
                            <Input
                                id="apellido"
                                placeholder="Ej. Pérez"
                                required
                                value={formData.apellido}
                                onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="documento">Documento <span className="text-red-500">*</span></Label>
                            <Input
                                id="documento"
                                placeholder="Cédula o ID"
                                required
                                value={formData.documento}
                                onChange={(e) => setFormData({ ...formData, documento: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="telefono">Teléfono <span className="text-red-500">*</span></Label>
                            <Input
                                id="telefono"
                                type="tel"
                                placeholder="300 123 4567"
                                required
                                value={formData.telefono}
                                onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="email">Email <span className="text-red-500">*</span></Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="correo@ejemplo.com"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <Label htmlFor="direccion">Dirección <span className="text-red-500">*</span></Label>
                            <Input
                                id="direccion"
                                placeholder="Dirección completa"
                                required
                                value={formData.direccion}
                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fechaNacimiento">Fecha de Nacimiento <span className="text-red-500">*</span></Label>
                            <Input
                                id="fechaNacimiento"
                                type="date"
                                required
                                value={formData.fechaNacimiento}
                                onChange={(e) => setFormData({ ...formData, fechaNacimiento: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fechaContratacion">Fecha de Contratación <span className="text-red-500">*</span></Label>
                            <Input
                                id="fechaContratacion"
                                type="date"
                                required
                                value={formData.fechaContratacion}
                                onChange={(e) => setFormData({ ...formData, fechaContratacion: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Sección 2: Datos Laborales */}
                <div className="space-y-6">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                        <Briefcase className="h-5 w-5 text-gray-500" />
                        Información Laboral
                    </h2>

                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="cargo">Cargo <span className="text-red-500">*</span></Label>
                            <select
                                id="cargo"
                                required
                                value={formData.cargo}
                                onChange={(e) => setFormData({ ...formData, cargo: e.target.value as CargoEmpleado })}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                <option value="limpiador">Limpiador</option>
                                <option value="supervisor">Supervisor</option>
                                <option value="especialista">Especialista</option>
                            </select>
                        </div>

                        <div className="space-y-3">
                            <Label>Especialidades</Label>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                {especialidadesDisponibles.map((esp) => (
                                    <div key={esp} className={`flex items-center space-x-2 p-3 rounded-lg border transition-all ${formData.especialidades.includes(esp) ? "border-primary bg-primary/5" : "border-gray-200 hover:border-gray-300"}`}>
                                        <Checkbox
                                            id={esp}
                                            checked={formData.especialidades.includes(esp)}
                                            onCheckedChange={() => toggleEspecialidad(esp)}
                                        />
                                        <label
                                            htmlFor={esp}
                                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer text-gray-700 capitalize w-full"
                                        >
                                            {esp.replace(/_/g, " ")}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label htmlFor="tarifaPorHora">Tarifa por Hora <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                                    <Input
                                        id="tarifaPorHora"
                                        type="number"
                                        required
                                        min="1000"
                                        className="pl-7"
                                        value={formData.tarifaPorHora}
                                        onChange={(e) => setFormData({ ...formData, tarifaPorHora: Number(e.target.value) })}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="modalidadPago">Modalidad de Pago <span className="text-red-500">*</span></Label>
                                <select
                                    id="modalidadPago"
                                    required
                                    value={formData.modalidadPago}
                                    onChange={(e) => setFormData({ ...formData, modalidadPago: e.target.value as ModalidadPago })}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    <option value="hora">Por Hora</option>
                                    <option value="servicio">Por Servicio</option>
                                    <option value="fijo_mensual">Fijo Mensual</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                        <div className="h-2 w-2 bg-red-500 rounded-full"></div>
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex justify-end items-center gap-4 pt-4 border-t">
                    <Link href="/admin/personal">
                        <Button type="button" variant="outline" disabled={loading} className="h-11 px-6">
                            Cancelar
                        </Button>
                    </Link>
                    <Button type="submit" disabled={loading} className="h-11 px-8 min-w-[180px]">
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Empleado
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
