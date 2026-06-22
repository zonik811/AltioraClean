import { AppwriteException } from 'node-appwrite';

// Configuración de retry
const MAX_RETRIES = 3;
const INITIAL_DELAY = 1000; // 1 segundo

export interface RetryOptions {
    maxRetries?: number;
    initialDelay?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
}

// Errores que deben reintentarse
function isRetryableError(error: unknown): boolean {
    if (error instanceof AppwriteException) {
        // Errores de red o timeout
        if (error.code === 0 || error.code === 503 || error.code === 504) {
            return true;
        }
        // Rate limiting
        if (error.code === 429) {
            return true;
        }
    }
    return false;
}

// Delay con exponential backoff
function getDelay(attempt: number, initialDelay: number): number {
    return initialDelay * Math.pow(2, attempt - 1) + Math.random() * 100;
}

// Función para dormir
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Ejecuta una operación con retry logic y exponential backoff
 */
export async function withRetry<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const {
        maxRetries = MAX_RETRIES,
        initialDelay = INITIAL_DELAY,
        shouldRetry = isRetryableError,
    } = options;

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            return await operation();
        } catch (error) {
            lastError = error;

            // Si es el último intento o no es retryable, lanzar error
            if (attempt === maxRetries || !shouldRetry(error, attempt)) {
                throw error;
            }

            // Esperar antes de reintentar
            const delay = getDelay(attempt, initialDelay);
            await sleep(delay);
        }
    }

    throw lastError;
}

/**
 * Helper para manejar errores de Appwrite de forma consistente
 */
export function handleAppwriteError(error: unknown, context: string): never {
    if (error instanceof AppwriteException) {
        console.error(`[Appwrite Error] ${context}:`, {
            code: error.code,
            type: error.type,
            message: error.message,
            response: error.response,
        });

        // Errores específicos con mensajes amigables
        if (error.code === 401) {
            throw new Error('No autorizado. Por favor, inicia sesión nuevamente.');
        }
        if (error.code === 403) {
            throw new Error('No tienes permisos para realizar esta acción.');
        }
        if (error.code === 404) {
            throw new Error('El recurso solicitado no existe.');
        }
        if (error.code === 409) {
            throw new Error('Ya existe un registro con estos datos.');
        }
        if (error.code === 429) {
            throw new Error('Demasiadas solicitudes. Por favor, espera un momento.');
        }
    }

    console.error(`[Error] ${context}:`, error);
    throw error;
}

/**
 * Result type para operaciones que pueden fallar
 */
export type Result<T, E = Error> = 
    | { success: true; data: T }
    | { success: false; error: E };

/**
 * Helper para envolver operaciones en Result type
 */
export async function tryCatch<T>(
    operation: () => Promise<T>
): Promise<Result<T>> {
    try {
        const data = await operation();
        return { success: true, data };
    } catch (error) {
        return { 
            success: false, 
            error: error instanceof Error ? error : new Error(String(error))
        };
    }
}
