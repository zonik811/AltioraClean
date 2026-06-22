import {
    adminDatabases,
    adminStorage,
    adminAccount,
    adminUsers,
} from './appwrite/admin-client';
import {
    DATABASE_ID,
    STORAGE_BUCKET_ID,
    COLLECTIONS,
} from './appwrite/config';

// Re-exportar para compatibilidad con código existente
export const databases = adminDatabases;
export const storage = adminStorage;
export const account = adminAccount;
export const users = adminUsers;

export { DATABASE_ID, STORAGE_BUCKET_ID, COLLECTIONS };
