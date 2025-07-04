# 🔧 LUMO - Variables de Autenticación con Supabase

## 📋 ANÁLISIS DE TU SITUACIÓN

✅ **Ya tienes configurado Supabase como sistema principal**  
✅ **No necesitas NextAuth.js** (está obsoleto en tu proyecto)  
✅ **Supabase maneja toda la autenticación**  

---

## 🎯 VARIABLES QUE SÍ NECESITAS

### 1️⃣ SUPABASE_SERVICE_ROLE_KEY (CRÍTICA - FALTANTE)

**📍 Dónde conseguirla:**
- Ve a: https://supabase.com/dashboard
- Selecciona tu proyecto: `ndprriqyhddjoixrlqnz`
- Ve a **Settings → API**
- Copia la **"service_role" key** (NO la anon key)
- Esta clave permite que tus APIs del servidor funcionen

### 2️⃣ JWT_SECRET (OPCIONAL pero recomendado)

**📍 Cómo generarla:**
- Cualquier string de 32+ caracteres
- Ejemplo: `lumo-super-secret-jwt-key-2024-production-ready-32chars`
- O genera una: `openssl rand -base64 32`

---

## ❌ VARIABLES QUE NO NECESITAS

### 🚫 NEXTAUTH_SECRET
- Tu proyecto **NO usa NextAuth.js**
- Supabase maneja toda la autenticación
- Esta variable es **obsoleta** en tu caso

### 🚫 NEXTAUTH_URL
- También obsoleta sin NextAuth.js
- Supabase usa sus propias URLs

---

## 🎯 SOLUCIÓN INMEDIATA

### Paso 1: Ve a Supabase Dashboard
```
https://supabase.com/dashboard/project/ndprriqyhddjoixrlqnz/settings/api
```

### Paso 2: Copia la "service_role" key

### Paso 3: Agrega a tu .env.local
```env
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Paso 4: Opcionalmente agrega
```env
JWT_SECRET=lumo-super-secret-jwt-key-2024-production-ready-32chars
```

### Paso 5: Reinicia el servidor
```bash
npm run dev
```

---

## ✅ RESULTADO ESPERADO

- ✅ APIs responderán **200** en lugar de **401**
- ✅ Podrás **crear usuarios** sin problemas
- ✅ Sistema de autenticación **100% funcional**

---

## 🔗 ENLACES ÚTILES

- **Supabase Dashboard:** https://supabase.com/dashboard
- **Tu proyecto:** https://supabase.com/dashboard/project/ndprriqyhddjoixrlqnz
- **Configuración API:** https://supabase.com/dashboard/project/ndprriqyhddjoixrlqnz/settings/api

---

## 💡 NOTA IMPORTANTE

⚠️ **La service_role key es PRIVADA** y solo debe usarse en el servidor.  
🚫 **NUNCA** la pongas en variables `NEXT_PUBLIC_*` ni la expongas al cliente.

---

## 📄 Tu .env.local completo debería verse así:

```env
# LUMO INVENTORY - DESARROLLO LOCAL
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8

# CRÍTICO: Clave de servicio para operaciones del servidor (APIs)
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY_AQUI

# JWT Secret para autenticación (opcional)
JWT_SECRET=lumo-super-secret-jwt-key-2024-production-ready-32chars

# Configuración de aplicación
FORCE_SUPABASE=true
NODE_ENV=development
APP_NAME=LUMO Inventory Management
APP_VERSION=2.0.0
```

**🎯 La única variable que te falta es la `SUPABASE_SERVICE_ROLE_KEY`** 