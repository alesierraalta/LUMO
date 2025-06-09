# LUMO - Configuración de Despliegue en Choreo

## Variables de Entorno Requeridas

### 1. Base de Datos (CRÍTICO)
```bash
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require
```
> Debe ser una base de datos PostgreSQL. Recomendado: Neon Database

### 2. JWT Secret (CRÍTICO)
```bash
JWT_SECRET=super-secret-key-minimum-32-characters-long-for-production
```
> Debe ser una cadena aleatoria de al menos 32 caracteres

### 3. Variables de Aplicación
```bash
NODE_ENV=production
PORT=3000
HOSTNAME=0.0.0.0
```

### 4. URLs de la Aplicación
```bash
NEXT_PUBLIC_APP_URL=https://tu-app.choreo.dev
APP_URL=https://tu-app.choreo.dev
```

## Usuario Administrador

La aplicación **automáticamente** creará un usuario administrador con las siguientes credenciales:

- **Email**: `alesierraalta@gmail.com`
- **Password**: `admin123`
- **Role**: `ADMIN`

Este usuario se crea/actualiza automáticamente en cada inicio de la aplicación en producción.

## Archivos de Configuración Verificados

### ✅ choreo.yaml
- Configurado para build con Dockerfile
- Variables de entorno correctas
- Health checks configurados
- Puerto 3000 expuesto

### ✅ Dockerfile
- Multi-stage build optimizado
- Configuración de Node.js 20
- Usuario no-root para seguridad
- Prisma client generado correctamente

### ✅ server.js
- Manejo de errores robusto
- Health checks en `/api/health`
- Creación automática de usuario admin
- Configuración standalone de Next.js

### ✅ package.json
- Scripts de deploy configurados
- `start:choreo` incluye ensure-admin
- Build optimizado para producción

## Comandos de Despliegue

1. **Build local para verificar**:
```bash
npm run build
```

2. **Verificar configuración**:
```bash
npm run verify:all
```

3. **Iniciar en modo choreo**:
```bash
npm run start:choreo
```

## Verificaciones Pre-Despliegue

### ✅ Base de Datos
- [ ] DATABASE_URL configurada
- [ ] Base de datos PostgreSQL accesible
- [ ] Conexión SSL habilitada

### ✅ Aplicación
- [ ] JWT_SECRET configurado
- [ ] Build exitoso sin errores
- [ ] Health check responde en `/api/health`

### ✅ Usuario Admin
- [ ] Script ensure-admin.js actualizado
- [ ] Credenciales: alesierraalta@gmail.com / admin123
- [ ] Rol ADMIN asignado

## Resolución de Problemas

### Error P6001 (Prisma)
- La aplicación automáticamente ejecuta fixes de Prisma en startup
- Incluye regeneración de cliente Prisma

### Error de Conexión DB
- Verificar DATABASE_URL en variables de entorno
- Verificar que la base de datos esté accesible desde Choreo

### Usuario Admin No Existe
- La aplicación automáticamente crea/actualiza el usuario admin
- Revisar logs del servidor para errores de creación

## Endpoints de Monitoreo

- **Health Check**: `/api/health`
- **Auth Check**: `/api/auth/me`
- **Status**: `/api/status`

## Notas Importantes

1. **El usuario admin se crea automáticamente** - no es necesario crearlo manualmente
2. **La aplicación usa standalone mode** para mejor rendimiento en Choreo
3. **Todos los fixes de deployment están automatizados** en el startup
4. **La base de datos debe ser PostgreSQL** para producción

## Estado de Desarrollo

✅ **LISTO PARA DEPLOY** - Todas las configuraciones están en orden 