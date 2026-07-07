"use client";

import { useState, useEffect, createContext, useContext } from "react";
import { account } from "@/lib/appwrite";
import { Models } from "appwrite";
import { obtenerClientePorEmail } from "@/lib/actions/clientes";
import { obtenerEmpleadoPorEmail } from "@/lib/actions/empleados";
import type { Cliente, Empleado } from "@/types";

interface AuthContextType {
    user: Models.User<Models.Preferences> | null;
    profile: Cliente | Empleado | null;
    role: "admin" | "client" | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [profile, setProfile] = useState<Cliente | Empleado | null>(null);
    const [role, setRole] = useState<"admin" | "client" | null>(null);
    const [loading, setLoading] = useState(true);

    const checkAuth = async () => {
        try {
            const currentUser = await account.get();
            setUser(currentUser);

            // 1. Detectar si es Cliente
            const cliente = await obtenerClientePorEmail(currentUser.email);

            if (cliente) {
                setRole("client");
                setProfile(cliente);
            } else {
                // 2. Si no es cliente, verificar si es Empleado/Admin
                // IMPORTANTE: Esto evita que cualquier usuario registrado sea admin por defecto
                const empleado = await obtenerEmpleadoPorEmail(currentUser.email);

                if (empleado) {
                    setRole("admin");
                    // Por ahora el perfil admin puede ser null o el objeto empleado
                    setProfile(empleado);
                } else {
                    setRole(null);
                    setProfile(null);
                }
            }

        } catch (error) {
            setUser(null);
            setRole(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        checkAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            let currentUser = null;
            try {
                currentUser = await account.get();
            } catch {
                // No hay sesión activa
            }

            if (currentUser) {
                try {
                    const sessionsList = await account.listSessions();
                    for (const session of sessionsList.sessions) {
                        try {
                            await account.deleteSession(session.$id);
                        } catch {
                            // Ignorar errores por sesión
                        }
                    }
                } catch {
                    // Ignorar error al listar
                }

                await new Promise(resolve => setTimeout(resolve, 300));
            }

            try {
                document.cookie.split(";").forEach(function(c) {
                    const cookieName = c.split("=")[0].trim();
                    document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });
            } catch {
                // Ignorar error de cookies
            }

            await account.createEmailPasswordSession(email, password);

            await checkAuth();
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error al iniciar sesión";
            throw new Error(errorMessage);
        }
    };

    const logout = async () => {
        try {
            try {
                const sessions = await account.listSessions();
                for (const session of sessions.sessions) {
                    try {
                        await account.deleteSession(session.$id);
                    } catch {
                        // Ignorar
                    }
                }
                try {
                    await account.deleteSession("current");
                } catch {
                    // Ignorar
                }
            } catch {
                try {
                    await account.deleteSession("current");
                } catch {
                    // Ignorar
                }
            }

            setUser(null);
            setRole(null);
            setProfile(null);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : "Error al cerrar sesión";
            throw new Error(errorMessage);
        }
    };

    return (
        <AuthContext.Provider value={{ user, role, profile, loading, login, logout, checkAuth }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth debe ser usado dentro de AuthProvider");
    }
    return context;
}
