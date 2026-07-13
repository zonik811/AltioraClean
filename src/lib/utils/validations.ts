import { z } from "zod";
import {
    CargoEmpleado,
    ModalidadPago,
    TipoPropiedad,
    MetodoPago,
    ConceptoPago,
    EstadoCita,
} from "@/types";

// Schema para login
export const loginSchema = z.object({
    email: z
        .string()
        .min(1, "El email es requerido")
        .email("Email inválido"),
    password: z
        .string()
        .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

// Schema para agendamiento público
export const agendamientoSchema = z.object({
    servicioId: z.string().min(1, "Debes seleccionar un servicio"),
    clienteNombre: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(100, "El nombre es muy largo"),
    clienteTelefono: z
        .string()
        .min(7, "Teléfono inválido")
        .max(15, "Teléfono inválido")
        .regex(/^[0-9+\-\s()]+$/, "Formato de teléfono inválido"),
    clienteEmail: z
        .string()
        .email("Email inválido")
        .min(1, "El email es requerido"),
    direccion: z
        .string()
        .min(5, "La dirección debe ser más específica")
        .max(200, "La dirección es muy larga"),
    ciudad: z.string().min(2, "La ciudad es requerida"),
    tipoPropiedad: z.nativeEnum(TipoPropiedad),
    metrosCuadrados: z
        .number()
        .min(10, "Los metros cuadrados deben ser al menos 10")
        .max(10000, "Los metros cuadrados son muy altos")
        .optional(),
    habitaciones: z
        .number()
        .min(0, "Las habitaciones no pueden ser negativas")
        .max(50, "Demasiadas habitaciones")
        .optional(),
    banos: z
        .number()
        .min(0, "Los baños no pueden ser negativos")
        .max(20, "Demasiados baños")
        .optional(),
    fechaCita: z.string().min(1, "La fecha es requerida"),
    horaCita: z.string().min(1, "La hora es requerida"),
    detallesAdicionales: z.string().max(500, "Detalles muy largos").optional(),
});

export type AgendamientoFormData = z.infer<typeof agendamientoSchema>;

// Schema para crear/editar empleado
export const empleadoSchema = z.object({
    nombre: z
        .string()
        .min(2, "El nombre debe tener al menos 2 caracteres")
        .max(50, "El nombre es muy largo"),
    apellido: z
        .string()
        .min(2, "El apellido debe tener al menos 2 caracteres")
        .max(50, "El apellido es muy largo"),
    documento: z
        .string()
        .min(6, "Documento inválido")
        .max(20, "Documento inválido"),
    telefono: z
        .string()
        .min(7, "Teléfono inválido")
        .max(15, "Teléfono inválido")
        .regex(/^[0-9+\-\s()]+$/, "Formato de teléfono inválido"),
    email: z.string().email("Email inválido"),
    direccion: z.string().min(5, "La dirección es muy corta").max(200),
    fechaNacimiento: z.string().min(1, "La fecha de nacimiento es requerida"),
    fechaContratacion: z.string().min(1, "La fecha de contratación es requerida"),
    cargo: z.nativeEnum(CargoEmpleado),
    especialidades: z
        .array(z.string())
        .min(1, "Debes seleccionar al menos una especialidad"),
    tarifaPorHora: z
        .number()
        .min(1000, "La tarifa debe ser al menos $1,000")
        .max(1000000, "La tarifa es muy alta"),
    modalidadPago: z.nativeEnum(ModalidadPago),
});

export type EmpleadoFormData = z.infer<typeof empleadoSchema>;

// Schema para crear/editar cita
export const citaSchema = z.object({
    servicioId: z.string().min(1, "Debes seleccionar un servicio"),
    clienteId: z.string().optional(),
    clienteNombre: z.string().min(2, "El nombre del cliente es requerido"),
    clienteTelefono: z.string().min(7, "Teléfono inválido"),
    clienteEmail: z.string().email("Email inválido"),
    direccion: z.string().min(5, "La dirección es requerida"),
    ciudad: z.string().min(2, "La ciudad es requerida"),
    tipoPropiedad: z.nativeEnum(TipoPropiedad),
    metrosCuadrados: z.number().min(10).optional(),
    habitaciones: z.number().min(0).optional(),
    banos: z.number().min(0).optional(),
    fechaCita: z.string().min(1, "La fecha es requerida"),
    horaCita: z.string().min(1, "La hora es requerida"),
    duracionEstimada: z.number().min(0.5, "La duración mínima es 0.5 horas"),
    empleadosAsignados: z.array(z.string()).optional(),
    precioCliente: z
        .number()
        .min(1000, "El precio debe ser al menos $1,000"),
    precioAcordado: z.number().optional(),
    metodoPago: z.nativeEnum(MetodoPago),
    detallesAdicionales: z.string().max(500).optional(),
    notasInternas: z.string().max(500).optional(),
});

export type CitaFormData = z.infer<typeof citaSchema>;

// Schema para registrar pago a empleado
export const pagoEmpleadoSchema = z.object({
    empleadoId: z.string().min(1, "Debes seleccionar un empleado"),
    citaId: z.string().optional(),
    periodo: z.string().optional(),
    concepto: z.nativeEnum(ConceptoPago),
    monto: z.number().min(1, "El monto debe ser mayor a 0"),
    fechaPago: z.string().min(1, "La fecha de pago es requerida"),
    metodoPago: z.nativeEnum(MetodoPago),
    notas: z.string().max(500).optional(),
});

export type PagoEmpleadoFormData = z.infer<typeof pagoEmpleadoSchema>;

// Schema para crear servicio
export const servicioSchema = z.object({
    nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
    slug: z
        .string()
        .min(3, "El slug debe tener al menos 3 caracteres")
        .regex(/^[a-z0-9-]+$/, "Solo minúsculas, números y guiones"),
    descripcion: z.string().min(20, "La descripción debe ser más detallada"),
    descripcionCorta: z.string().min(10).max(150),
    categoria: z.enum(["residencial", "comercial", "especializado"]),
    precioBase: z.number().min(1000, "El precio base debe ser al menos $1,000"),
    unidadPrecio: z.enum(["hora", "metrocuadrado", "servicio"]),
    duracionEstimada: z.number().min(0.25, "La duración mínima es 0.25 horas"),
    caracteristicas: z.array(z.string()).min(1, "Agrega al menos una característica"),
    requierePersonal: z.number().min(1, "Requiere al menos 1 empleado"),
});

export type ServicioFormData = z.infer<typeof servicioSchema>;
