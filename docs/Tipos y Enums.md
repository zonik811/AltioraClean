# Tipos y Enums

Definidos en `src/types/index.ts`.

## Enums del Dominio

| Enum | Valores |
|------|---------|
| `EstadoCita` | pendiente, confirmada, en-progreso, completada, cancelada |
| `CargoEmpleado` | limpiador, supervisor, especialista |
| `ModalidadPago` | hora, servicio, fijo_mensual |
| `TipoPropiedad` | casa, apartamento, oficina, local |
| `CategoriaServicio` | residencial, comercial, especializado |
| `MetodoPago` | efectivo, transferencia, nequi, bancolombia, por_cobrar |
| `ConceptoPago` | servicio, anticipo, pago_mensual, bono, deduccion |
| `EstadoPago` | pendiente, pagado, parcial |
| `TipoCliente` | residencial, comercial |
| `NivelFidelidad` | bronce, plata, oro, platino |
| `FrecuenciaCliente` | unica, semanal, quincenal, mensual |

## Interfaces Principales

- `Servicio` — Servicio ofrecido con precio base, categoría, características
- `Empleado` — Personal con cargo, tarifa, modalidad de pago
- `Cita` — Agendamiento con servicio, cliente, empleados, estado, precios
- `Cliente` — Cliente con datos de contacto, niveles de fidelidad, puntos
- `Gasto` — Gasto operativo con categoría y comprobante

## Tipos de Respuesta

- `CreateResponse<T>` — `{ success, data?, error? }`
- `UpdateResponse` — `{ success, error? }`
- `DeleteResponse` — `{ success, error? }`
- `PaginatedResponse<T>` — `{ documents, total, hasMore, nextCursor? }`
- `PaginationParams` — `{ limit?, cursor? }`
