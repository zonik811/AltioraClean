"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import { Cita, Empleado, Gasto } from "@/types";
import { obtenerTodosLosEmpleados } from "./empleados";

export interface ReporteFinancieroMes {
    mes: string;
    ingresos: number;
    gastos: number;
    beneficio: number;
}

export interface EstadisticaServicio {
    nombre: string;
    cantidad: number;
    fill?: string;
}

export interface RendimientoEmpleado {
    empleadoId: string;
    nombre: string;
    serviciosCompletados: number;
    totalGenerado: number; // New: Value of completed services
    calificacionPromedio: number;
}

export interface ClienteTop {
    clienteId: string; // Phone number or ID
    nombre: string;
    totalGastado: number;
    serviciosContratados: number;
}

export interface CarteraEstado {
    totalPorCobrar: number;
    citasPendientesPago: number;
    antiguedadPromedioDias: number;
}

export interface EstadoNomina {
    totalGenerado: number; // Total value of completed services attributed to employees
    totalPagado: number; // Placeholder: Actual payments made
    totalPendiente: number;
}

/**
 * Helper to filter dates
 */
const getDateFilter = (start?: Date, end?: Date, field: string = "createdAt") => {
    const filters = [];
    if (start) filters.push(Query.greaterThanEqual(field, start.toISOString()));
    if (end) filters.push(Query.lessThanEqual(field, end.toISOString()));
    return filters;
};

/**
 * Obtiene el resumen financiero mensual
 */
export async function obtenerResumenFinanciero(year?: number): Promise<ReporteFinancieroMes[]> {
    await requireAdmin();
    const targetYear = year || new Date().getFullYear();
    const startDate = new Date(targetYear, 0, 1).toISOString();
    const endDate = new Date(targetYear, 11, 31, 23, 59, 59).toISOString();

    try {
        const [citasResponse, gastosResponse] = await Promise.all([
            databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, [
                Query.equal("estado", "completada"),
                Query.equal("pagadoPorCliente", true),
                Query.greaterThanEqual("fechaCita", startDate),
                Query.lessThanEqual("fechaCita", endDate),
                Query.limit(5000)
            ]),
            databases.listDocuments(getDatabaseId(), COLLECTIONS.GASTOS, [
                Query.greaterThanEqual("fecha", startDate),
                Query.lessThanEqual("fecha", endDate),
                Query.limit(5000)
            ])
        ]);

        const citas = citasResponse.documents as unknown as Cita[];
        const gastos = gastosResponse.documents as unknown as Gasto[];

        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const reporte = meses.map(mes => ({ mes, ingresos: 0, gastos: 0, beneficio: 0 }));

        citas.forEach(cita => {
            const mesIndex = new Date(cita.fechaCita).getMonth();
            if (mesIndex >= 0 && mesIndex < 12) {
                reporte[mesIndex].ingresos += cita.precioAcordado;
            }
        });

        gastos.forEach(gasto => {
            const mesIndex = new Date(gasto.fecha).getMonth();
            if (mesIndex >= 0 && mesIndex < 12) {
                reporte[mesIndex].gastos += gasto.monto;
            }
        });

        reporte.forEach(item => { item.beneficio = item.ingresos - item.gastos; });
        return reporte;
    } catch (error) {
        console.error("Error generando reporte financiero:", error);
        return [];
    }
}

/**
 * Obtiene estadísticas de servicios (con filtros de fecha)
 */
export async function obtenerEstadisticasServicios(fechaInicio?: Date, fechaFin?: Date): Promise<EstadisticaServicio[]> {
    await requireAdmin();
    try {
        const filters = [Query.limit(5000), ...getDateFilter(fechaInicio, fechaFin, "fechaCita")];

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters);
        const citas = citasResponse.documents as unknown as Cita[];

        const stats: Record<string, number> = {};
        citas.forEach(cita => {
            const tipo = cita.tipoPropiedad || "Otros";
            const tipoFormatted = tipo.charAt(0).toUpperCase() + tipo.slice(1);
            stats[tipoFormatted] = (stats[tipoFormatted] || 0) + 1;
        });

        const colors = ["#0ea5e9", "#22c55e", "#eab308", "#f43f5e", "#8b5cf6"];
        return Object.entries(stats)
            .map(([nombre, cantidad], index) => ({ nombre, cantidad, fill: colors[index % colors.length] }))
            .sort((a, b) => b.cantidad - a.cantidad);
    } catch (error) {
        console.error("Error stats servicios:", error);
        return [];
    }
}

