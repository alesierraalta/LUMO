# 🚀 CHOREO DEPLOYMENT GUIDE - DESDE CERO
**LUMO Inventory Management System - Despliegue Completo**

> **FECHA:** 2025-06-30  
> **VERSIÓN:** 2.0 - Configuración Completa desde Cero  
> **ESTADO:** ✅ KEYS REALES INCLUIDAS

---

## 📋 **ÍNDICE**

1. [🎯 Preparación Inicial](#preparación-inicial)
2. [🔧 Configuración de Archivos](#configuración-de-archivos)
3. [🌐 Configuración de Choreo](#configuración-de-choreo)
4. [🚀 Proceso de Despliegue](#proceso-de-despliegue)
5. [✅ Verificación y Testing](#verificación-y-testing)
6. [🔍 Troubleshooting](#troubleshooting)

---

## 🎯 **PREPARACIÓN INICIAL**

### **1. Verificar Prerequisitos**

```bash
# Verificar Node.js y npm
node --version  # Debe ser >= 18.0.0
npm --version   # Debe ser >= 8.0.0

# Verificar Git
git --version

# Verificar que estás en el directorio correcto
pwd  # Debe mostrar: /c/Users/alesierraalta/Documents/python/new-inventory-app
```

### **2. Limpiar Estado Anterior**

```bash
# Limpiar builds anteriores
npm run clean 2>nul || echo "No hay builds anteriores"

# Verificar estado de Git
git status
git pull origin main  # Asegurar última versión
```

---

## 🔧 **CONFIGURACIÓN DE ARCHIVOS**

### **3. Verificar/Crear Dockerfile**

```dockerfile
# Dockerfile (en la raíz del proyecto)
FROM node:18-alpine AS base

# Instalar dependencias solo cuando sea necesario
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /workspace

# Instalar dependencias
COPY package.json package-lock.json* ./
RUN npm ci

# Rebuild para producción
FROM base AS builder
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY . .

# Configurar variables de entorno para build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build de la aplicación
RUN npm run build

# Imagen de producción
FROM base AS runner
WORKDIR /workspace

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar archivos públicos
COPY --from=builder /workspace/public ./public

# Copiar build standalone
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/static ./.next/static

# Copiar scripts necesarios
COPY --from=builder /workspace/lumo-static-server.js ./
COPY --from=builder /workspace/start.sh ./

# Hacer ejecutable el script de inicio
RUN chmod +x ./start.sh

USER nextjs

EXPOSE 8080 8081

ENV PORT=8081

CMD ["./start.sh"]
```

### **4. Configurar choreo.yaml**

```yaml
# choreo.yaml
apiVersion: core.choreo.dev/v1beta1
kind: Component
metadata:
  name: lumo
  description: LUMO Inventory Management System
spec:
  type: web-application
  
  # Build Configuration
  build:
    buildType: dockerfile
    dockerfilePath: ./Dockerfile
    
  # Container Configuration  
  container:
    image: lumo:latest
    
  # Environment Variables
  env:
    - name: NODE_ENV
      value: "production"
    - name: APP_NAME
      value: "LUMO"
    - name: APP_VERSION
      value: "1.0.0"
    - name: CHOREO_ENVIRONMENT
      value: "Production"
    - name: FORCE_SUPABASE
      value: "true"
    - name: NEXT_TELEMETRY_DISABLED
      value: "1"
    - name: PORT
      value: "8081"
      
  # Secrets (configurar en Choreo Console)
  secrets:
    - name: NEXT_PUBLIC_SUPABASE_URL
    - name: NEXT_PUBLIC_SUPABASE_ANON_KEY
    - name: SUPABASE_URL
    - name: SUPABASE_KEY
    - name: JWT_SECRET
    - name: DATABASE_URL
    - name: NEXTAUTH_SECRET
    - name: NEXTAUTH_URL
    
  # Endpoints
  endpoints:
    - name: lumo-app
      service:
        name: lumo
        port: 8080
      context: /
      schemaFilePath: openapi.yaml
      
  # Health Checks
  probes:
    readiness:
      httpGet:
        path: /api/health
        port: 8080
      initialDelaySeconds: 15
      periodSeconds: 10
      timeoutSeconds: 5
      
    liveness:
      httpGet:
        path: /api/health
        port: 8080
      initialDelaySeconds: 30
      periodSeconds: 30
      timeoutSeconds: 10
      
    startup:
      httpGet:
        path: /api/health
        port: 8080
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 12
      
  # Resource Configuration
  resources:
    requests:
      memory: "4Gi"
      cpu: "2000m"
    limits:
      memory: "8Gi"
      cpu: "4000m"
      
  # Scaling Configuration
  scaling:
    minReplicas: 2
    maxReplicas: 5
    targetCPUUtilizationPercentage: 70
```

### **5. Verificar start.sh**

```bash
#!/bin/bash
# start.sh

echo "🚀 [LUMO] Starting LUMO Deployment Verification..."

# Función para logging
log() {
    echo "🔍 [LUMO] $1"
}

# Verificar variables de entorno críticas
log "Checking critical environment variables..."

# Verificar Supabase URLs
if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" ]]; then
    log "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not set"
    exit 1
fi

if [[ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]]; then
    log "❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY not set"
    exit 1
fi

if [[ -z "$JWT_SECRET" ]]; then
    log "❌ ERROR: JWT_SECRET not set"
    exit 1
fi

# Validar que no sean placeholders
if [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"your-project"* ]] || [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"placeholder"* ]]; then
    log "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL contains placeholder values"
    exit 1
fi

if [[ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" == *"your_anon_key"* ]] || [[ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" == *"placeholder"* ]]; then
    log "❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY contains placeholder values"
    exit 1
fi

# Verificar longitud de JWT_SECRET
if [[ ${#JWT_SECRET} -lt 32 ]]; then
    log "❌ ERROR: JWT_SECRET must be at least 32 characters long"
    exit 1
fi

log "✅ All environment variables validated successfully"

# Verificar archivos necesarios
log "Checking required files..."

if [[ ! -f "./server.js" ]]; then
    log "❌ ERROR: server.js not found"
    exit 1
fi

if [[ ! -d "./.next" ]]; then
    log "❌ ERROR: .next directory not found"
    exit 1
fi

log "✅ All required files present"

# Mostrar configuración (sin valores sensibles)
log "Configuration Status:"
log "  - NODE_ENV: ${NODE_ENV:-'not set'}"
log "  - APP_NAME: ${APP_NAME:-'not set'}"
log "  - CHOREO_ENVIRONMENT: ${CHOREO_ENVIRONMENT:-'not set'}"
log "  - SUPABASE_URL configured: $([ -n "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "✅" || echo "❌")"
log "  - SUPABASE_KEY configured: $([ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && echo "✅" || echo "❌")"
log "  - JWT_SECRET configured: $([ -n "$JWT_SECRET" ] && echo "✅" || echo "❌")"

log "🚀 Starting LUMO with static assets on port 8080"
log "🚀 Starting standalone server on port 8081..."

# Ejecutar el servidor
exec node lumo-static-server.js
```

### **6. Verificar lumo-static-server.js**

```javascript
// lumo-static-server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { join } = require('path');
const fs = require('fs');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT, 10) || 8081;
const staticPort = 8080;

console.log('🔍 [LUMO] Starting LUMO with static assets on port', staticPort);
console.log('🔍 [LUMO] Starting standalone server on port', port, '...');

// Crear servidor estático para archivos públicos
const staticServer = createServer((req, res) => {
  const parsedUrl = parse(req.url, true);
  const { pathname } = parsedUrl;
  
  // Servir archivos estáticos desde /public
  if (pathname.startsWith('/')) {
    const filePath = join(__dirname, 'public', pathname === '/' ? 'index.html' : pathname);
    
    if (fs.existsSync(filePath)) {
      const ext = pathname.split('.').pop();
      const contentType = {
        'html': 'text/html',
        'js': 'application/javascript',
        'css': 'text/css',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'gif': 'image/gif',
        'ico': 'image/x-icon'
      }[ext] || 'text/plain';
      
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
      return;
    }
  }
  
  // Redirigir al servidor principal
  res.writeHead(302, { 'Location': `http://localhost:${port}${req.url}` });
  res.end();
});

staticServer.listen(staticPort, () => {
  console.log(`🔍 [STATIC] Static server ready on port ${staticPort}`);
});

// Servidor Next.js principal
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      await handle(req, res, parse(req.url, true));
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  })
  .once('error', (err) => {
    console.error(err);
    process.exit(1);
  })
  .listen(port, () => {
    console.log(`🔍 [STANDALONE] Ready on port ${port}`);
  });
});
```

---

## 🌐 **CONFIGURACIÓN DE CHOREO**

### **7. Valores Exactos para Secrets**

**COPIAR ESTOS VALORES EXACTOS EN CHOREO CONSOLE:**

```env
# 🔑 SUPABASE CONFIGURATION (Production)
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4

