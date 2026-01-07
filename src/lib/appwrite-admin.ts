import { Client, Databases, Storage, Account, Users } from "node-appwrite";

// Validar que la API Key exista
const apiKey = process.env.APPWRITE_API_KEY;
const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;

if (!apiKey || !endpoint || !projectId) {
    console.warn("⚠️ Appwrite Admin Client: Faltan variables de entorno (API KEY, Endpoint o Project ID)");
}

const client = new Client()
    .setEndpoint(endpoint || "")
    .setProject(projectId || "")
    .setKey(apiKey || "");

export const databases = new Databases(client);
export const storage = new Storage(client);
export const account = new Account(client);
export const users = new Users(client);

// Re-exportar constantes necesarias
export const DATABASE_ID = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID!;
export const STORAGE_BUCKET_ID = process.env.NEXT_PUBLIC_APPWRITE_STORAGE_BUCKET_ID!;
