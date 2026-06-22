"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { account } from "@/lib/appwrite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Lock, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react";

function ResetearForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get("userId");
    const secret = searchParams.get("secret");

    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    if (!userId || !secret) {
        return (
            <div className="text-center space-y-4">
                <p className="text-red-600 font-medium">Enlace de recuperación inválido o expirado.</p>
                <Link href="/recuperar">
                    <Button variant="outline">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Solicitar nuevo enlace
                    </Button>
                </Link>
            </div>
        );
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password.length < 8) {
            setError("La contraseña debe tener al menos 8 caracteres");
            return;
        }
        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden");
            return;
        }

        setLoading(true);
        try {
            await account.updateRecovery(userId, secret, password);
            setDone(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Error al restablecer la contraseña";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    if (done) {
        return (
            <div className="text-center space-y-6">
                <div className="flex justify-center">
                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                </div>
                <p className="text-gray-600">Tu contraseña ha sido restablecida exitosamente.</p>
                <Link href="/login">
                    <Button className="w-full bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600">
                        Ir al inicio de sesión
                    </Button>
                </Link>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700 font-medium">Nueva contraseña</Label>
                <div className="relative group">
                    <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                        <Lock className="w-5 h-5" />
                    </div>
                    <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Mínimo 8 caracteres"
                        className="pl-10 pr-10 h-12 bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <button
                        type="button"
                        className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                        onClick={() => setShowPassword(!showPassword)}
                    >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirmar contraseña</Label>
                <div className="relative group">
                    <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                        <Lock className="w-5 h-5" />
                    </div>
                    <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="Repite tu contraseña"
                        className="pl-10 h-12 bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={loading}
                    />
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    <p className="text-sm font-medium text-red-600">{error}</p>
                </div>
            )}

            <Button
                type="submit"
                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300"
                disabled={loading}
            >
                {loading ? (
                    <span className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Restableciendo...
                    </span>
                ) : (
                    "Restablecer contraseña"
                )}
            </Button>
        </form>
    );
}

export default function ResetearContrasenaPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50">
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            <div className="w-full max-w-md relative z-10 p-4">
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-3xl mb-6 shadow-2xl">
                        <Sparkles className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                        AltioraClean
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Nueva Contraseña
                    </p>
                </div>

                <Card className="shadow-2xl border-white/50 backdrop-blur-xl bg-white/70 overflow-hidden">
                    <CardHeader className="space-y-1 pt-8 pb-4 text-center">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                            Crear nueva contraseña
                        </CardTitle>
                        <CardDescription className="text-base text-gray-500">
                            Ingresa tu nueva contraseña para acceder a tu cuenta.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8 px-8">
                        <Suspense fallback={<div className="text-center text-gray-500">Cargando...</div>}>
                            <ResetearForm />
                        </Suspense>
                    </CardContent>
                    <div className="h-1 bg-gradient-to-r from-sky-400 to-emerald-400"></div>
                </Card>

                <p className="text-center text-sm text-gray-500 mt-8 font-medium">
                    © 2026 AltioraClean. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
