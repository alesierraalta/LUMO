# Modos de Desarrollo y Producción

## Problema Resuelto

Anteriormente, los cambios en la base de datos afectaban tanto el ambiente de desarrollo como el de producción porque ambos usaban la misma base de datos PostgreSQL. Ahora hemos separado completamente los ambientes:

- **Desarrollo**: SQLite local (`dev.db`)
- **Producción**: PostgreSQL (Neon/Choreo)

## Comandos Disponibles

### Modo Desarrollo (SQLite)

```bash
# Cambiar a modo desarrollo (recomendado)
npm run mode:dev-quick

# O usando el script original
npm run mode:dev

# Iniciar servidor de desarrollo
npm run dev

# Reset completo de datos de desarrollo
npm run dev:reset

# Poblar con datos de prueba
npm run dev:seed
```

### Modo Producción (PostgreSQL)

```bash
# Cambiar a modo producción
npm run mode:prod-quick

# O usando el script original
npm run mode:prod

# Construir para producción
npm run build:prod

# Iniciar servidor de producción
npm run start
```

### Verificar Modo Actual

```bash
npm run mode:status
```

## Características de Cada Modo

### 🛠️ Modo Desarrollo
- **Base de datos**: SQLite (`./dev.db`)
- **Configuración**: `.env` con `DATABASE_URL=file:./dev.db`
- **Schema**: `provider = "sqlite"`
- **Datos**: Usuarios de prueba y datos de ejemplo
- **Logs**: Habilitados y detallados
- **Ventajas**:
  - ✅ Completamente separado de producción
  - ✅ Reset instantáneo
  - ✅ No requiere PostgreSQL
  - ✅ Datos de prueba incluidos

### 🚀 Modo Producción
- **Base de datos**: PostgreSQL (Neon/Choreo)
- **Configuración**: `.env` con URL de PostgreSQL
- **Schema**: `provider = "postgresql"`
- **Datos**: Datos reales de producción
- **Logs**: Minimizados
- **Ventajas**:
  - ✅ Datos reales
  - ✅ Configuración de producción
  - ✅ Optimizado para rendimiento

## Usuarios de Prueba (Desarrollo)

Cuando estés en modo desarrollo, puedes usar estos usuarios:

```
- alesierraalta@gmail.com / admin123 (Root Admin)
- admin@lumo.dev / admin123 (Admin)
- manager@lumo.dev / manager123 (Manager)
- user@lumo.dev / user123 (User)
```

## Archivos Importantes

- `.env` - Variables de entorno activas
- `.env.production` - Variables de producción (guardadas automáticamente)
- `.env.backup` - Respaldo del archivo original
- `dev.db` - Base de datos SQLite de desarrollo
- `prisma/schema.prisma` - Schema que cambia según el modo

## Flujo de Trabajo Recomendado

### Para Desarrollo Diario:
1. `npm run mode:dev-quick` (una sola vez)
2. `npm run dev` (para iniciar servidor)
3. Desarrollar y probar cambios
4. Los cambios solo afectan `dev.db`

### Para Despliegue:
1. `npm run mode:prod-quick`
2. `npm run build:prod`
3. Desplegar a Choreo
4. Los cambios van a la base de datos real

## Solución de Problemas

### Si los cambios siguen afectando producción:
```bash
# Verificar modo actual
npm run mode:status

# Forzar modo desarrollo
npm run mode:dev-quick

# Verificar que usa SQLite
npx prisma db push
```

### Si hay errores de Prisma:
```bash
# Regenerar cliente
npx prisma generate

# Reset base de datos de desarrollo
npm run dev:reset
```

### Si no encuentra DATABASE_URL:
```bash
# Verificar archivo .env
cat .env

# Debería mostrar: DATABASE_URL=file:./dev.db
```

## Scripts Automáticos

Los scripts `dev-mode.bat` y `prod-mode.bat` automatizan:

1. **Cambio de archivos `.env`**
2. **Actualización del schema de Prisma**
3. **Configuración de base de datos**
4. **Población de datos (solo desarrollo)**

Esto garantiza que nunca mezcles los ambientes por accidente. 