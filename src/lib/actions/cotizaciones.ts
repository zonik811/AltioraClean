"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import type {
    Cotizacion,
    CrearCotizacionInput,
    ActualizarCotizacionInput,
    CreateResponse,
    UpdateResponse,
    DeleteResponse,
    PaginatedResponse,
    PaginationParams,
} from "@/types";
import { EstadoCotizacion, MetodoPago, TipoPropiedad } from "@/types";

export async function obtenerCotizaciones(
    filtros?: { estado?: string; leadId?: string },
    pagination?: PaginationParams
): Promise<PaginatedResponse<Cotizacion>> {
    try {
        await requireAdmin();
        const queries: string[] = [];

        if (filtros?.estado) {
            queries.push(Query.equal("estado", filtros.estado));
        }
        if (filtros?.leadId) {
            queries.push(Query.equal("leadId", filtros.leadId));
        }

        queries.push(Query.orderDesc("createdAt"));

        const limit = pagination?.limit || 20;
        queries.push(Query.limit(limit));

        if (pagination?.cursor) {
            queries.push(Query.cursorAfter(pagination.cursor));
        }

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.COTIZACIONES,
            queries
        );

        return {
            documents: response.documents as unknown as Cotizacion[],
            total: response.total,
            hasMore: response.documents.length === limit,
            nextCursor: response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : undefined,
        };
    } catch (error: unknown) {
        console.error("Error obteniendo cotizaciones:", error);
        return { documents: [], total: 0, hasMore: false };
    }
}

export async function obtenerCotizacionesPorLead(leadId: string): Promise<Cotizacion[]> {
    try {
        await requireAdmin();
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.COTIZACIONES,
            [
                Query.equal("leadId", leadId),
                Query.orderDesc("createdAt"),
                Query.limit(50),
            ]
        );
        return response.documents as unknown as Cotizacion[];
    } catch {
        return [];
    }
}

export async function obtenerCotizacion(id: string): Promise<Cotizacion | null> {
    try {
        await requireAdmin();
        const cotizacion = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.COTIZACIONES,
            id
        );
        return cotizacion as unknown as Cotizacion;
    } catch (error: unknown) {
        console.error("Error obteniendo cotizacion:", error);
        return null;
    }
}

export async function crearCotizacion(
    data: CrearCotizacionInput
): Promise<CreateResponse<Cotizacion>> {
    try {
        await requireAdmin();
        const validezDias = data.validezDias || 30;
        const fechaCreacion = new Date();
        const fechaVencimiento = new Date(fechaCreacion);
        fechaVencimiento.setDate(fechaVencimiento.getDate() + validezDias);

        const cotizacionData = {
            leadId: data.leadId || "",
            clienteId: data.clienteId || "",
            nombre: data.nombre,
            email: data.email,
            telefono: data.telefono,
            direccion: data.direccion || "",
            ciudad: data.ciudad || "",
            servicioId: data.servicioId || "",
            servicioNombre: data.servicioNombre || "",
            servicioDescripcion: data.servicioDescripcion || "",
            items: data.items,
            subtotal: data.subtotal,
            descuento: data.descuento || 0,
            total: data.total,
            notas: data.notas || "",
            terminos: data.terminos || "",
            validezDias,
            estado: data.estado || EstadoCotizacion.BORRADOR,
            pdfGenerado: false,
            fechaVencimiento: fechaVencimiento.toISOString(),
            createdAt: fechaCreacion.toISOString(),
            updatedAt: fechaCreacion.toISOString(),
        };

        const newCotizacion = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.COTIZACIONES,
            ID.unique(),
            cotizacionData
        );

        return { success: true, data: newCotizacion as unknown as Cotizacion };
    } catch (error: unknown) {
        console.error("Error creando cotización:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al crear cotización";
        return { success: false, error: errorMessage };
    }
}

export async function actualizarCotizacion(
    id: string,
    data: ActualizarCotizacionInput
): Promise<UpdateResponse> {
    try {
        await requireAdmin();
        const updateData: Record<string, unknown> = {
            ...data,
            updatedAt: new Date().toISOString(),
        };

        if (data.validezDias) {
            const vencimiento = new Date();
            vencimiento.setDate(vencimiento.getDate() + data.validezDias);
            updateData.fechaVencimiento = vencimiento.toISOString();
        }

        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.COTIZACIONES,
            id,
            updateData
        );

        return { success: true };
    } catch (error: unknown) {
        console.error("Error actualizando cotización:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al actualizar cotización";
        return { success: false, error: errorMessage };
    }
}

export async function eliminarCotizacion(id: string): Promise<DeleteResponse> {
    try {
        await requireAdmin();
        await databases.deleteDocument(
            getDatabaseId(),
            COLLECTIONS.COTIZACIONES,
            id
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando cotización:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al eliminar cotización";
        return { success: false, error: errorMessage };
    }
}

export async function convertirCotizacionEnCita(
    cotizacionId: string,
    fechaCita: string,
    horaCita: string
): Promise<CreateResponse<{ cotizacionId: string; citaId: string }>> {
    try {
        await requireAdmin();

        const cotizacion = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.COTIZACIONES,
            cotizacionId
        ) as unknown as Cotizacion;

        const { crearCita } = await import("./citas");
        const result = await crearCita({
            servicioId: cotizacion.servicioId || "",
            clienteId: cotizacion.clienteId || undefined,
            clienteNombre: cotizacion.nombre,
            clienteTelefono: cotizacion.telefono,
            clienteEmail: cotizacion.email,
            direccion: cotizacion.direccion || "",
            ciudad: cotizacion.ciudad || "",
            tipoPropiedad: TipoPropiedad.CASA,
            fechaCita,
            horaCita,
            duracionEstimada: 120,
            precioCliente: cotizacion.total,
            metodoPago: MetodoPago.POR_COBRAR,
        });

        if (!result.success || !result.data) {
            return { success: false, error: result.error || "Error al crear cita" };
        }

        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.COTIZACIONES,
            cotizacionId,
            {
                estado: EstadoCotizacion.CONVERTIDA,
                updatedAt: new Date().toISOString(),
            }
        );

        return {
            success: true,
            data: { cotizacionId, citaId: result.data.$id },
        };
    } catch (error: unknown) {
        console.error("Error convirtiendo cotización a cita:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al convertir cotización";
        return { success: false, error: errorMessage };
    }
}

export async function marcarPDFGenerado(id: string): Promise<UpdateResponse> {
    try {
        await requireAdmin();
        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.COTIZACIONES,
            id,
            {
                pdfGenerado: true,
                updatedAt: new Date().toISOString(),
            }
        );
        return { success: true };
    } catch {
        return { success: false, error: "Error al marcar PDF como generado" };
    }
}
