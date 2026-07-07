import { Client, Databases, Storage, Account } from 'appwrite';
import {
    APPWRITE_ENDPOINT,
    APPWRITE_PROJECT_ID,
    DATABASE_ID,
    STORAGE_BUCKET_ID,
    COLLECTIONS,
    validateAppwriteConfig,
} from './appwrite/config';

// Validar configuración básica
validateAppwriteConfig();

// Cliente público (browser-side)
const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT!)
    .setProject(APPWRITE_PROJECT_ID!);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

// Re-exportar constantes
export { DATABASE_ID, STORAGE_BUCKET_ID, COLLECTIONS };

// Función para limpiar completamente la sesión
export async function clearAllSessions(): Promise<void> {
    try {
        try {
            const sessions = await account.listSessions();
            for (const session of sessions.sessions) {
                try {
                    await account.deleteSession(session.$id);
                } catch {
                    // Ignorar
                }
            }
        } catch {
            // No se pudieron listar sesiones
        }

        try {
            await account.deleteSession("current");
        } catch {
            // No hay sesión actual
        }

        if (typeof document !== 'undefined') {
            document.cookie.split(";").forEach(function(c) {
                const cookieName = c.split("=")[0].trim();
                document.cookie = cookieName + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
            });
        }

        await new Promise(resolve => setTimeout(resolve, 300));
    } catch {
        // Ignorar errores generales
    }
}

// Función de login seguro que limpia sesiones primero
export async function safeLogin(email: string, password: string): Promise<void> {
    await clearAllSessions();
    await account.createEmailPasswordSession(email, password);
}

// Helper para subir archivos
export async function subirArchivo(file: File): Promise<string> {
    try {
        const response = await storage.createFile(
            STORAGE_BUCKET_ID!,
            'unique()',
            file
        );
        return response.$id;
    } catch (error) {
        console.error('Error subiendo archivo:', error);
        throw new Error('No se pudo subir el archivo');
    }
}

// Helper para obtener URL de archivo
export function obtenerURLArchivo(fileId: string): string {
    return `${APPWRITE_ENDPOINT}/storage/buckets/${STORAGE_BUCKET_ID}/files/${fileId}/view?project=${APPWRITE_PROJECT_ID}`;
}

// Helper para eliminar archivo
export async function eliminarArchivo(fileId: string): Promise<void> {
    try {
        await storage.deleteFile(STORAGE_BUCKET_ID!, fileId);
    } catch (error) {
        console.error('Error eliminando archivo:', error);
        throw new Error('No se pudo eliminar el archivo');
    }
}

export default client;