/**
 * Obtiene mejores clientes por ingresos generados
 */
export async function obtenerMejoresClientes(fechaInicio?: Date, fechaFin?: Date): Promise<ClienteTop[]> {
    await requireAdmin();
    try {
        const filters = [
            Query.equal("estado", "completada"),
            Query.limit(5000),
            ...getDateFilter(fechaInicio, fechaFin, "fechaCita")
        ];

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters);
        const citas = citasResponse.documents as unknown as Cita[];

        const clientesMap = new Map<string, ClienteTop>();

        citas.forEach(cita => {
            // Identifier: Phone or Name (since we don't have separate Client collection IDs strictly linked yet)
            const id = cita.clienteTelefono || cita.clienteNombre;

            if (!clientesMap.has(id)) {
                clientesMap.set(id, {
                    clienteId: id,
                    nombre: cita.clienteNombre,
                    totalGastado: 0,
                    serviciosContratados: 0
                });
            }

            const cliente = clientesMap.get(id)!;
            cliente.totalGastado += cita.precioAcordado;
            cliente.serviciosContratados += 1;
        });

        // Convert map to array and sort top 10
        return Array.from(clientesMap.values())
            .sort((a, b) => b.totalGastado - a.totalGastado)
            .slice(0, 10);

    } catch (error) {
        console.error("Error obteniendo mejores clientes:", error);
        return [];
    }
}

/**
 * Obtiene estado de cartera (Cuentas por Cobrar)
 */
export async function obtenerCartera(fechaInicio?: Date, fechaFin?: Date): Promise<CarteraEstado> {
    await requireAdmin();
    try {
        // Find completed citas that are NOT paid
        const filters = [
            Query.equal("estado", "completada"),
            Query.equal("pagadoPorCliente", false),
            Query.limit(5000),
            ...getDateFilter(fechaInicio, fechaFin, "fechaCita")
        ];

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters);
        const citas = citasResponse.documents as unknown as Cita[];

        const now = new Date();
        let totalDias = 0;

        const totalPorCobrar = citas.reduce((sum, cita) => {
            const fechaCita = new Date(cita.fechaCita);
            const diffTime = Math.abs(now.getTime() - fechaCita.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            totalDias += diffDays;

            return sum + cita.precioAcordado;
        }, 0);

        return {
            totalPorCobrar,
            citasPendientesPago: citas.length,
            antiguedadPromedioDias: citas.length > 0 ? Math.round(totalDias / citas.length) : 0
        };

    } catch (error) {
        console.error("Error obteniendo cartera:", error);
        return { totalPorCobrar: 0, citasPendientesPago: 0, antiguedadPromedioDias: 0 };
    }
}

/**
 * Obtiene estado de nómina (Simulado vs Real)
 */
export async function obtenerEstadoNomina(fechaInicio?: Date, fechaFin?: Date): Promise<EstadoNomina> {
    await requireAdmin();
    try {
        const filtros = getDateFilter(fechaInicio, fechaFin, "createdAt");

        const pagosResponse = await databases.listDocuments(
            getDatabaseId(),
            COLLECTIONS.PAGOS_EMPLEADOS,
            [...filtros, Query.limit(5000)]
        );

        let totalGenerado = 0;
        let totalPagado = 0;

        pagosResponse.documents.forEach((pago) => {
            const monto = (pago.monto as number) || 0;
            totalGenerado += monto;
            if (pago.estado === "pagado") {
                totalPagado += monto;
            }
        });

        return {
            totalGenerado,
            totalPagado,
            totalPendiente: totalGenerado - totalPagado
        };
    } catch (error) {
        return { totalGenerado: 0, totalPagado: 0, totalPendiente: 0 };
    }
}

/**
 * Obtiene el rendimiento del equipo (Employee Performance)
 */
