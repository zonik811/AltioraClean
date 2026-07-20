# AltioraClean — AGENTS.md

Stack: Next.js 16 (App Router, `--webpack`), React 19, TypeScript 5, Tailwind CSS 4 (`@tailwindcss/postcss`), shadcn/ui (New York), Appwrite (browser `appwrite` + server `node-appwrite`), PWA (`@ducanh2912/next-pwa`).

## Commands

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | `next dev --webpack` |
| `npm run build` | `next build --webpack` |
| `npm run lint` | ESLint v9 flat config (`eslint.config.mjs`) |
| `npm start` | Servidor producción |

No hay scripts de test ni typecheck.

## Environment

`.env.local` — `NEXT_PUBLIC_*` necesarias en build time. `APPWRITE_API_KEY` es server-only.

## Three Appwrite Clients

| Cliente | SDK | Archivo | Uso |
|---------|-----|---------|-----|
| Browser | `appwrite` | `src/lib/appwrite.ts` | Account, listDocuments del usuario |
| Admin | `node-appwrite` | `src/lib/appwrite/admin-client.ts` | Server actions — API Key total |
| Sesión | `node-appwrite` | `src/lib/appwrite/session-client.ts` | Server-side con cookie `a_session` |

## Collections (src/lib/appwrite/config.ts)

`SERVICIOS`, `CITAS`, `EMPLEADOS`, `CLIENTES`, `PAGOS_EMPLEADOS`, `PAGOS_CLIENTES`, `GASTOS`, `DIRECCIONES`, `HISTORIAL_PUNTOS`, `NOTIFICACIONES`, `PUSH_SUBSCRIPTIONS`, `LEADS`, `COTIZACIONES`, `PLANES`

Permisos: `servicios` Read=any; `citas` Create=any, resto Read/Create/Update/Delete=users. Ver `PERMISOS_APPWRITE.md`.

## Project Structure

```
src/
  app/
    admin/        (dashboard, citas, leads, cotizaciones, personal, clientes, pagos, gastos, servicios, reportes)
    agendar/      (público)
    solicitar-cotizacion/  (público — crea leads)
    login/, registro/, recuperar/, resetear-contrasena/
    (client)/     (portal cliente)
  components/
    ui/           (shadcn/ui)
    admin/        (skeletons, leads, cotizaciones, StatsCard, notification-toggle)
  lib/
    actions/      (server actions: citas, clientes, empleados, gastos, pagos, leads, cotizaciones, servicios, reportes, puntos, direcciones, notifications)
    appwrite/     (config, admin-client, session-client, helpers)
    hooks/        (useAuth, usePushNotifications)
    appwrite.ts, appwrite-admin.ts, auth-server.ts, utils.ts
  types/          (enums, interfaces, DTOs)
scripts/          (seed-services, setup-appwrite, generate-keys, crear-admin)
```

## Conventions

- **Idioma:** Todo en español (código, UI, commits).
- **Moneda:** COP — formatear con `formatearPrecio()` en `src/lib/utils.ts`.
- **Rutas:** `@/*` → `./src/*`.
- **Server actions:** `"use server"`, `requireAdmin()` al inicio, devolver `CreateResponse<T>` / `UpdateResponse` / `DeleteResponse`, capturar errores (no lanzar en acciones CRUD).
- **Paginación:** Cursor-based (`Query.cursorAfter`), default limit 20, patrón `hasMore` + `nextCursor`.
- **Timestamps:** Asignar manualmente con `new Date().toISOString()`.
- **Appwrite errors:** `handleAppwriteError()`, transient retry con `withRetry()` (exp. backoff).
- **CSS:** Tailwind CSS v4 con `@tailwindcss/postcss`.
- **Auth:** `safeLogin()` que limpia sesiones previas. Rol detectado vía `useAuth()` (busca en `clientes` → `empleados`).
- **PWA:** Deshabilitado en desarrollo.

## Vault Obsidian

Abrir `docs/` como vault de Obsidian para documentación del proyecto:
- [[docs/Índice.md]] — Mapa del vault
- [[docs/Arquitectura.md]] — Arquitectura general
- [[docs/Appwrite.md]] — Config Appwrite
- [[docs/Server Actions.md]] — Patrón de server actions
- [[docs/Leads.md]] — Módulo de leads
- [[docs/Cotizaciones.md]] — Módulo de cotizaciones con PDF
- [[docs/Guía de Desarrollo.md]] — Setup y comandos
