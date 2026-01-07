"use server";

import { databases } from "@/lib/appwrite-admin";
import { DATABASE_ID, COLLECTIONS } from "@/lib/appwrite";
import { Query, ID } from "node-appwrite";
import {
    EstadoCita,
    TipoPropiedad,
    TipoCliente,
    FrecuenciaCliente,
} from "@/types";

import type {
    Cita,
    Cliente,
    CrearCitaInput,
    ActualizarCitaInput,
    FiltrosCitas,
    CreateResponse,
    UpdateResponse,
} from "@/types";
import { crearCliente, obtenerClientePorTelefono, actualizarCliente } from "./clientes";

/**
 * Obtiene la lista de citas con filtros opcionales
 */
export async function obtenerCitas(filtros?: FiltrosCitas): Promise<Cita[]> {
    try {
        const queries: string[] = [];

        if (filtros?.estado) {
            queries.push(Query.equal("estado", filtros.estado));
        }

        if (filtros?.empleadoId) {
            queries.push(Query.contains("empleadosAsignados", filtros.empleadoId));
        }

        if (filtros?.fechaInicio) {
            queries.push(Query.greaterThanEqual("fechaCita", filtros.fechaInicio));
        }

        if (filtros?.fechaFin) {
            queries.push(Query.lessThanEqual("fechaCita", filtros.fechaFin));
        }

        if (filtros?.clienteId) {
            queries.push(Query.equal("clienteId", filtros.clienteId));
        }

        // Ordenar por fecha de cita descendente
        queries.push(Query.orderDesc("fechaCita"));
        queries.push(Query.limit(100));

        const response = await databases.listDocuments(
            DATABASE_ID,
            COLLECTIONS.CITAS,
            queries
        );

        return response.documents as unknown as Cita[];
    } catch (error: any) {
        console.error("Error obteniendo citas:", error);
        throw new Error(error.message || "Error al obtener citas");
    }
}

/**
 * Obtiene una cita por su ID
 */
export async function obtenerCita(id: string): Promise<Cita> {
    try {
        const cita = await databases.getDocument(
            DATABASE_ID,
            COLLECTIONS.CITAS,
            id
        );

        return cita as unknown as Cita;
    } catch (error: any) {
        console.error("Error obteniendo cita:", error);
        throw new Error(error.message || "Error al obtener cita");
    }
}

/**
 * Crea una nueva cita
 */
export async function crearCita(
    data: CrearCitaInput
): Promise<CreateResponse<Cita>> {
    try {
        let clienteId = data.clienteId;

        // Si no hay clienteId, buscar o crear cliente
        if (!clienteId) {
            const clienteExistente = await obtenerClientePorTelefono(data.clienteTelefono);

            if (clienteExistente) {
                clienteId = clienteExistente.$id;
            } else {
                // Crear nuevo cliente
                const nuevoCliente = await crearCliente({
                    nombre: data.clienteNombre,
                    telefono: data.clienteTelefono,
                    email: data.clienteEmail,
                    direccion: data.direccion,
                    ciudad: data.ciudad,
                    tipoCliente: data.tipoPropiedad === TipoPropiedad.OFICINA || data.tipoPropiedad === TipoPropiedad.LOCAL
                        ? TipoCliente.COMERCIAL
                        : TipoCliente.RESIDENCIAL,
                    frecuenciaPreferida: FrecuenciaCliente.UNICA,
                });

                if (nuevoCliente.success && nuevoCliente.data) {
                    clienteId = nuevoCliente.data.$id;
                }
            }
        }

        const citaData = {
            servicioId: data.servicioId,
            clienteId: clienteId || "",
            clienteNombre: data.clienteNombre,
            clienteTelefono: data.clienteTelefono,
            clienteEmail: data.clienteEmail,
            direccion: data.direccion,
            ciudad: data.ciudad,
            tipoPropiedad: data.tipoPropiedad,
            metrosCuadrados: data.metrosCuadrados,
            habitaciones: data.habitaciones,
            banos: data.banos,
            fechaCita: data.fechaCita,
            horaCita: data.horaCita,
            duracionEstimada: data.duracionEstimada,
            empleadosAsignados: data.empleadosAsignados || [],
            estado: EstadoCita.PENDIENTE,
            precioCliente: data.precioCliente,
            precioAcordado: data.precioAcordado || data.precioCliente,
            metodoPago: data.metodoPago,
            pagadoPorCliente: false,
            detallesAdicionales: data.detallesAdicionales,
            notasInternas: data.notasInternas,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        const newCita = await databases.createDocument(
            DATABASE_ID,
            COLLECTIONS.CITAS,
            ID.unique(),
            citaData
        );

        // Actualizar estadísticas del cliente
        if (clienteId) {
            await databases.getDocument(DATABASE_ID, COLLECTIONS.CLIENTES, clienteId)
                .then(async (cliente: any) => {
                    await actualizarCliente(clienteId!, {
                        totalServicios: cliente.totalServicios + 1,
                    });
                })
                .catch(() => { });
        }

        return {
            success: true,
            data: newCita as unknown as Cita,
        };
    } catch (error: any) {
        console.error("Error creando cita:", error);
        return {
            success: false,
            error: error.message || "Error al crear cita",
        };
    }
}

/**
 * Actualiza una cita existente
 */
export async function actualizarCita(
    id: string,
    data: ActualizarCitaInput
): Promise<UpdateResponse> {
    try {
        const updateData: any = {
            ...data,
            updatedAt: new Date().toISOString(),
        };

        // Si se completa la cita, agregar fecha de completado
        if (data.estado === EstadoCita.COMPLETADA) {
            updateData.completedAt = new Date().toISOString();
        }

        await databases.updateDocument(
            DATABASE_ID,
            COLLECTIONS.CITAS,
            id,
            updateData
        );

        return { success: true };
    } catch (error: any) {
        console.error("Error actualizando cita:", error);
        return {
            success: false,
            error: error.message || "Error al actualizar cita",
        };
    }
}

/**
 * Cambia el estado de una cita
 */
export async function cambiarEstadoCita(
    id: string,
    estado: EstadoCita
): Promise<UpdateResponse> {
    return actualizarCita(id, { estado });
}

/**
 * Asigna empleados a una cita
 */
export async function asignarEmpleados(
    citaId: string,
    empleadoIds: string[]
): Promise<UpdateResponse> {
    return actualizarCita(citaId, { empleadosAsignados: empleadoIds });
}

/**
 * Obtiene las citas del día actual
 */
export async function obtenerCitasHoy(): Promise<Cita[]> {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    return obtenerCitas({
        fechaInicio: hoy.toISOString().split("T")[0],
        fechaFin: manana.toISOString().split("T")[0],
    });
}

/**
 * Obtiene las citas de esta semana
 */
export async function obtenerCitasSemana(): Promise<Cita[]> {
    const hoy = new Date();
    const inicioSemana = new Date(hoy);
    inicioSemana.setDate(hoy.getDate() - hoy.getDay());
    inicioSemana.setHours(0, 0, 0, 0);

    const finSemana = new Date(inicioSemana);
    finSemana.setDate(inicioSemana.getDate() + 7);

    return obtenerCitas({
        fechaInicio: inicioSemana.toISOString().split("T")[0],
        fechaFin: finSemana.toISOString().split("T")[0],
    });
}
