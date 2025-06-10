# 🚀 LUMO - Listo para Deploy Automático en Choreo

## ✅ **Setup Híbrido Completado**

Tu aplicación está configurada para:
- **Local**: SQLite + Prisma 
- **Choreo**: Supabase (detección automática)

## 📋 **Pre-Deploy Checklist**

### 1️⃣ **Configurar Variables en Choreo**

Ve a tu proyecto Choreo → **Settings** → **Environment Variables** y agrega:

```bash
# Supabase Configuration
SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# Next.js Public Variables
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# Environment Detection
CHOREO_DEPLOYMENT=true
NODE_ENV=production

# JWT Secret (genera uno seguro)
JWT_SECRET=tu_jwt_secret_super_seguro_para_produccion

# Compatibility (mantener)
DATABASE_URL=postgresql://placeholder
```

### 2️⃣ **Ejecutar SQL en Supabase** ⚠️ **IMPORTANTE**

1. Ve a [Supabase Dashboard](https://ubjujxtvlubxowsphvuk.supabase.co)
2. Ve a **SQL Editor**
3. Copia y ejecuta el contenido completo de: `supabase-migration.sql`
4. Verifica que se crearon todas las tablas

### 3️⃣ **Generar JWT Secret Seguro**

```javascript
// Ejecuta esto en consola del navegador o Node.js
require('crypto').randomBytes(64).toString('hex')
```

## 🔄 **Flujo de Deploy Automático**

```bash
# 1. Commit tus cambios
git add .
git commit -m "chore: configuración híbrida SQLite/Supabase lista"

# 2. Push al repositorio
git push origin main

# 3. Choreo detectará automáticamente el commit
# 4. Choreo hará el build automáticamente
# 5. Choreo desplegará automáticamente
```

## 🛠️ **Lo que pasará automáticamente en Choreo:**

1. **Build Process**:
   - Detecta `NODE_ENV=production`
   - Detecta `SUPABASE_URL` → Usa Supabase
   - Instala dependencias
   - Ejecuta `npm run build`

2. **Runtime**:
   - La app detecta el entorno de Choreo
   - Conecta automáticamente a Supabase
   - Crea usuario admin automáticamente
   - Listo para usar

## 👤 **Credenciales Admin (creadas automáticamente)**

```
📧 Email: alesierraalta@gmail.com
🔑 Password: admin123
```

## 🔍 **Verificación del Deploy**

Una vez que Choreo termine el deploy:

1. Ve a la URL de tu app en Choreo
2. Intenta hacer login con las credenciales admin
3. Ve a Settings → Users
4. Deberías ver la página sin errores

## 📁 **Archivos Clave del Setup**

- `src/lib/db-hybrid.ts` - Cliente que detecta automáticamente el entorno
- `src/lib/db.ts` - Exporta el cliente híbrido
- `supabase-migration.sql` - Schema completo para Supabase
- `scripts/setup-supabase-admin.js` - Crea admin automáticamente
- `package.json` - Scripts actualizados

## 🚨 **Si algo falla:**

1. **Error en Build**: Revisa logs en Choreo
2. **Error de conexión DB**: Verifica variables de entorno
3. **Error de permisos**: Asegúrate de que el SQL se ejecutó completo
4. **Error de login**: Verifica que el admin se creó automáticamente

## 🎯 **Tu siguiente paso:**

```bash
git push origin main
```

Y Choreo hará el resto automáticamente! 🚀 