# Sistema de Puntos

## Niveles de Fidelidad

| Nivel | Puntos Requeridos |
|-------|-------------------|
| Bronce | 0 (default) |
| Plata | 10 |
| Oro | 20 |

## Acumulación

- Se otorgan puntos al **completar una cita** (`actualizarCita()` con estado `completada`).
- Fórmula: `max(1, floor(precioServicio / 50000))` — 1 punto por cada $50,000 COP.
- Los puntos se registran en `historial_puntos` y se acumulan en `clientes.puntosAcumulados`.
- También se actualiza `totalGastado` y `serviciosCompletados` del cliente.

## Canje

`redimirPuntos(clienteId, puntos, premio)`:
1. Verifica que el cliente tenga suficientes puntos.
2. Crea registro negativo en `historial_puntos`.
3. Actualiza `puntosAcumulados` y recalcula nivel.

## Almacenamiento

- `historial_puntos`: Cada movimiento (acumulación o canje) es un documento.
- `clientes.puntosAcumulados`: Saldo actual (desnormalizado para consultas rápidas).
- `clientes.nivelFidelidad`: Nivel calculado en el momento de la transacción.
