# 🛠️ LUMO - Guía de Desarrollo Local

## 📋 **RESUMEN**

LUMO ahora incluye un **sistema completo de desarrollo** que te permite trabajar de forma segura sin afectar los datos de producción.

---

## 🚀 **SETUP SÚPER RÁPIDO**

```bash
# 1. Setup automático completo
npm run dev:setup

# 2. Activar modo desarrollo (recomendado)
npm run mode:dev

# 3. Iniciar desarrollo
npm run dev
```

¡**En 3 comandos tienes todo listo!** 🎉

---

## 🔧 **SISTEMA DE MODOS**

### **Cambiar entre Desarrollo y Producción:**
```bash
npm run mode:dev     # 🛠️ Modo desarrollo (seguro)
npm run mode:prod    # 🚀 Modo producción (datos reales)
npm run mode:status  # 📊 Ver modo actual
```

### **Diferencias entre Modos:**

| **Característica** | **Desarrollo** | **Producción** |
|-------------------|----------------|----------------|
| **Base de datos** | ✅ Datos de prueba | ⚠️ Datos reales |
| **Logs detallados** | ✅ Habilitados | ❌ Mínimos |
| **Hot reload** | ✅ Rápido | ❌ Build completo |
| **Debug tools** | ✅ Disponibles | ❌ Deshabilitados |
| **Puerto** | 3000 | 8080 |
| **Reset fácil** | ✅ `npm run dev:reset` | ❌ Permanente |

---

## 🐘 **CONFIGURACIÓN DE BASE DE DATOS**

### **Opción A: PostgreSQL Local**
```bash
# Instalar PostgreSQL (si no lo tienes)
# Windows: https://www.postgresql.org/download/windows/
# macOS: brew install postgresql
# Linux: sudo apt-get install postgresql

# Crear base de datos manualmente
createuser lumo_dev
createdb --owner=lumo_dev lumo_dev
psql -c "ALTER USER lumo_dev WITH PASSWORD 'lumo_dev_pass';" postgres
```

### **Opción B: Docker (Recomendado)**
```bash
# Iniciar base de datos con Docker
docker-compose -f docker-compose.dev.yml up -d postgres-dev

# Verificar que esté funcionando
docker-compose -f docker-compose.dev.yml ps
```

### **Opción C: Servicios en la Nube**
```bash
# Usar servicios como Supabase, Neon, etc.
# Solo cambiar DATABASE_URL en .env.local
```

---

## 🔧 **SCRIPTS DE DESARROLLO**

### **Scripts Principales:**
```bash
npm run dev              # Iniciar servidor de desarrollo
npm run dev:setup        # Setup completo del entorno
npm run dev:seed         # Poblar base de datos con datos de prueba
npm run dev:reset        # Reset completo de base de datos
npm run dev:fresh        # Setup + reset (empezar desde cero)
```

### **Scripts de Base de Datos:**
```bash
npm run db:migrate       # Ejecutar migraciones
npm run db:generate      # Generar cliente Prisma
npm run db:push          # Push cambios de schema
npm run db:studio        # Abrir Prisma Studio
npm run db:reset         # Reset completo de DB
```

### **Scripts de Desarrollo:**
```bash
npm run lint             # Ejecutar linter
npm run lint:fix         # Corregir errores de lint
npm run type-check       # Verificar tipos TypeScript
```

---

## 👥 **USUARIOS DE PRUEBA (Modo Desarrollo)**

| **Email** | **Password** | **Rol** | **Descripción** |
|-----------|--------------|---------|-----------------|
| `admin@lumo.dev` | `admin123` | Admin | Acceso completo |
| `manager@lumo.dev` | `manager123` | Manager | Inventario + Reportes |
| `user@lumo.dev` | `user123` | User | Solo lectura |

---

## 📦 **DATOS DE EJEMPLO**

El seed incluye:
- **3 Roles** con permisos configurados
- **3 Categorías**: Electrónicos, Ropa, Hogar
- **3 Ubicaciones**: Almacén Principal, Tienda, Trastienda
- **5 Productos** de ejemplo con inventario

---

## 🌐 **URLs DE DESARROLLO**

| **Servicio** | **URL** | **Credenciales** |
|--------------|---------|------------------|
| **App Principal** | http://localhost:3000 | `admin@lumo.dev` / `admin123` |
| **Health Check** | http://localhost:3000/api/health | - |
| **Prisma Studio** | http://localhost:5555 | - |

---

## 🔄 **WORKFLOW RECOMENDADO**

### **Día a Día:**
```bash
# 1. Verificar modo
npm run mode:status

# 2. Asegurar modo desarrollo
npm run mode:dev

# 3. Iniciar desarrollo
npm run dev

# 4. ¡Desarrollar sin miedo! 
# - Los datos son de prueba
# - Puedes resetear cuando quieras
# - Hot reload automático
```

### **Cuando Cambias Esquema de DB:**
```bash
# 1. Modificar prisma/schema.prisma
# 2. Crear migración
npx prisma migrate dev --name mi_cambio

# 3. Poblar con datos frescos
npm run dev:seed
```

