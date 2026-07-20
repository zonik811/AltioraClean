"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import type {
    Lead,
    CrearLeadInput,
    ActualizarLeadInput,
    CreateResponse,
    UpdateResponse,
    DeleteResponse,
    PaginatedResponse,
    PaginationParams,
} from "@/types";
import { EstadoLead, FuenteLead, TipoCliente, FrecuenciaCliente } from "@/types";

export async function obtenerLeads(
    filtros?: { estado?: string; fuente?: string },
    pagination?: PaginationParams
): Promise<PaginatedResponse<Lead>> {
    try {
        await requireAdmin();
        const queries: string[] = [];

        if (filtros?.estado) {
            queries.push(Query.equal("estado", filtros.estado));
        }
        if (filtros?.fuente) {
            queries.push(Query.equal("fuente", filtros.fuente));
        }

        queries.push(Query.orderDesc("createdAt"));

        const limit = pagination?.limit || 20;
        queries.push(Query.limit(limit));

        if (pagination?.cursor) {
            queries.push(Query.cursorAfter(pagination.cursor));
        }

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.LEADS,
            queries
        );

        return {
            documents: response.documents as unknown as Lead[],
            total: response.total,
            hasMore: response.documents.length === limit,
            nextCursor: response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : undefined,
        };
    } catch (error: unknown) {
        console.error("Error obteniendo leads:", error);
        return { documents: [], total: 0, hasMore: false };
    }
}

export async function obtenerLead(id: string): Promise<Lead | null> {
    try {
        await requireAdmin();
        const lead = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.LEADS,
            id
        );
        return lead as unknown as Lead;
    } catch (error: unknown) {
        console.error("Error obteniendo lead:", error);
        return null;
    }
}

export async function crearLead(
    data: CrearLeadInput
): Promise<CreateResponse<Lead>> {
    try {
        const leadData = {
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono,
            direccion: data.direccion || "",
            ciudad: data.ciudad || "",
            tipoPropiedad: data.tipoPropiedad || "",
            servicioInteresado: data.servicioInteresado || "",
            descripcion: data.descripcion || "",
            estado: EstadoLead.NUEVO,
            fuente: data.fuente || FuenteLead.WEB,
            fechaContacto: null,
            notasInternas: "",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const newLead = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.LEADS,
            ID.unique(),
            leadData
        );

        return { success: true, data: newLead as unknown as Lead };
    } catch (error: unknown) {
        console.error("Error creando lead:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al crear lead";
        return { success: false, error: errorMessage };
    }
}

export async function actualizarLead(
    id: string,
    data: ActualizarLeadInput
): Promise<UpdateResponse> {
    try {
        await requireAdmin();
        const updateData: Record<string, unknown> = {
            ...data,
            updatedAt: new Date().toISOString(),
        };

        if (data.estado === EstadoLead.CONTACTADO && !data.fechaContacto) {
            updateData.fechaContacto = new Date().toISOString();
        }

        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.LEADS,
            id,
            updateData
        );

        return { success: true };
    } catch (error: unknown) {
        console.error("Error actualizando lead:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al actualizar lead";
        return { success: false, error: errorMessage };
    }
}

export async function eliminarLead(id: string): Promise<DeleteResponse> {
    try {
        await requireAdmin();
        await databases.deleteDocument(
            getDatabaseId(),
            COLLECTIONS.LEADS,
            id
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando lead:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al eliminar lead";
        return { success: false, error: errorMessage };
    }
}

export async function convertirLeadACliente(leadId: string): Promise<CreateResponse<{ leadId: string; clienteId: string }>> {
    try {
        await requireAdmin();

        const lead = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.LEADS,
            leadId
        ) as unknown as Lead;

        const { crearCliente } = await import("./clientes");
        const result = await crearCliente({
            nombre: lead.nombre,
            telefono: lead.telefono,
            email: lead.email,
            direccion: lead.direccion || "",
            ciudad: lead.ciudad || "",
            tipoCliente: TipoCliente.RESIDENCIAL,
            frecuenciaPreferida: FrecuenciaCliente.UNICA,
        });

        if (!result.success || !result.data) {
            return { success: false, error: result.error || "Error al crear cliente" };
        }

        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.LEADS,
            leadId,
            {
                estado: EstadoLead.CONVERTIDO,
                updatedAt: new Date().toISOString(),
            }
        );

        return {
            success: true,
            data: { leadId, clienteId: result.data.$id },
        };
    } catch (error: unknown) {
        console.error("Error convirtiendo lead a cliente:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al convertir lead";
        return { success: false, error: errorMessage };
    }
}
