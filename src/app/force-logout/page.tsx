"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { account } from "@/lib/appwrite";

export default function ForceLogoutPage() {
    const router = useRouter();
    const [status, setStatus] = useState("Limpiando sesión...");

    useEffect(() => {
        const forceLogout = async () => {
            try {
                console.log("Iniciando logout forzado...");
                
                // 1. Intentar listar y cerrar todas las sesiones
                try {
                    const sessions = await account.listSessions();
                    console.log(`Encontradas ${sessions.sessions.length} sesiones`);
                    
                    for (const session of sessions.sessions) {
                        try {
                            await account.deleteSession(session.$id);
                            console.log(`Sesión ${session.$id} cerrada`);
                        } catch (err) {
                            console.warn(`Error cerrando sesión ${session.$id}:`, err);
                        }
                    }
                } catch (err) {
                    console.log("No se pudieron listar sesiones:", err);
                }
                
                // 2. Intentar cerrar sesión actual
                try {
                    await account.deleteSession("current");
                    console.log("Sesión actual cerrada");
                } catch (err) {
                    console.log("No hay sesión actual");
                }
                
                // 3. Limpiar cookies manualmente
                document.cookie.split(";").forEach(function(c) {
                    const cookieName = c.split("=")[0].trim();
                    document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
                });
                console.log("Cookies limpiadas");
                
                // 4. Limpiar localStorage
                localStorage.clear();
                console.log("localStorage limpiado");
                
                setStatus("✓ Sesión limpiada completamente");
                
                // 5. Redirigir al login después de 2 segundos
                setTimeout(() => {
                    router.push("/login");
                }, 2000);
                
            } catch (error) {
                console.error("Error en logout forzado:", error);
                setStatus("Error: " + (error instanceof Error ? error.message : "Error desconocido"));
            }
        };
        
        forceLogout();
    }, [router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-emerald-50">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto"></div>
                <p className="text-lg font-medium text-gray-700">{status}</p>
                <p className="text-sm text-gray-500">Serás redirigido al login automáticamente...</p>
            </div>
        </div>
    );
}
