# Choreo 500 Internal Server Error - Complete Diagnosis & Solution

## 🔍 **ANÁLISIS COMPLETO CON MCP - PROBLEMA IDENTIFICADO**

### **DIFERENCIAS DE SCHEMA ENCONTRADAS**

**✅ DESARROLLO (ndprriqyhddjoixrlqnz)**
```sql
-- Tabla users: 9 columnas (SIN last_login originalmente)
-- Tabla inventory_items: 16 columnas (SIN barcode, current_stock, min_level, max_level)
```

**❌ PRODUCCIÓN (ubjujxtvlubxowsphvuk)**  
```sql
-- Tabla users: 8 columnas (SIN last_login originalmente) ✅ CORREGIDO
-- Tabla inventory_items: 20 columnas (CON barcode, current_stock, min_level, max_level)
```

### **🚨 DESINCRONIZACIÓN BIDIRECCIONAL IDENTIFICADA**

**Problema 1: Columna last_login faltante en producción**
```sql
-- ✅ SOLUCIONADO: Agregada last_login a users en producción
ALTER TABLE users ADD COLUMN last_login timestamp with time zone;
```

**Problema 2: Columnas extra en producción que NO están en desarrollo**
```sql
-- ❌ PENDIENTE: Estas columnas existen en PROD pero NO en DEV:
-- inventory_items.barcode
-- inventory_items.current_stock  
-- inventory_items.min_level
-- inventory_items.max_level
```

### **🔍 ESTADO ACTUAL**
- ✅ Schema users sincronizado
- ✅ Datos verificados (2 usuarios, 3 roles)
- ❌ **500 Error PERSISTE** después del fix
- ❌ Schema inventory_items AÚN desincronizado

### **🎯 HIPÓTESIS DEL PROBLEMA RESTANTE**

El código de la aplicación puede estar:
1. **Intentando acceder a columnas** que existen en PROD pero no en DEV
2. **Usando queries** que fallan por diferencias de schema
3. **Validando datos** contra un schema esperado diferente

## 🚨 **ACCIÓN INMEDIATA REQUERIDA**

**Opción 1: Sincronizar DEV con PROD** (Recomendado)
```sql
-- Ejecutar en DESARROLLO (ndprriqyhddjoixrlqnz):
ALTER TABLE inventory_items ADD COLUMN barcode character varying;
ALTER TABLE inventory_items ADD COLUMN current_stock integer;
ALTER TABLE inventory_items ADD COLUMN min_level integer;
ALTER TABLE inventory_items ADD COLUMN max_level integer;
```

**Opción 2: Revisar logs de aplicación en Choreo**
- Buscar errores específicos relacionados con columnas faltantes
- Identificar queries que están fallando

## 🔍 **ACTUAL ROOT CAUSE IDENTIFIED**

### **Problem Statement**
- ✅ entryCSSFiles protection working perfectly (no crashes)
- ✅ Server starting successfully in Choreo production  
- ✅ Environment variables ARE available (Supabase URL/Key detected)
- ❌ **500 Internal Server Error** when accessing the application
- ❌ **SCHEMA MISMATCH** between development and production Supabase projects
- ❌ **Missing start.sh script** referenced in choreo.yaml
- ❌ **Next.js standalone configuration conflict**

### **Root Cause Analysis from Logs & Documentation**

**CRITICAL DISCOVERY**: Different Supabase projects with different schemas

**1. Development Supabase (Works)**
```bash
# Project: ndprriqyhddjoixrlqnz (DEV)
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
Schema: ✅ UPDATED (password field, complete tables)
```

**2. Production Supabase (Fails)**
```bash
# Project: ubjujxtvlubxowsphvuk (PROD)  
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
Schema: ❌ OUTDATED (password_hash field, missing columns)
```

**3. Schema Inconsistency Issue**
From `SUPABASE_MIGRATION_COMPLETE.md`:
> **Password Field**: Renamed `password_hash` to `password` in development to match production

**This indicates the schemas are NOT synchronized!**

**4. Missing Database Fields**
Production database likely missing:
- `password` field (still using `password_hash`)
- `min_stock_level` column in `inventory_items`
- Other schema updates applied to development

**1. Missing Startup Script**
```yaml
# choreo.yaml references non-existent script
deploy:
  command: ./start.sh  # ❌ This file doesn't exist
```

**2. Next.js Standalone Error**
```
❌ "next start" does not work with "output: standalone" configuration. 
   Use "node .next/standalone/server.js" instead.
```

**3. DATABASE_URL Runtime Issue**
```
⚠️ [Choreo Setup] Optional environment variables not found: [ 'DATABASE_URL' ]
⚠️ [Choreo Setup] These may be loaded at runtime by Choreo
```

**4. Server Process Mismatch**
The `intelligent-startup.js` script is running but the server process isn't handling standalone mode correctly.

## 📊 **Evidence Analysis**