### **Si Algo Se Rompe:**
```bash
# Reset completo - vuelve al estado inicial
npm run dev:fresh
```

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Error: Puerto en uso**
```bash
# Cambiar puerto
npm run mode:dev
# Editar PORT en .env.local si es necesario
```

### **Error: Base de datos no conecta**
```bash
# Reset completo
npm run dev:fresh
```

### **Error: Prisma out of sync**
```bash
# Regenerar todo
npm run db:generate
npx prisma migrate reset --force
npm run dev:seed
```

### **Error: No puedo hacer login**
```bash
# Recrear usuarios de prueba
npm run dev:seed
# Usar: admin@lumo.dev / admin123
```

---

## 🔒 **SEGURIDAD DE DATOS**

### **✅ En Modo Desarrollo:**
- ✅ **Datos separados** de producción
- ✅ **Reset ilimitado** sin consecuencias
- ✅ **Usuarios de prueba** preconfigurados
- ✅ **Experimentos seguros**

### **⚠️ En Modo Producción:**
- ⚠️ **Datos reales** - ten cuidado
- ❌ **No resetear** - se pierden datos reales
- ⚠️ **Solo para testing** de la build final

---

## 🚨 **SOLUCIÓN DE PROBLEMAS**

### **Error de Conexión a DB:**
```bash
# Verificar que PostgreSQL esté ejecutándose
docker-compose -f docker-compose.dev.yml ps
# o
pg_isready -h localhost -p 5432

# Reset de base de datos
npm run dev:reset
```

### **Error de Prisma Client:**
```bash
# Regenerar cliente
npm run db:generate

# Si persiste
rm -rf node_modules/.prisma
npm run db:generate
```

### **Error de Permisos:**
```bash
# Verificar usuario admin
npm run dev:seed

# Login con admin@lumo.dev / admin123
```

### **Puerto en Uso:**
```bash
# Cambiar puerto en .env.local
PORT=3001

# O matar el proceso
lsof -ti:3000 | xargs kill -9
```

---

## 🔒 **SEPARACIÓN DESARROLLO/PRODUCCIÓN**

### **Variables de Entorno:**

**Desarrollo (.env.local):**
```env
NODE_ENV=development
DATABASE_URL=postgresql://lumo_dev:lumo_dev_pass@localhost:5432/lumo_dev
JWT_SECRET=development-jwt-secret-key-for-lumo-inventory-system-2024
ENABLE_DEBUG_LOGS=true
```

**Producción (Choreo):**
```env
NODE_ENV=production
DATABASE_URL=postgresql://[tu-db-produccion]
JWT_SECRET=[secret-super-seguro-32-chars]
ENABLE_DEBUG_LOGS=false
```

### **Beneficios:**
- ✅ **Datos separados** - No afectas producción
- ✅ **Experimentos seguros** - Prueba sin riesgo
- ✅ **Reset rápido** - Vuelve al estado inicial fácilmente
- ✅ **Debug habilitado** - Logs detallados para desarrollo
- ✅ **Usuarios de prueba** - Diferentes roles preconfigurados

---

## 📚 **RECURSOS ADICIONALES**

