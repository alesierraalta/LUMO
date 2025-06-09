# 🚀 LUMO - Sistema de Setup Automático

## ✨ ¿Qué es esto?

**Un sistema completamente automático** que detecta si estás en desarrollo o producción y configura todo automáticamente:

- 🛠️ **Desarrollo**: SQLite + Usuario admin + .env.local
- 📦 **Producción**: PostgreSQL + Usuario admin + Variables de entorno

## 🎯 **CERO configuración manual necesaria**

### Para Desarrollo Local

```bash
# Opción 1: Setup completo + desarrollo
npm run dev

# Opción 2: Solo setup (sin iniciar servidor)
npm run setup

# Opción 3: Desarrollo rápido (sin setup)
npm run dev:quick
```

### Para Producción/Choreo

```bash
# El sistema detecta automáticamente el entorno
npm run build    # Configura PostgreSQL automáticamente
npm start        # Funciona en Choreo sin cambios
```

## 🔄 Detección Automática de Entorno

El sistema detecta automáticamente el entorno basado en:

1. **Desarrollo**: `NODE_ENV !== 'production'` y sin PostgreSQL
2. **Producción**: `NODE_ENV === 'production'` o `DATABASE_URL` contiene 'postgres'

## 📁 Lo que hace automáticamente

### En Desarrollo (SQLite)
- ✅ Configura `schema.prisma` para SQLite
- ✅ Crea archivo `.env.local` con configuración local
- ✅ Genera base de datos SQLite (`dev.db`)
- ✅ Crea usuario administrador
- ✅ Configura 23 permisos completos

### En Producción (PostgreSQL)
- ✅ Configura `schema.prisma` para PostgreSQL  
- ✅ Usa variables de entorno de Choreo
- ✅ Crea usuario administrador en PostgreSQL
- ✅ Configura sistema de permisos completo

## 🔑 Credenciales de Admin (Ambos entornos)

```
Email: alesierraalta@gmail.com
Password: admin123
```

## 🎛️ Comandos Disponibles

### Desarrollo
| Comando | Descripción |
|---------|-------------|
| `npm run setup` | Solo configuración automática |
| `npm run dev` | Setup automático + desarrollo |
| `npm run dev:quick` | Solo desarrollo (sin setup) |

### Depuración
| Comando | Descripción |
|---------|-------------|
| `node scripts/auto-env-setup.js` | Ver proceso de setup detallado |
| `node scripts/ensure-admin.js` | Solo configurar admin |
| `npx prisma studio` | Ver base de datos |

## 📊 Permisos Configurados Automáticamente

**Navegación (category: 'page')**:
- Dashboard, Inventario, Ventas, Ubicaciones, Categorías, Usuarios, Configuración, Permisos, Reportes

**Operaciones (category: 'data')**:
- Crear, Editar, Eliminar para todos los recursos

## 🔧 Configuración Manual (Solo si es necesario)

### Cambiar Base de Datos Manualmente
```bash
# Forzar SQLite
npm run schema:sqlite

# Forzar PostgreSQL  
npm run schema:postgresql
```

### Recrear Base de Datos Local
```bash
# Eliminar y recrear dev.db
npm run db:reset
npm run setup
```

## 🚨 Solución de Problemas

### "No encuentra usuario admin"
```bash
npm run setup
```

### "Error de permisos"
```bash
node scripts/ensure-admin.js
```

### "Base de datos no existe"
```bash
npm run setup
```

### "Schema incorrecto"
```bash
node scripts/auto-env-setup.js
```

## 🎉 Ventajas del Sistema

1. **Cero Configuración**: No necesitas cambiar nada manualmente
2. **Automático**: Detecta el entorno y se configura solo
3. **Consistente**: Mismos permisos en desarrollo y producción
4. **Rápido**: Setup completo en segundos
5. **Confiable**: Funciona tanto en local como en Choreo

## 📝 Archivos Creados Automáticamente

### Desarrollo
- `.env.local` - Variables de entorno locales
- `dev.db` - Base de datos SQLite
- `prisma-config.json` - Configuración de Prisma

### Ambos
- Usuario admin con 23 permisos
- Rol ADMIN configurado
- Sistema de permisos completo

---

## 🎯 **Resumen: Solo necesitas**

```bash
# Para desarrollo
npm run dev

# Para producción (Choreo hace esto automáticamente)
npm run build && npm start
```

**¡Eso es todo!** El sistema se encarga del resto automáticamente. 🚀 