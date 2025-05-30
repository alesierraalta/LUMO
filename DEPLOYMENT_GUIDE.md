# 🚀 LUMO Inventory - Guía de Despliegue en Choreo

## ✅ Pre-requisitos

Antes de desplegar, asegúrate de tener:

1. **Cuenta de Choreo** con proyecto configurado
2. **Base de datos PostgreSQL** (recomendado: Neon, Supabase, o Railway)
3. **JWT Secret** para autenticación personalizada
4. **Git** con código subido a GitHub/GitLab

## 🔧 Paso 1: Verificación Pre-Despliegue

Ejecuta el script de verificación:

```bash
npm run pre-deploy
```

Si hay errores, resuélvelos antes de continuar.

## 📊 Paso 2: Configuración de Secretos en Choreo

Ve a tu proyecto Choreo → Component → Settings → Secrets y configura:

### 🔑 Secretos Requeridos

```bash
# Base de datos (CRÍTICO)
DATABASE_URL=postgresql://username:password@host:port/database?sslmode=require

# JWT Secret para autenticación personalizada (CRÍTICO)
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
```

### 🔍 Verificación de Secrets

Asegúrate de que:
- ✅ **DATABASE_URL** apunte a tu base de datos PostgreSQL
- ✅ **JWT_SECRET** sea una clave segura de al menos 32 caracteres
- ✅ La base de datos esté accesible desde Choreo

## 🏗️ Paso 3: Build Local (Opcional)

Para verificar que todo compile correctamente:

```bash
npm run deploy:check
```

Este comando:
1. Ejecuta verificaciones pre-despliegue
2. Hace build de la aplicación
3. Verifica que los artefactos estén correctos

## 🚀 Paso 4: Despliegue en Choreo

### 4.1 Conectar Repositorio

1. Ve a Choreo Dashboard
2. Crea nuevo componente → Web Application
3. Conecta tu repositorio GitHub/GitLab
4. Selecciona la rama `main` o `master`

### 4.2 Configuración Automática

Choreo detectará automáticamente:
- ✅ `choreo.yaml` - Configuración del componente
- ✅ `Dockerfile` - Instrucciones de build
- ✅ `package.json` - Dependencias y scripts

### 4.3 Variables de Entorno

En Component Settings → Environment Variables, verifica que estén configuradas:

```yaml
NODE_ENV: production
PORT: 8080
HOSTNAME: 0.0.0.0
```

## 🔍 Paso 5: Monitoreo del Despliegue

### 5.1 Logs de Build

Monitorea los logs durante el build:

```
[BUILD] Installing dependencies...
[BUILD] Running pre-build scripts...
[BUILD] Building application...
[BUILD] Running post-build scripts...
[BUILD] Build completed successfully!
```

### 5.2 Logs de Deploy

Verifica el inicio del servidor:

```
[DEPLOY] 🚀 Starting LUMO Inventory deployment...
[DEPLOY] ✅ choreo-server.js found
[DEPLOY] ✅ server.js found
[DEPLOY] Starting Choreo-optimized server...
[CHOREO-SERVER] 🚀 Starting LUMO Inventory System for Choreo...
```

## 🩺 Paso 6: Verificación Post-Despliegue

### 6.1 Health Check

Verifica que el endpoint de salud funcione:

```bash
curl https://your-choreo-url/api/health
```

Respuesta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-XX...",
  "service": "lumo-inventory",
  "version": "1.0.0",
  "environment": "production"
}
```

### 6.2 Verificación de Base de Datos

1. Ve a la aplicación → Dashboard
2. Verifica que se carguen productos/categorías
3. Prueba crear un nuevo producto

### 6.3 Verificación de Autenticación

1. Intenta hacer login con tus credenciales
2. Verifica que el middleware funcione
3. Confirma acceso a rutas protegidas

## 🐛 Solución de Problemas Comunes

### Error: "Can't reach database server"

**Solución:**
```bash
# Verifica la URL de base de datos
echo $DATABASE_URL

# En Neon/Supabase, asegúrate de incluir ?sslmode=require
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
```

### Error: "JWT_SECRET is missing"

**Solución:**
1. Verifica que JWT_SECRET esté en Choreo Secrets
2. Asegúrate de que tenga al menos 32 caracteres
3. Redeploy el componente

### Error: "Build timeout"

**Solución:**
```yaml
# En choreo.yaml, aumenta el timeout:
build:
  timeoutSeconds: 900  # 15 minutos
```

### Error: "Health check failed"

**Solución:**
1. Verifica que el puerto 8080 esté libre
2. Revisa logs del servidor
3. Confirma que `/api/health` responda

## 📈 Configuración de Producción

### Auto-Scaling

```yaml
scaling:
  minReplicas: 1
  maxReplicas: 5
  targetCPUUtilizationPercentage: 80
```

### Recursos

```yaml
resources:
  cpu:
    units: 1      # 1 vCPU
  memory:
    units: 2Gi   # 2GB RAM
```

### Health Checks

```yaml
healthCheck:
  readinessProbe:
    initialDelaySeconds: 60
    periodSeconds: 15
  livenessProbe:
    initialDelaySeconds: 90
    periodSeconds: 30
```

## 🔐 Seguridad

### Variables de Entorno Sensibles

- ✅ Todas las keys están en Choreo Secrets
- ✅ No hay credenciales en el código
- ✅ Base de datos usa SSL/TLS
- ✅ JWT Secret seguro para autenticación

### Headers de Seguridad

```javascript
// Ya configurados en next.config.js
{
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block'
}
```

## 🎯 URLs Importantes

Después del despliegue exitoso:

- **Aplicación:** `https://your-choreo-url`
- **Health Check:** `https://your-choreo-url/api/health`
- **Dashboard:** `https://your-choreo-url/dashboard`
- **Login:** `https://your-choreo-url/login`
- **API:** `https://your-choreo-url/api/*`

## 📞 Soporte

Si tienes problemas:

1. **Revisa logs** en Choreo Dashboard
2. **Ejecuta** `npm run pre-deploy` localmente
3. **Verifica** que todos los secretos estén configurados
4. **Confirma** que la base de datos esté accesible

---

**✅ ¡Listo! Tu aplicación LUMO Inventory está desplegada en producción.** 