export async function obtenerRendimientoPersonal(fechaInicio?: Date, fechaFin?: Date): Promise<RendimientoEmpleado[]> {
    await requireAdmin();
    try {
        const filters = [
            Query.equal("estado", "completada"),
            Query.limit(5000),
            ...getDateFilter(fechaInicio, fechaFin, "fechaCita")
        ];

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters);
        const citas = citasResponse.documents as unknown as Cita[];
        const empleados = await obtenerTodosLosEmpleados({ activo: true });

        const statsMap = new Map<string, { count: number, revenue: number }>();

        citas.forEach(cita => {
            if (cita.empleadosAsignados && cita.empleadosAsignados.length > 0) {
                // Split revenue among assigned employees
                const revenuePerEmp = cita.precioAcordado / cita.empleadosAsignados.length;

                cita.empleadosAsignados.forEach(empId => {
                    const current = statsMap.get(empId) || { count: 0, revenue: 0 };
                    statsMap.set(empId, {
                        count: current.count + 1,
                        revenue: current.revenue + revenuePerEmp
                    });
                });
            }
        });

        const result: RendimientoEmpleado[] = empleados.map(emp => {
            const stats = statsMap.get(emp.$id) || { count: 0, revenue: 0 };
            return {
                empleadoId: emp.$id,
                nombre: `${emp.nombre} ${emp.apellido}`,
                serviciosCompletados: stats.count,
                totalGenerado: stats.revenue,
                calificacionPromedio: 5.0
            };
        });

        return result.sort((a, b) => b.serviciosCompletados - a.serviciosCompletados);

    } catch (error) {
        console.error("Error obteniendo rendimiento personal:", error);
        return [];
    }
}

// ============================================================
// NUEVOS REPORTES - Alto Valor
// ============================================================

export interface CrecimientoMensual {
    mes: string;
    ingresosActual: number;
    ingresosAnterior: number;
    crecimiento: number;
    porcentajeCrecimiento: number;
}

/**
 * 1. Crecimiento Mensual
 * Compara ingresos del mes actual vs mes anterior
 */
export async function obtenerCrecimientoMensual(year: number): Promise<CrecimientoMensual[]> {
    await requireAdmin();
    try {
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const resultado: CrecimientoMensual[] = [];

        for (let i = 0; i < 12; i++) {
            const inicioMes = new Date(year, i, 1).toISOString();
            const finMes = new Date(year, i + 1, 0, 23, 59, 59).toISOString();

            // Mes anterior
            const inicioMesAnt = new Date(year, i - 1, 1).toISOString();
            const finMesAnt = new Date(year, i, 0, 23, 59, 59).toISOString();

            const [resActual, resAnterior] = await Promise.all([
                databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, [
                    Query.equal("estado", "completada"),
                    Query.equal("pagadoPorCliente", true),
                    Query.greaterThanEqual("fechaCita", inicioMes),
                    Query.lessThanEqual("fechaCita", finMes),
                    Query.limit(5000),
                ]),
                i > 0
                    ? databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, [
                          Query.equal("estado", "completada"),
                          Query.equal("pagadoPorCliente", true),
                          Query.greaterThanEqual("fechaCita", inicioMesAnt),
                          Query.lessThanEqual("fechaCita", finMesAnt),
                          Query.limit(5000),
                      ])
                    : null,
            ]);

            const ingresosActual = (resActual.documents as unknown as Cita[]).reduce(
                (sum, c) => sum + c.precioAcordado, 0
            );
            const ingresosAnterior = resAnterior
                ? (resAnterior.documents as unknown as Cita[]).reduce((sum, c) => sum + c.precioAcordado, 0)
                : 0;

            const crecimiento = ingresosActual - ingresosAnterior;
            const porcentaje = ingresosAnterior > 0 ? (crecimiento / ingresosAnterior) * 100 : 0;

            resultado.push({
                mes: meses[i],
                ingresosActual,
                ingresosAnterior,
                crecimiento,
                porcentajeCrecimiento: Math.round(porcentaje * 10) / 10,
            });
        }

        return resultado;
    } catch (error) {
        console.error("Error obteniendo crecimiento mensual:", error);
        return [];
    }
}

