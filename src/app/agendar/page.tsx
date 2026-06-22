"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ValidatedInput } from "@/components/ui/validated-input";
import {
    ArrowLeft,
    ArrowRight,
    User,
    Phone,
    Mail,
    MapPin,
    Home,
    Calendar,
    Clock,
    FileText,
    CheckCircle2,
    Sparkles,
    Building2,
    Zap,
    CreditCard,
    Banknote,
    Wallet,
} from "lucide-react";
import Link from "next/link";
import { crearCita } from "@/lib/actions/citas";
import { obtenerDireccionesCliente } from "@/lib/actions/direcciones";
import { TipoPropiedad, MetodoPago, Direccion } from "@/types";
import { calcularDuracionEstimada } from "@/lib/utils/precio-calculator";
import { useAuth } from "@/lib/hooks/useAuth";
import { useFormValidation } from "@/lib/hooks/use-form-validation";

const SERVICIOS = [
    {
        id: "limpieza-basica",
        nombre: "Limpieza Básica",
        descripcion: "Limpieza general de espacios. Ideal para mantenimiento regular.",
        icon: Sparkles,
        precioBase: 80000,
        duracionBase: 90,
        color: "from-sky-500 to-blue-600",
    },
    {
        id: "limpieza-profunda",
        nombre: "Limpieza Profunda",
        descripcion: "Limpieza exhaustiva con desinfección. Perfecta para limpieza estacional.",
        icon: Zap,
        precioBase: 150000,
        duracionBase: 180,
        color: "from-emerald-500 to-green-600",
        popular: true,
    },
    {
        id: "limpieza-especializada",
        nombre: "Limpieza Especializada",
        descripcion: "Servicio premium con productos especializados y técnicas avanzadas.",
        icon: Building2,
        precioBase: 200000,
        duracionBase: 240,
        color: "from-purple-500 to-violet-600",
    },
];

const METODOS_PAGO = [
    { value: MetodoPago.EFECTIVO, label: "Efectivo", icon: Banknote },
    { value: MetodoPago.TRANSFERENCIA, label: "Transferencia", icon: CreditCard },
    { value: MetodoPago.NEQUI, label: "Nequi", icon: Wallet },
    { value: MetodoPago.BANCOLOMBIA, label: "Bancolombia", icon: CreditCard },
];

