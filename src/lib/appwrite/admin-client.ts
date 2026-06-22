import { Client, Databases, Storage, Account, Users } from 'node-appwrite';
import { validateAppwriteConfig, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY } from './config';

// Validar configuración al importar (fail-fast)
validateAppwriteConfig(['apiKey']);

// Cliente admin con API Key (para server actions)
const adminClient = new Client()
    .setEndpoint(APPWRITE_ENDPOINT!)
    .setProject(APPWRITE_PROJECT_ID!)
    .setKey(APPWRITE_API_KEY!);

export const adminDatabases = new Databases(adminClient);
export const adminStorage = new Storage(adminClient);
export const adminAccount = new Account(adminClient);
export const adminUsers = new Users(adminClient);

export { adminClient };