export interface RetencionClientes {
    clientesNuevos: number;
    clientesRecurrentes: number;
    totalClientes: number;
    tasaRetencion: number;
    tasaRecurrencia: number;
}

/**
 * 2. Retención de Clientes
 * Mide cuántos clientes regresan vs nuevos
 */
export async function obtenerRetencionClientes(fechaInicio?: Date, fechaFin?: Date): Promise<RetencionClientes> {
    await requireAdmin();
    try {
        const filters = [
            Query.equal("estado", "completada"),
            Query.limit(5000),
            ...getDateFilter(fechaInicio, fechaFin, "fechaCita"),
        ];

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters);
        const citas = citasResponse.documents as unknown as Cita[];

        // Contar servicios por cliente (usar email como identificador)
        const serviciosPorCliente = new Map<string, number>();
        citas.forEach((cita) => {
            const id = cita.clienteEmail || cita.clienteTelefono;
            serviciosPorCliente.set(id, (serviciosPorCliente.get(id) || 0) + 1);
        });

        const clientesNuevos = Array.from(serviciosPorCliente.values()).filter((count) => count === 1).length;
        const clientesRecurrentes = Array.from(serviciosPorCliente.values()).filter((count) => count > 1).length;
        const totalClientes = clientesNuevos + clientesRecurrentes;

        return {
            clientesNuevos,
            clientesRecurrentes,
            totalClientes,
            tasaRetencion: totalClientes > 0 ? Math.round((clientesRecurrentes / totalClientes) * 100) : 0,
            tasaRecurrencia: totalClientes > 0 ? Math.round((clientesNuevos / totalClientes) * 100) : 0,
        };
    } catch (error) {
        console.error("Error obteniendo retención:", error);
        return { clientesNuevos: 0, clientesRecurrentes: 0, totalClientes: 0, tasaRetencion: 0, tasaRecurrencia: 0 };
    }
}

export interface TasaCancelacion {
    totalCitas: number;
    citasCanceladas: number;
    citasCompletadas: number;
    citasPendientes: number;
    tasaCancelacion: number;
    tasaCompletacion: number;
}

/**
 * 3. Tasa de Cancelación
 * Mide el % de citas canceladas vs total
 */
export async function obtenerTasaCancelacion(fechaInicio?: Date, fechaFin?: Date): Promise<TasaCancelacion> {
    await requireAdmin();
    try {
        const filters = [Query.limit(5000), ...getDateFilter(fechaInicio, fechaFin, "fechaCita")];

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters);
        const citas = citasResponse.documents as unknown as Cita[];

        const total = citas.length;
        const canceladas = citas.filter((c) => c.estado === "cancelada").length;
        const completadas = citas.filter((c) => c.estado === "completada").length;
        const pendientes = citas.filter((c) => ["pendiente", "confirmada", "en-progreso"].includes(c.estado)).length;

        return {
            totalCitas: total,
            citasCanceladas: canceladas,
            citasCompletadas: completadas,
            citasPendientes: pendientes,
            tasaCancelacion: total > 0 ? Math.round((canceladas / total) * 100) : 0,
            tasaCompletacion: total > 0 ? Math.round((completadas / total) * 100) : 0,
        };
    } catch (error) {
        console.error("Error obteniendo tasa cancelación:", error);
        return { totalCitas: 0, citasCanceladas: 0, citasCompletadas: 0, citasPendientes: 0, tasaCancelacion: 0, tasaCompletacion: 0 };
    }
}

export interface DistribucionGeografica {
    ciudad: string;
    totalCitas: number;
    ingresos: number;
    porcentaje: number;
}

/**
 * 4. Distribución Geográfica
 * Demanda por ciudad
 */