export default function AgendarPage() {
    const router = useRouter();
    const { user, profile } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState<number[]>([]);
    const [showSummary, setShowSummary] = useState(false);

    const validation = useFormValidation({
        clienteNombre: { required: true, minLength: 3 },
        clienteTelefono: { required: true, phone: true },
        clienteEmail: { required: true, email: true },
        direccion: { required: true, minLength: 5 },
        ciudad: { required: true },
        fechaCita: { required: true },
        horaCita: { required: true },
    });

    const [savedAddresses, setSavedAddresses] = useState<Direccion[]>([]);
    const [selectedAddressId, setSelectedAddressId] = useState<string>("new");

    const [formData, setFormData] = useState({
        servicioId: "",
        clienteNombre: "",
        clienteTelefono: "",
        clienteEmail: "",
        direccion: "",
        ciudad: "Bogotá",
        tipoPropiedad: TipoPropiedad.CASA,
        metrosCuadrados: 0,
        habitaciones: 0,
        banos: 0,
        fechaCita: "",
        horaCita: "",
        metodoPago: MetodoPago.EFECTIVO,
        detallesAdicionales: "",
        direccionId: undefined as string | undefined,
    });

    // Auto-fill form data if user is logged in
    useEffect(() => {
        if (user && profile) {
            const isCliente = "ciudad" in profile;
            setFormData((prev) => ({
                ...prev,
                clienteNombre: profile.nombre || user.name || "",
                clienteEmail: profile.email || user.email || "",
                clienteTelefono: profile.telefono || "",
                direccion: profile.direccion || "",
                ciudad: isCliente
                    ? (profile as typeof profile & { ciudad?: string }).ciudad || "Bogotá"
                    : "Bogotá",
            }));
        } else if (user) {
            setFormData((prev) => ({
                ...prev,
                clienteNombre: user.name || "",
                clienteEmail: user.email || "",
            }));
        }
    }, [user, profile]);

    useEffect(() => {
        const fetchAddresses = async () => {
            if (profile?.$id) {
                const addrs = await obtenerDireccionesCliente(profile.$id);
                setSavedAddresses(addrs);
            }
        };
        fetchAddresses();
    }, [profile]);

    const handleAddressChange = (addressId: string) => {
        setSelectedAddressId(addressId);
        if (addressId === "new") {
            setFormData((prev) => ({
                ...prev,
                direccion: "",
                direccionId: undefined,
            }));
        } else {
            const addr = savedAddresses.find((a) => a.$id === addressId);
            if (addr) {
                setFormData((prev) => ({
                    ...prev,
                    direccion: addr.direccion,
                    ciudad: addr.ciudad,
                    tipoPropiedad: addr.tipo,
                    direccionId: addr.$id,
                }));
            }
        }
    };

    const selectedServicio = useMemo(
        () => SERVICIOS.find((s) => s.id === formData.servicioId),
        [formData.servicioId]
    );

    const precioEstimado = useMemo(() => {
        if (!selectedServicio) return 0;

        let precio = selectedServicio.precioBase;

        switch (formData.tipoPropiedad) {
            case TipoPropiedad.APARTAMENTO:
                precio *= 0.9;
                break;
            case TipoPropiedad.OFICINA:
                precio *= 1.15;
                break;
            case TipoPropiedad.LOCAL:
                precio *= 1.3;
                break;
        }

        if (formData.metrosCuadrados > 100) {
            precio += (formData.metrosCuadrados - 100) * 500;
        }
        if (formData.habitaciones > 3) {
            precio += (formData.habitaciones - 3) * 10000;
        }
        if (formData.banos > 2) {
            precio += (formData.banos - 2) * 8000;
        }

        return Math.round(precio / 1000) * 1000;
    }, [selectedServicio, formData.tipoPropiedad, formData.metrosCuadrados, formData.habitaciones, formData.banos]);

    const duracionEstimada = useMemo(() => {
        if (!selectedServicio) return 90;
        return calcularDuracionEstimada({
            tipoPropiedad: formData.tipoPropiedad,
            metrosCuadrados: formData.metrosCuadrados,
            habitaciones: formData.habitaciones,
            tipoServicio: formData.servicioId.includes("profunda")
                ? "profundo"
                : formData.servicioId.includes("especializada")
                  ? "especializado"
                  : "basico",
        });
    }, [selectedServicio, formData.tipoPropiedad, formData.metrosCuadrados, formData.habitaciones, formData.servicioId]);

    const validateStep = (step: number): boolean => {
        switch (step) {
            case 1:
                if (!formData.servicioId) {
                    setError("Selecciona un servicio");
                    return false;
                }
                const s1 = validation.validateField("clienteNombre");
                const s2 = validation.validateField("clienteTelefono");
                const s3 = validation.validateField("clienteEmail");
                if (!s1 || !s2 || !s3) return false;
                break;
            case 2:
                const d1 = validation.validateField("direccion");
                const d2 = validation.validateField("ciudad");
                if (!d1 || !d2) return false;
                break;
            case 3:
                const f1 = validation.validateField("fechaCita");
                const f2 = validation.validateField("horaCita");
                if (!f1 || !f2) return false;
                // Validar que la fecha no sea pasada
                const fechaCita = new Date(formData.fechaCita);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                if (fechaCita < hoy) {
                    setError("La fecha no puede ser en el pasado");
                    return false;
                }
                // Validar hora dentro de rango laboral
                const [hora] = formData.horaCita.split(":").map(Number);
                if (hora < 7 || hora >= 19) {
                    setError("El horario de servicio es de 7:00 AM a 7:00 PM");
                    return false;
                }
                break;
        }
        setError("");
        return true;
    };

    const goToStep = (step: number) => {
        if (step > currentStep) {
            if (!validateStep(currentStep)) return;
            setCompletedSteps((prev) => [...new Set([...prev, currentStep])]);
        }
        setCurrentStep(step);
    };

    const nextStep = () => {
        if (currentStep < 3) {
            goToStep(currentStep + 1);
        } else {
            if (validateStep(3)) {
                setCompletedSteps((prev) => [...new Set([...prev, 3])]);
                setShowSummary(true);
            }
        }
    };

    const prevStep = () => {
        if (showSummary) {
            setShowSummary(false);
        } else if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleSubmit = async () => {
        setError("");
        setLoading(true);

        try {
            const response = await crearCita({
                servicioId: formData.servicioId,
                clienteNombre: formData.clienteNombre,
                clienteTelefono: formData.clienteTelefono,
                clienteEmail: formData.clienteEmail,
                direccion: formData.direccion,
                ciudad: formData.ciudad,
                tipoPropiedad: formData.tipoPropiedad,
                metrosCuadrados: formData.metrosCuadrados || undefined,
                habitaciones: formData.habitaciones || undefined,
                banos: formData.banos || undefined,
                fechaCita: formData.fechaCita,
                horaCita: formData.horaCita,
                duracionEstimada,
                precioCliente: precioEstimado,
                metodoPago: formData.metodoPago,
                detallesAdicionales: formData.detallesAdicionales || undefined,
                clienteId: profile?.$id,
            });

            if (response.success) {
                setSuccess(true);
                setTimeout(() => {
                    router.push("/portal/dashboard?refresh=" + Date.now());
                }, 3000);
            } else {
                setError(response.error || "Error al crear la cita");
            }
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Error al agendar el servicio";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const steps = [
        { number: 1, title: "Servicio", icon: Sparkles },
        { number: 2, title: "Ubicación", icon: MapPin },
        { number: 3, title: "Fecha", icon: Calendar },
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
                            <span>Redirigiendo...</span>
                        </div>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen relative overflow-hidden">
            <div className="fixed inset-0 z-0">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-purple-50 to-green-100"></div>
                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl animate-float"></div>
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-secondary/20 rounded-full blur-3xl"></div>
            </div>

            <div className="relative z-10">
                {/* Header */}
                <div className="bg-gradient-to-r from-sky-500 to-emerald-500 text-white py-8 relative overflow-hidden shadow-lg">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse"></div>
                    </div>

                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex items-center space-x-4 mb-6">
                            <Link href="/">
                                <Button variant="ghost" size="icon" className="rounded-full bg-white/20 hover:bg-white/30 text-white hover:scale-110 transition-all duration-300 backdrop-blur-sm">
                                    <ArrowLeft className="h-6 w-6" />
                                </Button>
                            </Link>
                            <div>
                                <div className="flex items-center space-x-2 mb-1">
                                    <Sparkles className="h-7 w-7 text-yellow-300" />
                                    <h1 className="text-3xl font-bold text-white drop-shadow-md">Agendar Servicio</h1>
                                </div>
                                <p className="text-white/90 text-base">Completa los pasos para agendar tu servicio</p>
                            </div>
                        </div>

                        {/* Progress Steps */}
                        <div className="flex justify-center space-x-2 sm:space-x-4 mt-6">
                            {steps.map((step, idx) => {
                                const StepIcon = step.icon;
                                const isActive = currentStep === step.number;
                                const isCompleted = completedSteps.includes(step.number);

                                return (
                                    <div key={step.number} className="flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (isCompleted || step.number <= currentStep) {
                                                    goToStep(step.number);
                                                }
                                            }}
                                            className={`flex flex-col items-center transition-all ${isCompleted || step.number <= currentStep ? "cursor-pointer" : "cursor-default"}`}
                                        >
                                            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all ${isActive
                                                ? "bg-white text-primary shadow-lg scale-110"
                                                : isCompleted
                                                  ? "bg-white/80 text-green-600"
                                                  : "bg-white/20 text-white/60"
                                                }`}>
                                                {isCompleted ? (
                                                    <CheckCircle2 className="h-6 w-6 sm:h-7 sm:w-7" />
                                                ) : (
                                                    <StepIcon className="h-5 w-5 sm:h-7 sm:w-7" />
                                                )}
                                            </div>
                                            <span className={`text-xs sm:text-sm mt-2 font-medium ${isActive ? "text-white" : "text-white/60"}`}>
                                                {step.title}
                                            </span>
                                        </button>
                                        {idx < steps.length - 1 && (
                                            <div className={`w-12 sm:w-20 h-1 mx-2 sm:mx-4 mb-6 rounded transition-all ${completedSteps.includes(step.number) ? "bg-white" : "bg-white/30"
                                                }`}></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Form Content */}
                <div className="container mx-auto px-4 py-8">
                    <div className="max-w-3xl mx-auto">
                        {/* Step 1: Servicio y Contacto */}
                        {currentStep === 1 && !showSummary && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <Card className="border-2 border-primary/30 backdrop-blur-xl bg-white/80 shadow-xl">
                                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                                                <Sparkles className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">Elige tu Servicio</CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">Selecciona el tipo de limpieza que necesitas</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {SERVICIOS.map((servicio) => {
                                                const Icon = servicio.icon;
                                                const isSelected = formData.servicioId === servicio.id;
                                                return (
                                                    <button
                                                        key={servicio.id}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, servicioId: servicio.id })}
                                                        className={`relative p-4 rounded-xl border-2 text-left transition-all duration-200 ${isSelected
                                                            ? "border-primary bg-primary/5 shadow-lg scale-[1.02]"
                                                            : "border-gray-200 bg-white hover:border-primary/40 hover:shadow-md"
                                                            }`}
                                                    >
                                                        {servicio.popular && (
                                                            <Badge className="absolute -top-2 right-3 bg-secondary text-white text-xs">
                                                                Popular
                                                            </Badge>
                                                        )}
                                                        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${servicio.color} flex items-center justify-center mb-3`}>
                                                            <Icon className="h-5 w-5 text-white" />
                                                        </div>
                                                        <h3 className="font-bold text-gray-900 text-sm">{servicio.nombre}</h3>
                                                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">{servicio.descripcion}</p>
                                                        <div className="mt-3 flex items-center justify-between">
                                                            <span className="text-lg font-bold text-primary">
                                                                ${servicio.precioBase.toLocaleString("es-CO")}
                                                            </span>
                                                            <span className="text-xs text-gray-400">~{servicio.duracionBase} min</span>
                                                        </div>
                                                        {isSelected && (
                                                            <div className="absolute top-2 left-2">
                                                                <CheckCircle2 className="h-5 w-5 text-primary" />
                                                            </div>
                                                        )}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-2 backdrop-blur-xl bg-white/80 shadow-xl">
                                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                                                <User className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">Datos de Contacto</CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">¿Cómo podemos comunicarnos contigo?</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-6">
                                        <ValidatedInput
                                            id="clienteNombre"
                                            name="clienteNombre"
                                            required
                                            placeholder="Ej: Juan Pérez"
                                            className="h-12 bg-white/80"
                                            value={formData.clienteNombre}
                                            onChange={(e) => {
                                                setFormData({ ...formData, clienteNombre: e.target.value });
                                                validation.setValue("clienteNombre", e.target.value);
                                            }}
                                            onBlur={() => validation.setTouched("clienteNombre")}
                                            label="Nombre Completo"
                                            icon={<User className="h-4 w-4 text-primary" />}
                                            error={validation.fields.clienteNombre.error}
                                            touched={validation.fields.clienteNombre.touched}
                                            valid={validation.fields.clienteNombre.valid}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ValidatedInput
                                                id="clienteTelefono"
                                                name="clienteTelefono"
                                                type="tel"
                                                required
                                                placeholder="300 123 4567"
                                                className="h-12 bg-white/80"
                                                value={formData.clienteTelefono}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, clienteTelefono: e.target.value });
                                                    validation.setValue("clienteTelefono", e.target.value);
                                                }}
                                                onBlur={() => validation.setTouched("clienteTelefono")}
                                                label="Teléfono"
                                                icon={<Phone className="h-4 w-4 text-primary" />}
                                                error={validation.fields.clienteTelefono.error}
                                                touched={validation.fields.clienteTelefono.touched}
                                                valid={validation.fields.clienteTelefono.valid}
                                            />
                                            <ValidatedInput
                                                id="clienteEmail"
                                                name="clienteEmail"
                                                type="email"
                                                required
                                                placeholder="ejemplo@email.com"
                                                className="h-12 bg-white/80"
                                                value={formData.clienteEmail}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, clienteEmail: e.target.value });
                                                    validation.setValue("clienteEmail", e.target.value);
                                                }}
                                                onBlur={() => validation.setTouched("clienteEmail")}
                                                label="Email"
                                                icon={<Mail className="h-4 w-4 text-primary" />}
                                                error={validation.fields.clienteEmail.error}
                                                touched={validation.fields.clienteEmail.touched}
                                                valid={validation.fields.clienteEmail.valid}
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Step 2: Ubicación */}
                        {currentStep === 2 && !showSummary && (
                            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                                <Card className="border-2 border-secondary/30 backdrop-blur-xl bg-white/80 shadow-xl">
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
                                    <CardContent className="space-y-5 pt-6">
                                        {savedAddresses.length > 0 && (
                                            <div className="space-y-2">
                                                <Label className="text-base">Direcciones guardadas</Label>
                                                <select
                                                    className="flex h-12 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
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

                                        <ValidatedInput
                                            id="direccion"
                                            name="direccion"
                                            required
                                            placeholder="Calle 123 # 45 - 67"
                                            className="h-12 bg-white/80"
                                            value={formData.direccion}
                                            onChange={(e) => {
                                                setFormData({ ...formData, direccion: e.target.value });
                                                validation.setValue("direccion", e.target.value);
                                            }}
                                            onBlur={() => validation.setTouched("direccion")}
                                            label="Dirección Exacta"
                                            icon={<MapPin className="h-4 w-4 text-secondary" />}
                                            error={validation.fields.direccion.error}
                                            touched={validation.fields.direccion.touched}
                                            valid={validation.fields.direccion.valid}
                                            disabled={selectedAddressId !== "new"}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <Label htmlFor="ciudad" className="text-base flex items-center space-x-2">
                                                    <Home className="h-4 w-4 text-secondary" />
                                                    <span>Ciudad *</span>
                                                </Label>
                                                <select
                                                    id="ciudad"
                                                    className="flex h-12 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
                                                    value={formData.ciudad}
                                                    onChange={(e) => {
                                                        setFormData({ ...formData, ciudad: e.target.value });
                                                        validation.setValue("ciudad", e.target.value);
                                                    }}
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
                                                    className="flex h-12 w-full rounded-md border border-input bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50"
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
                                                    className="h-11 bg-white/80"
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
                                                    className="h-11 bg-white/80"
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
                                                    className="h-11 bg-white/80"
                                                    value={formData.banos || ""}
                                                    onChange={(e) => setFormData({ ...formData, banos: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Step 3: Fecha y Hora */}
                        {currentStep === 3 && !showSummary && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                <Card className="border-2 border-primary/30 backdrop-blur-xl bg-white/80 shadow-xl">
                                    <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent">
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                                                <Calendar className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">Fecha y Hora</CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">¿Cuándo te gustaría el servicio?</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-5 pt-6">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <ValidatedInput
                                                id="fechaCita"
                                                name="fechaCita"
                                                type="date"
                                                required
                                                min={new Date().toISOString().split("T")[0]}
                                                className="h-12 bg-white/80"
                                                value={formData.fechaCita}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, fechaCita: e.target.value });
                                                    validation.setValue("fechaCita", e.target.value);
                                                }}
                                                onBlur={() => validation.setTouched("fechaCita")}
                                                label="Fecha"
                                                icon={<Calendar className="h-4 w-4 text-primary" />}
                                                error={validation.fields.fechaCita.error}
                                                touched={validation.fields.fechaCita.touched}
                                                valid={validation.fields.fechaCita.valid}
                                            />
                                            <ValidatedInput
                                                id="horaCita"
                                                name="horaCita"
                                                type="time"
                                                required
                                                className="h-12 bg-white/80"
                                                value={formData.horaCita}
                                                onChange={(e) => {
                                                    setFormData({ ...formData, horaCita: e.target.value });
                                                    validation.setValue("horaCita", e.target.value);
                                                }}
                                                onBlur={() => validation.setTouched("horaCita")}
                                                label="Hora"
                                                icon={<Clock className="h-4 w-4 text-primary" />}
                                                error={validation.fields.horaCita.error}
                                                touched={validation.fields.horaCita.touched}
                                                valid={validation.fields.horaCita.valid}
                                                description="Horario: 7:00 AM - 7:00 PM"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-base flex items-center space-x-2">
                                                <CreditCard className="h-4 w-4 text-primary" />
                                                <span>Método de Pago</span>
                                            </Label>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                                {METODOS_PAGO.map((metodo) => {
                                                    const Icon = metodo.icon;
                                                    const isSelected = formData.metodoPago === metodo.value;
                                                    return (
                                                        <button
                                                            key={metodo.value}
                                                            type="button"
                                                            onClick={() => setFormData({ ...formData, metodoPago: metodo.value })}
                                                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all ${isSelected
                                                                ? "border-primary bg-primary/5"
                                                                : "border-gray-200 bg-white hover:border-primary/40"
                                                                }`}
                                                        >
                                                            <Icon className={`h-5 w-5 ${isSelected ? "text-primary" : "text-gray-400"}`} />
                                                            <span className={`text-xs font-medium ${isSelected ? "text-primary" : "text-gray-600"}`}>
                                                                {metodo.label}
                                                            </span>
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label htmlFor="detallesAdicionales" className="text-base flex items-center space-x-2">
                                                <FileText className="h-4 w-4 text-primary" />
                                                <span>Detalles Adicionales (Opcional)</span>
                                            </Label>
                                            <textarea
                                                id="detallesAdicionales"
                                                rows={3}
                                                value={formData.detallesAdicionales}
                                                onChange={(e) => setFormData({ ...formData, detallesAdicionales: e.target.value })}
                                                className="flex w-full rounded-md border-2 border-input bg-white/80 px-4 py-3 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                                                placeholder="Instrucciones especiales, código de acceso, mascotas, etc."
                                            />
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Precio estimado */}
                                {selectedServicio && (
                                    <Card className="border-2 border-secondary/50 backdrop-blur-xl bg-gradient-to-r from-secondary/10 via-white/80 to-primary/10 shadow-xl">
                                        <CardContent className="pt-6">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                                                        <Sparkles className="h-6 w-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm text-gray-600">Precio Estimado</p>
                                                        <p className="text-3xl font-bold text-gray-900">
                                                            ${precioEstimado.toLocaleString("es-CO")}
                                                        </p>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            {selectedServicio.nombre} • ~{duracionEstimada} min
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge className="bg-secondary/20 text-secondary border-secondary/30 px-3 py-1.5 text-xs">
                                                    Confirmado al aceptar
                                                </Badge>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )}
                            </div>
                        )}

                        {/* Summary */}
                        {showSummary && (
                            <div className="animate-in fade-in zoom-in-95 duration-300">
                                <Card className="border-2 border-primary/30 backdrop-blur-xl bg-white/90 shadow-2xl">
                                    <CardHeader>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg">
                                                <CheckCircle2 className="h-6 w-6 text-white" />
                                            </div>
                                            <div>
                                                <CardTitle className="text-2xl">Confirma tu Reserva</CardTitle>
                                                <p className="text-sm text-gray-600 mt-1">Revisa los datos antes de confirmar</p>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="space-y-4 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Servicio</p>
                                                <p className="font-semibold text-gray-900">{selectedServicio?.nombre}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Precio Estimado</p>
                                                <p className="font-bold text-primary text-lg">${precioEstimado.toLocaleString("es-CO")}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Cliente</p>
                                                <p className="font-semibold text-gray-900">{formData.clienteNombre}</p>
                                                <p className="text-sm text-gray-500">{formData.clienteEmail}</p>
                                                <p className="text-sm text-gray-500">{formData.clienteTelefono}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Ubicación</p>
                                                <p className="font-semibold text-gray-900">{formData.direccion}</p>
                                                <p className="text-sm text-gray-500">{formData.ciudad} • {formData.tipoPropiedad}</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Fecha y Hora</p>
                                                <p className="font-semibold text-gray-900">
                                                    {new Date(formData.fechaCita + "T12:00:00").toLocaleDateString("es-CO", { weekday: "long", day: "numeric", month: "long" })}
                                                </p>
                                                <p className="text-sm text-gray-500">{formData.horaCita} • ~{duracionEstimada} min</p>
                                            </div>
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Método de Pago</p>
                                                <p className="font-semibold text-gray-900 capitalize">{formData.metodoPago.replace("_", " ")}</p>
                                            </div>
                                        </div>

                                        {formData.detallesAdicionales && (
                                            <div className="p-3 bg-gray-50 rounded-lg">
                                                <p className="text-xs text-gray-500 uppercase tracking-wide">Notas</p>
                                                <p className="text-sm text-gray-700">{formData.detallesAdicionales}</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Error */}
                        {error && (
                            <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-start space-x-3 backdrop-blur-xl">
                                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                    <span className="text-red-600 text-xl">!</span>
                                </div>
                                <div>
                                    <p className="font-semibold text-red-900">Error</p>
                                    <p className="text-sm text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex gap-4 mt-6">
                            {(currentStep > 1 || showSummary) && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="lg"
                                    onClick={prevStep}
                                    className="px-6"
                                >
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Anterior
                                </Button>
                            )}

                            {showSummary ? (
                                <Button
                                    type="button"
                                    size="lg"
                                    className="flex-1 h-14 text-lg font-semibold shadow-xl bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90"
                                    disabled={loading}
                                    onClick={handleSubmit}
                                >
                                    {loading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-5 w-5" />
                                            Confirmar Reserva
                                        </>
                                    )}
                                </Button>
                            ) : currentStep < 3 ? (
                                <Button
                                    type="button"
                                    size="lg"
                                    className="flex-1 h-14 text-lg font-semibold shadow-xl"
                                    onClick={nextStep}
                                >
                                    Siguiente
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    size="lg"
                                    className="flex-1 h-14 text-lg font-semibold shadow-xl"
                                    onClick={nextStep}
                                >
                                    Revisar Resumen
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            )}
                        </div>

                        <p className="text-center text-sm text-gray-500 mt-4">
                            Al agendar, aceptas que nos comuniquemos contigo para confirmar los detalles del servicio
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
