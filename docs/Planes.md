# Módulo de Planes Recurrentes

## Descripción

El módulo de Planes permite a los administradores crear y gestionar planes recurrentes (semanal, quincenal, mensual) que los clientes pueden contratar para obtener precios preferenciales y visitas periódicas automáticas.

## Colección Appwrite

**`planes`** con los siguientes campos:

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `nombre` | string | Nombre del plan (ej: "Plan Semanal Básico") |
| `descripcion` | string | Texto explicativo del plan |
| `servicioId` | string | FK al servicio incluido en el plan |
| `frecuencia` | enum | `semanal`, `quincenal`, `mensual` |
| `precioPorVisita` | number | Precio con descuento por cada visita |
| `precioSugerido` | number | Precio regular sin plan (para mostrar ahorro) |
| `sesionesPorMes` | number | Ej: 4 para semanal, 2 para quincenal, 1 para mensual |
| `activo` | boolean | Para deshabilitar sin borrar |
| `destacado` | boolean | Mostrar con prioridad en el formulario de agendar |
| `createdAt`, `updatedAt` | timestamps | |

## Flujo de uso

### Admin → Gestión de Planes
1. `/admin/planes` — CRUD completo de planes
2. `/admin/planes/[id]` — Detalle del plan con resumen financiero
3. `/admin/clientes/[id]` — Asignar/cancelar plan a cliente

### Público → Agendar con Plan
1. En `/agendar`, después de seleccionar servicio y llenar datos, en la sección de resumen se muestran los planes disponibles para ese servicio
2. El usuario puede optar por "Solo esta vez" o seleccionar un plan
3. Si selecciona plan, se usa `plan.precioPorVisita` como precio y el plan se asigna automáticamente al cliente

### Auto-generación de citas
1. Cuando una cita se marca como `completada`, si el cliente tiene `planId`, se calcula la próxima fecha según la frecuencia del plan
2. Se crea automáticamente una nueva cita con estado `pendiente`
3. Se actualiza `proximaCitaAuto` en el cliente

## Archivos creados/modificados

### Nuevos
- `src/app/admin/planes/page.tsx` — Lista de planes con CRUD
- `src/app/admin/planes/[id]/page.tsx` — Detalle del plan
- `src/lib/actions/planes.ts` — Server actions

### Modificados
- `src/types/index.ts` — Interfaz `Plan`, `CrearPlanInput`, `ActualizarPlanInput`
- `src/lib/appwrite/config.ts` — `PLANES` collection
- `src/lib/actions/citas.ts` — Auto-generación al completar cita + `planId`/`frecuencia` en `crearCita`
- `src/app/agendar/page.tsx` — Selector de plan en resumen
- `src/app/admin/page.tsx` — Acceso rápido a Planes
- `src/app/admin/clientes/[id]/page.tsx` — Asignar/cancelar plan
- `src/app/(client)/portal/dashboard/page.tsx` — Mostrar plan activo
- `src/components/layout/Sidebar.tsx` — Nav item "Planes"

## Server Actions (`src/lib/actions/planes.ts`)

| Función | Descripción |
|---------|-------------|
| `obtenerPlanes(soloActivos?, pagination?)` | Lista paginada de planes |
| `obtenerPlanesPublicos()` | Solo planes activos (para público) |
| `obtenerPlan(id)` | Detalle de un plan |
| `crearPlan(data)` | Crear nuevo plan |
| `actualizarPlan(id, data)` | Actualizar plan |
| `eliminarPlan(id)` | Eliminar plan |
| `asignarPlanACliente(clienteId, planId)` | Asignar plan a cliente |
| `cancelarPlan(clienteId)` | Cancelar plan de un cliente |

## Pendiente (próximas iteraciones)
- Vista de todos los clientes con un plan específico
- Dashboard del admin: tarjeta con "Clientes con plan activo"
- Notificaciones automáticas recordando próxima visita del plan
- Límite de visitas por plan (ej: "máximo 5 visitas")