export async function obtenerDistribucionGeografica(fechaInicio?: Date, fechaFin?: Date): Promise<DistribucionGeografica[]> {
    await requireAdmin();
    try {
        const filters = [Query.limit(5000), ...getDateFilter(fechaInicio, fechaFin, "fechaCita")];

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters);
        const citas = citasResponse.documents as unknown as Cita[];

        const ciudadMap = new Map<string, { count: number; ingresos: number }>();

        citas.forEach((cita) => {
            const ciudad = cita.ciudad || "Sin especificar";
            const current = ciudadMap.get(ciudad) || { count: 0, ingresos: 0 };
            ciudadMap.set(ciudad, {
                count: current.count + 1,
                ingresos: current.ingresos + (cita.precioAcordado || 0),
            });
        });

        const totalCitas = Array.from(ciudadMap.values()).reduce((sum, v) => sum + v.count, 0);

        return Array.from(ciudadMap.entries())
            .map(([ciudad, data]) => ({
                ciudad,
                totalCitas: data.count,
                ingresos: data.ingresos,
                porcentaje: totalCitas > 0 ? Math.round((data.count / totalCitas) * 100) : 0,
            }))
            .sort((a, b) => b.totalCitas - a.totalCitas);
    } catch (error) {
        console.error("Error obteniendo distribución geográfica:", error);
        return [];
    }
}

export interface ComparativaAnual {
    mes: string;
    ingresosActual: number;
    ingresosAnterior: number;
    diferencia: number;
    porcentaje: number;
}

/**
 * 5. Comparativa Anual
 * Mismo mes año actual vs año anterior
 */
export async function obtenerComparativaAnual(yearActual: number): Promise<ComparativaAnual[]> {
    await requireAdmin();
    try {
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const resultado: ComparativaAnual[] = [];

        const yearAnterior = yearActual - 1;

        const [resActual, resAnterior] = await Promise.all([
            databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, [
                Query.equal("estado", "completada"),
                Query.equal("pagadoPorCliente", true),
                Query.greaterThanEqual("fechaCita", new Date(yearActual, 0, 1).toISOString()),
                Query.lessThanEqual("fechaCita", new Date(yearActual, 11, 31, 23, 59, 59).toISOString()),
                Query.limit(5000),
            ]),
            databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, [
                Query.equal("estado", "completada"),
                Query.equal("pagadoPorCliente", true),
                Query.greaterThanEqual("fechaCita", new Date(yearAnterior, 0, 1).toISOString()),
                Query.lessThanEqual("fechaCita", new Date(yearAnterior, 11, 31, 23, 59, 59).toISOString()),
                Query.limit(5000),
            ]),
        ]);

        const citasActual = resActual.documents as unknown as Cita[];
        const citasAnterior = resAnterior.documents as unknown as Cita[];

        for (let i = 0; i < 12; i++) {
            const ingresosActual = citasActual
                .filter((c) => new Date(c.fechaCita).getMonth() === i)
                .reduce((sum, c) => sum + c.precioAcordado, 0);
            const ingresosAnterior = citasAnterior
                .filter((c) => new Date(c.fechaCita).getMonth() === i)
                .reduce((sum, c) => sum + c.precioAcordado, 0);

            const diferencia = ingresosActual - ingresosAnterior;
            const porcentaje = ingresosAnterior > 0 ? Math.round((diferencia / ingresosAnterior) * 100) : 0;

            resultado.push({
                mes: meses[i],
                ingresosActual,
                ingresosAnterior,
                diferencia,
                porcentaje,
            });
        }

        return resultado;
    } catch (error) {
        console.error("Error obteniendo comparativa anual:", error);
        return [];
    }
}

// ============================================================
// REPORTES - Medio Valor y Bonus
// ============================================================

export interface RentabilidadServicio {
    tipoPropiedad: string;
    totalCitas: number;
    ingresos: number;
    costoNomina: number;
    beneficio: number;
    margen: number;
}

/**
 * 6. Rentabilidad por Servicio
 * Ingresos vs costos de nómina por tipo de propiedad
 */
