# Convenciones

## Código

- **Idioma:** Todo en español (nombres de variables, funciones, comentarios, commits, UI).
- **Moneda:** Formatear precios COP con `formatearPrecio()` (`src/lib/utils.ts`).
- **Fechas:** Formatear con `formatearFecha()` / `formatearFechaHora()`.
- **Path alias:** `@/*` → `./src/*`.

## Server Actions

- Siempre `"use server"` al inicio.
- Usar `databases` de `@/lib/appwrite-admin` (admin client con API Key).
- Llamar `requireAdmin()`, `requireAuth()` o `requireClient()` al inicio según corresponda.
- Devolver objetos tipados (`CreateResponse<T>`, `UpdateResponse`, `DeleteResponse`).
- Capturar errores y devolverlos en el response — **no lanzar excepciones** en acciones que retornan respuesta.
- Timestamps asignados manualmente con `new Date().toISOString()`.

## Appwrite

- IDs de colecciones son **strings planas** (no UUIDs de Appwrite). Ver `COLLECTIONS` en `config.ts`.
- Usar `handleAppwriteError()` para errores consistentes.
- Usar `withRetry()` para operaciones propensas a errores transitorios.

## Componentes

- shadcn/ui en `src/components/ui/`.
- Componentes admin en `src/components/admin/`.
- CSS con Tailwind utility classes — evitar CSS personalizado cuando sea posible.
- Animaciones y estilos globales en `src/app/globals.css`.
