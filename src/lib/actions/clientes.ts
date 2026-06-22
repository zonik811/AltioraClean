"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import type {
    Cliente,
    CreateResponse,
    UpdateResponse,
    TipoCliente,
    FrecuenciaCliente,
} from "@/types";

interface CrearClienteInput {
    nombre: string;
    telefono: string;
    email: string;
    direccion: string;
    ciudad: string;
    tipoCliente: TipoCliente;
    frecuenciaPreferida: FrecuenciaCliente;
    notasImportantes?: string;
}

/**
 * Obtiene la lista de todos los clientes
 */
export async function obtenerClientes(): Promise<Cliente[]> {
    try {
        await requireAdmin();
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            [Query.orderDesc("createdAt"), Query.limit(100)]
        );

        return response.documents as unknown as Cliente[];
    } catch (error: unknown) {
        console.error("Error obteniendo clientes:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al obtener clientes";
        throw new Error(errorMessage);
    }
}

/**
 * Obtiene un cliente por su ID
 */
export async function obtenerCliente(id: string): Promise<Cliente> {
    try {
        await requireAdmin();
        const cliente = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            id
        );

        return cliente as unknown as Cliente;
    } catch (error: unknown) {
        console.error("Error obteniendo cliente:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al obtener cliente";
        throw new Error(errorMessage);
    }
}

/**
 * Obtiene un cliente por su email
 */
export async function obtenerClientePorEmail(
    email: string
): Promise<Cliente | null> {
    try {
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            [Query.equal("email", email), Query.limit(1)]
        );

        if (response.documents.length > 0) {
            return response.documents[0] as unknown as Cliente;
        }

        return null;
    } catch (error: unknown) {
        console.warn("Index query failed for email, attempting memory fallback:", error);
        // Fallback: Si falla el índice (ej: faltan permisos o index), buscar en los últimos 100 clientes
        try {
            const fallbackList = await databases.listDocuments(
                getDatabaseId(),
                COLLECTIONS.CLIENTES,
                [Query.orderDesc("$createdAt"), Query.limit(100)]
            );
            const found = fallbackList.documents.find((doc) =>
                doc.email?.trim().toLowerCase() === email?.trim().toLowerCase()
            );
            return (found as unknown as Cliente) || null;
        } catch (fallbackError) {
            console.error("Critical: Memory fallback failed for email", fallbackError);
            return null;
        }
    }
}

/**
 * Obtiene un cliente por su teléfono
 */
export async function obtenerClientePorTelefono(
    telefono: string
): Promise<Cliente | null> {
    try {
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            [Query.equal("telefono", telefono), Query.limit(1)]
        );

        if (response.documents.length > 0) {
            return response.documents[0] as unknown as Cliente;
        }

        return null;
    } catch (error: unknown) {
        console.warn("Index query failed for phone, attempting memory fallback:", error);
        try {
            const fallbackList = await databases.listDocuments(
                getDatabaseId(),
                COLLECTIONS.CLIENTES,
                [Query.orderDesc("$createdAt"), Query.limit(100)]
            );
            // Normalizar teléfono eliminando espacios y signos
            const cleanPhone = (p: string) => p?.replace(/\D/g, "") || "";
            const targetPhone = cleanPhone(telefono);

            const found = fallbackList.documents.find((doc) =>
                cleanPhone(doc.telefono as string) === targetPhone
            );
            return (found as unknown as Cliente) || null;
        } catch (fallbackError) {
            console.error("Critical: Memory fallback failed for phone", fallbackError);
            return null;
        }
    }
}

/**
 * Crea un nuevo cliente
 */
export async function crearCliente(
    data: CrearClienteInput
): Promise<CreateResponse<Cliente>> {
    try {
        const clienteData = {
            nombre: data.nombre,
            telefono: data.telefono,
            email: data.email,
            direccion: data.direccion,
            ciudad: data.ciudad,
            tipoCliente: data.tipoCliente,
            frecuenciaPreferida: data.frecuenciaPreferida,
            totalServicios: 0,
            totalGastado: 0,
            calificacionPromedio: 0,
            notasImportantes: data.notasImportantes,
            activo: true,
            createdAt: new Date().toISOString(),
        };

        const newCliente = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            ID.unique(),
            clienteData
        );

        return {
            success: true,
            data: newCliente as unknown as Cliente,
        };
    } catch (error: unknown) {
        console.error("Error creando cliente:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al crear cliente";
        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Actualiza un cliente existente
 */
export async function actualizarCliente(
    id: string,
    data: Partial<Cliente>
): Promise<UpdateResponse> {
    try {
        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            id,
            data
        );

        return { success: true };
    } catch (error: unknown) {
        console.error("Error actualizando cliente:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al actualizar cliente";
        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Recalcula el número de servicios completados por un cliente
 * contando las citas completadas en la base de datos
 */
export async function recalcularServiciosCliente(clienteId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        const citasCompletadas = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CITAS,
            [
                Query.equal('estado', 'completada'),
                Query.equal('clienteId', clienteId)
            ]
        );

        const count = citasCompletadas.total;

        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            clienteId,
            { serviciosCompletados: count }
        );

        return { success: true, count };
    } catch (error: unknown) {
        console.error(`Error recalculando servicios de cliente ${clienteId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Error al recalcular servicios";
        return { success: false, error: errorMessage };
    }
}
/**
 * Elimina un cliente y sus datos relacionados
 */
export async function eliminarCliente(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await databases.deleteDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            id
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando cliente:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al eliminar cliente";
        return { success: false, error: errorMessage };
    }
}