export async function obtenerRentabilidadPorServicio(fechaInicio?: Date, fechaFin?: Date): Promise<RentabilidadServicio[]> {
    await requireAdmin();
    try {
        const filters = [
            Query.equal("estado", "completada"),
            Query.limit(5000),
            ...getDateFilter(fechaInicio, fechaFin, "fechaCita"),
        ];

        const [citasResponse, pagosResponse] = await Promise.all([
            databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters),
            databases.listDocuments(getDatabaseId(), COLLECTIONS.PAGOS_EMPLEADOS, [
                ...getDateFilter(fechaInicio, fechaFin, "createdAt"),
                Query.limit(5000),
            ]),
        ]);

        const citas = citasResponse.documents as unknown as Cita[];
        const totalNomina = (pagosResponse.documents as unknown as Array<{ monto: number }>).reduce(
            (sum, p) => sum + (p.monto || 0), 0
        );

        const servicioMap = new Map<string, { count: number; ingresos: number }>();

        citas.forEach((cita) => {
            const tipo = cita.tipoPropiedad || "Otros";
            const current = servicioMap.get(tipo) || { count: 0, ingresos: 0 };
            servicioMap.set(tipo, {
                count: current.count + 1,
                ingresos: current.ingresos + (cita.precioAcordado || 0),
            });
        });

        const totalCitas = citas.length;

        return Array.from(servicioMap.entries())
            .map(([tipo, data]) => {
                // Prorratear nómina según proporción de citas
                const costoNomina = totalCitas > 0 ? (data.count / totalCitas) * totalNomina : 0;
                const beneficio = data.ingresos - costoNomina;
                return {
                    tipoPropiedad: tipo.charAt(0).toUpperCase() + tipo.slice(1),
                    totalCitas: data.count,
                    ingresos: data.ingresos,
                    costoNomina: Math.round(costoNomina),
                    beneficio,
                    margen: data.ingresos > 0 ? Math.round((beneficio / data.ingresos) * 100) : 0,
                };
            })
            .sort((a, b) => b.ingresos - a.ingresos);
    } catch (error) {
        console.error("Error obteniendo rentabilidad:", error);
        return [];
    }
}

export interface MetricasFidelidad {
    totalClientes: number;
    bronce: number;
    plata: number;
    oro: number;
    puntosOtorgados: number;
    ticketPromedioFiel: number;
}

/**
 * 7. Métricas de Fidelidad
 * Distribución de clientes por nivel y puntos
 */
export async function obtenerMetricasFidelidad(): Promise<MetricasFidelidad> {
    await requireAdmin();
    try {
        const [clientesResponse, puntosResponse] = await Promise.all([
            databases.listDocuments(getDatabaseId(), COLLECTIONS.CLIENTES, [Query.limit(5000)]),
            databases.listDocuments(getDatabaseId(), COLLECTIONS.HISTORIAL_PUNTOS, [Query.limit(5000)]),
        ]);

        const clientes = clientesResponse.documents as unknown as Array<{
            nivelFidelidad?: string;
            totalGastado?: number;
            serviciosCompletados?: number;
        }>;

        const puntosOtorgados = (puntosResponse.documents as unknown as Array<{ puntos: number }>).reduce(
            (sum, p) => sum + (p.puntos || 0), 0
        );

        const bronce = clientes.filter((c) => !c.nivelFidelidad || c.nivelFidelidad === "bronce" || c.nivelFidelidad === "BRONCE").length;
        const plata = clientes.filter((c) => c.nivelFidelidad === "plata" || c.nivelFidelidad === "PLATA").length;
        const oro = clientes.filter((c) => c.nivelFidelidad === "oro" || c.nivelFidelidad === "ORO").length;

        const clientesFieles = clientes.filter((c) => (c.serviciosCompletados || 0) > 1);
        const totalGastadoFieles = clientesFieles.reduce((sum, c) => sum + (c.totalGastado || 0), 0);

        return {
            totalClientes: clientes.length,
            bronce,
            plata,
            oro,
            puntosOtorgados,
            ticketPromedioFiel: clientesFieles.length > 0
                ? Math.round(totalGastadoFieles / clientesFieles.length)
                : 0,
        };
    } catch (error) {
        console.error("Error obteniendo métricas fidelidad:", error);
        return { totalClientes: 0, bronce: 0, plata: 0, oro: 0, puntosOtorgados: 0, ticketPromedioFiel: 0 };
    }
}