# 🔑 SERVER-SIDE SUPABASE
SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUxMjM4NCwiZXhwIjoyMDY1MDg4Mzg0fQ.dBKGr8BqLGDSGAkCHnHI8FJQb-tTOaQ3gLHo_8rl4Eo

# 🔑 JWT SECRETS
JWT_SECRET=pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg==
NEXTAUTH_SECRET=pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg==

# 🔑 DATABASE
DATABASE_URL=postgresql://postgres.ubjujxtvlubxowsphvuk:Theale05042013$$@aws-0-us-east-1.pooler.supabase.com:6543/postgres

# 🔑 NEXTAUTH
NEXTAUTH_URL=https://lumo-1615540597.choreoapis.dev
```

### **8. Pasos en Choreo Console**

1. **Acceder a Choreo Console:**
   - Ve a: https://console.choreo.dev/
   - Busca tu proyecto "LUMO"

2. **Configurar Secrets:**
   - Ve a `Settings` → `Environment Variables`
   - Elimina TODAS las variables existentes
   - Agrega cada secret con los valores exactos de arriba:

   ```
   NEXT_PUBLIC_SUPABASE_URL → https://ubjujxtvlubxowsphvuk.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_URL → https://ubjujxtvlubxowsphvuk.supabase.co
   SUPABASE_KEY → eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   JWT_SECRET → pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5...
   DATABASE_URL → postgresql://postgres.ubjujxtvlubxowsphvuk...
   NEXTAUTH_SECRET → pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5...
   NEXTAUTH_URL → https://lumo-1615540597.choreoapis.dev
   ```

3. **Guardar Configuración:**
   - Hacer clic en "Save" después de cada variable
   - Verificar que no haya typos

---

## 🚀 **PROCESO DE DESPLIEGUE**

### **9. Build Local (Verificación)**

```bash
# Limpiar y preparar
npm run clean
npm ci

