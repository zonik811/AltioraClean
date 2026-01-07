"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, Lock, ArrowRight } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            await login(email, password);
            router.push("/admin");
        } catch (err: any) {
            setError(err.message || "Error al iniciar sesión");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-sky-50 via-white to-emerald-50">
            {/* Animated Background Elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-sky-100/50 to-emerald-100/50 rounded-full blur-3xl opacity-50"></div>
            </div>

            <div className="w-full max-w-md relative z-10 p-4">
                {/* Logo y título */}
                <div className="text-center mb-8 animate-fade-in">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-sky-500 to-emerald-500 rounded-3xl mb-6 shadow-2xl items-center justify-center transform hover:scale-110 transition-transform duration-300">
                        <Sparkles className="w-10 h-10 text-white animate-pulse" />
                    </div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2 tracking-tight">
                        AltioraClean
                    </h1>
                    <p className="text-gray-600 text-lg">
                        Panel Administrativo
                    </p>
                </div>

                {/* Card de login */}
                <Card className="shadow-2xl border-white/50 backdrop-blur-xl bg-white/70 overflow-hidden transform transition-all duration-300 hover:shadow-3xl">
                    <CardHeader className="space-y-1 pt-8 pb-4 text-center">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-emerald-600 bg-clip-text text-transparent">
                            Bienvenido de nuevo
                        </CardTitle>
                        <CardDescription className="text-base text-gray-500">
                            Ingresa tus credenciales para acceder
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-8 px-8">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-700 font-medium">Email Corporativo</Label>
                                <div className="relative group">
                                    <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="admin@altioraclean.com"
                                        className="pl-10 h-12 bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-gray-700 font-medium">Contraseña</Label>
                                    <a href="#" className="text-xs text-primary hover:underline font-medium">
                                        ¿Olvidaste tu contraseña?
                                    </a>
                                </div>
                                <div className="relative group">
                                    <div className="absolute left-3 top-3 text-gray-400 group-focus-within:text-primary transition-colors">
                                        <Lock className="w-5 h-5" />
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-12 bg-white/50 border-gray-200 focus:border-primary/50 focus:ring-primary/20 transition-all font-medium"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 animate-shake">
                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                                    <p className="text-sm font-medium text-red-600">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 text-lg font-bold bg-gradient-to-r from-sky-500 to-emerald-500 hover:from-sky-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5"
                                disabled={loading}
                            >
                                {loading ? (
                                    <span className="flex items-center">
                                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                        Conectando...
                                    </span>
                                ) : (
                                    <span className="flex items-center">
                                        Iniciar Sesión <ArrowRight className="ml-2 w-5 h-5" />
                                    </span>
                                )}
                            </Button>
                        </form>
                    </CardContent>
                    <div className="h-1 bg-gradient-to-r from-sky-400 to-emerald-400"></div>
                </Card>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 mt-8 font-medium">
                    © 2026 AltioraClean. Todos los derechos reservados.
                </p>
            </div>
        </div>
    );
}
