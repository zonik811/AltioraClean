const { Client, Databases, Storage, ID, Permission, Role } = require('node-appwrite');

// Configuración
const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('695e8be5003357919803')
    .setKey('standard_ddd48759fd28e61a5f38817bd6ca59324a3b94bb7128d42564c9fee3b24a37e450aa7c94ef2bed84256e6ee0ef95efc188eb92f9f1ca23dc9b4d8abc03437c15f30f501e884fd58450466df8684a11e5728adfbabe75fce1f2ac2b8bda5d6a8f130c37d4af02380b5644b700a664a693641cb9b25f910bed3a3d227dfcbf4a1f');

const databases = new Databases(client);
const storage = new Storage(client);

const DATABASE_ID = '695e8da400267ef69bae';
const STORAGE_BUCKET_ID = '695e8dbe001a74cfd203';

// Helper para esperar entre operaciones
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function setupAppwrite() {
    console.log('🚀 Iniciando configuración de Appwrite...\n');

    try {
        // Crear colección de Servicios
        console.log('📝 Creando colección: servicios');
        try {
            await databases.createCollection(
                DATABASE_ID,
                'servicios',
                'servicios',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users()),
                ]
            );
            await delay(1000);
        } catch (e) {
            if (e.code === 409) {
                console.log('⚠️  Colección "servicios" ya existe, continuando...');
            } else {
                throw e;
            }
        }

        // Atributos de servicios
        console.log('   Agregando atributos...');
        await databases.createStringAttribute(DATABASE_ID, 'servicios', 'nombre', 100, true);
        await delay(500);
        await databases.createStringAttribute(DATABASE_ID, 'servicios', 'slug', 100, true);
        await delay(500);
        await databases.createStringAttribute(DATABASE_ID, 'servicios', 'descripcion', 1000, true);
        await delay(500);
        await databases.createStringAttribute(DATABASE_ID, 'servicios', 'descripcionCorta', 200, true);
        await delay(500);
        await databases.createEnumAttribute(DATABASE_ID, 'servicios', 'categoria', ['residencial', 'comercial', 'especializado'], true);
        await databases.createIntegerAttribute(DATABASE_ID, 'servicios', 'precioBase', true);
        await databases.createEnumAttribute(DATABASE_ID, 'servicios', 'unidadPrecio', ['hora', 'metrocuadrado', 'servicio'], true);
        await databases.createIntegerAttribute(DATABASE_ID, 'servicios', 'duracionEstimada', true);
        await databases.createStringAttribute(DATABASE_ID, 'servicios', 'imagen', 255, false);
        await databases.createStringAttribute(DATABASE_ID, 'servicios', 'caracteristicas', 5000, true, undefined, true);
        await databases.createIntegerAttribute(DATABASE_ID, 'servicios', 'requierePersonal', true);
        await databases.createBooleanAttribute(DATABASE_ID, 'servicios', 'activo', true, true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'servicios', 'createdAt', true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'servicios', 'updatedAt', true);
        console.log('✅ Colección "servicios" creada\n');

        // Crear colección de Empleados
        console.log('📝 Creando colección: empleados');
        await databases.createCollection(
            DATABASE_ID,
            'empleados',
            'empleados',
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        );

        // Atributos de empleados
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'userId', 100, false);
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'nombre', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'apellido', 50, true);
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'documento', 20, true);
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'telefono', 15, true);
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'email', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'direccion', 200, true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'empleados', 'fechaNacimiento', true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'empleados', 'fechaContratacion', true);
        await databases.createEnumAttribute(DATABASE_ID, 'empleados', 'cargo', ['limpiador', 'supervisor', 'especialista'], true);
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'especialidades', 5000, true, undefined, true);
        await databases.createIntegerAttribute(DATABASE_ID, 'empleados', 'tarifaPorHora', true);
        await databases.createEnumAttribute(DATABASE_ID, 'empleados', 'modalidadPago', ['hora', 'servicio', 'fijo_mensual'], true);
        await databases.createBooleanAttribute(DATABASE_ID, 'empleados', 'activo', true, true);
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'foto', 255, false);
        await databases.createStringAttribute(DATABASE_ID, 'empleados', 'documentos', 5000, false, undefined, true);
        await databases.createFloatAttribute(DATABASE_ID, 'empleados', 'calificacionPromedio', true, undefined, undefined, 0);
        await databases.createIntegerAttribute(DATABASE_ID, 'empleados', 'totalServicios', true, undefined, undefined, 0);
        await databases.createDatetimeAttribute(DATABASE_ID, 'empleados', 'createdAt', true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'empleados', 'updatedAt', true);
        console.log('✅ Colección "empleados" creada\n');

        // Crear colección de Citas
        console.log('📝 Creando colección: citas');
        await databases.createCollection(
            DATABASE_ID,
            'citas',
            'citas',
            [
                Permission.read(Role.users()),
                Permission.create(Role.any()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        );

        // Atributos de citas
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'servicioId', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'clienteId', 100, false);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'clienteNombre', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'clienteTelefono', 15, true);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'clienteEmail', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'direccion', 200, true);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'ciudad', 100, true);
        await databases.createEnumAttribute(DATABASE_ID, 'citas', 'tipoPropiedad', ['casa', 'apartamento', 'oficina', 'local'], true);
        await databases.createIntegerAttribute(DATABASE_ID, 'citas', 'metrosCuadrados', false);
        await databases.createIntegerAttribute(DATABASE_ID, 'citas', 'habitaciones', false);
        await databases.createIntegerAttribute(DATABASE_ID, 'citas', 'banos', false);
        await databases.createDatetimeAttribute(DATABASE_ID, 'citas', 'fechaCita', true);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'horaCita', 10, true);
        await databases.createIntegerAttribute(DATABASE_ID, 'citas', 'duracionEstimada', true);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'empleadosAsignados', 5000, false, undefined, true);
        await databases.createEnumAttribute(DATABASE_ID, 'citas', 'estado', ['pendiente', 'confirmada', 'en-progreso', 'completada', 'cancelada'], true, 'pendiente');
        await databases.createIntegerAttribute(DATABASE_ID, 'citas', 'precioCliente', true);
        await databases.createIntegerAttribute(DATABASE_ID, 'citas', 'precioAcordado', true);
        await databases.createEnumAttribute(DATABASE_ID, 'citas', 'metodoPago', ['efectivo', 'transferencia', 'nequi', 'bancolombia', 'por_cobrar'], true);
        await databases.createBooleanAttribute(DATABASE_ID, 'citas', 'pagadoPorCliente', true, false);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'detallesAdicionales', 500, false);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'notasInternas', 500, false);
        await databases.createIntegerAttribute(DATABASE_ID, 'citas', 'calificacionCliente', false);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'resenaCliente', 500, false);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'fotosAntes', 5000, false, undefined, true);
        await databases.createStringAttribute(DATABASE_ID, 'citas', 'fotosDespues', 5000, false, undefined, true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'citas', 'createdAt', true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'citas', 'updatedAt', true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'citas', 'completedAt', false);
        try {
            await databases.createStringAttribute(DATABASE_ID, 'citas', 'planId', 100, false);
        } catch (e) {
            if (e.code !== 409) console.warn('   planId ya existe en citas');
        }
        try {
            await databases.createStringAttribute(DATABASE_ID, 'citas', 'origen', 50, false);
        } catch (e) {
            if (e.code !== 409) console.warn('   origen ya existe en citas');
        }
        try {
            await databases.createEnumAttribute(DATABASE_ID, 'citas', 'frecuencia', ['unica', 'semanal', 'quincenal', 'mensual'], false);
        } catch (e) {
            if (e.code !== 409) console.warn('   frecuencia ya existe en citas');
        }
        console.log('✅ Colección "citas" creada\n');

        // Crear colección de Clientes
        console.log('📝 Creando colección: clientes');
        await databases.createCollection(
            DATABASE_ID,
            'clientes',
            'clientes',
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        );

        // Atributos de clientes
        await databases.createStringAttribute(DATABASE_ID, 'clientes', 'nombre', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'clientes', 'telefono', 15, true);
        await databases.createStringAttribute(DATABASE_ID, 'clientes', 'email', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'clientes', 'direccion', 200, true);
        await databases.createStringAttribute(DATABASE_ID, 'clientes', 'ciudad', 100, true);
        await databases.createEnumAttribute(DATABASE_ID, 'clientes', 'tipoCliente', ['residencial', 'comercial'], true);
        await databases.createEnumAttribute(DATABASE_ID, 'clientes', 'frecuenciaPreferida', ['unica', 'semanal', 'quincenal', 'mensual'], true);
        await databases.createIntegerAttribute(DATABASE_ID, 'clientes', 'totalServicios', true, undefined, undefined, 0);
        await databases.createIntegerAttribute(DATABASE_ID, 'clientes', 'totalGastado', true, undefined, undefined, 0);
        await databases.createFloatAttribute(DATABASE_ID, 'clientes', 'calificacionPromedio', true, undefined, undefined, 0);
        await databases.createStringAttribute(DATABASE_ID, 'clientes', 'notasImportantes', 500, false);
        await databases.createBooleanAttribute(DATABASE_ID, 'clientes', 'activo', true, true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'clientes', 'createdAt', true);
        await databases.createStringAttribute(DATABASE_ID, 'clientes', 'ultimoServicio', 100, false);
        try {
            await databases.createIntegerAttribute(DATABASE_ID, 'clientes', 'puntosAcumulados', false, undefined, undefined, 0);
        } catch (e) {
            if (e.code !== 409) console.warn('   puntosAcumulados ya existe en clientes');
        }
        try {
            await databases.createStringAttribute(DATABASE_ID, 'clientes', 'nivelFidelidad', 20, false);
        } catch (e) {
            if (e.code !== 409) console.warn('   nivelFidelidad ya existe en clientes');
        }
        console.log('✅ Colección "clientes" creada\n');

        // Crear colección de Pagos a Empleados
        console.log('📝 Creando colección: pagos_empleados');
        await databases.createCollection(
            DATABASE_ID,
            'pagos_empleados',
            'pagos_empleados',
            [
                Permission.read(Role.users()),
                Permission.create(Role.users()),
                Permission.update(Role.users()),
                Permission.delete(Role.users()),
            ]
        );

        // Atributos de pagos_empleados
        await databases.createStringAttribute(DATABASE_ID, 'pagos_empleados', 'empleadoId', 100, true);
        await databases.createStringAttribute(DATABASE_ID, 'pagos_empleados', 'citaId', 100, false);
        await databases.createStringAttribute(DATABASE_ID, 'pagos_empleados', 'periodo', 20, false);
        await databases.createEnumAttribute(DATABASE_ID, 'pagos_empleados', 'concepto', ['servicio', 'anticipo', 'pago_mensual', 'bono', 'deduccion'], true);
        await databases.createIntegerAttribute(DATABASE_ID, 'pagos_empleados', 'monto', true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'pagos_empleados', 'fechaPago', false);
        await databases.createEnumAttribute(DATABASE_ID, 'pagos_empleados', 'metodoPago', ['efectivo', 'transferencia', 'nequi', 'bancolombia'], true);
        await databases.createEnumAttribute(DATABASE_ID, 'pagos_empleados', 'estado', ['pendiente', 'pagado', 'parcial'], true, 'pendiente');
        await databases.createStringAttribute(DATABASE_ID, 'pagos_empleados', 'comprobante', 255, false);
        await databases.createStringAttribute(DATABASE_ID, 'pagos_empleados', 'notas', 500, false);
        await databases.createStringAttribute(DATABASE_ID, 'pagos_empleados', 'creadoPor', 100, true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'pagos_empleados', 'createdAt', true);
        await databases.createDatetimeAttribute(DATABASE_ID, 'pagos_empleados', 'updatedAt', true);
        console.log('✅ Colección "pagos_empleados" creada\n');

        console.log('🎉 ¡Todas las colecciones han sido creadas exitosamente!\n');
        console.log('📋 Resumen:');
        console.log('   ✓ servicios');
        console.log('   ✓ empleados');
        console.log('   ✓ citas');
        console.log('   ✓ clientes');
        console.log('   ✓ pagos_empleados\n');
        // Crear colección de Planes
        console.log('📝 Creando colección: planes');
        try {
            await databases.createCollection(
                DATABASE_ID,
                'planes',
                'planes',
                [
                    Permission.read(Role.any()),
                    Permission.create(Role.users()),
                    Permission.update(Role.users()),
                    Permission.delete(Role.users()),
                ]
            );
            await delay(1000);
        } catch (e) {
            if (e.code === 409) {
                console.log('⚠️  Colección "planes" ya existe, continuando...');
            } else {
                throw e;
            }
        }

        console.log('   Agregando atributos...');
        await databases.createStringAttribute(DATABASE_ID, 'planes', 'nombre', 100, true);
        await delay(500);
        await databases.createStringAttribute(DATABASE_ID, 'planes', 'descripcion', 1000, true);
        await delay(500);
        await databases.createStringAttribute(DATABASE_ID, 'planes', 'servicioId', 100, true);
        await delay(500);
        await databases.createEnumAttribute(DATABASE_ID, 'planes', 'frecuencia', ['semanal', 'quincenal', 'mensual'], true);
        await delay(500);
        await databases.createIntegerAttribute(DATABASE_ID, 'planes', 'precioPorVisita', true);
        await delay(500);
        await databases.createIntegerAttribute(DATABASE_ID, 'planes', 'precioSugerido', true);
        await delay(500);
        await databases.createIntegerAttribute(DATABASE_ID, 'planes', 'sesionesPorMes', true);
        await delay(500);
        await databases.createBooleanAttribute(DATABASE_ID, 'planes', 'activo', true, true);
        await delay(500);
        await databases.createBooleanAttribute(DATABASE_ID, 'planes', 'destacado', true, false);
        await delay(500);
        await databases.createDatetimeAttribute(DATABASE_ID, 'planes', 'createdAt', true);
        await delay(500);
        await databases.createDatetimeAttribute(DATABASE_ID, 'planes', 'updatedAt', true);
        console.log('✅ Colección "planes" creada\n');

        // Agregar atributos de plan a clientes si no existen
        try {
            await databases.createStringAttribute(DATABASE_ID, 'clientes', 'planId', 100, false);
        } catch (e) {
            if (e.code !== 409) console.warn('   planId ya existe o error:', e.message);
        }
        try {
            await databases.createDatetimeAttribute(DATABASE_ID, 'clientes', 'planInicio', false);
        } catch (e) {
            if (e.code !== 409) console.warn('   planInicio ya existe o error:', e.message);
        }
        try {
            await databases.createDatetimeAttribute(DATABASE_ID, 'clientes', 'proximaCitaAuto', false);
        } catch (e) {
            if (e.code !== 409) console.warn('   proximaCitaAuto ya existe o error:', e.message);
        }

        console.log('🎉 ¡Todas las colecciones han sido creadas exitosamente!\n');
        console.log('📋 Resumen:');
        console.log('   ✓ servicios');
        console.log('   ✓ empleados');
        console.log('   ✓ citas');
        console.log('   ✓ clientes (actualizado con planId, planInicio, proximaCitaAuto)');
        console.log('   ✓ pagos_empleados');
        console.log('   ✓ planes\n');
        console.log('💡 Próximo paso: Crear un usuario admin en Appwrite Auth');

    } catch (error) {
        console.error('❌ Error durante la configuración:', error.message);
        if (error.response) {
            console.error('Detalles:', error.response);
        }
        process.exit(1);
    }
}

setupAppwrite();
