const fs = require('fs');
const path = require('path');
const { Client, Databases, ID } = require('node-appwrite');

// Leer variables de .env.local de forma dinámica
const envPath = path.join(__dirname, '../.env.local');
let env = {};

try {
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine && !trimmedLine.startsWith('#')) {
                const parts = trimmedLine.split('=');
                if (parts.length >= 2) {
                    const key = parts[0].trim();
                    const value = parts.slice(1).join('=').trim();
                    env[key] = value;
                }
            }
        });
    }
} catch (err) {
    console.warn('⚠️ No se pudo leer el archivo .env.local:', err.message);
}

// Fallback o configuración de variables
const endpoint = env.NEXT_PUBLIC_APPWRITE_ENDPOINT || 'https://nyc.cloud.appwrite.io/v1';
const projectId = env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || '695e8be5003357919803';
const databaseId = env.NEXT_PUBLIC_APPWRITE_DATABASE_ID || '695e8da400267ef69bae';
const apiKey = env.APPWRITE_API_KEY;

if (!apiKey) {
    console.error('❌ Error: APPWRITE_API_KEY no está configurado en .env.local');
    process.exit(1);
}

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);

const databases = new Databases(client);

async function crearAdmin() {
    const email = process.argv[2];
    if (!email) {
        console.error('❌ Error: Por favor especifica el email del administrador.');
        console.error('Uso: node scripts/crear-admin.js tu-email@ejemplo.com');
        process.exit(1);
    }

    const cleanEmail = email.trim().toLowerCase();
    console.log(`👤 Creando empleado administrativo para: ${cleanEmail}...\n`);

    try {
        const adminData = {
            nombre: 'Administrador',
            apellido: 'AltioraClean',
            documento: '123456789',
            telefono: '3001234567',
            email: cleanEmail,
            direccion: 'Oficinas Principales',
            fechaNacimiento: new Date('1990-01-01').toISOString(),
            fechaContratacion: new Date().toISOString(),
            cargo: 'supervisor', // supervisor es admin
            especialidades: ['Administración', 'Supervisión'],
            tarifaPorHora: 15000,
            modalidadPago: 'fijo_mensual',
            activo: true,
            calificacionPromedio: 5.0,
            totalServicios: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const result = await databases.createDocument(
            databaseId,
            'empleados',
            ID.unique(),
            adminData
        );

        console.log(`🎉 ¡Perfil de administrador creado exitosamente en la base de datos!`);
        console.log(`Documento ID: ${result.$id}`);
        console.log(`Email asociado: ${cleanEmail}`);
        console.log(`Ahora puedes iniciar sesión con este email en la plataforma.`);
    } catch (error) {
        console.error('❌ Error creando admin:', error.message);
        if (error.code === 404) {
            console.error('\n⚠️ La colección "empleados" no existe. Asegúrate de correr scripts/setup-appwrite.js primero.');
        }
        process.exit(1);
    }
}

crearAdmin();
