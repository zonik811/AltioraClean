"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { ID, Query } from "node-appwrite";
import type { Direccion, CreateResponse, TipoPropiedad } from "@/types";

export interface CrearDireccionInput {
    clienteId: string;
    nombre: string;
    direccion: string;
    ciudad: string;
    barrio?: string;
    tipo: TipoPropiedad;
}

/**
 * Obtiene las direcciones de un cliente
 */
export async function obtenerDireccionesCliente(clienteId: string): Promise<Direccion[]> {
    try {
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.DIRECCIONES,
            [
                Query.equal("clienteId", clienteId),
                Query.orderDesc("$createdAt")
            ]
        );
        return response.documents as unknown as Direccion[];
    } catch (error: unknown) {
        console.error("Error obteniendo direcciones:", error);
        return [];
    }
}

/**
 * Guarda una nueva dirección para un cliente
 */
export async function crearDireccion(data: CrearDireccionInput): Promise<CreateResponse<Direccion>> {
    try {
        const doc = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.DIRECCIONES,
            ID.unique(),
            {
                clienteId: data.clienteId,
                nombre: data.nombre,
                direccion: data.direccion,
                ciudad: data.ciudad,
                barrio: data.barrio,
                tipo: data.tipo
            }
        );
        return { success: true, data: doc as unknown as Direccion };
    } catch (error: unknown) {
        console.error("Error creando dirección:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al crear dirección";
        return { success: false, error: errorMessage };
    }
}

/**
 * Elimina una dirección
 */
export async function eliminarDireccion(id: string): Promise<{ success: boolean; error?: string }> {
    try {
        await databases.deleteDocument(
            getDatabaseId(),
            COLLECTIONS.DIRECCIONES,
            id
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando dirección:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al eliminar dirección";
        return { success: false, error: errorMessage };
    }
}
