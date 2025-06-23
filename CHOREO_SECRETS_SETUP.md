# 🔐 CONFIGURACIÓN DE SECRETS EN CHOREO CONSOLE

## 🎯 **PROBLEMA IDENTIFICADO:**
El deployment está fallando porque los **secrets requeridos NO EXISTEN** en Choreo Console.

## 📋 **SECRETS REQUERIDOS:**

### 1. **DATABASE_URL** (CRÍTICO)
- **Descripción:** URL de conexión a Supabase PostgreSQL
- **Formato:** `postgresql://postgres:[PASSWORD]@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres`
- **Obtener de:** Supabase Dashboard → Settings → Database → Connection String

### 2. **NEXT_PUBLIC_SUPABASE_URL** (CRÍTICO)
- **Descripción:** URL pública de tu proyecto Supabase
- **Formato:** `https://ubjujxtvlubxowsphvuk.supabase.co`
- **Obtener de:** Supabase Dashboard → Settings → API → Project URL

### 3. **NEXT_PUBLIC_SUPABASE_ANON_KEY** (CRÍTICO)
- **Descripción:** Clave anónima de Supabase para acceso público
- **Formato:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Obtener de:** Supabase Dashboard → Settings → API → anon/public key

### 4. **JWT_SECRET** (REQUERIDO)
- **Descripción:** Clave secreta para JWT authentication
- **Formato:** String de mínimo 32 caracteres
- **Generar:** `openssl rand -base64 32`

---

## 🚀 **PASOS PARA CONFIGURAR:**

### **Paso 1: Obtener Credenciales de Supabase**

1. Ve a **Supabase Dashboard**: https://supabase.com/dashboard
2. Selecciona tu proyecto **LUMO** (ubjujxtvlubxowsphvuk)
3. Ve a **Settings** → **Database**
4. Copia **Connection String** → **URI**
5. Ve a **Settings** → **API**
6. Copia **Project URL** y **anon key**

### **Paso 2: Crear Secrets en Choreo Console**

1. Ve a **Choreo Console**: https://console.choreo.dev/
2. Selecciona tu proyecto **LUMO**
3. Ve a **DevOps** → **Configs & Secrets**
4. Click **+ Create**

#### **Para cada secret:**

**A. DATABASE_URL:**
- Click **Environment Variables**
- ✅ **Mark as a Secret** (IMPORTANTE)
- **Display Name:** `Database Connection`
- **Environment Variable:**
  - **Key:** `DATABASE_URL`
  - **Value:** `postgresql://postgres:[TU_PASSWORD]@db.ubjujxtvlubxowsphvuk.supabase.co:5432/postgres`
- Click **Create**

**B. NEXT_PUBLIC_SUPABASE_URL:**
- **Display Name:** `Supabase URL`
- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** `https://ubjujxtvlubxowsphvuk.supabase.co`

**C. NEXT_PUBLIC_SUPABASE_ANON_KEY:**
- ✅ **Mark as a Secret**
- **Display Name:** `Supabase Anon Key`
- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** `[TU_ANON_KEY]`

**D. JWT_SECRET:**
- ✅ **Mark as a Secret**
- **Display Name:** `JWT Secret Key`
- **Key:** `JWT_SECRET`
- **Value:** `[GENERAR_CON_OPENSSL]`

### **Paso 3: Verificar Configuración**

1. En Choreo Console, ve a **Configs & Secrets**
2. Deberías ver **4 secrets** creados
3. Redeploy tu aplicación

---

## 🔍 **GENERACIÓN DE JWT_SECRET:**

```bash
# Opción 1: OpenSSL
openssl rand -base64 32

# Opción 2: Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Opción 3: Online (solo para desarrollo)
# https://generate-secret.now.sh/32
```

---

## ✅ **VERIFICACIÓN POST-CONFIGURACIÓN:**

Después de crear todos los secrets, los logs deberían mostrar:

```
🚀 [Choreo Setup] Starting runtime configuration...
🔍 [Choreo Setup] Critical environment variables validated
✅ [Choreo Setup] All configurations loaded successfully
✅ [Choreo Setup] Runtime setup completed
Server starting on port 8080...
```

---

## 🚨 **NOTAS IMPORTANTES:**

1. **Secrets son write-only** - No podrás ver su contenido después de crearlos
2. **Environment-specific** - Crea secrets para cada environment (dev/prod)
3. **Redeploy requerido** - Después de crear secrets, debes redesplegar
4. **Validación automática** - El script verificará que existan al startup

---

## 🔧 **TROUBLESHOOTING:**

### Si sigue fallando después de crear secrets:
1. Verifica que los nombres de los secrets coincidan exactamente
2. Asegúrate de que DATABASE_URL tenga la contraseña correcta
3. Confirma que el proyecto Supabase esté ACTIVE
4. Redeploy desde cero (no promote)

### Para verificar que los secrets existen:
1. Ve a Choreo Console → DevOps → Configs & Secrets
2. Deberías ver 4 entries (algunos marcados como secrets)
3. Si faltan, créalos siguiendo los pasos anteriores 