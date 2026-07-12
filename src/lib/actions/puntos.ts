"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";
import { NivelFidelidad } from "@/types";
import type { HistorialPuntos, CreateResponse, Cliente } from "@/types";

interface RegistrarPuntosInput {
    clienteId: string;
    puntos: number;
    motivo: string;
    referenciaId?: string; // ID de cita
    precioServicio?: number; // Precio del servicio para actualizar totalGastado
}

/**
 * Obtiene el historial de puntos de un cliente
 */
export async function obtenerHistorialPuntos(clienteId: string): Promise<HistorialPuntos[]> {
    try {
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.HISTORIAL_PUNTOS,
            [
                Query.equal("clienteId", clienteId),
                Query.orderDesc("$createdAt")
            ]
        );
        return response.documents as unknown as HistorialPuntos[];
    } catch (error: unknown) {
        console.error("Error obteniendo historial puntos:", error);
        return [];
    }
}

/**
 * Registra un movimiento de puntos y actualiza el cliente
 */
export async function registrarPuntos(data: RegistrarPuntosInput): Promise<CreateResponse<HistorialPuntos>> {
    try {
        // 1. Crear registro en historial
        const historialDoc = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.HISTORIAL_PUNTOS,
            ID.unique(),
            {
                clienteId: data.clienteId,
                puntos: data.puntos,
                motivo: data.motivo,
                referenciaId: data.referenciaId,
                fecha: new Date().toISOString()
            }
        );

        // 2. Actualizar el total en el cliente (Re-fetch para asegurar consistencia)
        const clienteDoc = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            data.clienteId
        );

        const cliente = clienteDoc as unknown as Cliente;
        const nuevosPuntos = (cliente.puntosAcumulados || 0) + data.puntos;
        const nuevoTotalGastado = (cliente.totalGastado || 0) + (data.precioServicio || 0);
        const nuevosServiciosCompletados = (cliente.serviciosCompletados || 0) + 1;

        // Calcular nivel
        let nuevoNivel = cliente.nivelFidelidad || NivelFidelidad.BRONCE;
        if (nuevosPuntos >= 20) nuevoNivel = NivelFidelidad.ORO;
        else if (nuevosPuntos >= 10) nuevoNivel = NivelFidelidad.PLATA;

        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            data.clienteId,
            {
                puntosAcumulados: nuevosPuntos,
                nivelFidelidad: nuevoNivel,
                totalGastado: nuevoTotalGastado,
                serviciosCompletados: nuevosServiciosCompletados
            }
        );

        return { success: true, data: historialDoc as unknown as HistorialPuntos };
    } catch (error: unknown) {
        console.error("Error registrando puntos:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al registrar puntos";
        return { success: false, error: errorMessage };
    }
}

/**
 * Redime puntos de un cliente para un premio específico
 */
export async function redimirPuntos(
    clienteId: string,
    puntosARedimir: number,
    premio: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Obtener el cliente actual
        const clienteDoc = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            clienteId
        );
        const cliente = clienteDoc as unknown as Cliente;
        const puntosActuales = cliente.puntosAcumulados || 0;

        if (puntosActuales < puntosARedimir) {
            return {
                success: false,
                error: "No tienes suficientes puntos acumulados para redimir este premio."
            };
        }

        // 2. Crear movimiento negativo en historial de puntos
        await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.HISTORIAL_PUNTOS,
            ID.unique(),
            {
                clienteId: clienteId,
                puntos: -puntosARedimir,
                motivo: `Canje de Premio: ${premio}`,
                fecha: new Date().toISOString()
            }
        );

        // 3. Actualizar puntos del cliente y calcular su nuevo nivel
        const nuevosPuntos = puntosActuales - puntosARedimir;
        
        let nuevoNivel = NivelFidelidad.BRONCE;
        if (nuevosPuntos >= 20) nuevoNivel = NivelFidelidad.ORO;
        else if (nuevosPuntos >= 10) nuevoNivel = NivelFidelidad.PLATA;

        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            clienteId,
            {
                puntosAcumulados: nuevosPuntos,
                nivelFidelidad: nuevoNivel
            }
        );

        return { success: true };
    } catch (error: unknown) {
        console.error("Error redimiendo puntos:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al redimir puntos";
        return { success: false, error: errorMessage };
    }
}
