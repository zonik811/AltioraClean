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
                    // 3. Si no está en ninguna lista, es un usuario sin rol (Guest/Pending)
                    // Esto previene el acceso no autorizado
                    console.warn(`Usuario ${currentUser.email} no tiene rol asignado.`);
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
            console.log("=== INICIANDO PROCESO DE LOGIN ===");
            console.log("Email:", email);
            
            // PASO 1: Intentar obtener usuario actual
            let currentUser = null;
            try {
                currentUser = await account.get();
                console.log("Usuario actual encontrado:", currentUser.email);
            } catch (err) {
                console.log("No hay usuario actual (sesión no activa)");
            }
            
            // PASO 2: Si hay usuario, cerrar TODAS sus sesiones
            if (currentUser) {
                console.log("Cerrando todas las sesiones del usuario...");
                try {
                    const sessionsList = await account.listSessions();
                    console.log(`Total sesiones encontradas: ${sessionsList.sessions.length}`);
                    
                    for (const session of sessionsList.sessions) {
                        try {
                            console.log(`Cerrando sesión: ${session.$id}`);
                            await account.deleteSession(session.$id);
                            console.log(`Sesión ${session.$id} cerrada`);
                        } catch (err) {
                            console.warn(`Error cerrando sesión ${session.$id}:`, err);
                        }
                    }
                } catch (err) {
                    console.warn("Error listando sesiones:", err);
                }
                
                // Esperar para asegurar que todo se procesó
                await new Promise(resolve => setTimeout(resolve, 300));
            }
            
            // PASO 3: Limpiar cookies manualmente (método de respaldo)
            try {
                document.cookie.split(";").forEach(function(c) {
                    const cookieName = c.split("=")[0].trim();
                    document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });
                console.log("Cookies limpiadas");
            } catch (err) {
                console.warn("Error limpiando cookies:", err);
            }
            
            // PASO 4: Crear nueva sesión
            console.log("Creando nueva sesión...");
            await account.createEmailPasswordSession(email, password);
            console.log("✓ Nueva sesión creada exitosamente");
            
            // PASO 5: Verificar y cargar datos del usuario
            await checkAuth();
            console.log("=== LOGIN COMPLETADO ===");
        } catch (error: unknown) {
            console.error("✗ Error en login:", error);
            const errorMessage = error instanceof Error ? error.message : "Error al iniciar sesión";
            throw new Error(errorMessage);
        }
    };

    const logout = async () => {
        try {
            // Cerrar todas las sesiones activas de forma exhaustiva
            try {
                const sessions = await account.listSessions();
                console.log(`Cerrando ${sessions.sessions.length} sesiones activas`);
                
                // Cerrar cada sesión individualmente
                for (const session of sessions.sessions) {
                    try {
                        await account.deleteSession(session.$id);
                    } catch (err) {
                        console.warn(`Error cerrando sesión ${session.$id}:`, err);
                    }
                }
                
                // También intentar cerrar la sesión actual
                try {
                    await account.deleteSession("current");
                } catch {
                    // Ignorar si ya fue cerrada
                }
            } catch (err) {
                console.warn("Error listando sesiones:", err);
                // Fallback: intentar cerrar sesión actual
                try {
                    await account.deleteSession("current");
                } catch {
                    // Ignorar si no hay sesión
                }
            }

            // Limpiar estado local
            setUser(null);
            setRole(null);
            setProfile(null);
            
            console.log("Logout completado exitosamente");
        } catch (error: unknown) {
            console.error("Error en logout:", error);
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
