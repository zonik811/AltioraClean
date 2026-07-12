"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin, requireAuth } from "@/lib/auth-server";
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
    PaginatedResponse,
    PaginationParams,
} from "@/types";
import { crearCliente, obtenerClientePorTelefono, actualizarCliente, obtenerClientePorEmail } from "@/lib/actions/clientes";
import { registrarPuntos } from "@/lib/actions/puntos";
import { crearDireccion } from "@/lib/actions/direcciones";

/**
 * Obtiene la lista de citas con paginación cursor-based
 */
export async function obtenerCitasPaginadas(
    filtros?: FiltrosCitas,
    paginacion?: PaginationParams
): Promise<PaginatedResponse<Cita>> {
    try {
        await requireAdmin();
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

        if (filtros?.pagadoPorCliente !== undefined) {
            queries.push(Query.equal("pagadoPorCliente", filtros.pagadoPorCliente));
        }

        queries.push(Query.orderDesc("fechaCita"));

        if (paginacion?.cursor) {
            queries.push(Query.cursorAfter(paginacion.cursor));
        }

        const limit = paginacion?.limit || 20;
        queries.push(Query.limit(limit + 1));

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CITAS,
            queries
        );

        const documents = response.documents.map((doc: Record<string, unknown>) => ({
            id: doc.$id as string,
            ...doc,
        })) as unknown as Cita[];

        const hasMore = documents.length > limit;
        if (hasMore) documents.pop();

        return {
            documents,
            total: response.total,
            hasMore,
            nextCursor: hasMore ? documents[documents.length - 1]?.$id : undefined,
        };
    } catch (error: unknown) {
        console.error("Error obteniendo citas paginadas:", error);
        throw new Error(error instanceof Error ? error.message : "Error al obtener citas");
    }
}

/**
 * Obtiene la lista de citas con filtros opcionales
 */
export async function obtenerCitas(filtros?: FiltrosCitas): Promise<Cita[]> {
    try {
        await requireAdmin();
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

        if (filtros?.pagadoPorCliente !== undefined) {
            queries.push(Query.equal("pagadoPorCliente", filtros.pagadoPorCliente));
        }

        // Ordenar por fecha de cita descendente
        queries.push(Query.orderDesc("fechaCita"));
        queries.push(Query.limit(100));

        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CITAS,
            queries
        );

        return response.documents.map((doc: Record<string, unknown>) => ({
            id: doc.$id as string,
            ...doc,
        })) as unknown as Cita[];
    } catch (error: unknown) {
        console.error("Error obteniendo citas:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al obtener citas";
        throw new Error(errorMessage);
    }
}

/**
 * Obtiene las citas de un cliente específico por su email
 */
export async function obtenerMisCitas(email: string): Promise<Cita[]> {
    try {
        const authResult = await requireAuth();
        // Si no hay sesión, permitir ver las citas del email proporcionado
        // (la verificación real se hace en el layout del cliente)
        if (authResult && authResult.email !== email) {
            return [];
        }
        const response = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.CITAS,
            [
                Query.equal("clienteEmail", email),
                Query.orderDesc("fechaCita"), // Las más recientes primero
            ]
        );

        return response.documents.map((doc: Record<string, unknown>) => ({
            id: doc.$id as string,
            ...doc,
        })) as unknown as Cita[];
    } catch (error: unknown) {
        console.error("Error obteniendo mis citas:", error);
        return [];
    }
}

/**
 * Obtiene una cita por su ID
 */
