"use server";

import { databases } from "@/lib/appwrite-admin";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query, ID } from "node-appwrite";
import type {
    Empleado,
    CrearEmpleadoInput,
    ActualizarEmpleadoInput,
    FiltrosEmpleados,
    CreateResponse,
    UpdateResponse,
    DeleteResponse,
    EstadisticasEmpleado,
} from "@/types";

/**
 * Obtiene la lista de empleados con filtros opcionales
 */
export async function obtenerEmpleados(
    filtros?: FiltrosEmpleados
): Promise<Empleado[]> {
    try {
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

        // Ordenar por fecha de creación descendente
        queries.push(Query.orderDesc("createdAt"));

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.EMPLEADOS,
            queries
        );

        return response.documents as unknown as Empleado[];
    } catch (error: any) {
        console.error("Error obteniendo empleados:", error);
        throw new Error(error.message || "Error al obtener empleados");
    }
}

/**
 * Obtiene un empleado por su ID
 */
export async function obtenerEmpleado(id: string): Promise<Empleado> {
    try {
        const empleado = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.EMPLEADOS,
            id
        );

        return empleado as unknown as Empleado;
    } catch (error: any) {
        console.error("Error obteniendo empleado:", error);
        throw new Error(error.message || "Error al obtener empleado");
    }
}

/**
 * Crea un nuevo empleado
 */
export async function crearEmpleado(
    data: CrearEmpleadoInput
): Promise<CreateResponse<Empleado>> {
    try {
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
            DATABASE_ID,
            COLLECTIONS.EMPLEADOS,
            ID.unique(),
            empleadoData
        );

        return {
            success: true,
            data: newEmpleado as unknown as Empleado,
        };
    } catch (error: any) {
        console.error("Error creando empleado:", error);
        return {
            success: false,
            error: error.message || "Error al crear empleado",
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
        const updateData = {
            ...data,
            updatedAt: new Date().toISOString(),
        };

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.EMPLEADOS,
            id,
            updateData
        );

        return { success: true };
    } catch (error: any) {
        console.error("Error actualizando empleado:", error);
        return {
            success: false,
            error: error.message || "Error al actualizar empleado",
        };
    }
}

/**
 * Elimina un empleado (soft delete - marca como inactivo)
 */
export async function eliminarEmpleado(id: string): Promise<DeleteResponse> {
    try {
        await databases.updateDocument(DATABASE_ID, COLLECTIONS.EMPLEADOS, id, {
            activo: false,
            updatedAt: new Date().toISOString(),
        });

        return { success: true };
    } catch (error: any) {
        console.error("Error eliminando empleado:", error);
        return {
            success: false,
            error: error.message || "Error al eliminar empleado",
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
            DATABASE_ID,
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

        const citasEsteMes = citasCompletadas.documents.filter((cita: any) => {
            const fechaCita = new Date(cita.fechaCita);
            return fechaCita >= inicioMes;
        });

        const horasTrabajadasMes = citasEsteMes.reduce((total: number, cita: any) => {
            return total + cita.duracionEstimada / 60;
        }, 0);

        // Obtener pagos pendientes (esto se implementará cuando se haga el módulo de pagos)
        const pendientePorPagar = 0; // TODO: Calcular desde pagos_empleados

        // Calcular total ganado histórico
        const totalGanado = citasCompletadas.documents.reduce((total: number, cita: any) => {
            const horas = cita.duracionEstimada / 60;
            return total + horas * empleado.tarifaPorHora;
        }, 0);

        return {
            totalServicios: empleado.totalServicios,
            horasTrabajadasMes,
            calificacionPromedio: empleado.calificacionPromedio,
            totalGanado,
            pendientePorPagar,
        };
    } catch (error: any) {
        console.error("Error obteniendo estadísticas:", error);
        throw new Error(error.message || "Error al obtener estadísticas");
    }
}
