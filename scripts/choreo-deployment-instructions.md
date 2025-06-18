# 🚀 CHOREO DEPLOYMENT FIX - Variables de Entorno Requeridas

## ❌ **PROBLEMA IDENTIFICADO**
El error en Choreo es: `Error: supabaseUrl is required` porque las variables de entorno de Supabase no están configuradas.

## ✅ **SOLUCIÓN: Configurar Variables en Choreo Dashboard**

Ve a tu proyecto Choreo → **Settings** → **Secrets** y agrega estas variables **EXACTAMENTE** con estos nombres:

### **🔑 Variables de Supabase (CRÍTICAS)**
```bash
# Variables públicas de Supabase (PRODUCTION)
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4
```

### **🔐 Variables de Autenticación**
```bash
# JWT Secret (genera uno nuevo y seguro)
JWT_SECRET=tu_jwt_secret_super_seguro_minimo_32_caracteres_aqui

# Database URL (si usas otra base de datos)
DATABASE_URL=postgresql://usuario:password@host:puerto/database
```

## 📋 **PASOS PARA ARREGLAR EL DEPLOYMENT**

### **1. Configurar Variables en Choreo**
1. Ve a tu proyecto Choreo
2. Navega a **Settings** → **Secrets**
3. Agrega cada variable una por una con los nombres EXACTOS de arriba
4. Asegúrate de que no haya espacios extra en los nombres

### **2. Verificar choreo.yaml**
✅ **Ya actualizado** - El archivo `choreo.yaml` ahora incluye las variables de Supabase correctas

### **3. Re-deployar**
```bash
# Commit los cambios del choreo.yaml
git add choreo.yaml
git commit -m "fix: Add Supabase environment variables to choreo.yaml"
git push origin main
```

### **4. Verificar el Deploy**
Una vez que Choreo termine el build, verifica:
- ✅ Build exitoso sin errores de "supabaseUrl is required"
- ✅ Aplicación inicia correctamente
- ✅ Endpoint `/api/health` responde

## 🔍 **VALIDACIÓN POST-DEPLOYMENT**

### **Verificar Variables de Entorno**
```bash
# Accede a tu app desplegada y ve a:
https://tu-app-choreo.apps.choreo.dev/api/health

# Deberías ver una respuesta como:
{
  "status": "ok",
  "environment": "production",
  "supabase": {
    "url_configured": true,
    "key_configured": true
  }
}
```

### **Credenciales de Acceso**
Una vez desplegado, puedes acceder con:
- **Email**: `alesierraalta@gmail.com`
- **Password**: `admin123`

## 🚨 **NOTAS IMPORTANTES**

1. **Nombres Exactos**: Los nombres de las variables en Choreo deben coincidir EXACTAMENTE con los del `choreo.yaml`
2. **Sin Espacios**: Asegúrate de no tener espacios antes/después de los nombres de variables
3. **Producción**: Estas son las credenciales de PRODUCCIÓN de Supabase
4. **JWT Secret**: Genera un JWT_SECRET seguro de al menos 32 caracteres

## 🎯 **PRÓXIMOS PASOS**

1. **Configurar variables** en Choreo Dashboard
2. **Hacer push** de los cambios de choreo.yaml
3. **Esperar el deployment** automático
4. **Verificar** que la aplicación funcione correctamente

¡El problema debería resolverse completamente con estos cambios! 