# Server Actions

Todas las server actions están en `src/lib/actions/`. Cada archivo corresponde a una entidad del dominio.

## Patrón General

```typescript
"use server";

import { databases } from "@/lib/appwrite-admin";
import { getDatabaseId, COLLECTIONS } from "@/lib/appwrite/config";
import { Query, ID } from "node-appwrite";
import { requireAdmin } from "@/lib/auth-server";
import type { CreateResponse, ... } from "@/types";

export async function miAccion(input: Input): Promise<CreateResponse<Entidad>> {
  try {
    await requireAdmin(); // o requireAuth() / requireClient()

    const result = await databases.createDocument(
      getDatabaseId(),
      COLLECTIONS.MI_COLECCION,
      ID.unique(),
      data
    );

    return { success: true, data: result as unknown as Entidad };
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}
```

## Reglas

1. Toda server action empieza con `"use server"`.
2. Las operaciones de **admin** usan `databases` del admin client (`node-appwrite` + API Key).
3. Las operaciones de **cliente** pueden usar el session client para filtrar por usuario autenticado.
4. `requireAdmin()` se llama al inicio para verificar permisos; si falla, retorna `{ success: false, error }`.
5. Los errores se capturan y devuelven en el objeto de respuesta — **no se lanzan** (excepto en acciones que no usan `CreateResponse`).
6. Timestamps (`createdAt`, `updatedAt`) se asignan manualmente con `new Date().toISOString()`.
7. Las colecciones son strings planas (no IDs de Appwrite) — ver `COLLECTIONS` en `config.ts`.