export interface TiempoServicio {
    tipoPropiedad: string;
    duracionEstimada: number;
    duracionReal: number;
    diferencia: number;
    eficiencia: number;
    totalCitas: number;
}

/**
 * 8. Tiempo de Servicio
 * Duración estimada vs real y eficiencia
 */
export async function obtenerTiempoServicio(fechaInicio?: Date, fechaFin?: Date): Promise<TiempoServicio[]> {
    await requireAdmin();
    try {
        const filters = [
            Query.equal("estado", "completada"),
            Query.limit(5000),
            ...getDateFilter(fechaInicio, fechaFin, "fechaCita"),
        ];

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters);
        const citas = citasResponse.documents as unknown as Cita[];

        const tipoMap = new Map<string, { estimado: number; real: number; count: number }>();

        citas.forEach((cita) => {
            const tipo = cita.tipoPropiedad || "Otros";
            const current = tipoMap.get(tipo) || { estimado: 0, real: 0, count: 0 };
            const estimado = cita.duracionEstimada || 0;
            const real = cita.horasTrabajadas ? cita.horasTrabajadas * 60 : estimado;

            tipoMap.set(tipo, {
                estimado: current.estimado + estimado,
                real: current.real + real,
                count: current.count + 1,
            });
        });

        return Array.from(tipoMap.entries())
            .map(([tipo, data]) => {
                const promedioEstimado = data.count > 0 ? Math.round(data.estimado / data.count) : 0;
                const promedioReal = data.count > 0 ? Math.round(data.real / data.count) : 0;
                const diferencia = promedioReal - promedioEstimado;
                return {
                    tipoPropiedad: tipo.charAt(0).toUpperCase() + tipo.slice(1),
                    duracionEstimada: promedioEstimado,
                    duracionReal: promedioReal,
                    diferencia,
                    eficiencia: promedioEstimado > 0 ? Math.round((promedioEstimado / Math.max(promedioReal, 1)) * 100) : 100,
                    totalCitas: data.count,
                };
            })
            .sort((a, b) => b.totalCitas - a.totalCitas);
    } catch (error) {
        console.error("Error obteniendo tiempo de servicio:", error);
        return [];
    }
}

export interface Estacionalidad {
    mes: string;
    totalCitas: number;
    ingresos: number;
    esPico: boolean;
    esValle: boolean;
}

/**
 * 9. Estacionalidad
 * Identifica meses pico y valle de demanda
 */
export async function obtenerEstacionalidad(year: number): Promise<Estacionalidad[]> {
    await requireAdmin();
    try {
        const startDate = new Date(year, 0, 1).toISOString();
        const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, [
            Query.greaterThanEqual("fechaCita", startDate),
            Query.lessThanEqual("fechaCita", endDate),
            Query.limit(5000),
        ]);

        const citas = citasResponse.documents as unknown as Cita[];
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const datos = meses.map((mes) => ({ mes, totalCitas: 0, ingresos: 0, esPico: false, esValle: false }));

        citas.forEach((cita) => {
            const mesIndex = new Date(cita.fechaCita).getMonth();
            if (mesIndex >= 0 && mesIndex < 12) {
                datos[mesIndex].totalCitas += 1;
                datos[mesIndex].ingresos += cita.precioAcordado || 0;
            }
        });

        // Identificar pico y valle
        const conDatos = datos.filter((d) => d.totalCitas > 0);
        if (conDatos.length > 0) {
            const maxCitas = Math.max(...conDatos.map((d) => d.totalCitas));
            const minCitas = Math.min(...conDatos.map((d) => d.totalCitas));

            datos.forEach((d) => {
                if (d.totalCitas === maxCitas && maxCitas > 0) d.esPico = true;
                if (d.totalCitas === minCitas && minCitas > 0) d.esValle = true;
            });
        }

        return datos;
    } catch (error) {
        console.error("Error obteniendo estacionalidad:", error);
        return [];
    }
}

export interface TicketPromedio {
    mes: string;
    ticketPromedio: number;
    totalCitas: number;
}

/**
 * 10. Ticket Promedio
 * Valor promedio por servicio, evolución mensual
 */
