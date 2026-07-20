# Appwrite

## Configuración

Todas las constantes viven en `src/lib/appwrite/config.ts` y se importan vía variables de entorno en `.env.local`.

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=695e8be5003357919803
NEXT_PUBLIC_APPWRITE_DATABASE_ID=695e8da400267ef69bae
NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID=695e8dbe001a74cfd203
APPWRITE_API_KEY=standard_<...>
NEXT_PUBLIC_VAPID_PUBLIC_KEY=<key>
VAPID_PRIVATE_KEY=<key>
```

`APPWRITE_API_KEY` es **server-only** (no tiene prefijo `NEXT_PUBLIC_`).

## Tres Clientes

| Cliente | Archivo | SDK | Uso |
|---------|---------|-----|-----|
| Browser | `src/lib/appwrite.ts` | `appwrite` (npm) | Account, listDocuments del lado del cliente |
| Admin | `src/lib/appwrite/admin-client.ts` | `node-appwrite` | Server actions — API Key con permisos totales |
| Sesión | `src/lib/appwrite/session-client.ts` | `node-appwrite` | Operaciones server-side autenticadas por cookie `a_session` |

## Colecciones

Ver `src/lib/appwrite/config.ts` para los IDs exactos. Colecciones actuales:

- `servicios` — Read: any, Create/Update/Delete: users
- `citas` — Read/Update/Delete: users, Create: any
- `empleados`, `clientes`, `pagos_empleados`, `pagos_clientes`, `gastos`, `direcciones`, `historial_puntos`, `notificaciones`, `push_subscriptions` — todas Read/Create/Update/Delete: users

Para esquemas detallados de atributos, ver `scripts/README.md`.

## Funciones Helper

- `handleAppwriteError(error, context)` — Manejo consistente de errores con mensajes en español
- `withRetry(operation)` — Exponential backoff para errores transitorios (códigos 0, 429, 503, 504)
- `tryCatch(operation)` — Envuelve operaciones en `Result<T, E>` type
- `validateAppwriteConfig(required)` — Fail-fast si faltan variables de entorno