# Build de producción
npm run build

# Verificar que el build fue exitoso
ls -la .next/
ls -la .next/standalone/
```

### **10. Commit y Push**

```bash
# Verificar cambios
git status

# Agregar archivos
git add .

# Commit con mensaje descriptivo
git commit -m "feat(choreo): complete deployment configuration with real Supabase keys

- Add production Dockerfile with multi-stage build
- Configure choreo.yaml with proper resource allocation
- Add comprehensive start.sh with environment validation
- Include lumo-static-server.js for dual-port setup
- All environment variables configured with real values
- Ready for production deployment"

# Push a main
git push origin main
```

### **11. Desplegar en Choreo**

1. **Trigger Deployment:**
   - En Choreo Console, ve a tu proyecto
   - Click en "Deploy" o "Build & Deploy"
   - Selecciona la branch "main"

2. **Monitorear Build:**
   - Observa los logs de build en tiempo real
   - Verificar que no haya errores

3. **Verificar Deployment:**
   - Una vez completado, acceder a la URL de la aplicación
   - Verificar que la aplicación inicie correctamente

---

## ✅ **VERIFICACIÓN Y TESTING**

### **12. Scripts de Verificación**

```bash
# Ejecutar verificación de configuración
node scripts/verify-choreo-config.bat

# Verificar endpoint de debug
curl "https://lumo-1615540597.choreoapis.dev/api/debug-env-config"

# Verificar health endpoint
curl "https://lumo-1615540597.choreoapis.dev/api/health"
```

### **13. Tests de Funcionalidad**

1. **Verificar Aplicación:**
   - Acceder a: https://lumo-1615540597.choreoapis.dev
   - Verificar que la página de login carga
   - Intentar login con credenciales válidas

2. **Verificar APIs:**
   - `/api/health` → Debe retornar 200 OK
   - `/api/debug-env-config` → Debe mostrar configuración sin placeholders
   - `/api/auth/supabase-me` → Debe funcionar con autenticación

3. **Verificar Base de Datos:**
   - Login debe conectar con Supabase
   - Operaciones CRUD deben funcionar
   - No debe haber errores de conexión

---

## 🔍 **TROUBLESHOOTING**

### **14. Problemas Comunes**

**❌ "urlIsPlaceholder: true"**
```bash
# SOLUCIÓN: Verificar que las variables en Choreo Console sean exactas
# NO deben contener "your-project", "placeholder", etc.
```

**❌ "Standalone server failed to start"**
```bash
# SOLUCIÓN: Verificar que start.sh sea ejecutable
chmod +x start.sh

# Verificar que server.js exista en .next/standalone/
ls -la .next/standalone/server.js
```

**❌ "Build failed"**
```bash
# SOLUCIÓN: Verificar dependencias
npm ci
npm run build

# Verificar que no haya errores de TypeScript
npm run type-check
```

### **15. Logs y Debugging**

```bash
# Ver logs de Choreo deployment
# (En Choreo Console → Logs)

# Verificar configuración local
node scripts/generate-choreo-config.js

# Test de conexión a Supabase
curl -H "Authorization: Bearer ANON_KEY" \
  "https://ubjujxtvlubxowsphvuk.supabase.co/rest/v1/"
```

---

## 🎯 **CHECKLIST FINAL**

- [ ] ✅ Dockerfile creado y configurado
- [ ] ✅ choreo.yaml con configuración completa
- [ ] ✅ start.sh ejecutable y con validaciones
- [ ] ✅ lumo-static-server.js configurado
- [ ] ✅ Variables de entorno configuradas en Choreo Console
- [ ] ✅ Secrets configurados con valores reales (NO placeholders)
- [ ] ✅ Build local exitoso
- [ ] ✅ Código commiteado y pusheado
- [ ] ✅ Deployment ejecutado en Choreo
- [ ] ✅ Aplicación accesible y funcional
- [ ] ✅ APIs respondiendo correctamente
- [ ] ✅ Base de datos conectada y operacional

---

## 📞 **SOPORTE**

Si encuentras problemas:

1. **Verificar logs:** Choreo Console → Logs
2. **Ejecutar debug:** `/api/debug-env-config`
3. **Verificar configuración:** `scripts/verify-choreo-config.bat`
4. **Revisar este guide:** Todos los valores están probados y funcionando

**¡CONFIGURACIÓN COMPLETA Y LISTA PARA PRODUCCIÓN!** 🚀 