### **Documentación:**
- [Prisma Docs](https://www.prisma.io/docs/)
- [Next.js Docs](https://nextjs.org/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

### **Herramientas Útiles:**
- **Prisma Studio**: Editor visual de DB
- **Adminer**: Interfaz web para PostgreSQL
- **Thunder Client**: Extension de VS Code para probar APIs

### **Extensiones VS Code Recomendadas:**
- Prisma
- PostgreSQL
- Thunder Client
- ES7+ React/Redux/React-Native snippets

---

## 🎯 **PASOS SIGUIENTES**

### **Para Empezar Ahora:**
```bash
# 1. Setup completo
npm run dev:setup

# 2. Modo desarrollo
npm run mode:dev

# 3. Iniciar
npm run dev

# 4. Ir a: http://localhost:3000
# 5. Login: admin@lumo.dev / admin123
```

### **Para Desplegar a Producción:**
```bash
# 1. Cambiar a modo producción
npm run mode:prod

# 2. Verificar build
npm run build

# 3. Desplegar en Choreo
# (con variables de entorno de producción)
```

---

## 🏆 **BENEFICIOS DEL NUEVO SISTEMA**

- ✅ **Desarrollo 100% seguro** - Sin riesgo de afectar producción
- ✅ **Switch instantáneo** - Cambio de modo en segundos
- ✅ **Reset ilimitado** - Vuelve al estado inicial cuando quieras
- ✅ **Datos de prueba** - Usuarios y productos preconfigurados
- ✅ **Debug completo** - Logs detallados para desarrollo
- ✅ **Hot reload** - Cambios instantáneos
- ✅ **Herramientas de desarrollo** - Prisma Studio y más

¡**Ahora puedes desarrollar LUMO con total confianza!** 🚀✨ 

## 📊 **DUAL ENVIRONMENT SYSTEM**

### 🔄 **MODO DESARROLLO (SQLite)**
- **Base de datos:** SQLite (`dev.db`) - archivo local
- **Usuarios:** Completamente separados de producción
- **Schema:** Automáticamente configurado para SQLite
- **Puerto:** 3000
- **Debug:** Activado

### 🚀 **MODO PRODUCCIÓN (PostgreSQL)**
- **Base de datos:** PostgreSQL (Neon Database)
- **Usuarios:** Datos reales de producción
- **Schema:** Automáticamente configurado para PostgreSQL
- **Puerto:** 8080
- **Debug:** Desactivado

## 🎯 **COMANDOS PRINCIPALES**

### **Desarrollo Local**
```bash
# Activar modo desarrollo
npm run mode:dev

# Configurar entorno por primera vez
npm run dev:setup

# Iniciar servidor desarrollo
npm run dev

# Reset completo de datos
npm run dev:reset

# Poblar datos de prueba
npm run dev:seed
```

### **Producción/Despliegue**
```bash
# Activar modo producción
npm run mode:prod

# Construir para producción
npm run build:prod

# Verificar configuración
npm run mode:status

# Iniciar servidor producción
npm run start
```

### **Utilidades**
```bash
# Ver modo actual
npm run mode:status

# Editor visual de base de datos
npm run db:studio
```

## 🔐 **CONFIGURACIÓN DE SEGURIDAD**

### **Variables de Entorno**
- ✅ **Desarrollo:** Automáticamente configurado para SQLite
- ✅ **Producción:** Automáticamente usa PostgreSQL de Neon
- ✅ **JWT:** Diferentes secrets para cada modo
- ✅ **Debug:** Activado solo en desarrollo

### **Base de Datos**
- ✅ **SQLite:** `./dev.db` - completamente separado
- ✅ **PostgreSQL:** Neon Database - datos reales
- ✅ **Schema:** Cambio automático según el modo
- ✅ **Migraciones:** Seguras para cada entorno

## 👥 **USUARIOS DE DESARROLLO**

Solo en modo desarrollo (SQLite):
- **admin@lumo.dev** / **admin123** (Administrador completo)
- **manager@lumo.dev** / **manager123** (Gerente con reportes)
- **user@lumo.dev** / **user123** (Usuario básico)

## 📦 **DATOS DE EJEMPLO**

En modo desarrollo:
- 3 Roles con permisos
- 3 Categorías (Electrónicos, Ropa, Hogar)
- 3 Ubicaciones (Almacén, Tienda, Trastienda)
- 5 Productos de ejemplo con precios reales

## 🚀 **DESPLIEGUE EN CHOREO**

### **Configuración Automática**
1. El proyecto está configurado para usar PostgreSQL automáticamente en producción
2. Variables de entorno gestionadas automáticamente
3. Schema configurado automáticamente para PostgreSQL

### **Variables en Choreo Dashboard**
Solo necesitas configurar estas variables en Choreo:
```
NODE_ENV=production
DATABASE_URL=postgresql://tu-url-de-neon
JWT_SECRET=tu-secret-de-produccion
```

### **Comandos de Despliegue**
```bash
# Para Choreo
npm run choreo:build  # Activa modo prod + build
npm run choreo:start  # Inicia servidor

# Verificación antes del despliegue
npm run mode:prod
npm run mode:status
```

## 🔧 **FLUJO DE TRABAJO RECOMENDADO**

### **Para Desarrollo**
1. `npm run mode:dev` - Activa SQLite
2. `npm run dev` - Inicia servidor
3. Desarrollar tranquilamente sin afectar producción
4. `npm run dev:reset` cuando necesites datos frescos

### **Para Despliegue**
1. `npm run mode:prod` - Cambia a PostgreSQL
2. `npm run build:prod` - Construye para producción
3. Verificar que todo funciona
4. Desplegar en Choreo

### **Cambio Rápido de Modo**
```bash
npm run mode:dev    # → SQLite (desarrollo)
npm run mode:prod   # → PostgreSQL (producción)
npm run mode:status # → Ver modo actual
```

## ✅ **VERIFICACIONES DE SEGURIDAD**

- [x] **Bases de datos completamente separadas**
- [x] **Usuarios independientes por entorno**
- [x] **Configuración automática de schema**
- [x] **Variables de entorno seguras**
- [x] **Reset seguro solo en desarrollo**
- [x] **Modo producción protegido**

## 🎯 **RESUMEN EJECUTIVO**

**✅ DESARROLLO:** SQLite local, datos falsos, desarrollo seguro  
**✅ PRODUCCIÓN:** PostgreSQL Neon, datos reales, listo para Choreo  
**✅ CAMBIO:** Automático con `npm run mode:dev/prod`  
**✅ SEGURIDAD:** Entornos completamente aislados  

¡**Sistema dual perfecto para desarrollo seguro y despliegue en producción!** 🚀 