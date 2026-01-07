"use server";

import { databases } from "@/lib/appwrite-admin";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query, ID } from "node-appwrite";
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
        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CLIENTES,
            [Query.orderDesc("createdAt"), Query.limit(100)]
        );

        return response.documents as unknown as Cliente[];
    } catch (error: any) {
        console.error("Error obteniendo clientes:", error);
        throw new Error(error.message || "Error al obtener clientes");
    }
}

/**
 * Obtiene un cliente por su ID
 */
export async function obtenerCliente(id: string): Promise<Cliente> {
    try {
        const cliente = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.CLIENTES,
            id
        );

        return cliente as unknown as Cliente;
    } catch (error: any) {
        console.error("Error obteniendo cliente:", error);
        throw new Error(error.message || "Error al obtener cliente");
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
            DATABASE_ID,
            COLLECTIONS.CLIENTES,
            [Query.equal("telefono", telefono), Query.limit(1)]
        );

        if (response.documents.length > 0) {
            return response.documents[0] as unknown as Cliente;
        }

        return null;
    } catch (error: any) {
        console.error("Error buscando cliente:", error);
        return null;
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
            DATABASE_ID,
            COLLECTIONS.CLIENTES,
            ID.unique(),
            clienteData
        );

        return {
            success: true,
            data: newCliente as unknown as Cliente,
        };
    } catch (error: any) {
        console.error("Error creando cliente:", error);
        return {
            success: false,
            error: error.message || "Error al crear cliente",
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
            DATABASE_ID,
            COLLECTIONS.CLIENTES,
            id,
            data
        );

        return { success: true };
    } catch (error: any) {
        console.error("Error actualizando cliente:", error);
        return {
            success: false,
            error: error.message || "Error al actualizar cliente",
        };
    }
}
