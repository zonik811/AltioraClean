# Checklist de Pruebas QA - AltioraClean

## 1. Páginas Públicas

### 1.1 Landing Page (/)
- [ ] Carga sin errores
- [ ] Hero section visible con CTA
- [ ] Sección de servicios muestra imágenes
- [ ] Testimonios se renderizan
- [ ] Footer con información de contacto
- [ ] Navbar responsive (mobile/desktop)

### 1.2 Página de Agendar (/agendar)
- [ ] Formulario multi-paso funciona (3 pasos)
- [ ] Cálculo dinámico de precio
- [ ] Selector de fecha/hora funciona
- [ ] Validaciones de formulario
- [ ] Si usuario está logueado, auto-rellena datos
- [ ] Si no, permite agendar como invitado
- [ ] Al completar, crea cita y cliente si no existe

### 1.3 Login (/login)
- [ ] Formulario visible
- [ ] Validación de campos requeridos
- [ ] Login con credenciales correctas redirige según rol
- [ ] Login con credenciales incorrectas muestra error
- [ ] Link "¿Olvidaste tu contraseña?" funciona

### 1.4 Registro (/registro)
- [ ] Formulario completo (nombre, email, teléfono, contraseña, dirección)
- [ ] Validación de email único
- [ ] Validación de contraseña mínima 8 caracteres
- [ ] Al registrarse, crea cuenta Appwrite + documento Cliente
- [ ] Auto-login después del registro
- [ ] Redirección a /portal/dashboard

### 1.5 Recuperar Contraseña (/recuperar) - NUEVO
- [ ] Formulario visible con campo email
- [ ] Al enviar, muestra mensaje de éxito
- [ ] Link de recuperación enviado (verificar consola Appwrite)
- [ ] Link "Volver al inicio de sesión" funciona

### 1.6 Resetear Contraseña (/resetear-contrasena) - NUEVO
- [ ] Al hacer clic en link del email, abre página
- [ ] Validación de contraseña mínima 8 caracteres
- [ ] Validación de contraseñas coincidentes
- [ ] Al resetear, muestra mensaje de éxito
- [ ] Redirección a /login funciona

## 2. Portal de Cliente (/portal/dashboard)

### 2.1 Autenticación
- [ ] Sin login, redirige a /login
- [ ] Con login de cliente, muestra dashboard
- [ ] Con login de admin, redirige a /admin

### 2.2 Dashboard
- [ ] Tarjeta de membresía visible (Bronce/Plata/Oro)
- [ ] Progreso de puntos visible
- [ ] Tabs funcionan: Resumen, Mis Servicios, Puntos, Direcciones
- [ ] Historial de servicios se carga
- [ ] Filtro de búsqueda funciona
- [ ] Direcciones guardadas se muestran

## 3. Panel de Admin (/admin)

### 3.1 Autenticación
- [ ] Sin login, redirige a /login
- [ ] Con login de admin, muestra dashboard
- [ ] Con login de cliente, redirige a /portal/dashboard

### 3.2 Dashboard Admin
- [ ] Stats cards se cargan (citas hoy, ingresos, etc.)
- [ ] Próximas citas listadas
- [ ] Acciones rápidas funcionan
- [ ] Gráfico de ingresos vs gastos

### 3.3 Citas (/admin/citas)
- [ ] Lista de citas se carga
- [ ] Filtros funcionan (estado, fecha, empleado)
- [ ] Click en cita abre detalle
- [ ] Botón "Nueva cita" abre formulario
- [ ] Editar estado de cita funciona
- [ ] Asignar empleados funciona
- [ ] Marcar como completada registra puntos

### 3.4 Personal (/admin/personal)
- [ ] Lista de empleados se carga
- [ ] Filtros funcionan (activo/inactivo)
- [ ] Búsqueda por nombre funciona
- [ ] Click en empleado abre detalle
- [ ] Botón "Nuevo empleado" abre formulario
- [ ] Editar empleado funciona
- [ ] Soft delete (marcar inactivo) funciona
- [ ] **PAGINACIÓN**: Botón "Cargar más" aparece si hay >20 empleados

### 3.5 Clientes (/admin/clientes)
- [ ] Lista de clientes se carga
- [ ] Filtros funcionan
- [ ] Búsqueda funciona
- [ ] Click en cliente abre detalle

### 3.6 Pagos Empleados (/admin/pagos/empleados)
- [ ] Lista de pagos se carga
- [ ] Filtros por empleado/fecha funcionan
- [ ] Registrar nuevo pago funciona
- [ ] Eliminar pago funciona
- [ ] Estadísticas se actualizan

