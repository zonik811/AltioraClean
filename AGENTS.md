# AltioraClean — AGENTS.md

## Tech stack

- Next.js 16 (App Router, `--webpack` flag), React 19, TypeScript 5
- Tailwind CSS 4 + PostCSS (`@tailwindcss/postcss`), shadcn/ui (New York style)
- Appwrite (auth, database, storage) — both client SDK in browser and `node-appwrite` SDK with API Key on the server
- PWA via `@ducanh2912/next-pwa`, Web Push notifications (VAPID keys)
- Charts: Recharts. Forms: react-hook-form + zod. Icons: lucide-react. Toasts: sonner. Motion: framer-motion.

## Commands

```bash
npm run dev          # next dev --webpack
npm run build        # next build --webpack
npm run lint         # eslint (v9 flat config)
npm start            # next start
```

No test or typecheck scripts in `package.json`.

## Environment (.env.local)

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=695e8be5003357919803
NEXT_PUBLIC_APPWRITE_DATABASE_ID=695e8da400267ef69bae
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=695e8dbe001a74cfd203
APPWRITE_API_KEY=standard_<...>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<key>
VAPID_PRIVATE_KEY=<key>
```

`NEXT_PUBLIC_*` needed at build time. `APPWRITE_API_KEY` is server-only (admin SDK).

## Project structure

```
src/
  app/              # Next.js App Router pages
    admin/          # Admin panel (citas, clientes, gastos, pagos, personal, reportes, servicios)
    agendar/        # Public scheduling
    login/          # Auth
    registro/       # Registration
    recuperar/      # Password recovery
    resetear-contrasena/  # Password reset
    (client)/       # Client portal (dashboard)
  components/
    ui/             # shadcn/ui primitives
    admin/          # Admin-specific components
  lib/
    actions/        # Server actions (citas, clientes, empleados, gastos, pagos, etc.)
    appwrite/       # config.ts (IDs), admin-client.ts, session-client.ts, helpers.ts
    hooks/          # useAuth, use-toast, usePushNotifications
    appwrite.ts     # Browser-side Appwrite client
    appwrite-admin.ts # Server-side alias
    auth-server.ts  # requireAuth, requireAdmin, requireClient
  types/            # All TS enums & interfaces (Servicio, Empleado, Cita, etc.)
scripts/            # Setup scripts (seed-services.js, setup-appwrite.js, etc.)
```

## Appwrite — critical details

**Two clients co-exist:**
1. **Browser client** (`src/lib/appwrite.ts`): uses `appwrite` npm package, runs in browser. Safe for `Account`, `Databases`, `Storage` on user-session operations.
2. **Admin client** (`src/lib/appwrite/admin-client.ts`): uses `node-appwrite`, server-only, initialized with `APPWRITE_API_KEY`. Used in server actions.

**Session client** (`session-client.ts`): creates a `node-appwrite` client using the `a_session` cookie for per-user server-side operations.

**Collection ID constants** live in `src/lib/appwrite/config.ts`:
```ts
COLLECTIONS = {
  SERVICIOS: 'servicios',
  CITAS: 'citas',
  EMPLEADOS: 'empleados',
  CLIENTES: 'clientes',
  PAGOS_EMPLEADOS: 'pagos_empleados',
  PAGOS_CLIENTES: 'pagos_clientes',
  GASTOS: 'gastos',
  DIRECCIONES: 'direcciones',
  HISTORIAL_PUNTOS: 'historial_puntos',
  NOTIFICACIONES: 'notificaciones',
}
```

**Appwrite collection permissions** (must match Appwrite Console):
- `servicios`: Read=any, Create/Update/Delete=users
- `citas`: Read/Update/Delete=users, Create=any (public scheduling)
- All others: Read/Create/Update/Delete=users

See `PERMISOS_APPWRITE.md` for the full matrix.

## Conventions

- Codebase is in **Spanish** (UI, comments, identifiers, commit messages).
- Currency: COP (Colombian pesos), formatted via `formatearPrecio()` in `src/lib/utils.ts`.
- Path alias `@/*` → `./src/*`.
- shadcn/ui components in `src/components/ui/`, installed via `components.json`.
- Server actions in `src/lib/actions/`, returning `CreateResponse<T>` / `UpdateResponse` / `DeleteResponse`.
- Auth check pattern in layouts: `requireAuth()`, `requireAdmin()`, `requireClient()` from `auth-server.ts`.
- Appwrite errors use `handleAppwriteError()` helper; transient failures use `withRetry()` (exponential backoff).
- CSS uses `@tailwindcss/postcss` (Tailwind CSS v4 PostCSS plugin).
- ESlint flat config in `eslint.config.mjs` — ignores `.next/`, `out/`, `build/`, `scripts/`, `public/`.
- PWA disabled in development (`disable: process.env.NODE_ENV === "development"`).
- Custom service worker at `public/custom-sw.js` handles push notifications.
- Login uses `safeLogin()` which clears all sessions first to avoid stale session issues.

## Git / remote

- Remote: `origin` → `https://github.com/zonik811/AltioraClean.git`, single `main` branch.
- Commits are in Spanish.