export async function obtenerCita(id: string): Promise<Cita> {
    try {
        await requireAuth();
        const cita = await databases.getDocument(
            getDatabaseId(),
            COLLECTIONS.CITAS,
            id
        );

        return cita as unknown as Cita;
    } catch (error: unknown) {
        console.error("Error obteniendo cita:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al obtener cita";
        throw new Error(errorMessage);
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
        const normalizedEmail = data.clienteEmail?.trim().toLowerCase();
        const normalizedPhone = data.clienteTelefono.trim();

        // Si no hay clienteId, buscar o crear cliente
        if (!clienteId) {
            // 1. Intentar buscar por Email (Prioridad para usuarios registrados)
            if (normalizedEmail) {
                const clientePorEmail = await obtenerClientePorEmail(normalizedEmail);
                if (clientePorEmail) {
                    clienteId = clientePorEmail.$id;
                }
            }

            // 2. Si no encontró por email, intentar por teléfono
            if (!clienteId && normalizedPhone) {
                const clientePorTelefono = await obtenerClientePorTelefono(normalizedPhone);
                if (clientePorTelefono) {
                    clienteId = clientePorTelefono.$id;
                }
            }

            // 3. Si AÚN no hay clienteId, crear nuevo cliente
            if (!clienteId) {
                const nuevoCliente = await crearCliente({
                    nombre: data.clienteNombre,
                    telefono: data.clienteTelefono,
                    email: data.clienteEmail,
                    direccion: data.direccion,
                    ciudad: data.ciudad,
                    tipoCliente: TipoCliente.RESIDENCIAL,
                    frecuenciaPreferida: FrecuenciaCliente.UNICA,
                });
                if (nuevoCliente.success && nuevoCliente.data) {
                    clienteId = nuevoCliente.data.$id;
                }
            }
        }

        // Guardar dirección SOLO si:
        // 1. Hay clienteId
        // 2. Hay dirección y ciudad válidas  
        // 3. El usuario NO seleccionó una dirección guardada (no viene direccionId)
        const isUsingExistingAddress = !!((data as unknown as Record<string, unknown>).direccionId);

        if (clienteId && data.direccion && data.ciudad && !isUsingExistingAddress) {
            try {
                await crearDireccion({
                    clienteId: clienteId,
                    nombre: `${data.tipoPropiedad} - ${data.direccion}`,
                    direccion: data.direccion,
                    ciudad: data.ciudad,
                    barrio: (data as unknown as Record<string, unknown>).barrio as string | undefined,
                    tipo: data.tipoPropiedad
                });
            } catch (direccionError) {
                console.error("Error guardando dirección:", direccionError);
            }
        }

        const citaData = {
            servicioId: data.servicioId || "limpieza-general",
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
            getDatabaseId(),
            COLLECTIONS.CITAS,
            ID.unique(),
            citaData
        );

        // Actualizar estadísticas del cliente
        if (clienteId) {
            await databases.getDocument(getDatabaseId(), COLLECTIONS.CLIENTES, clienteId)
                .then(async (cliente) => {
                    await actualizarCliente(clienteId!, {
                        totalServicios: (cliente.totalServicios || 0) + 1,
                    });
                })
                .catch(() => { });
        }

        return {
            success: true,
            data: newCita as unknown as Cita,
        };
    } catch (error: unknown) {
        console.error("Error creando cita:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al crear cita";
        return {
            success: false,
            error: errorMessage,
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
        await requireAdmin();
        const updateData: Record<string, unknown> = {
            ...data,
            updatedAt: new Date().toISOString(),
        };

        // Get current appointment state BEFORE updating
        const currentCita = await databases.getDocument(getDatabaseId(), COLLECTIONS.CITAS, id);
        const wasAlreadyCompleted = currentCita.estado === EstadoCita.COMPLETADA;

        // Si se completa la cita (y NO estaba completada antes), agregar fecha de completado y calcular puntos
        if (data.estado === EstadoCita.COMPLETADA && !wasAlreadyCompleted) {
            updateData.completedAt = new Date().toISOString();

            // 2. Registrar puntos y actualizar cliente (Refactorizado para usar action centralizada)
            try {
                const descripcionServicio = data.servicioId || currentCita.servicioId || 'General';
                const precioServicio = currentCita.precioCliente || currentCita.precioAcordado || 0;

                if (currentCita.clienteId) {
                    const puntosGanados = Math.max(1, Math.floor(precioServicio / 50000));
                    await registrarPuntos({
                        clienteId: currentCita.clienteId,
                        puntos: puntosGanados,
                        motivo: `Servicio Completado: ${descripcionServicio} ($${precioServicio.toLocaleString("es-CO")})`,
                        referenciaId: id,
                        precioServicio: precioServicio
                    });
                }

                // 3. Actualizar contador de servicios de empleados asignados
                if (currentCita.empleadosAsignados && Array.isArray(currentCita.empleadosAsignados)) {
                    for (const empleadoId of currentCita.empleadosAsignados) {
                        try {
                            const empleado = await databases.getDocument(getDatabaseId(), COLLECTIONS.EMPLEADOS, empleadoId);
                            await databases.updateDocument(
                                getDatabaseId(),
                                COLLECTIONS.EMPLEADOS,
                                empleadoId,
                                {
                                    serviciosRealizados: (empleado.serviciosRealizados || 0) + 1
                                }
                            );
                        } catch (empError) {
                            console.warn(`Error updating employee ${empleadoId}:`, empError);
                        }
                    }
                }
            } catch (errorPuntos) {
                console.error("Error registrando puntos en actualizarCita:", errorPuntos);
            }
        }

        // Update the appointment
        await databases.updateDocument(
            getDatabaseId(),
            COLLECTIONS.CITAS,
            id,
            updateData
        );

        // RECALCULAR ESTADÍSTICAS AUTOMÁTICAMENTE
        // Esto asegura que los contadores siempre reflejen la realidad de la BD

        // 1. Si cambiaron los empleados asignados, recalcular AMBOS sets (antiguos + nuevos)
        if (data.empleadosAsignados) {
            const oldEmpleados = currentCita.empleadosAsignados || [];
            const newEmpleados = data.empleadosAsignados || [];

            // Combinar ambos sets y eliminar duplicados
            const allAffectedEmpleados = [...new Set([...oldEmpleados, ...newEmpleados])];

            for (const empleadoId of allAffectedEmpleados) {
                try {
                    const { recalcularServiciosEmpleado } = await import('./empleados');
                    await recalcularServiciosEmpleado(empleadoId);
                } catch (recalcError) {
                    console.warn(`Error recalculando empleado ${empleadoId}:`, recalcError);
                }
            }
        }

        // 2. Si la cita cambió a completada, recalcular el cliente
        if (data.estado === EstadoCita.COMPLETADA && currentCita.clienteId) {
            try {
                const { recalcularServiciosCliente } = await import('./clientes');
                await recalcularServiciosCliente(currentCita.clienteId);
            } catch (recalcError) {
                console.warn(`Error recalculando cliente:`, recalcError);
            }
        }

        return { success: true };
    } catch (error: unknown) {
        console.error("Error actualizando cita:", error);
        const errorMessage = error instanceof Error ? error.message : "Error al actualizar cita";
        return {
            success: false,
            error: errorMessage,
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
    // Ajustar a zona horaria local si es necesario, pero por ahora usamos UTC date string simple
    // o simplemente la fecha actual. Appwrite guarda en UTC, pero filtramos por string YYYY-MM-DD
    const dateStr = hoy.toISOString().split("T")[0];

    return obtenerCitas({
        fechaInicio: dateStr,
        fechaFin: dateStr
    });
}

/**
 * Obtiene las citas de la semana actual
 */
export async function obtenerCitasSemana(): Promise<Cita[]> {
    const hoy = new Date();
    const firstDay = new Date(hoy.setDate(hoy.getDate() - hoy.getDay())); // Domingo
    const dateStr = firstDay.toISOString().split("T")[0];

    return obtenerCitas({
        fechaInicio: dateStr
    });
}
