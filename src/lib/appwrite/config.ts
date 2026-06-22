// Configuración centralizada de Appwrite
// Este archivo es la única fuente de verdad para IDs y constantes

export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
export const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID;
export const APPWRITE_ENDPOINT = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
export const APPWRITE_PROJECT_ID = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
export const APPWRITE_API_KEY = process.env.APPWRITE_API_KEY;

// Validación de variables de entorno
export function validateAppwriteConfig(required: ('database' | 'storage' | 'apiKey')[] = []) {
    const missing: string[] = [];

    if (!APPWRITE_ENDPOINT) missing.push('NEXT_PUBLIC_APPWRITE_ENDPOINT');
    if (!APPWRITE_PROJECT_ID) missing.push('NEXT_PUBLIC_APPWRITE_PROJECT_ID');

    if (required.includes('database') && !DATABASE_ID) {
        missing.push('NEXT_PUBLIC_APPWRITE_DATABASE_ID');
    }
    if (required.includes('storage') && !STORAGE_BUCKET_ID) {
        missing.push('NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID');
    }
    if (required.includes('apiKey') && !APPWRITE_API_KEY) {
        missing.push('APPWRITE_API_KEY');
    }

    if (missing.length > 0) {
        throw new Error(
            `[Appwrite] Variables de entorno faltantes: ${missing.join(', ')}. ` +
            `Verifica tu archivo .env.local`
        );
    }
}

// Función helper para obtener DATABASE_ID de forma segura
export function getDatabaseId(): string {
    if (!DATABASE_ID) {
        throw new Error('[Appwrite] DATABASE_ID no está configurado');
    }
    return DATABASE_ID;
}

// Función helper para obtener STORAGE_BUCKET_ID de forma segura
export function getStorageBucketId(): string {
    if (!STORAGE_BUCKET_ID) {
        throw new Error('[Appwrite] STORAGE_BUCKET_ID no está configurado');
    }
    return STORAGE_BUCKET_ID;
}

// IDs de colecciones
export const COLLECTIONS = {
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
} as const;

// Tipos derivados
export type CollectionName = typeof COLLECTIONS[keyof typeof COLLECTIONS];
