"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import type {
    Empleado,
    CrearEmpleadoInput,
    ActualizarEmpleadoInput,
    FiltrosEmpleados,
    CreateResponse,
    UpdateResponse,
    DeleteResponse,
    EstadisticasEmpleado,
    PaginatedResponse,
    PaginationParams,
} from "@/types";

/**
 * Obtiene la lista de empleados con filtros opcionales
 */
export async function obtenerEmpleados(
    filtros?: FiltrosEmpleados,
    pagination?: PaginationParams
): Promise<PaginatedResponse<Empleado>> {
    try {
        await requireAdmin();
        const queries: string[] = [];

        if (filtros?.cargo) {
            queries.push(Query.equal("cargo", filtros.cargo));
        }

        if (filtros?.activo !== undefined) {
            queries.push(Query.equal("activo", filtros.activo));
        }

        if (filtros?.especialidad) {
            queries.push(Query.contains("especialidades", filtros.especialidad));
        }

        queries.push(Query.orderDesc("createdAt"));

        const limit = pagination?.limit || 20;
        queries.push(Query.limit(limit));

        if (pagination?.cursor) {
            queries.push(Query.cursorAfter(pagination.cursor));
        }

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.EMPLEADOS,
            queries
        );

        return {
            documents: response.documents as unknown as Empleado[],
            total: response.total,
            hasMore: response.documents.length === limit,
            nextCursor: response.documents.length > 0 ? response.documents[response.documents.length - 1].$id : undefined,
        };
    } catch (error: unknown) {
        console.error("Error obteniendo empleados:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al obtener empleados";
        throw new Error(errorMessage);
    }
}

/**
 * Obtiene todos los empleados (sin paginación, para uso interno)
 */
export async function obtenerTodosLosEmpleados(
    filtros?: FiltrosEmpleados
): Promise<Empleado[]> {
    try {
        await requireAdmin();
        const queries: string[] = [];

        if (filtros?.cargo) {
            queries.push(Query.equal("cargo", filtros.cargo));
        }

        if (filtros?.activo !== undefined) {
            queries.push(Query.equal("activo", filtros.activo));
        }

        if (filtros?.especialidad) {
            queries.push(Query.contains("especialidades", filtros.especialidad));
        }

        queries.push(Query.orderDesc("createdAt"));
        queries.push(Query.limit(5000));

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.EMPLEADOS,
            queries
        );

        return response.documents as unknown as Empleado[];
    } catch (error: unknown) {
        console.error("Error obteniendo empleados:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al obtener empleados";
        throw new Error(errorMessage);
    }
}

/**
 * Obtiene un empleado por su ID
 */
export async function obtenerEmpleado(id: string): Promise<Empleado> {
    try {
        await requireAdmin();
        const empleado = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.EMPLEADOS,
            id
        );

        return empleado as unknown as Empleado;
    } catch (error: unknown) {
        console.error("Error obteniendo empleado:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al obtener empleado";
        throw new Error(errorMessage);
    }
}

/**
 * Obtiene un empleado por su email
 */
export async function obtenerEmpleadoPorEmail(email: string): Promise<Empleado | null> {
    try {
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.EMPLEADOS,
            [Query.equal("email", email), Query.limit(1)]
        );

        if (response.documents.length > 0) {
            return response.documents[0] as unknown as Empleado;
        }

        return null;
    } catch (error) {
        console.error("Error buscando empleado por email:", error);
        return null;
    }
}

/**
 * Crea un nuevo empleado
 */
