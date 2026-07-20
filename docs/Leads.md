# Módulo de Leads

## Propósito

Gestionar prospectos y clientes potenciales antes de que se conviertan en clientes formales. Los leads pueden entrar por el formulario público (`/solicitar-cotizacion`) o ser creados manualmente por el admin.

## Ciclo de Vida

```
nuevo → contactado → calificado → cotizado → convertido
  ↓         ↓            ↓           ↓
  │         │            └→ a Cliente vía convertirLeadACliente()
  │         │
  │         └→ (se actualiza estado manualmente)
  │
  └→ perdido (en cualquier etapa)
```

## Estados

| Estado | Descripción | Acción principal |
|--------|-------------|------------------|
| `nuevo` | Acaba de entrar, sin contacto | Contactar |
| `contactado` | Se estableció comunicación | Calificar / Cotizar |
| `calificado` | Validado como prospecto real | Convertir a Cliente o crear cotización |
| `cotizado` | Se le envió cotización | Dar seguimiento |
| `convertido` | Ya es cliente (`clientes`) | — |
| `perdido` | No prosiguió | — |

## Colección Appwrite

**`leads`** — Permisos Read/Create/Update/Delete: users.

Atributos principales:
- `nombre`, `email`, `telefono` (requeridos)
- `direccion`, `ciudad`, `tipoPropiedad`
- `servicioInteresado` — ID del servicio que busca
- `descripcion` — Comentarios del lead
- `estado` — Enum `EstadoLead`
- `fuente` — Enum `FuenteLead` (web, referencia, llamada, whatsapp, redes, otro)
- `fechaContacto` — Cuándo se contactó por última vez
- `notasInternas` — Notas del admin

## Server Actions

`src/lib/actions/leads.ts`:
- `obtenerLeads`, `obtenerLead`, `crearLead`, `actualizarLead`, `eliminarLead`
- `convertirLeadACliente(id)` — Crea un documento en `clientes` y marca lead como `convertido`

## Páginas Admin

- `/admin/leads` — Lista con filtros por estado y búsqueda
- `/admin/leads/[id]` — Detalle con cambio de estado, notas internas, cotizaciones relacionadas y botón "Crear Cotización"

## Formulario Público

- `/solicitar-cotizacion` — Formulario público que crea un lead con fuente `web`. Incluye selección de tipo de propiedad y servicio de interés.
