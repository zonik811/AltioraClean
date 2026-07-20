"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import type {
    Plan,
    Cliente,
    CrearPlanInput,
    ActualizarPlanInput,
    CreateResponse,
    UpdateResponse,
    DeleteResponse,
    PaginatedResponse,
    PaginationParams,
} from "@/types";

export async function obtenerPlanes(
    soloActivos?: boolean,
    pagination?: PaginationParams
): Promise<PaginatedResponse<Plan>> {
    try {
        await requireAdmin();
        const queries: string[] = [Query.orderDesc("createdAt")];

        if (soloActivos) {
            queries.push(Query.equal("activo", true));
        }

        const limit = pagination?.limit || 20;
        queries.push(Query.limit(limit));

        if (pagination?.cursor) {
            queries.push(Query.cursorAfter(pagination.cursor));
        }

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.PLANES,
            queries
        );

        return {
            documents: response.documents as unknown as Plan[],
            total: response.total,
            hasMore: response.documents.length === limit,
            nextCursor: response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : undefined,
        };
    } catch (error: unknown) {
        console.error("Error obteniendo planes:", error);
        return { documents: [], total: 0, hasMore: false };
    }
}

export async function obtenerPlanesPublicos(): Promise<Plan[]> {
    try {
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.PLANES,
            [Query.equal("activo", true), Query.limit(50)]
        );
        return response.documents as unknown as Plan[];
    } catch {
        return [];
    }
}

export async function obtenerPlan(id: string): Promise<Plan | null> {
    try {
        await requireAdmin();
        const plan = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.PLANES,
            id
        );
        return plan as unknown as Plan;
    } catch {
        return null;
    }
}

export async function crearPlan(data: CrearPlanInput): Promise<CreateResponse<Plan>> {
    try {
        await requireAdmin();
        const planData = {
            ...data,
            activo: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const newPlan = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.PLANES,
            ID.unique(),
            planData
        );

        return { success: true, data: newPlan as unknown as Plan };
    } catch (error: unknown) {
        console.error("Error creando plan:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al crear plan" };
    }
}

export async function actualizarPlan(id: string, data: ActualizarPlanInput): Promise<UpdateResponse> {
    try {
        await requireAdmin();
        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.PLANES,
            id,
            { ...data, updatedAt: new Date().toISOString() }
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error actualizando plan:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al actualizar plan" };
    }
}

export async function eliminarPlan(id: string): Promise<DeleteResponse> {
    try {
        await requireAdmin();
        await databases.deleteDocument(getDatabaseId(), COLLECTIONS.PLANES, id);
        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando plan:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al eliminar plan" };
    }
}

export async function asignarPlanACliente(clienteId: string, planId: string): Promise<UpdateResponse> {
    try {
        await requireAdmin();
        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            clienteId,
            {
                planId,
                planInicio: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            }
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error asignando plan:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al asignar plan" };
    }
}

export async function obtenerClientesPorPlan(planId: string): Promise<Cliente[]> {
    try {
        await requireAdmin();
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            [Query.equal("planId", planId), Query.limit(100)]
        );
        return response.documents as unknown as Cliente[];
    } catch {
        return [];
    }
}

export async function contarPlanesActivos(): Promise<number> {
    try {
        await requireAdmin();
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.PLANES,
            [Query.equal("activo", true), Query.limit(1)]
        );
        return response.total;
    } catch {
        return 0;
    }
}

export async function contarClientesConPlan(): Promise<number> {
    try {
        await requireAdmin();
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            [Query.isNotNull("planId"), Query.limit(1)]
        );
        return response.total;
    } catch {
        return 0;
    }
}

export async function cancelarPlan(clienteId: string): Promise<UpdateResponse> {
    try {
        await requireAdmin();
        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.CLIENTES,
            clienteId,
            {
                planId: null,
                planInicio: null,
                updatedAt: new Date().toISOString(),
            }
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error cancelando plan:", error);
        return { success: false, error: error instanceof Error ? error.message : "Error al cancelar plan" };
    }
}
