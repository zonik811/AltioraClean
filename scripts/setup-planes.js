const { Client, Databases, ID, Permission, Role } = require('node-appwrite');

const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('695e8be5003357919803')
    .setKey('standard_ddd48759fd28e61a5f38817bd6ca59324a3b94bb7128d42564c9fee3b24a37e450aa7c94ef2bed84256e6ee0ef95efc188eb92f9f1ca23dc9b4d8abc03437c15f30f501e884fd58450466df8684a11e5728adfbabe75fce1f2ac2b8bda5d6a8f130c37d4af02380b5644b700a664a693641cb9b25f910bed3a3d227dfcbf4a1f');

const databases = new Databases(client);
const DATABASE_ID = '695e8da400267ef69bae';

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function tryCreate(fn, label) {
    try {
        await fn();
        console.log(`  ✅ ${label}`);
    } catch (e) {
        if (e.code === 409) {
            console.log(`  ⚠️  ${label} ya existe`);
        } else {
            console.log(`  ❌ ${label}: ${e.message}`);
        }
    }
}

async function setupPlanes() {
    console.log('🚀 Configurando colección planes y atributos faltantes...\n');

    // Crear colección planes
    console.log('📝 Colección: planes');
    await tryCreate(
        () => databases.createCollection(
            DATABASE_ID, 'planes', 'planes',
            [
                Permission.read(Role.any()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        ),
        'Crear colección'
    );
    await delay(1000);

    const attrs = [
        ['nombre', () => databases.createStringAttribute(DATABASE_ID, 'planes', 'nombre', 100, true)],
        ['descripcion', () => databases.createStringAttribute(DATABASE_ID, 'planes', 'descripcion', 1000, true)],
        ['servicioId', () => databases.createStringAttribute(DATABASE_ID, 'planes', 'servicioId', 100, true)],
        ['frecuencia', () => databases.createEnumAttribute(DATABASE_ID, 'planes', 'frecuencia', ['semanal', 'quincenal', 'mensual'], true)],
        ['precioPorVisita', () => databases.createIntegerAttribute(DATABASE_ID, 'planes', 'precioPorVisita', true)],
        ['precioSugerido', () => databases.createIntegerAttribute(DATABASE_ID, 'planes', 'precioSugerido', true)],
        ['sesionesPorMes', () => databases.createIntegerAttribute(DATABASE_ID, 'planes', 'sesionesPorMes', true)],
        ['activo', async () => {
            try {
                await databases.createBooleanAttribute(DATABASE_ID, 'planes', 'activo', false, undefined, true);
            } catch (e) {
                if (e.code === 409) { /* ya existe */ }
                else {
                    await databases.createBooleanAttribute(DATABASE_ID, 'planes', 'activo', true);
                }
            }
        }],
        ['destacado', async () => {
            try {
                await databases.createBooleanAttribute(DATABASE_ID, 'planes', 'destacado', false, undefined, false);
            } catch (e) {
                if (e.code === 409) { /* ya existe */ }
                else {
                    await databases.createBooleanAttribute(DATABASE_ID, 'planes', 'destacado', true);
                }
            }
        }],
        ['createdAt', () => databases.createDatetimeAttribute(DATABASE_ID, 'planes', 'createdAt', true)],
        ['updatedAt', () => databases.createDatetimeAttribute(DATABASE_ID, 'planes', 'updatedAt', true)],
    ];

    for (const [name, fn] of attrs) {
        await tryCreate(fn, `  atributo: ${name}`);
        await delay(300);
    }

    // Atributos faltantes en clientes
    console.log('\n📝 Colección: clientes (atributos faltantes)');
    const clientAttrs = [
        ['puntosAcumulados', () => databases.createIntegerAttribute(DATABASE_ID, 'clientes', 'puntosAcumulados', false, undefined, undefined, 0)],
        ['nivelFidelidad', () => databases.createStringAttribute(DATABASE_ID, 'clientes', 'nivelFidelidad', 20, false)],
        ['planId', () => databases.createStringAttribute(DATABASE_ID, 'clientes', 'planId', 100, false)],
        ['planInicio', () => databases.createDatetimeAttribute(DATABASE_ID, 'clientes', 'planInicio', false)],
        ['proximaCitaAuto', () => databases.createDatetimeAttribute(DATABASE_ID, 'clientes', 'proximaCitaAuto', false)],
        ['serviciosCompletados', () => databases.createIntegerAttribute(DATABASE_ID, 'clientes', 'serviciosCompletados', false, undefined, undefined, 0)],
    ];
    for (const [name, fn] of clientAttrs) {
        await tryCreate(fn, `  atributo: ${name}`);
        await delay(300);
    }

    // Atributos faltantes en citas
    console.log('\n📝 Colección: citas (atributos faltantes)');
    const citasAttrs = [
        ['planId', () => databases.createStringAttribute(DATABASE_ID, 'citas', 'planId', 100, false)],
        ['origen', () => databases.createStringAttribute(DATABASE_ID, 'citas', 'origen', 50, false)],
        ['frecuencia', () => databases.createEnumAttribute(DATABASE_ID, 'citas', 'frecuencia', ['unica', 'semanal', 'quincenal', 'mensual'], false)],
    ];
    for (const [name, fn] of citasAttrs) {
        await tryCreate(fn, `  atributo: ${name}`);
        await delay(300);
    }

    console.log('\n🎉 Configuración completada');
}

setupPlanes().catch(e => {
    console.error('❌ Error:', e.message);
    process.exit(1);
});
