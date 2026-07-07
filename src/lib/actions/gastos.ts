"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import type { Gasto } from "@/types";

export interface RegistrarGastoInput {
    categoria: string;
    concepto: string;
    monto: number;
    metodoPago: string;
    proveedor?: string;
    fecha: string;
    comprobante?: string;
    notas?: string;
}

export interface FiltrosGastos {
    categoria?: string;
    fechaInicio?: string;
    fechaFin?: string;
}

export interface PaginatedGastos {
    documents: Gasto[];
    total: number;
    hasMore: boolean;
    nextCursor?: string;
}

/**
 * Obtiene todos los gastos con filtros opcionales
 */
export async function obtenerGastos(
    filters?: FiltrosGastos,
    cursor?: string,
    limit: number = 50
): Promise<PaginatedGastos> {
    try {
        await requireAdmin();
        const queries = [
            Query.orderDesc('fecha'),
            Query.limit(limit + 1)
        ];

        if (filters?.categoria && filters.categoria !== "todos") {
            queries.push(Query.equal('categoria', filters.categoria));
        }

        if (filters?.fechaInicio) {
            queries.push(Query.greaterThanEqual('fecha', filters.fechaInicio));
        }

        if (filters?.fechaFin) {
            queries.push(Query.lessThanEqual('fecha', filters.fechaFin));
        }

        if (cursor) {
            queries.push(Query.cursorAfter(cursor));
        }

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.GASTOS,
            queries
        );

        const hasMore = response.documents.length > limit;
        const documents = hasMore
            ? response.documents.slice(0, limit)
            : response.documents;

        return {
            documents: documents as unknown as Gasto[],
            total: response.total,
            hasMore,
            nextCursor:
                documents.length > 0
                    ? documents[documents.length - 1].$id
                    : undefined,
        };
    } catch (error: unknown) {
        console.error("Error obteniendo gastos:", error);
        return { documents: [], total: 0, hasMore: false };
    }
}

/**
 * Obtiene todos los gastos (sin paginación, para estadísticas)
 */
export async function obtenerTodosLosGastos(
    filters?: FiltrosGastos
): Promise<Gasto[]> {
    try {
        await requireAdmin();
        const queries: string[] = [
            Query.orderDesc('fecha'),
            Query.limit(100),
        ];

        if (filters?.categoria && filters.categoria !== "todos") {
            queries.push(Query.equal('categoria', filters.categoria));
        }

        if (filters?.fechaInicio) {
            queries.push(Query.greaterThanEqual('fecha', filters.fechaInicio));
        }

        if (filters?.fechaFin) {
            queries.push(Query.lessThanEqual('fecha', filters.fechaFin));
        }

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.GASTOS,
            queries
        );
        return response.documents as unknown as Gasto[];
    } catch (error: unknown) {
        console.error("Error obteniendo gastos:", error);
        return [];
    }
}

/**
 * Obtiene un gasto por su ID
 */
export async function obtenerGastoPorId(
    gastoId: string
): Promise<Gasto | null> {
    try {
        await requireAdmin();
        const response = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.GASTOS,
            gastoId
        );
        return response as unknown as Gasto;
    } catch (error: unknown) {
        console.error("Error obteniendo gasto:", error);
        return null;
    }
}

/**
 * Registra un nuevo gasto
 */
export async function registrarGasto(data: RegistrarGastoInput): Promise<{ success: boolean; data?: Gasto; error?: string }> {
    try {
        await requireAdmin();
        const gastoData = {
            ...data,
            createdAt: new Date().toISOString()
        };

        const newGasto = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.GASTOS,
            ID.unique(),
            gastoData
        );

        return { success: true, data: newGasto as unknown as Gasto };
    } catch (error: unknown) {
        console.error("Error registrando gasto:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al registrar gasto";
        return { success: false, error: errorMessage };
    }
}

/**
 * Actualiza un gasto existente
 */
export async function actualizarGasto(gastoId: string, data: Partial<RegistrarGastoInput>): Promise<{ success: boolean; data?: Gasto; error?: string }> {
    try {
        await requireAdmin();
        const updatedGasto = await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.GASTOS,
            gastoId,
            data
        );

        return { success: true, data: updatedGasto as unknown as Gasto };
    } catch (error: unknown) {
        console.error("Error actualizando gasto:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al actualizar gasto";
        return { success: false, error: errorMessage };
    }
}

/**
 * Elimina un gasto
 */
export async function eliminarGasto(gastoId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        await databases.deleteDocument(
            getDatabaseId(),
            COLLECTIONS.GASTOS,
            gastoId
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando gasto:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al eliminar gasto";
        return { success: false, error: errorMessage };
    }
}

/**
 * Obtiene estadísticas de gastos por categoría
 */
export async function obtenerGastosPorCategoria(): Promise<{ [key: string]: number }> {
    try {
        const gastos = await obtenerTodosLosGastos();
        const stats: { [key: string]: number } = {};

        gastos.forEach(gasto => {
            if (!stats[gasto.categoria]) {
                stats[gasto.categoria] = 0;
            }
            stats[gasto.categoria] += gasto.monto;
        });

        return stats;
    } catch (error) {
        console.error("Error obteniendo stats de gastos:", error);
        return {};
    }
}