### 3.7 Pagos Clientes (/admin/pagos/clientes)
- [ ] Lista de pagos se carga
- [ ] Filtros funcionan
- [ ] Registrar pago funciona
- [ ] Recalcula estado de cita (pagado/pendiente)

### 3.8 Gastos (/admin/gastos)
- [ ] Lista de gastos se carga
- [ ] Filtros por categoría/fecha funcionan
- [ ] Registrar nuevo gasto funciona
- [ ] Editar gasto funciona
- [ ] Eliminar gasto funciona
- [ ] Gráfico de gastos por categoría

### 3.9 Servicios (/admin/servicios)
- [ ] Lista de servicios se carga
- [ ] Crear nuevo servicio funciona
- [ ] Editar servicio funciona
- [ ] Activar/desactivar servicio

### 3.10 Reportes (/admin/reportes)
- [ ] Reporte financiero mensual se carga
- [ ] Gráfico de ingresos vs gastos
- [ ] Estadísticas de servicios por tipo
- [ ] Top clientes
- [ ] Cartera (cuentas por cobrar)
- [ ] Estado de nómina (datos reales, no mock)
- [ ] Rendimiento del personal

## 4. Autorización Server-Side - NUEVO

### 4.1 Endpoints Protegidos (Admin)
- [ ] Sin sesión, las acciones de admin fallan con error
- [ ] Con sesión de cliente, las acciones de admin fallan
- [ ] Con sesión de admin, las acciones funcionan

### 4.2 Endpoints Protegidos (Cliente)
- [ ] obtenerMisCitas solo devuelve citas del usuario autenticado
- [ ] obtenerCita requiere sesión activa

## 5. Integración con Appwrite

### 5.1 Autenticación
- [ ] Crear sesión funciona
- [ ] Cerrar sesión funciona
- [ ] Recuperación de contraseña envía email

### 5.2 Base de Datos
- [ ] CRUD de citas funciona
- [ ] CRUD de empleados funciona
- [ ] CRUD de clientes funciona
- [ ] CRUD de gastos funciona
- [ ] CRUD de pagos funciona

### 5.3 Notificaciones Push
- [ ] Toggle de notificaciones funciona
- [ ] Service worker se registra
- [ ] Suscripción se guarda en BD

## 6. Responsive Design

### 6.1 Mobile (< 768px)
- [ ] Navbar colapsa en menú hamburguesa
- [ ] Sidebar admin es drawer
- [ ] Tablas son scrolleables horizontalmente
- [ ] Formularios son de una columna
- [ ] Botones son touch-friendly

### 6.2 Desktop (>= 768px)
- [ ] Navbar expandido
- [ ] Sidebar admin visible
- [ ] Grid layouts funcionan
- [ ] Modales centrados

## 7. Errores a Verificar

### 7.1 Consola del Navegador
- [ ] No hay errores 404 de recursos
- [ ] No hay errores de TypeScript
- [ ] No hay errores de CORS
- [ ] No hay errores de autenticación inesperados

### 7.2 Consola del Servidor
- [ ] No hay errores de compilación
- [ ] No hay errores de conexión a Appwrite
- [ ] No hay errores de variables de entorno

## 8. Performance

- [ ] Landing page carga en < 3s
- [ ] Dashboard admin carga en < 2s
- [ ] Listas con paginación cargan rápido
- [ ] Imágenes optimizadas (next/image)

## 9. Seguridad

- [ ] Variables de entorno no expuestas en cliente
- [ ] API Key de Appwrite no visible en frontend
- [ ] VAPID private key no visible en frontend
- [ ] Rutas de admin protegidas
- [ ] Server actions verifican permisos

---

## Notas de Pruebas

### Cambios Recientes a Verificar
1. **Reset de contraseña**: Probar flujo completo desde /recuperar
2. **Autorización**: Intentar acceder a acciones de admin sin permisos
3. **Paginación**: En /admin/personal, verificar botón "Cargar más"
4. **Tipos**: Verificar que no hay errores de TypeScript en consola
5. **Console.logs**: Verificar que no hay logs de debug con emojis

### Datos de Prueba Sugeridos
- **Admin**: Crear empleado con email para login
- **Cliente**: Registrarse desde /registro
- **Cita**: Agendar desde /agendar como invitado
- **Gasto**: Registrar gasto de prueba
- **Pago**: Registrar pago a empleado
