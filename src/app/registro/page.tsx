"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, Lock, ArrowRight, User, Phone, MapPin } from "lucide-react";
import Link from "next/link";
import { crearCliente } from "@/lib/actions/clientes";
import { TipoCliente, FrecuenciaCliente, NivelFidelidad } from "@/types";
import { account } from "@/lib/appwrite";
import { ID } from "appwrite";

export default function RegistroPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        nombre: "",
        email: "",
        telefono: "",
        password: "",
        direccion: "",
        ciudad: "Bogotá", // Default
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            // 1. Crear cuenta en Appwrite Auth
            await account.create(ID.unique(), formData.email, formData.password, formData.nombre);

            // 2. Crear documento de Cliente en Base de Datos
            await crearCliente({
                nombre: formData.nombre,
                email: formData.email,
                telefono: formData.telefono,
                direccion: formData.direccion,
                ciudad: formData.ciudad,
                tipoCliente: TipoCliente.RESIDENCIAL, // Default
                frecuenciaPreferida: FrecuenciaCliente.UNICA,
                // Lógica de Bienvenida: Asignar logro o puntos iniciales podría ir aquí o en el backend
                // Por ahora el logro se maneja visualmente en el dashboard
            });

            // 3. Iniciar sesión automáticamente
            await login(formData.email, formData.password);

            // La redirección será manejada por el useEffect en el layout o página protegida, 
            // pero para UX inmediata:
            // router.push("/portal/dashboard"); 
            // Dejamos que el useAuth y el useEffect hagan su magia.

        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Error al registrarse. Intenta nuevamente.";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-purple-50 via-white to-pink-50">
            {/* Animated Background Elements (Similar to Login but different colors) */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 right-10 w-64 h-64 bg-purple-200/30 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 left-10 w-96 h-96 bg-pink-200/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-lg relative z-10 p-4">
                <div className="text-center mb-8 animate-fade-in">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Únete a AltioraClean
                    </h1>
                    <p className="text-gray-600">
                        Regístrate y obtén un <span className="font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">4% OFF</span> en tu primer servicio
                    </p>
                </div>

                <Card className="shadow-2xl border-white/50 backdrop-blur-xl bg-white/70 overflow-hidden">
                    <CardHeader>
                        <CardTitle className="text-xl text-center">Crear Cuenta</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="nombre">Nombre Completo</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <Input id="nombre" placeholder="Juan Pérez" className="pl-9" value={formData.nombre} onChange={handleChange} required />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="telefono">Teléfono</Label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                        <Input id="telefono" placeholder="300..." className="pl-9" value={formData.telefono} onChange={handleChange} required />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input id="email" type="email" placeholder="juan@ejemplo.com" className="pl-9" value={formData.email} onChange={handleChange} required />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Contraseña</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input id="password" type="password" placeholder="Mínimo 8 caracteres" className="pl-9" value={formData.password} onChange={handleChange} required minLength={8} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="direccion">Dirección Principal</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                                    <Input id="direccion" placeholder="Calle 123 #45-67" className="pl-9" value={formData.direccion} onChange={handleChange} required />
                                </div>
                            </div>

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <Button type="submit" className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700" disabled={loading}>
                                {loading ? "Creando cuenta..." : "Registrarse y Obtener Descuento"}
                            </Button>
                        </form>
                        <p className="text-center text-sm text-gray-600 mt-4">
                            ¿Ya tienes cuenta? <Link href="/login" className="text-purple-600 hover:underline font-medium">Inicia Sesión</Link>
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
