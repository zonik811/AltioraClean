import { Client, Account, Databases } from 'node-appwrite';
import { cookies } from 'next/headers';
import { APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, validateAppwriteConfig } from './config';

// Cache para sesiones (evita crear múltiples clientes por request)
const sessionCache = new Map<string, { client: Client; expires: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

validateAppwriteConfig();

export async function createSessionClient() {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('a_session');

    if (!sessionCookie?.value) {
        throw new Error('No hay sesión activa');
    }

    // Verificar cache
    const cached = sessionCache.get(sessionCookie.value);
    if (cached && cached.expires > Date.now()) {
        return {
            account: new Account(cached.client),
            databases: new Databases(cached.client),
        };
    }

    // Crear nuevo cliente
    const client = new Client()
        .setEndpoint(APPWRITE_ENDPOINT!)
        .setProject(APPWRITE_PROJECT_ID!)
        .setSession(sessionCookie.value);

    // Guardar en cache
    sessionCache.set(sessionCookie.value, {
        client,
        expires: Date.now() + CACHE_TTL,
    });

    // Limpiar cache expirado periódicamente
    if (sessionCache.size > 100) {
        const now = Date.now();
        for (const [key, value] of sessionCache.entries()) {
            if (value.expires < now) {
                sessionCache.delete(key);
            }
        }
    }

    return {
        account: new Account(client),
        databases: new Databases(client),
    };
}
