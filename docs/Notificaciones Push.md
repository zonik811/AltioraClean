# Notificaciones Push

## Configuración

- VAPID keys se generan con `node scripts/generate-keys.js`.
- Las keys se almacenan en `.env.local` como `NEXT_PUBLIC_VAPID_PUBLIC_KEY` y `VAPID_PRIVATE_KEY`.
- Service worker personalizado en `public/custom-sw.js` maneja eventos `push` y `notificationclick`.

## Flujo

1. El navegador registra el service worker (`@ducanh2912/next-pwa` lo maneja automáticamente).
2. El hook `usePushNotifications()` en `src/lib/hooks/usePushNotifications.ts`:
   - Obtiene suscripción actual.
   - `subscribe()` — Solicita permiso, crea suscripción, la guarda en `push_subscriptions`.
   - `unsubscribe()` — Elimina suscripción en navegador y base de datos.
3. `sendNotification()` en `src/lib/actions/notifications.ts` envía a todas las suscripciones (o a un `userId` específico).
4. Suscripciones expiradas (HTTP 410/404) se limpian automáticamente.

## Colección Appwrite

- `push_subscriptions`: Guarda endpoint, keys (JSON string), userId y userAgent.
- Desduplicación por endpoint al suscribirse.