export async function obtenerTicketPromedio(year: number): Promise<TicketPromedio[]> {
    await requireAdmin();
    try {
        const startDate = new Date(year, 0, 1).toISOString();
        const endDate = new Date(year, 11, 31, 23, 59, 59).toISOString();

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, [
            Query.equal("estado", "completada"),
            Query.greaterThanEqual("fechaCita", startDate),
            Query.lessThanEqual("fechaCita", endDate),
            Query.limit(5000),
        ]);

        const citas = citasResponse.documents as unknown as Cita[];
        const meses = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        const datos = meses.map((mes) => ({ mes, ticketPromedio: 0, totalCitas: 0 }));

        const sumaPorMes = Array(12).fill(0);
        const countPorMes = Array(12).fill(0);

        citas.forEach((cita) => {
            const mesIndex = new Date(cita.fechaCita).getMonth();
            if (mesIndex >= 0 && mesIndex < 12) {
                sumaPorMes[mesIndex] += cita.precioAcordado || 0;
                countPorMes[mesIndex] += 1;
            }
        });

        for (let i = 0; i < 12; i++) {
            datos[i].totalCitas = countPorMes[i];
            datos[i].ticketPromedio = countPorMes[i] > 0 ? Math.round(sumaPorMes[i] / countPorMes[i]) : 0;
        }

        return datos;
    } catch (error) {
        console.error("Error obteniendo ticket promedio:", error);
        return [];
    }
}

export interface ConcentracionRiesgo {
    top5Ingresos: number;
    totalIngresos: number;
    porcentajeConcentracion: number;
    nivelRiesgo: "Bajo" | "Medio" | "Alto";
    clientesTop: Array<{ nombre: string; totalGastado: number; porcentaje: number }>;
}

/**
 * 11. Concentración de Riesgo
 * % de ingresos que viene del top 5 clientes
 */
export async function obtenerConcentracionRiesgo(fechaInicio?: Date, fechaFin?: Date): Promise<ConcentracionRiesgo> {
    await requireAdmin();
    try {
        const filters = [
            Query.equal("estado", "completada"),
            Query.limit(5000),
            ...getDateFilter(fechaInicio, fechaFin, "fechaCita"),
        ];

        const citasResponse = await databases.listDocuments(getDatabaseId(), COLLECTIONS.CITAS, filters);
        const citas = citasResponse.documents as unknown as Cita[];

        const clienteMap = new Map<string, { nombre: string; total: number }>();

        citas.forEach((cita) => {
            const id = cita.clienteEmail || cita.clienteTelefono || cita.clienteNombre;
            const current = clienteMap.get(id) || { nombre: cita.clienteNombre, total: 0 };
            current.total += cita.precioAcordado || 0;
            clienteMap.set(id, current);
        });

        const ordenados = Array.from(clienteMap.entries())
            .map(([id, data]) => ({ id, nombre: data.nombre, totalGastado: data.total }))
            .sort((a, b) => b.totalGastado - a.totalGastado);

        const totalIngresos = ordenados.reduce((sum, c) => sum + c.totalGastado, 0);
        const top5 = ordenados.slice(0, 5);
        const top5Ingresos = top5.reduce((sum, c) => sum + c.totalGastado, 0);
        const porcentaje = totalIngresos > 0 ? Math.round((top5Ingresos / totalIngresos) * 100) : 0;

        let nivelRiesgo: "Bajo" | "Medio" | "Alto" = "Bajo";
        if (porcentaje >= 70) nivelRiesgo = "Alto";
        else if (porcentaje >= 50) nivelRiesgo = "Medio";

        return {
            top5Ingresos,
            totalIngresos,
            porcentajeConcentracion: porcentaje,
            nivelRiesgo,
            clientesTop: top5.map((c) => ({
                nombre: c.nombre,
                totalGastado: c.totalGastado,
                porcentaje: totalIngresos > 0 ? Math.round((c.totalGastado / totalIngresos) * 100) : 0,
            })),
        };
    } catch (error) {
        console.error("Error obteniendo concentración:", error);
        return { top5Ingresos: 0, totalIngresos: 0, porcentajeConcentracion: 0, nivelRiesgo: "Bajo", clientesTop: [] };
    }
}
