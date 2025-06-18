# 🔑 CHOREO - Template de Variables de Entorno

## ⚠️ **IMPORTANTE: NO SUBIR CLAVES REALES A GITHUB**

Este es un template con placeholders. **NUNCA** pongas claves reales en archivos que se suben a GitHub.

## 📋 **CONFIGURAR EN CHOREO DASHBOARD**

Ve a tu proyecto Choreo → **Settings** → **Secrets** y agrega estas variables:

### **🚀 VARIABLES DE PRODUCCIÓN (Para Choreo)**

```bash
# Supabase Production Configuration
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROD_PROJECT_ID].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_PRODUCTION_ANON_KEY]

# JWT Secret (Production)
JWT_SECRET=[YOUR_PRODUCTION_JWT_SECRET]

# Database URL (opcional, usar Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[YOUR_PROD_PROJECT_ID].supabase.co:5432/postgres
```

## 🎯 **PASOS PARA CONFIGURAR**

### **1. Obtener tus claves de Supabase**
1. Ve a tu proyecto de **PRODUCCIÓN** en Supabase Dashboard
2. Ve a **Settings** → **API**
3. Copia:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### **2. Generar JWT Secret**
Usa tu JWT secret de producción o genera uno nuevo:
```bash
# En Node.js console o terminal
require('crypto').randomBytes(64).toString('base64')
```

### **3. Configurar en Choreo**
Agrega estas 3 variables en Choreo Dashboard:

| Variable Name | Descripción |
|---------------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de tu proyecto Supabase PROD |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key de tu proyecto Supabase PROD |
| `JWT_SECRET` | Tu JWT secret seguro (mínimo 32 caracteres) |

## 🚨 **REGLAS DE SEGURIDAD**

1. **NUNCA** subas claves reales a GitHub
2. **SIEMPRE** usa variables de entorno para claves
3. **REGENERA** claves si se exponen accidentalmente
4. **USA** diferentes claves para dev/prod

## 🔄 **Si expusiste claves accidentalmente**

1. **Regenera inmediatamente** las claves en Supabase
2. **Actualiza** las nuevas claves en Choreo
3. **Cambia** el JWT secret por uno nuevo

¡La seguridad es lo primero! 