export async function crearEmpleado(
    data: CrearEmpleadoInput
): Promise<CreateResponse<Empleado>> {
    try {
        await requireAdmin();
        const empleadoData = {
            nombre: data.nombre,
            apellido: data.apellido,
            documento: data.documento,
            telefono: data.telefono,
            email: data.email,
            direccion: data.direccion,
            fechaNacimiento: data.fechaNacimiento,
            fechaContratacion: data.fechaContratacion,
            cargo: data.cargo,
            especialidades: data.especialidades,
            tarifaPorHora: data.tarifaPorHora,
            modalidadPago: data.modalidadPago,
            activo: true,
            calificacionPromedio: 0,
            totalServicios: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const newEmpleado = await databases.createDocument(
            getDatabaseId(),
            COLLECTIONS.EMPLEADOS,
            ID.unique(),
            empleadoData
        );

        return {
            success: true,
            data: newEmpleado as unknown as Empleado,
        };
    } catch (error: unknown) {
        console.error("Error creando empleado:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al crear empleado";
        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Actualiza un empleado existente
 */
export async function actualizarEmpleado(
    id: string,
    data: ActualizarEmpleadoInput
): Promise<UpdateResponse> {
    try {
        await requireAdmin();
        const updateData = {
            ...data,
            updatedAt: new Date().toISOString(),
        };

        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.EMPLEADOS,
            id,
            updateData
        );

        return { success: true };
    } catch (error: unknown) {
        console.error("Error actualizando empleado:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al actualizar empleado";
        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Recalcula el número de servicios realizados por un empleado
 * contando las citas completadas en la base de datos
 */
export async function recalcularServiciosEmpleado(empleadoId: string): Promise<{ success: boolean; count?: number; error?: string }> {
    try {
        const citasCompletadas = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CITAS,
            [
                Query.equal('estado', 'completada'),
                Query.contains('empleadosAsignados', empleadoId)
            ]
        );

        const count = citasCompletadas.total;

        const updateResult = await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.EMPLEADOS,
            empleadoId,
            { serviciosRealizados: count }
        );

        return { success: true, count };
    } catch (error: unknown) {
        console.error(`Error recalculando servicios de empleado ${empleadoId}:`, error);
        const errorMessage = error instanceof Error ? error.message : "Error al recalcular servicios";
        return { success: false, error: errorMessage };
    }
}

/**
 * Elimina un empleado (soft delete - marca como inactivo)
 */
export async function eliminarEmpleado(id: string): Promise<DeleteResponse> {
    try {
        await requireAdmin();
        await databases.updateDocument(getDatabaseId(), COLLECTIONS.EMPLEADOS, id, {
            activo: false,
            updatedAt: new Date().toISOString(),
        });

        return { success: true };
    } catch (error: unknown) {
        console.error("Error eliminando empleado:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al eliminar empleado";
        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Obtiene las estadísticas de un empleado
 */
export async function obtenerEstadisticasEmpleado(
    empleadoId: string
): Promise<EstadisticasEmpleado> {
    try {
        // Obtener empleado
        const empleado = await obtenerEmpleado(empleadoId);

        // Obtener citas completadas
        const citasCompletadas = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CITAS,
            [
                Query.contains("empleadosAsignados", empleadoId),
                Query.equal("estado", "completada"),
            ]
        );

        // Calcular horas trabajadas este mes
        const inicioMes = new Date();
        inicioMes.setDate(1);
        inicioMes.setHours(0, 0, 0, 0);

        const citasEsteMes = citasCompletadas.documents.filter((cita) => {
            const fechaCita = new Date(cita.fechaCita as string);
            return fechaCita >= inicioMes;
        });

        // Calcular horas usando horasTrabajadas (default 8 si no existe)
        const horasTrabajadasMes = citasEsteMes.reduce((total: number, cita) => {
            return total + ((cita.horasTrabajadas as number) || 8);
        }, 0);

        // Obtener pagos realizados al empleado
        const pagos = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.PAGOS_EMPLEADOS,
            [
                Query.equal('empleadoId', empleadoId)
            ]
        );

        // Calcular total pagado
        const totalPagado = pagos.documents.reduce((total: number, pago) => {
            return total + ((pago.monto as number) || 0);
        }, 0);

        // Calcular total ganado histórico usando horasTrabajadas
        const totalGanado = citasCompletadas.documents.reduce((total: number, cita) => {
            const horas = (cita.horasTrabajadas as number) || 8;
            return total + (horas * empleado.tarifaPorHora);
        }, 0);

        // Pendiente por pagar = Total Ganado - Total Pagado
        const pendientePorPagar = totalGanado - totalPagado;

        return {
            totalServicios: empleado.totalServicios,
            horasTrabajadasMes,
            calificacionPromedio: empleado.calificacionPromedio,
            totalGanado,
            pendientePorPagar,
        };
    } catch (error: unknown) {
        console.error("Error obteniendo estadísticas:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al obtener estadísticas";
        throw new Error(errorMessage);
    }
}
