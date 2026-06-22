"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";

export interface RegistrarPagoClienteInput {
    citaId: string;
    clienteId: string; // Para redundancia/busqueda rápida
    monto: number;
    metodoPago: string;
    estado?: string;
    fechaPago: string;
    comprobante?: string;
    notas?: string;
}

export interface ActualizarPagoClienteInput extends Partial<RegistrarPagoClienteInput> {
    id: string;
}

export interface PagoCliente {
    $id: string;
    citaId: string;
    clienteId: string;
    monto: number;
    metodoPago: string;
    estado: string;
    fechaPago: string;
    comprobante?: string;
    notas?: string;
    createdAt: string;
}

/**
 * Obtiene todos los pagos de clientes
 */
export async function obtenerPagosClientes(): Promise<PagoCliente[]> {
    try {
        await requireAdmin();
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.PAGOS_CLIENTES,
            [
                Query.orderDesc('fechaPago'),
                Query.limit(100)
            ]
        );
        return response.documents as unknown as PagoCliente[];
    } catch (error: unknown) {
        console.error("Error obteniendo pagos de clientes:", error);
        return [];
    }
}

/**
 * Recalcula si una cita está totalmente pagada basándose en la suma de sus pagos
 */
async function recalcularEstadoPagoCita(citaId: string) {
    if (!citaId) return;

    try {
        // 1. Obtener la cita para saber el precio total
        const cita = await databases.getDocument(getDatabaseId(), COLLECTIONS.CITAS, citaId);
        const precioTotal = cita.precioAcordado || cita.precioCliente || 0;

        // 2. Obtener TODOS los pagos asociados a esta cita
        const pagos = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.PAGOS_CLIENTES,
            [
                Query.equal('citaId', citaId)
            ]
        );

        // 3. Sumar montos
        const totalPagado = pagos.documents.reduce((sum: number, pago) => sum + ((pago.monto as number) || 0), 0);

        // 4. Determinar estado
        // Consideramos pagado si el total pagado es mayor o igual al precio (con un margen de error pequeño por decimales si fuera necesario, aqui entero)
        const isPagado = totalPagado >= precioTotal;

        if (cita.pagadoPorCliente !== isPagado) {
            await databases.updateDocument(
                getDatabaseId(),
                COLLECTIONS.CITAS,
                citaId,
                {
                    pagadoPorCliente: isPagado,
                    updatedAt: new Date().toISOString() // Force refresh
                }
            );
        }

    } catch (error) {
        console.error(`Error recalculando estado de cita ${citaId}:`, error);
    }
}

/**
 * Registra un pago de cliente
 */
export async function registrarPagoCliente(data: RegistrarPagoClienteInput): Promise<{ success: boolean; data?: PagoCliente; error?: string }> {
    try {
        await requireAdmin();
        const pagoData = {
            citaId: data.citaId,
            clienteId: data.clienteId,
            monto: data.monto,
            metodoPago: data.metodoPago,
            estado: data.estado || 'pagado',
            fechaPago: data.fechaPago,
            notas: data.notas,
            createdAt: new Date().toISOString()
        };

        const newPago = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.PAGOS_CLIENTES,
            ID.unique(),
            pagoData
        );

        await recalcularEstadoPagoCita(data.citaId);

        return { success: true, data: newPago as unknown as PagoCliente };
    } catch (error: unknown) {
        console.error("Error registrando pago de cliente:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al registrar pago";
        return { success: false, error: errorMessage };
    }
}

/**
 * Actualiza un pago de cliente existente
 */
export async function actualizarPagoCliente(data: ActualizarPagoClienteInput): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        const { id, ...updateData } = data;

        // Obtener pago original para saber citaId (por si cambió, aunque inusual)
        const pagoOriginal = await databases.getDocument(getDatabaseId(), COLLECTIONS.PAGOS_CLIENTES, id);

        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.PAGOS_CLIENTES,
            id,
            updateData
        );

        // Recalcular estado de la cita (usando citaId del pago actualizado o del original)
        const targetCitaId = (updateData.citaId as string) || pagoOriginal.citaId;
        await recalcularEstadoPagoCita(targetCitaId);

        return { success: true };
    } catch (error: unknown) {
        console.error("Error actualizando pago:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al actualizar pago";
        return { success: false, error: errorMessage };
    }
}

/**
 * Elimina un pago de cliente
 */
export async function eliminarPagoCliente(pagoId: string): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();
        const pago = await databases.getDocument(getDatabaseId(), COLLECTIONS.PAGOS_CLIENTES, pagoId);
        const citaId = pago.citaId;

        await databases.deleteDocument(
            getDatabaseId(),
            COLLECTIONS.PAGOS_CLIENTES,
            pagoId
        );

        if (citaId) {
            await recalcularEstadoPagoCita(citaId);
        }

        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando pago:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al eliminar pago";
        return { success: false, error: errorMessage };
    }
}
