"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Home,
    Calendar,
    Clock,
    FileText,
    CheckCircle2,
    Sparkles
} from "lucide-react";
import Link from "next/link";
import { crearCita } from "@/lib/actions/citas";
import { obtenerDireccionesCliente, crearDireccion } from "@/lib/actions/direcciones";
import { TipoPropiedad, MetodoPago, Direccion } from "@/types";
import { calcularDuracionEstimada } from "@/lib/utils/precio-calculator";
import { useAuth } from "@/lib/hooks/useAuth"; // Import Auth Hook

export default function AgendarPage() {
    const router = useRouter();
    const { user, profile } = useAuth(); // Get user and profile
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);

    // Address Management State
    const [savedAddresses, setSavedAddresses] = useState<Direccion[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

    const [formData, setFormData] = useState({
        servicioId: "servicio-basico",
        clienteNombre: "",
        clienteTelefono: "",
        clienteEmail: "",
        direccion: "",
        ciudad: "",
        tipoPropiedad: TipoPropiedad.CASA,
        metrosCuadrados: 0,
        habitaciones: 0,
        banos: 0,
        fechaCita: "",
        horaCita: "",
        detallesAdicionales: "",
    });

    // Auto-fill form data if user is logged in
    useEffect(() => {
        if (user && profile) {
            setFormData(prev => ({
                ...prev,
                clienteNombre: profile.nombre || user.name || "",
                clienteEmail: profile.email || user.email || "",
                clienteTelefono: profile.telefono || "",
                direccion: profile.direccion || "",
                ciudad: profile.ciudad || "Bogotá",
            }));
        } else if (user) {
            // Fallback if no specific client profile but user is logged in (e.g. just registered)
            setFormData(prev => ({
                ...prev,
                clienteNombre: user.name || "",
                clienteEmail: user.email || "",
            }));
        }
    }, [user, profile]);

    // Fetch saved addresses for logged-in users
    useEffect(() => {
        const fetchAddresses = async () => {
            if (profile?.$id) {
                const addrs = await obtenerDireccionesCliente(profile.$id);
                setSavedAddresses(addrs);
            }
        };
        fetchAddresses();
    }, [profile]);

    // Handle address selection
    const handleAddressChange = (addressId: string) => {
        setSelectedAddressId(addressId);

        if (addressId === "new") {
            // Reset address fields and remove direccionId
            setFormData(prev => ({
                ...prev,
                direccion: "",
                direccionId: undefined, // Clear any previous direccionId
            }));
        } else {
            const addr = savedAddresses.find(a => a.$id === addressId);
            if (addr) {
                setFormData(prev => ({
                    ...prev,
                    direccion: addr.direccion,
                    ciudad: addr.ciudad,
                    tipoPropiedad: addr.tipo,
                    direccionId: addr.$id, // CRITICAL: Include direccionId so backend knows it's saved
                }));
            }
        }
    };

    // Cálculo dinámico del precio estimado
    const precioEstimado = useMemo(() => {
        let precioBase = 0;

        // Precio base según tipo de propiedad
        switch (formData.tipoPropiedad) {
            case TipoPropiedad.APARTAMENTO:
                precioBase = 93000; // Más económico
                break;
            case TipoPropiedad.CASA:
                precioBase = 105000;
                break;
            case TipoPropiedad.OFICINA:
                precioBase = 120000; // Más caro
                break;
            case TipoPropiedad.LOCAL:
                precioBase = 150000; // Comercial más caro
                break;
            default:
                precioBase = 100000;
        }

        // Ajuste por metros cuadrados
        if (formData.metrosCuadrados > 0) {
            if (formData.metrosCuadrados > 100) {
                precioBase += (formData.metrosCuadrados - 100) * 500; // $500 por m² adicional
            }
            if (formData.metrosCuadrados > 200) {
                precioBase += (formData.metrosCuadrados - 200) * 300; // Tarifa reducida
            }
        }

        // Ajuste por habitaciones
        if (formData.habitaciones > 3) {
            precioBase += (formData.habitaciones - 3) * 10000;
        }

        // Ajuste por baños
        if (formData.banos > 2) {
            precioBase += (formData.banos - 2) * 8000;
        }

        return precioBase;
    }, [formData.tipoPropiedad, formData.metrosCuadrados, formData.habitaciones, formData.banos]);

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

            // Backend now handles both client AND address creation automatically
            const response = await crearCita({
                ...formData,
                duracionEstimada,
                precioCliente: precioEstimado,
                metodoPago: "por_cobrar" as MetodoPago,
                servicioId: "limpieza-general",
                clienteId: profile?.$id, // Enviar ID si el usuario está logueado para evitar duplicados
            });

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    // Redirect to client dashboard instead of home
                    router.push("/portal/dashboard?refresh=" + Date.now());
                }, 3000);
            } else {
                setError(response.error || "Error al crear la cita");
            }
        } catch (err: any) {
            setError(err.message || "Error al agendar el servicio");
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: "Contacto", icon: User },
        { number: 2, title: "Ubicación", icon: MapPin },
        { number: 3, title: "Fecha & Hora", icon: Calendar },
    ];

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <Image
                        src="/images/hero_cleaning_1767812896737.png"
                        alt="Éxito"
                        fill
                        className="object-cover brightness-50"
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 to-secondary/80"></div>
                </div>

                <Card className="max-w-md w-full text-center relative z-10 m-4 border-0 shadow-2xl backdrop-blur-xl bg-white/90">
                    <CardContent className="pt-12 pb-12">
                        <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse-glow">
                            <CheckCircle2 className="w-12 h-12 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-3">¡Solicitud Enviada!</h2>
                        <p className="text-lg text-gray-600 mb-6">
                            Tu cita ha sido agendada exitosamente. Nuestro equipo se pondrá en contacto contigo pronto para confirmar los detalles.
                        </p>
                        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent"></div>
                            <span>Redirigiendo a inicio...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-green-100"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-purple-300/20 rounded-full blur-3xl"></div>
            </div>

            {/* Content */}
            <div className="relative z-10">
                {/* Hero Header */}
                <div className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white py-12 relative overflow-hidden shadow-lg">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 animate-pulse" style={{ animationDelay: "1s" }}></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex items-center space-x-4 mb-6">
                            <Link href="/">
                                <Button variant="ghost" size="icon" className="rounded-full bg-white/20 hover:bg-white/30 text-white hover:scale-110 transition-all duration-300 backdrop-blur-sm">
                                    <ArrowLeft className="h-6 w-6" />
                                </Button>
                            </Link>
                            <div>
                                <div className="flex items-center space-x-2 mb-2 animate-float">
                                    <Sparkles className="h-8 w-8 text-yellow-300" />
                                    <h1 className="text-4xl font-bold text-white drop-shadow-md">Agendar Servicio</h1>
                                </div>
                                <p className="text-white/90 text-lg font-medium">Completa el formulario y te contactaremos pronto</p>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex justify-center space-x-4 mt-8">
                            {steps.map((step, idx) => {
                                const StepIcon = step.icon;
                                const isActive = currentStep >= step.number;
                                const isCompleted = currentStep > step.number;

                                return (
                                    <div key={step.number} className="flex items-center">
                                        <div className="flex flex-col items-center">
                                            <div className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isActive
                                                ? 'bg-white text-primary shadow-lg scale-110'
                                                : 'bg-white/20 text-white/60'
                                                }`}>
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-7 w-7" />
                                                ) : (
                                                    <StepIcon className="h-7 w-7" />
                                                )}
                                            </div>
                                            <span className={`text-sm mt-2 font-medium ${isActive ? 'text-white' : 'text-white/60'}`}>
                                                {step.title}
                                            </span>
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className={`w-20 h-1 mx-4 mb-6 rounded transition-all ${currentStep > step.number ? 'bg-white' : 'bg-white/30'
                                                }`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Formulario */}
                <div className="container mx-auto px-4 py-12">
                    <div className="max-w-3xl mx-auto">
                        <form onSubmit={handleSubmit}>
                            <div className="space-y-6">
                                {/* Paso 1: Información de Contacto */}
                                <Card className={`border-2 transition-all backdrop-blur-xl bg-white/70 shadow-xl ${currentStep === 1 ? 'border-primary scale-[1.02]' : 'border-white/50'}`}>
                                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                                                <User className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">Información de Contacto</CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">Datos para comunicarnos contigo</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="space-y-2">
                                            <Label htmlFor="clienteNombre" className="text-base flex items-center space-x-2">
                                                <User className="h-4 w-4 text-primary" />
                                                <span>Nombre Completo *</span>
                                            </Label>
                                            <Input
                                                id="clienteNombre"
                                                required
                                                placeholder="Ej: Juan Pérez"
                                                className="h-12 text-lg bg-white/80 backdrop-blur-sm"
                                                value={formData.clienteNombre}
                                                onChange={(e) => setFormData({ ...formData, clienteNombre: e.target.value })}
                                                onClick={() => setCurrentStep(1)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="clienteTelefono" className="text-base flex items-center space-x-2">
                                                    <Phone className="h-4 w-4 text-primary" />
                                                    <span>Teléfono *</span>
                                                </Label>
                                                <Input
                                                    id="clienteTelefono"
                                                    type="tel"
                                                    required
                                                    placeholder="300 123 4567"
                                                    className="h-12 text-lg bg-white/80 backdrop-blur-sm"
                                                    value={formData.clienteTelefono}
                                                    onChange={(e) => setFormData({ ...formData, clienteTelefono: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="clienteEmail" className="text-base flex items-center space-x-2">
                                                    <Mail className="h-4 w-4 text-primary" />
                                                    <span>Email *</span>
                                                </Label>
                                                <Input
                                                    id="clienteEmail"
                                                    type="email"
                                                    required
                                                    placeholder="ejemplo@email.com"
                                                    className="h-12 text-lg bg-white/80 backdrop-blur-sm"
                                                    value={formData.clienteEmail}
                                                    onChange={(e) => setFormData({ ...formData, clienteEmail: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Paso 2: Ubicación */}
                                <Card className={`border-2 transition-all backdrop-blur-xl bg-white/70 shadow-xl ${currentStep === 2 ? 'border-primary scale-[1.02]' : 'border-white/50'}`}>
                                    <CardHeader className="bg-gradient-to-r from-secondary/10 to-transparent">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-secondary to-primary rounded-xl flex items-center justify-center shadow-lg">
                                                <MapPin className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">Ubicación del Servicio</CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">¿Dónde realizaremos el servicio?</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        {/* Selector de Direcciones Guardadas */}
                                        {savedAddresses.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-base">Usar una dirección guardada</Label>
                                                <select
                                                    className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={selectedAddressId}
                                                    onChange={(e) => handleAddressChange(e.target.value)}
                                                >
                                                    <option value="new">+ Nueva Dirección</option>
                                                    {savedAddresses.map((addr) => (
                                                        <option key={addr.$id} value={addr.$id}>
                                                            {addr.nombre} - {addr.direccion}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        )}

                                        <div className="space-y-2">
                                            <Label htmlFor="direccion" className="text-base flex items-center space-x-2">
                                                <MapPin className="h-4 w-4 text-secondary" />
                                                <span>Dirección Exacta *</span>
                                            </Label>
                                            <Input
                                                id="direccion"
                                                required
                                                placeholder="Calle 123 # 45 - 67"
                                                className="h-12 text-lg bg-white/80 backdrop-blur-sm"
                                                value={formData.direccion}
                                                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                                                disabled={selectedAddressId !== "new"} // Readonly if existing selected
                                            />
                                            {selectedAddressId !== "new" && (
                                                <p className="text-xs text-muted-foreground">
                                                    Para editar, selecciona "Nueva Dirección" o ve a tu perfil.
                                                </p>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="ciudad" className="text-base flex items-center space-x-2">
                                                    <Home className="h-4 w-4 text-secondary" />
                                                    <span>Ciudad *</span>
                                                </Label>
                                                <select
                                                    id="ciudad"
                                                    className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={formData.ciudad}
                                                    onChange={(e) => setFormData({ ...formData, ciudad: e.target.value })}
                                                    disabled={selectedAddressId !== "new"}
                                                >
                                                    <option value="Bogotá">Bogotá</option>
                                                    <option value="Mosquera">Mosquera</option>
                                                    <option value="Funza">Funza</option>
                                                    <option value="Fusagasugá">Fusagasugá</option>
                                                    <option value="Soacha">Soacha</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="tipoPropiedad" className="text-base flex items-center space-x-2">
                                                    <Home className="h-4 w-4 text-secondary" />
                                                    <span>Tipo de Propiedad *</span>
                                                </Label>
                                                <select
                                                    id="tipoPropiedad"
                                                    className="flex h-12 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                                    value={formData.tipoPropiedad}
                                                    onChange={(e) => setFormData({ ...formData, tipoPropiedad: e.target.value as TipoPropiedad })}
                                                    disabled={selectedAddressId !== "new"}
                                                >
                                                    <option value={TipoPropiedad.CASA}>Casa</option>
                                                    <option value={TipoPropiedad.APARTAMENTO}>Apartamento</option>
                                                    <option value={TipoPropiedad.OFICINA}>Oficina</option>
                                                    <option value={TipoPropiedad.LOCAL}>Local Comercial</option>
                                                </select>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-3 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="metrosCuadrados" className="text-sm">M² (aprox)</Label>
                                                <Input
                                                    id="metrosCuadrados"
                                                    type="number"
                                                    min="0"
                                                    placeholder="80"
                                                    className="h-11 bg-white/80 backdrop-blur-sm"
                                                    value={formData.metrosCuadrados || ""}
                                                    onChange={(e) => setFormData({ ...formData, metrosCuadrados: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="habitaciones" className="text-sm">Habitaciones</Label>
                                                <Input
                                                    id="habitaciones"
                                                    type="number"
                                                    min="0"
                                                    placeholder="3"
                                                    className="h-11 bg-white/80 backdrop-blur-sm"
                                                    value={formData.habitaciones || ""}
                                                    onChange={(e) => setFormData({ ...formData, habitaciones: Number(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="banos" className="text-sm">Baños</Label>
                                                <Input
                                                    id="banos"
                                                    type="number"
                                                    min="0"
                                                    placeholder="2"
                                                    className="h-11 bg-white/80 backdrop-blur-sm"
                                                    value={formData.banos || ""}
                                                    onChange={(e) => setFormData({ ...formData, banos: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Paso 3: Fecha y Hora */}
                                <Card className={`border-2 transition-all backdrop-blur-xl bg-white/70 shadow-xl ${currentStep === 3 ? 'border-primary scale-[1.02]' : 'border-white/50'}`}>
                                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                                                <Calendar className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">Fecha y Hora Preferida</CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">¿Cuándo te gustaría el servicio?</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-6 pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-2">
                                                <Label htmlFor="fechaCita" className="text-base flex items-center space-x-2">
                                                    <Calendar className="h-4 w-4 text-primary" />
                                                    <span>Fecha *</span>
                                                </Label>
                                                <Input
                                                    id="fechaCita"
                                                    type="date"
                                                    required
                                                    min={new Date().toISOString().split("T")[0]}
                                                    className="h-12 text-lg bg-white/80 backdrop-blur-sm"
                                                    value={formData.fechaCita}
                                                    onChange={(e) => setFormData({ ...formData, fechaCita: e.target.value })}
                                                    onClick={() => setCurrentStep(3)}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="horaCita" className="text-base flex items-center space-x-2">
                                                    <Clock className="h-4 w-4 text-primary" />
                                                    <span>Hora *</span>
                                                </Label>
                                                <Input
                                                    id="horaCita"
                                                    type="time"
                                                    required
                                                    className="h-12 text-lg bg-white/80 backdrop-blur-sm"
                                                    value={formData.horaCita}
                                                    onChange={(e) => setFormData({ ...formData, horaCita: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="detallesAdicionales" className="text-base flex items-center space-x-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span>Detalles Adicionales (Opcional)</span>
                                            </Label>
                                            <textarea
                                                id="detallesAdicionales"
                                                rows={4}
                                                value={formData.detallesAdicionales}
                                                onChange={(e) => setFormData({ ...formData, detallesAdicionales: e.target.value })}
                                                className="flex w-full rounded-md border-2 border-input bg-white/80 backdrop-blur-sm px-4 py-3 text-base focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                placeholder="Instrucciones especiales, código de acceso, mascota en casa, etc."
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Resumen de Precio */}
                                <Card className="border-2 border-secondary/50 backdrop-blur-xl bg-gradient-to-r from-secondary/10 via-white/70 to-primary/10 shadow-xl">
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                                                    <Sparkles className="h-6 w-6 text-white" />
                                                </div>
                                                <div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Precio Estimado</p>
                                                        <p className="text-3xl font-bold text-gray-900">
                                                            ${precioEstimado.toLocaleString('es-CO')}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            Basado en {formData.tipoPropiedad}
                                                            {formData.metrosCuadrados > 0 && ` • ${formData.metrosCuadrados}m²`}
                                                        </p>
                                                    </div>                        </div>
                                            </div>
                                            <Badge className="bg-secondary/20 text-secondary border-secondary/30 px-4 py-2 text-sm">
                                                Precio final confirmado al aceptar servicio
                                            </Badge>
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Error */}
                                {error && (
                                    <div className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3 backdrop-blur-xl">
                                        <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-red-600 text-xl">!</span>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-red-900">Error al agendar</p>
                                            <p className="text-sm text-red-700">{error}</p>
                                        </div>
                                    </div>
                                )}

                                {/* Botón de envío */}
                                <Button
                                    type="submit"
                                    size="lg"
                                    className="w-full h-14 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-[1.02] transition-all"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Confirmar Agendamiento
                                        </>
                                    )}
                                </Button>

                                <p className="text-center text-sm text-gray-500">
                                    Al agendar, aceptas que nos comuniquemos contigo para confirmar los detalles del servicio
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
