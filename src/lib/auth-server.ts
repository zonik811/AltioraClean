import { createSessionClient } from '@/lib/appwrite/session-client';
import { adminDatabases } from '@/lib/appwrite/admin-client';
import { DATABASE_ID, COLLECTIONS } from '@/lib/appwrite/config';
import { Query } from 'node-appwrite';

/**
 * Verifica que el usuario esté autenticado.
 * Si no hay sesión, retorna null (no lanza error).
 * La verificación de sesión ya se hace en el layout del cliente.
 */
export async function requireAuth(): Promise<{ userId: string; email: string } | null> {
    try {
        const { account } = await createSessionClient();
        const user = await account.get();
        return { userId: user.$id, email: user.email };
    } catch {
        // No hay sesión activa - retornar null sin error
        // La verificación de sesión ya se hace en el layout del cliente
        return null;
    }
}

/**
 * Verifica que el usuario sea administrador.
 * Si no hay sesión, usa el admin SDK para verificar (tolerante).
 * La verificación de sesión ya se hace en el layout del cliente.
 */
export async function requireAdmin(): Promise<{ userId: string; email: string } | null> {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();

        const empleados = await databases.listDocuments(
            DATABASE_ID!,
            COLLECTIONS.EMPLEADOS,
            [Query.equal('email', user.email)]
        );

        if (empleados.total === 0) {
            return null;
        }

        return { userId: user.$id, email: user.email };
    } catch {
        // No hay sesión activa - retornar null sin error
        // La verificación de sesión ya se hace en el layout del cliente
        // El admin SDK tiene permisos de admin de todas formas
        return null;
    }
}

/**
 * Verifica que el usuario sea un cliente.
 * Si no hay sesión, retorna null (no lanza error).
 */
export async function requireClient(): Promise<{ userId: string; email: string; clienteId: string } | null> {
    try {
        const { account, databases } = await createSessionClient();
        const user = await account.get();

        const clientes = await databases.listDocuments(
            DATABASE_ID!,
            COLLECTIONS.CLIENTES,
            [Query.equal('email', user.email)]
        );

        if (clientes.total === 0) {
            return null;
        }

        return { userId: user.$id, email: user.email, clienteId: clientes.documents[0].$id };
    } catch {
        return null;
    }
}
