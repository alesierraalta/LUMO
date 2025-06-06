# 🐘 GUÍA COMPLETA: Conectar Neon a LUMO

**Sistema Dual**: SQLite (Local) + Neon PostgreSQL (Producción) - **SIN CLERK**

---

## 🎯 **RESUMEN EJECUTIVO**

Tu sistema LUMO ya tiene un **sistema dual perfecto**:
- 🏠 **Local**: SQLite (`./dev.db`) - Sin afectar producción
- 🌐 **Producción**: Neon PostgreSQL - Datos reales
- 🔐 **Autenticación**: JWT puro (sin Clerk)

---

## 📋 **PASOS RÁPIDOS**

### 1️⃣ **Obtener URL de Neon**
```bash
# Ve a: https://console.neon.tech/
# Crea un proyecto
# Copia la connection string:
postgresql://neondb_owner:PASSWORD@ep-xxx-xxx.region.aws.neon.tech/neondb?sslmode=require
```

### 2️⃣ **Configurar Neon**
```bash
# Eliminar referencias a Clerk
npm run clean:clerk

# Configurar Neon
DATABASE_URL="postgresql://neondb_owner:TU_PASSWORD@ep-xxx.region.aws.neon.tech/neondb?sslmode=require" npm run setup:neon
```

### 3️⃣ **Verificar y Probar**
```bash
# Cambiar a modo producción
npm run mode:prod

# Probar build
npm run build

# Volver a desarrollo
npm run mode:dev
```

---

## 🔧 **CONFIGURACIÓN DETALLADA**

### **Sistema Dual Actual**

Tu proyecto ya tiene estos scripts inteligentes:

```bash
npm run mode:dev    # SQLite local
npm run mode:prod   # PostgreSQL producción
```

#### **¿Cómo Funciona?**

```javascript
// scripts/switch-mode.js
const modes = {
  development: {
    env: { DATABASE_URL: 'file:./dev.db' },
    schema: { provider: 'sqlite' }
  },
  production: {
    env: { DATABASE_URL: 'postgresql://...' },
    schema: { provider: 'postgresql' }
  }
}
```

### **Archivos de Configuración**

| Archivo | Propósito | Base de Datos |
|---------|-----------|---------------|
| `.env.local` | Desarrollo diario | SQLite |
| `.env` | Producción/Deploy | Neon PostgreSQL |
| `prisma/schema.prisma` | Auto-switch | sqlite ↔ postgresql |

---

## 📊 **ANTES vs DESPUÉS**

### **❌ ANTES (Con Clerk)**
```env
# .env.local
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
DATABASE_URL=file:./dev.db
```

### **✅ DESPUÉS (JWT + Neon)**
```env
# .env.local (desarrollo)
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
DATABASE_URL=file:./dev.db

# .env (producción)
JWT_SECRET=STRONG_PRODUCTION_SECRET_MIN_32_CHARS
DATABASE_URL=postgresql://neondb_owner:PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require
DIRECT_URL=postgresql://neondb_owner:PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require
```

---

## 🛠️ **COMANDOS DISPONIBLES**

### **Nuevos Scripts Agregados**
```bash
npm run setup:neon     # Configurar Neon automáticamente
npm run clean:clerk    # Eliminar todas las referencias a Clerk
```

### **Scripts Existentes**
```bash
npm run mode:dev       # Cambiar a SQLite local
npm run mode:prod      # Cambiar a Neon producción
npm run dev            # Desarrollo con SQLite
npm run build          # Build para producción
```

---

## 🧪 **PROCESO DE TESTING**

### **1. Desarrollo Local (SQLite)**
```bash
npm run mode:dev
npm run dev

# ✅ Base de datos: ./dev.db
# ✅ No afecta producción
# ✅ Reset rápido con: rm dev.db
```

### **2. Testing Producción (Neon)**
```bash
npm run mode:prod
npm run build
npm run start

# ✅ Base de datos: Neon PostgreSQL
# ✅ Datos reales de producción
# ⚠️ Ten cuidado con los cambios
```

### **3. Volver a Desarrollo**
```bash
npm run mode:dev
npm run dev

# ✅ De vuelta a SQLite
# ✅ Ambiente aislado
```

---

## 🚀 **CONFIGURACIÓN DE ACCELERATE (Opcional)**

### **¿Por qué Accelerate?**
- 🚄 **500ms → 50ms** tiempo de conexión
- 🔄 **Pool de conexiones** global
- 💾 **Cache inteligente** (70-90% hit rate)
- 🛡️ **Elimina P6001** errores de Choreo

