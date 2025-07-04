# 🔧 LUMO - Guía Completa de Variables de Entorno

## 📋 Resumen de tus proyectos Supabase

### 🔵 DESARROLLO
- **Proyecto**: ndprriqyhddjoixrlqnz  
- **URL**: https://ndprriqyhddjoixrlqnz.supabase.co
- **Estado**: ✅ Configurado y funcionando

### 🟢 PRODUCCIÓN  
- **Proyecto**: ubjujxtvlubxowsphvuk
- **URL**: https://ubjujxtvlubxowsphvuk.supabase.co
- **Estado**: ✅ Configurado pero necesita service_role_key

---

## 🎯 ARCHIVO .env.local (DESARROLLO)

Copia esto exactamente a tu archivo `.env.local`:

```env
# LUMO INVENTORY - DESARROLLO LOCAL
# ===================================

# Supabase Desarrollo (Proyecto: ndprriqyhddjoixrlqnz)
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# CRÍTICO: Service Role Key para APIs del servidor
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEwODQwMCwiZXhwIjoyMDY1Njg0NDAwfQ.Nqs_Lm2qdqcbgNV0r9BsxmkJPCEgPiZeKUOz0eJWXKI

# Configuración del servidor Supabase
SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# Database URL (PostgreSQL)
DATABASE_URL=postgresql://postgres.ndprriqyhddjoixrlqnz:Theale05042013$$@aws-0-us-east-2.pooler.supabase.com:6543/postgres

# JWT Secret para autenticación
JWT_SECRET=lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==

# NextAuth (obsoleto pero mantenido por compatibilidad)
NEXTAUTH_SECRET=lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==
NEXTAUTH_URL=http://localhost:3000

# Configuración de aplicación
FORCE_SUPABASE=true
NODE_ENV=development
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0
PORT=3000

# Configuración adicional
CHOREO_ENVIRONMENT=Development
```

---

## 🎯 ARCHIVO .env.production (PRODUCCIÓN)

Para producción/Choreo, usa esto:

```env
# LUMO INVENTORY - PRODUCCIÓN
# ============================

# Supabase Producción (Proyecto: ubjujxtvlubxowsphvuk)
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# CRÍTICO: Service Role Key para APIs del servidor (NECESITAS OBTENERLA)
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY_DE_PRODUCCION_AQUI

# Configuración del servidor Supabase
SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# Database URL (PostgreSQL) - NECESITAS OBTENERLA
DATABASE_URL=postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres

# JWT Secret para autenticación
JWT_SECRET=lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==

# NextAuth (obsoleto pero mantenido por compatibilidad)
NEXTAUTH_SECRET=lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==
NEXTAUTH_URL=https://tu-app-choreo.choreoapps.dev

# Configuración de aplicación
FORCE_SUPABASE=true
NODE_ENV=production
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0
PORT=8080

# Configuración de Choreo
CHOREO_ENVIRONMENT=Production
```

---

## 🔑 CLAVES QUE NECESITAS OBTENER

### Para DESARROLLO ✅
**¡YA TIENES TODO!** El archivo de desarrollo está completo.

### Para PRODUCCIÓN ⚠️
Necesitas obtener estas 2 claves del proyecto de producción:

#### 1️⃣ SUPABASE_SERVICE_ROLE_KEY (Producción)
- **Ir a**: https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk/settings/api
- **Buscar**: "Project API keys" → "service_role"
- **Copiar**: La clave completa (empieza con `eyJhbGciOiJIUzI1NiI...`)

#### 2️⃣ DATABASE_URL (Producción)
- **Ir a**: https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk/settings/database
- **Buscar**: "Connection string" → "URI"
- **Copiar**: La URL completa de PostgreSQL

---

## 🚀 PASOS INMEDIATOS

### Para DESARROLLO (AHORA MISMO):
1. **Copia** el contenido del archivo `.env.local` de arriba
2. **Pega** en un archivo llamado `.env.local` en tu proyecto
3. **Ejecuta**: `npm run dev`
4. **Verifica**: Las APIs deberían responder 200 en lugar de 401

### Para PRODUCCIÓN (CUANDO DESPLIEGUES):
1. **Obtén** la `SUPABASE_SERVICE_ROLE_KEY` del dashboard de producción
2. **Obtén** la `DATABASE_URL` del dashboard de producción  
3. **Reemplaza** las variables en `.env.production`
4. **Configura** las variables en Choreo

---

## ❌ VARIABLES QUE NO NECESITAS

### 🚫 NEXTAUTH_SECRET
- Tu proyecto usa **Supabase**, no NextAuth.js
- Esta variable es obsoleta pero la mantenemos por compatibilidad

### 🚫 NEXTAUTH_URL  
- También obsoleta con Supabase
- Supabase maneja sus propias URLs de autenticación

---

## 🔗 ENLACES ÚTILES

### Dashboards de Supabase:
- **Desarrollo**: https://supabase.com/dashboard/project/ndprriqyhddjoixrlqnz
- **Producción**: https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk

### Configuración de API:
- **Dev API**: https://supabase.com/dashboard/project/ndprriqyhddjoixrlqnz/settings/api
- **Prod API**: https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk/settings/api

### Base de datos:
- **Dev DB**: https://supabase.com/dashboard/project/ndprriqyhddjoixrlqnz/settings/database
- **Prod DB**: https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk/settings/database

---

## ✅ RESULTADO ESPERADO

### Después de configurar DESARROLLO:
- ✅ APIs responden **200** en lugar de **401**
- ✅ Puedes crear usuarios sin problemas
- ✅ Sistema de autenticación 100% funcional
- ✅ Base de datos conectada correctamente

### Después de configurar PRODUCCIÓN:
- ✅ Despliegue en Choreo exitoso
- ✅ APIs de producción funcionando
- ✅ Base de datos de producción conectada
- ✅ Sistema completo en producción

---

## 💡 NOTAS IMPORTANTES

⚠️ **Las service_role keys son PRIVADAS** - solo para servidor  
🚫 **NUNCA** las pongas en variables `NEXT_PUBLIC_*`  
📁 **NUNCA** commites archivos `.env` al repositorio  
🔄 **USA** desarrollo para testing y producción para usuarios finales 