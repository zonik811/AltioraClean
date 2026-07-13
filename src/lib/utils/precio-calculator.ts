/**
 * Calcula el precio estimado de un servicio basado en varios factores
 */

import { ModalidadPago, TipoPropiedad } from "@/types";

interface CalculoPrecioParams {
    precioBase: number;
    unidadPrecio: "hora" | "metrocuadrado" | "servicio";
    duracionEstimada?: number; // en horas
    metrosCuadrados?: number;
    habitaciones?: number;
    banos?: number;
    factorComplejidad?: number; // 1.0 = normal, 1.5 = complejo, 0.8 = simple
}

export function calcularPrecioServicio(params: CalculoPrecioParams): number {
    const {
        precioBase,
        unidadPrecio,
        duracionEstimada = 1,
        metrosCuadrados = 0,
        habitaciones = 0,
        banos = 0,
        factorComplejidad = 1.0,
    } = params;

    let precioCalculado = 0;

    switch (unidadPrecio) {
        case "hora":
            // Precio por hora basado en duración estimada
            precioCalculado = precioBase * duracionEstimada;
            break;

        case "metrocuadrado":
            // Precio por metro cuadrado
            if (metrosCuadrados > 0) {
                precioCalculado = precioBase * metrosCuadrados;
            } else {
                // Si no hay metros, usar estimado basado en habitaciones
                const metrosEstimados = habitaciones * 20 + banos * 8;
                precioCalculado = precioBase * metrosEstimados;
            }
            break;

        case "servicio":
            // Precio fijo por servicio
            precioCalculado = precioBase;
            break;
    }

    // Aplicar factor de complejidad
    precioCalculado *= factorComplejidad;

    // Redondear al múltiplo de 1000 más cercano
    return Math.round(precioCalculado / 1000) * 1000;
}

/**
 * Calcula el pago que le corresponde a un empleado por un servicio
 */
interface CalculoPagoEmpleadoParams {
    tarifaPorHora: number;
    modalidadPago: ModalidadPago;
    duracionServicio?: number; // en horas
    precioServicio?: number;
    porcentajeServicio?: number; // si se paga por porcentaje del servicio
}

export function calcularPagoEmpleado(params: CalculoPagoEmpleadoParams): number {
    const {
        tarifaPorHora,
        modalidadPago,
        duracionServicio = 1,
        precioServicio = 0,
        porcentajeServicio = 0,
    } = params;

    let montoAPagar = 0;

    switch (modalidadPago) {
        case ModalidadPago.HORA:
            montoAPagar = tarifaPorHora * duracionServicio;
            break;

        case ModalidadPago.SERVICIO:
            if (porcentajeServicio > 0) {
                // Paga un porcentaje del servicio
                montoAPagar = (precioServicio * porcentajeServicio) / 100;
            } else {
                // Paga una tarifa fija por servicio
                montoAPagar = tarifaPorHora;
            }
            break;

        case ModalidadPago.FIJO_MENSUAL:
            // Esto se calcula mensualmente, no por servicio individual
            montoAPagar = 0;
            break;
    }

    return Math.round(montoAPagar);
}

/**
 * Calcula la duración estimada basada en tipo de propiedad y tamaño
 */
interface CalculoDuracionParams {
    tipoPropiedad: TipoPropiedad;
    metrosCuadrados?: number;
    habitaciones?: number;
    tipoServicio?: "basico" | "profundo" | "especializado";
}

export function calcularDuracionEstimada(params: CalculoDuracionParams): number {
    const {
        tipoPropiedad,
        metrosCuadrados = 0,
        habitaciones = 0,
        tipoServicio = "basico",
    } = params;

    let horasBase = 1;

    // Ajustar por tipo de propiedad
    switch (tipoPropiedad) {
        case TipoPropiedad.APARTAMENTO:
            horasBase = 1.5;
            break;
        case TipoPropiedad.CASA:
            horasBase = 2.5;
            break;
        case TipoPropiedad.OFICINA:
            horasBase = 2;
            break;
        case TipoPropiedad.LOCAL:
            horasBase = 3;
            break;
    }

    // Ajustar por tamaño
    if (metrosCuadrados > 0) {
        // ~1/60 horas (1 minuto) por metro cuadrado para limpieza básica
        horasBase = (metrosCuadrados * 1) / 60;
    } else if (habitaciones > 0) {
        // ~0.5 horas (30 minutos) por habitación
        horasBase = habitaciones * 0.5;
    }

    // Ajustar por tipo de servicio
    const factoresTipo: Record<string, number> = {
        basico: 1.0,
        profundo: 2.0,
        especializado: 1.5,
    };

    const horasTotales = horasBase * (factoresTipo[tipoServicio] || 1.0);

    // Redondear a múltiplos de 0.25 horas (15 minutos)
    return Math.ceil(horasTotales * 4) / 4;
}
