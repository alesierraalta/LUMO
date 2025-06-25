# 🌍 CHOREO ENVIRONMENT SETUP - DEV vs PROD

## 🎯 **PROBLEMA SOLUCIONADO**

Choreo tiene **entornos separados** (Development y Production) que deben configurarse diferente:

- **🧪 DEV Environment**: Optimizado para desarrollo y testing rápido
- **🚀 PROD Environment**: Optimizado para rendimiento y estabilidad

## ✅ **SOLUCIÓN IMPLEMENTADA**

### **1. Detector Automático de Entorno**
- **Archivo**: `scripts/choreo-env-detector.js`
- **Función**: Detecta automáticamente si está en dev o prod
- **Lógica**: Analiza hostname, variables de entorno, etc.

### **2. Configuración Dinámica**
```javascript
// El sistema ahora detecta automáticamente:
if (isChoreoDev) {
  environment = 'development'
  useStandalone = false  // Compilación en tiempo real
} else if (isChoreoProd) {
  environment = 'production' 
  useStandalone = true   // Build pre-compilado
}
```

## 🔧 **CONFIGURACIÓN EN CHOREO**

### **Environment Variables por Entorno:**

#### **🧪 DEV Environment:**
```bash
CHOREO_ENVIRONMENT=dev
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co  # Dev DB
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_dev_key
JWT_SECRET=dev_jwt_secret
DATABASE_URL=postgresql://dev_database_url
```

#### **🚀 PROD Environment:**
```bash
CHOREO_ENVIRONMENT=prod
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co  # Prod DB
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_prod_key
JWT_SECRET=super_secure_prod_jwt_secret
DATABASE_URL=postgresql://prod_database_url
```

## 📊 **COMPORTAMIENTO ESPERADO**

### **🧪 DEV Environment:**
```
🔍 [Choreo Env] DEVELOPMENT environment detected
🧪 [Choreo Setup] Development mode optimizations applied
🔧 Using custom Next.js server (development mode)
⏱️ Compilation: En tiempo real (normal para dev)
⚡ Startup: ~10-15 segundos
🎯 Propósito: Testing rápido, hot reload
```

### **🚀 PROD Environment:**
```
🔍 [Choreo Env] PRODUCTION environment detected  
⚡ [Choreo Setup] Production optimizations applied
✅ Using standalone build
⏱️ Compilation: Pre-compilado
⚡ Startup: ~2-3 segundos
🎯 Propósito: Máximo rendimiento
```

## 🛠️ **CÓMO CONFIGURAR EN CHOREO**

### **Paso 1: Environment Variables**
1. Ve a tu proyecto en Choreo
2. Selecciona **DEV environment**
3. Ve a **Settings** > **Environment Variables**
4. Agrega las variables del entorno DEV
5. Repite para **PROD environment** con variables de producción

### **Paso 2: Verificación**
Después del deployment, revisa los logs:

**DEV logs deberían mostrar:**
```
🧪 [Choreo Env] DEVELOPMENT environment detected
🔧 Using custom Next.js server
```

**PROD logs deberían mostrar:**
```
🎯 [Choreo Env] PRODUCTION environment detected
⚡ Using standalone build
```

## 🚨 **TROUBLESHOOTING**

### **Si DEV está muy lento:**
- Verifica que `CHOREO_ENVIRONMENT=dev`
- Logs deben mostrar "DEVELOPMENT environment detected"
- Es normal que compile en tiempo real

### **Si PROD está lento:**
- Verifica que `CHOREO_ENVIRONMENT=prod`
- Logs deben mostrar "PRODUCTION environment detected"
- Debe usar standalone build

### **Variables de Entorno Críticas:**
```bash
# Estas DEBEN estar configuradas en AMBOS entornos:
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
JWT_SECRET

# Esta determina el comportamiento:
CHOREO_ENVIRONMENT  # 'dev' o 'prod'
```

## 🎯 **PRÓXIMOS PASOS**

1. **Configurar variables de entorno** en ambos entornos de Choreo
2. **Deploy en DEV** - Verificar que use modo desarrollo
3. **Deploy en PROD** - Verificar que use modo producción  
4. **Monitorear rendimiento** en cada entorno

**Resultado esperado**: Cada entorno optimizado para su propósito específico! 🚀 