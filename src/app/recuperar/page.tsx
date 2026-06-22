"use client";

import { useState } from "react";
import Link from "next/link";
import { account } from "@/lib/appwrite";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function RecuperarPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            const resetUrl = `${window.location.origin}/resetear-contrasena`;
            await account.createRecovery(email, resetUrl);
            setSent(true);
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : "Error al enviar el enlace de recuperación";
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

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
                        Recuperar Contraseña
                    </p>
                </div>

                <Card className="shadow-2xl border-white/50 backdrop-blur-xl bg-white/70 overflow-hidden">
                    <CardHeader className="space-y-1 pt-8 pb-4 text-center">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                            {sent ? "¡Correo Enviado!" : "¿Olvidaste tu contraseña?"}
                        </CardTitle>
                        <CardDescription className="text-base text-gray-500">
                            {sent
                                ? "Revisa tu bandeja de entrada para restablecer tu contraseña."
                                : "Ingresa tu correo y te enviaremos un enlace para restablecerla."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8 px-8">
                        {sent ? (
                            <div className="text-center space-y-6">
                                <div className="flex justify-center">
                                    <CheckCircle2 className="w-16 h-16 text-emerald-500" />
                                </div>
                                <p className="text-sm text-gray-600">
                                    Enviamos un enlace de recuperación a <strong>{email}</strong>.
                                    Haz clic en el enlace del correo para crear una nueva contraseña.
                                </p>
                                <Link href="/login">
                                    <Button variant="outline" className="w-full">
                                        <ArrowLeft className="w-4 h-4 mr-2" />
                                        Volver al inicio de sesión
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-gray-700 font-medium">Correo electrónico</Label>
                                    <div className="relative group">
                                        <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                                            <Mail className="w-5 h-5" />
                                        </div>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="tu@correo.com"
                                            className="pl-10 h-12 bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
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
                                            Enviando...
                                        </span>
                                    ) : (
                                        "Enviar enlace de recuperación"
                                    )}
                                </Button>

                                <div className="text-center">
                                    <Link href="/login" className="text-sm text-primary hover:underline font-medium inline-flex items-center">
                                        <ArrowLeft className="w-4 h-4 mr-1" />
                                        Volver al inicio de sesión
                                    </Link>
                                </div>
                            </form>
                        )}
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