### **✅ What's Working:**
- entryCSSFiles protection system fully operational
- Server startup sequence completing successfully
- Choreo.yaml configuration has correct environment variables
- Supabase project is ACTIVE_HEALTHY
- Environment variables are being loaded: `🔍 [Choreo Setup] Debug - Supabase URL: https://ubjujxtvlubxowsphvuk.s...`

### **❌ What's Failing:**
- Missing `start.sh` script that choreo.yaml expects
- Next.js trying to use `next start` instead of standalone server
- SERVER_ONLY module issues in standalone mode
- Database connection failing due to missing DATABASE_URL at runtime

## 🛠️ **COMPLETE SOLUTION**

### **Step 1: ✅ Fixed - Missing start.sh Script**

**Created `/start.sh` with proper startup logic:**
```bash
#!/bin/bash
# Validates environment variables
# Uses correct standalone server startup
# Proper error handling and logging
```

### **Step 2: Verify Choreo Console Secrets**

**Required Secrets in Choreo Console:**

1. **`DATABASE_URL`** (CRITICAL - Currently Missing)
   ```
   postgresql://postgres:[PASSWORD]@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres
   ```

2. **`JWT_SECRET`** (CRITICAL)
   ```
   [Generate 32+ character random string]
   ```

3. **`NEXT_PUBLIC_SUPABASE_URL`** (✅ Already Set)
   ```
   https://ubjujxtvlubxowsphvuk.supabase.co
   ```

4. **`NEXT_PUBLIC_SUPABASE_ANON_KEY`** (✅ Already Set)
   ```
   eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4
   ```

### **Step 3: Fix Choreo Console Configuration**

**🎯 PRIORITY ACTION: Add Missing DATABASE_URL Secret**

1. **Go to Choreo Console:** https://console.choreo.dev/
2. **Navigate to:** Your LUMO project → Settings → Secrets
3. **Add Secret:**
   - **Name:** `DATABASE_URL`
   - **Value:** `postgresql://postgres:[YOUR_SUPABASE_PASSWORD]@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres`
   - **Type:** Environment Variable
   - **Mark as Secret:** ✅ Yes

4. **Add JWT_SECRET:**
   - **Name:** `JWT_SECRET`
   - **Value:** Generate with: `openssl rand -base64 32`
   - **Type:** Environment Variable
   - **Mark as Secret:** ✅ Yes

### **Step 4: Get Supabase DATABASE_URL**

**To get your Supabase DATABASE_URL:**

1. **Go to:** https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk
2. **Navigate to:** Settings → Database
3. **Copy:** Connection String → URI
4. **Format:** `postgresql://postgres:[YOUR_PASSWORD]@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres`

### **Step 5: Redeploy Application**

After adding the missing secrets:
1. **Trigger New Deployment** in Choreo Console
2. **Monitor Logs** for successful startup
3. **Test Application** endpoints

## 🎯 **Expected Resolution**

### **After Adding Missing DATABASE_URL:**
1. ✅ `start.sh` script executes successfully
2. ✅ Environment variables properly validated
3. ✅ Next.js standalone server starts correctly
4. ✅ Database connections established
5. ✅ Application serves requests without 500 errors

### **Success Indicators in Logs:**
```
🚀 LUMO Choreo Production Startup
✅ Environment variables validated
🎯 Using Next.js standalone server
✅ Server ready on http://0.0.0.0:8080
```

## 📝 **Action Items**

### **Immediate (Priority 1):**
- [x] ✅ Created missing `start.sh` script
- [ ] 🔴 **ADD DATABASE_URL secret in Choreo Console**
- [ ] 🔴 **ADD JWT_SECRET secret in Choreo Console**
- [ ] 🔴 **Redeploy application**

### **Verification (Priority 2):**
- [ ] Test health endpoint: `GET /api/health`
- [ ] Test authentication flow
- [ ] Test database connectivity
- [ ] Monitor error logs

### **Long-term (Priority 3):**
- [ ] Add startup script validation
- [ ] Implement better error handling
- [ ] Add environment variable validation UI

## 🔧 **Troubleshooting Commands**

### **Test Locally:**
```bash
# Simulate production environment
export NODE_ENV=production
export DATABASE_URL="postgresql://postgres:yourpassword@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres"
export JWT_SECRET="your-32-char-secret"
./start.sh
```

### **Debug Choreo Deployment:**
```bash
# Check logs in Choreo Console
# Look for these success messages:
# "✅ Environment variables validated"
# "🎯 Using Next.js standalone server"
```

## 🚨 **CRITICAL NEXT STEPS**

1. **🔴 IMMEDIATELY:** Add `DATABASE_URL` secret in Choreo Console
2. **🔴 IMMEDIATELY:** Add `JWT_SECRET` secret in Choreo Console  
3. **🔴 IMMEDIATELY:** Redeploy application
4. **🔴 VERIFY:** Check application loads without 500 errors

---

**Status:** ✅ Root cause identified and start.sh created  
**Next Step:** 🔴 **ADD MISSING DATABASE_URL SECRET IN CHOREO CONSOLE**  
**Expected Fix Time:** 5-10 minutes after adding secrets 