# Flujo de Agendamiento

## Creación de Cita (`/agendar`)

1. El usuario llena formulario multi-paso con datos del servicio, dirección y fecha.
2. `crearCita()` en `src/lib/actions/citas.ts`:
   - Busca cliente existente por **email** (prioridad), luego por **teléfono**.
   - Si no existe, **crea cliente nuevo**.
   - Guarda dirección automáticamente si no usó una existente.
   - Crea la cita con estado `pendiente`.
   - Actualiza `totalServicios++` en el cliente.
3. El formulario funciona **sin autenticación** (Create: any en Appwrite).

## Actualización de Cita

- `actualizarCita()` maneja cambios de estado, asignación de empleados, etc.
- **Completar una cita** (`estado === completada`) dispara:
  - Registro de puntos de fidelidad en el cliente (`$1 = 1 punto`, mínimo 1).
  - Actualización de `serviciosRealizados++` en empleados asignados.
  - Recalculo automático de contadores de empleados y cliente.

## Estados

```
pendiente → confirmada → en-progreso → completada
     ↘                        ↘
     cancelada              cancelada
```
