// Appwrite - Módulo centralizado
// Este archivo exporta todo lo necesario para usar Appwrite

// Configuración
export {
    DATABASE_ID,
    STORAGE_BUCKET_ID,
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    APPWRITE_API_KEY,
    COLLECTIONS,
    validateAppwriteConfig,
} from './config';

export type { CollectionName } from './config';

// Cliente admin (server-side)
export {
    adminClient,
    adminDatabases,
    adminStorage,
    adminAccount,
    adminUsers,
} from './admin-client';

// Cliente de sesión (server-side con autenticación de usuario)
export { createSessionClient } from './session-client';

// Helpers
export {
    withRetry,
    handleAppwriteError,
    tryCatch,
} from './helpers';

export type { RetryOptions, Result } from './helpers';
