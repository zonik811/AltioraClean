# Módulo de Cotizaciones

## Propósito

Crear cotizaciones personalizadas para leads o clientes, con generación de PDF descargable configurable (header, footer, contenido).

## Ciclo de Vida

```
borrador → enviada → aprobada → convertida (a cita)
             ↓           ↓
          rechazada   rechazada
```

## Estados

| Estado | Descripción |
|--------|-------------|
| `borrador` | En edición, aún no enviada al cliente |
| `enviada` | Enviada al cliente, pendiente de respuesta |
| `aprobada` | Cliente aceptó la cotización |
| `rechazada` | Cliente no aceptó |
| `convertida` | Se creó una cita a partir de esta cotización |

## Estructura

### Items (líneas de la cotización)

Cada item tiene: `concepto`, `descripción`, `cantidad`, `precioUnitario`, `total`.

### Totales

- `subtotal` = suma de items
- `descuento` = monto fijo a descontar
- `total` = subtotal - descuento

### Configuración

- `validezDias` — Días de validez (default: 30). Genera `fechaVencimiento` automáticamente.
- `notas` — Notas adicionales para el cliente
- `terminos` — Términos y condiciones

## PDF Generation

Se usa **html2canvas** + **jsPDF** en el navegador (cliente-side):

1. El componente `PDFPreview` renderiza la cotización como HTML con estilo de impresión A4.
2. `GenerarPDFButton` captura el preview con `html2canvas` y genera el PDF con `jsPDF`.
3. Soporta multi-página automáticamente si el contenido excede una hoja A4.

El header incluye: logo, nombre de empresa, datos de contacto. El footer incluye: notas, términos, y pie de página con validez.

## Server Actions

`src/lib/actions/cotizaciones.ts`:
- `obtenerCotizaciones`, `obtenerCotizacion`, `obtenerCotizacionesPorLead`
- `crearCotizacion`, `actualizarCotizacion`, `eliminarCotizacion`
- `convertirCotizacionEnCita(id, fechaCita, horaCita)` — Crea cita y marca cotización como `convertida`
- `marcarPDFGenerado(id)` — Marca flag `pdfGenerado` en true

## Páginas Admin

- `/admin/cotizaciones` — Lista con filtros por estado y búsqueda
- `/admin/cotizaciones/nueva` — Formulario completo con items editables, selector de servicios, resumen de totales
- `/admin/cotizaciones/[id]` — Detalle con preview en vivo, cambio de estado, edición de notas/términos, botón PDF, convertir a cita

## Componentes

- `src/components/admin/cotizaciones/pdf-cotizacion.tsx` — Componente de preview (formato A4)
- `src/components/admin/cotizaciones/generar-pdf.tsx` — Botón que genera y descarga el PDF