### **Setup Accelerate**
```bash
# 1. Ve a: https://console.prisma.io/
# 2. Crear proyecto Accelerate
# 3. Obtener API key

# 4. Actualizar .env
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=TU_API_KEY
DIRECT_URL=postgresql://neondb_owner:PASSWORD@ep-xxx.neon.tech/neondb?sslmode=require

# 5. Regenerar cliente
npx prisma generate --no-engine
```

---

## 📁 **ESTRUCTURA DE ARCHIVOS**

```
LUMO/
├── .env.local          # SQLite (desarrollo)
├── .env                # Neon (producción)
├── prisma/
│   └── schema.prisma   # Auto-switch provider
├── scripts/
│   ├── setup-neon-database.js     # ✨ NUEVO
│   ├── clean-clerk-references.js  # ✨ NUEVO
│   └── switch-mode.js             # ✅ EXISTENTE
└── src/
    └── lib/
        └── prisma.ts   # Con Accelerate support
```

---

## ⚠️ **PROBLEMAS COMUNES**

### **Error: "Provider mismatch"**
```bash
# Solución:
npm run mode:prod  # Asegurar PostgreSQL mode
npx prisma generate
```

### **Error: "Connection refused"**
```bash
# Verificar URL de Neon:
# ✅ Correcto: postgresql://neondb_owner:pass@ep-xxx.neon.tech/neondb?sslmode=require
# ❌ Incorrecto: Sin ?sslmode=require
```

### **Error: P6001 en Choreo**
```bash
# Solución: Usar Accelerate
DATABASE_URL=prisma://accelerate.prisma-data.net/?api_key=...
DIRECT_URL=postgresql://neondb_owner:...@ep-xxx.neon.tech/neondb?sslmode=require
```

---

## 🔐 **SEGURIDAD**

### **Claves JWT**
```bash
# ❌ NO USAR en producción:
JWT_SECRET=dev-secret

# ✅ USAR en producción:
JWT_SECRET=super-secure-random-string-minimum-32-characters-long-2024
```

### **Archivos .env**
```bash
# ✅ Commitear:
.env.local      # Template para desarrollo
env.template    # Template general

# ❌ NUNCA commitear:
.env           # Contiene credenciales reales
```

---

## 📊 **MÉTRICAS ESPERADAS**

### **Sin Accelerate**
- Conexión inicial: ~500ms
- Query simple: ~50-100ms
- Excel import (1000 rows): ~30-45s

### **Con Accelerate**
- Conexión inicial: ~50ms
- Query simple: ~10-30ms (cache hit)
- Excel import (1000 rows): ~8-15s

---

## 🎯 **CHECKLIST FINAL**

### **Configuración Básica**
- [ ] ✅ Neon database creada
- [ ] ✅ URL de conexión copiada
- [ ] ✅ `npm run clean:clerk` ejecutado
- [ ] ✅ `DATABASE_URL="..." npm run setup:neon` ejecutado
- [ ] ✅ JWT_SECRET configurado

### **Testing**
- [ ] ✅ `npm run mode:dev` funciona (SQLite)
- [ ] ✅ `npm run mode:prod` funciona (Neon)
- [ ] ✅ `npm run build` exitoso
- [ ] ✅ Login/registro funciona sin Clerk

### **Producción**
- [ ] ✅ Variables configuradas en Choreo
- [ ] ✅ Deploy exitoso
- [ ] ✅ Logs sin errores P6001
- [ ] ✅ Performance mejorada

### **Accelerate (Opcional)**
- [ ] ✅ Prisma Console configurado
- [ ] ✅ API key obtenida
- [ ] ✅ URLs actualizadas
- [ ] ✅ `npx prisma generate --no-engine`

---

## 🆘 **SOPORTE**

### **Enlaces Útiles**
- 🌐 [Neon Console](https://console.neon.tech/)
- 🚀 [Prisma Accelerate](https://console.prisma.io/)
- 📚 [Documentación Prisma](https://www.prisma.io/docs)

### **Comandos de Debug**
```bash
# Verificar configuración actual
npm run mode:status

# Test conexión directa
npx prisma db push

# Ver estado del schema
npx prisma format
```

---

## 🎉 **¡LISTO!**

Tu sistema LUMO ahora tiene:
- ✅ **Sistema dual** SQLite ↔ Neon
- ✅ **Sin Clerk** (JWT puro)
- ✅ **Configuración automática** con scripts
- ✅ **Preparado para Accelerate**
- ✅ **Deploy-ready** para Choreo

**¡A desarrollar sin límites!** 🚀 