"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import type {
    Servicio,
    CreateResponse,
    UpdateResponse,
    DeleteResponse,
    PaginatedResponse,
    PaginationParams,
} from "@/types";

export interface CrearServicioInput {
    nombre: string;
    slug: string;
    descripcion: string;
    descripcionCorta: string;
    categoria: string;
    precioBase: number;
    unidadPrecio: "hora" | "metrocuadrado" | "servicio";
    duracionEstimada: number;
    caracteristicas: string[];
    requierePersonal: number;
    imagen?: string;
}

export async function obtenerServicios(
    activo?: boolean,
    pagination?: PaginationParams
): Promise<PaginatedResponse<Servicio>> {
    try {
        await requireAdmin();
        const queries: string[] = [Query.orderDesc("createdAt")];

        if (activo !== undefined) {
            queries.push(Query.equal("activo", activo));
        }

        const limit = pagination?.limit || 20;
        queries.push(Query.limit(limit + 1));

        if (pagination?.cursor) {
            queries.push(Query.cursorAfter(pagination.cursor));
        }

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.SERVICIOS,
            queries
        );

        const hasMore = response.documents.length > limit;
        const documents = hasMore
            ? response.documents.slice(0, limit)
            : response.documents;

        return {
            documents: documents as unknown as Servicio[],
            total: response.total,
            hasMore,
            nextCursor:
                documents.length > 0
                    ? documents[documents.length - 1].$id
                    : undefined,
        };
    } catch (error: unknown) {
        console.error("Error obteniendo servicios:", error);
        return { documents: [], total: 0, hasMore: false };
    }
}

export async function obtenerServiciosPublicos(): Promise<Servicio[]> {
    try {
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.SERVICIOS,
            [Query.equal("activo", true), Query.limit(100)]
        );
        return response.documents as unknown as Servicio[];
    } catch (error: unknown) {
        console.error("Error obteniendo servicios públicos:", error);
        return [];
    }
}

export async function obtenerServicioPorId(
    id: string
): Promise<Servicio | null> {
    try {
        const response = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.SERVICIOS,
            id
        );
        return response as unknown as Servicio;
    } catch (error: unknown) {
        console.error("Error obteniendo servicio:", error);
        return null;
    }
}

export async function obtenerServicioPorSlug(
    slug: string
): Promise<Servicio | null> {
    try {
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.SERVICIOS,
            [Query.equal("slug", slug), Query.limit(1)]
        );
        return response.documents.length > 0
            ? (response.documents[0] as unknown as Servicio)
            : null;
    } catch {
        return null;
    }
}

export async function crearServicio(
    data: CrearServicioInput
): Promise<CreateResponse<Servicio>> {
    try {
        await requireAdmin();

        const existing = await obtenerServicioPorSlug(data.slug);
        if (existing) {
            return {
                success: false,
                error: "Ya existe un servicio con este slug",
            };
        }

        const servicioData = {
            ...data,
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const newServicio = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.SERVICIOS,
            ID.unique(),
            servicioData
        );

        return { success: true, data: newServicio as unknown as Servicio };
    } catch (error: unknown) {
        console.error("Error creando servicio:", error);
        const errorMessage =
            error instanceof Error ? error.message : "Error al crear servicio";
        return { success: false, error: errorMessage };
    }
}

export async function actualizarServicio(
    servicioId: string,
    data: Partial<CrearServicioInput & { activo: boolean }>
): Promise<UpdateResponse & { data?: Servicio }> {
    try {
        await requireAdmin();

        if (data.slug) {
            const existing = await obtenerServicioPorSlug(data.slug);
            if (existing && existing.$id !== servicioId) {
                return {
                    success: false,
                    error: "Ya existe otro servicio con este slug",
                };
            }
        }

        const updateData = {
            ...data,
            updatedAt: new Date().toISOString(),
        };

        const updatedServicio = await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.SERVICIOS,
            servicioId,
            updateData
        );

        return {
            success: true,
            data: updatedServicio as unknown as Servicio,
        };
    } catch (error: unknown) {
        console.error("Error actualizando servicio:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Error al actualizar servicio";
        return { success: false, error: errorMessage };
    }
}

export async function eliminarServicio(
    servicioId: string
): Promise<DeleteResponse> {
    try {
        await requireAdmin();
        await databases.deleteDocument(
            getDatabaseId(),
            COLLECTIONS.SERVICIOS,
            servicioId
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando servicio:", error);
        const errorMessage =
            error instanceof Error
                ? error.message
                : "Error al eliminar servicio";
        return { success: false, error: errorMessage };
    }
}
