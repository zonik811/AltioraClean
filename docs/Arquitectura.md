# Arquitectura

## Stack

- **Frontend:** Next.js 16 (App Router, `--webpack`), React 19, TypeScript 5
- **Estilos:** Tailwind CSS 4 + PostCSS (`@tailwindcss/postcss`), shadcn/ui (New York)
- **Backend:** Appwrite (auth, database, storage, functions)
- **PWA:** `@ducanh2912/next-pwa` con service worker personalizado
- **Gráficos:** Recharts
- **Forms:** react-hook-form + zod
- **Notificaciones:** Web Push (VAPID keys)

## Estructura de Directorios

```
src/
  app/                  # Next.js App Router
    admin/              # Panel administrativo
    agendar/            # Agendamiento público
    login/              # Autenticación
    registro/           # Registro de usuarios
    recuperar/          # Recuperación de contraseña
    resetear-contrasena/# Reset de contraseña
    (client)/           # Portal del cliente (dashboard)
  components/
    ui/                 # shadcn/ui primitives
    admin/              # Componentes del panel admin
  lib/
    actions/            # Server actions (CRUD de cada entidad)
    appwrite/           # Clientes Appwrite + config + helpers
    hooks/              # useAuth, usePushNotifications
    appwrite.ts         # Browser client
    appwrite-admin.ts   # Server-side alias
    auth-server.ts      # requireAuth, requireAdmin, requireClient
    utils.ts            # formatearPrecio, cn(), etc.
  types/                # Enums, interfaces, DTOs
scripts/                # Seed y setup de Appwrite
```

## Flujo de Datos

```
Browser (cliente appwrite) ←→ Appwrite API ←→ Server Actions (node-appwrite SDK)
```

1. **Browser client** (`src/lib/appwrite.ts`): Operaciones de sesión del usuario (Account, listDocuments del propio usuario).
2. **Server Actions** (`"use server"`): Usan el **admin client** (`node-appwrite` + API Key) para CRUD completo.
3. **Session client** (`session-client.ts`): Cliente `node-appwrite` autenticado con cookie `a_session` para operaciones server-side por usuario.

## Autenticación y Roles

- **Admin:** Usuario que existe en Appwrite Auth y tiene un documento en la colección `empleados`.
- **Cliente:** Usuario que existe en Appwrite Auth y tiene un documento en la colección `clientes`.
- `requireAuth()`, `requireAdmin()`, `requireClient()` en `auth-server.ts` verifican sesión y rol.
- El rol se determina en el lado del cliente vía `useAuth()` hook, que busca primero en `clientes` y luego en `empleados`.

## Paginación

Todas las listas usan paginación **cursor-based** con `Query.cursorAfter()`. Límite por defecto: 20 documentos. Patrón `hasMore` + `nextCursor` en respuestas.
