# Guía de Desarrollo

## Setup Local

1. Clonar repositorio.
2. `npm install`
3. Crear `.env.local` con las variables del proyecto (ver [[Appwrite#Configuración]]).
4. `npm run dev` — Inicia servidor en `http://localhost:3000`.

## Comandos

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | `next dev --webpack` |
| `npm run build` | `next build --webpack` |
| `npm run lint` | ESLint (v9 flat config en `eslint.config.mjs`) |
| `npm start` | Servidor de producción |

No hay scripts de test ni typecheck en `package.json`.

## Convenciones

- **Idioma:** Todo el código (UI, comentarios, commits) está en **español**.
- **Moneda:** Pesos colombianos (COP), formatear con `formatearPrecio()` de `src/lib/utils.ts`.
- **Rutas:** `@/*` → `./src/*`.
- **shadcn/ui:** Componentes en `src/components/ui/`, config en `components.json`.
- **PWA:** Deshabilitado en desarrollo (`disable: process.env.NODE_ENV === "development"`).
- **CSS:** Tailwind CSS v4 con `@tailwindcss/postcss`. El archivo `tailwind.config.ts` sigue existiendo para compatibilidad.
- **Login:** Usar `safeLogin()` que limpia todas las sesiones previas antes de crear una nueva.

## ESLint

Configuración flat en `eslint.config.mjs`. Ignora: `.next/`, `out/`, `build/`, `next-env.d.ts`, `scripts/`, `public/`.

## Scripts Útiles

```bash
node scripts/seed-services.js    # Poblar servicios de ejemplo
node scripts/generate-keys.js    # Generar VAPID keys
node scripts/crear-admin.js      # Crear usuario admin
```

Para setup completo de Appwrite, seguir `scripts/README.md`.
