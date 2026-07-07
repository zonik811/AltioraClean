"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";

export interface RegistrarPagoInput {
    empleadoId: string;
    citaId?: string;
    periodo: string;
    concepto: string;
    monto: number;
    metodoPago: string;
    estado?: string;
    comprobante?: string;
    notas?: string;
    fechaPago: string;
}

export interface Pago {
    $id: string;
    empleadoId: string;
    citaId?: string;
    periodo: string;
    concepto: string;
    monto: number;
    metodoPago: string;
    estado: string;
    comprobante?: string;
    notas?: string;
    fechaPago: string;
    createdAt: string;
    updatedAt?: string;
}

/**
 * Obtiene un pago por ID
 */
export async function obtenerPagoPorId(id: string): Promise<Pago | null> {
    try {
        await requireAdmin();
        const pago = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.PAGOS_EMPLEADOS,
            id
        );
        return pago as unknown as Pago;
    } catch (error: unknown) {
        console.error("Error obteniendo pago:", error);
        return null;
    }
}

/**
 * Obtiene el historial de pagos de un empleado
 */
export async function obtenerPagosEmpleado(empleadoId: string): Promise<Pago[]> {
    try {
        await requireAdmin();
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.PAGOS_EMPLEADOS,
            [
                Query.equal('empleadoId', empleadoId),
                Query.orderDesc('fechaPago'),
                Query.limit(100)
            ]
        );

        return response.documents as unknown as Pago[];
    } catch (error: unknown) {
        console.error("Error obteniendo pagos:", error);
        return [];
    }
}

/**
 * Registra un nuevo pago a un empleado
 */
export async function registrarPago(data: RegistrarPagoInput): Promise<{ success: boolean; data?: Pago; error?: string }> {
    try {
        await requireAdmin();
        const pagoData = {
            ...data,
            estado: data.estado || 'pagado',
            createdAt: new Date().toISOString()
        };

        const newPago = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.PAGOS_EMPLEADOS,
            ID.unique(),
            pagoData
        );

        return { success: true, data: newPago as unknown as Pago };
    } catch (error: unknown) {
        console.error("Error registrando pago:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al registrar pago";
        return { success: false, error: errorMessage };
    }
}

/**
 * Actualiza un pago existente
 */
export async function actualizarPago(id: string, data: Partial<RegistrarPagoInput>): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.PAGOS_EMPLEADOS,
            id,
            data
        );
        return { success: true };
    } catch (error: unknown) {
        console.error("Error actualizando pago:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al actualizar pago";
        return { success: false, error: errorMessage };
    }
}

/**
 * Elimina un pago
 */
export async function eliminarPago(pagoId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        await databases.deleteDocument(
            getDatabaseId(),
            COLLECTIONS.PAGOS_EMPLEADOS,
            pagoId
        );

        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando pago:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al eliminar pago";
        return { success: false, error: errorMessage };
    }
}
