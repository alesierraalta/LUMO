# 🚀 Optimización de Startup para Desarrollo en Choreo

## 🎯 **PROBLEMA IDENTIFICADO**

El deployment de desarrollo en Choreo está tardando **60+ segundos** en arrancar debido a:

- ⏱️ **52 segundos** instalando dependencias TypeScript en runtime
- ⏱️ **29 segundos** compilando páginas on-demand  
- ⏱️ **767 packages** instalándose durante el startup
- ❌ **No BUILD_ID** = usando development server en lugar de standalone

## ✅ **SOLUCIONES IMPLEMENTADAS**

### **1. 📦 Pre-instalación de Dependencias TypeScript**
```dockerfile
# En Dockerfile - Línea agregada después de npm ci
RUN npm install --save-dev typescript @types/react @types/node --legacy-peer-deps || true
```
**Beneficio**: Ahorra ~52 segundos de instalación en runtime

### **2. 🆔 Generación Automática de BUILD_ID**
```javascript
// scripts/optimize-dev-startup.js
const createDevBuildId = () => {
  const buildId = `dev-${Date.now()}`;
  fs.writeFileSync('.next/BUILD_ID', buildId);
};
```
**Beneficio**: Habilita standalone server incluso en development

### **3. ⚙️ Configuración Next.js Optimizada**
```javascript
// next.config.dev-optimized.js
const nextConfig = {
  telemetry: false,
  swcMinify: true,
  experimental: {
    optimizePackageImports: ['@supabase/supabase-js'],
    memoryBasedWorkersCount: true,
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.optimization = {
        removeAvailableModules: false,
        removeEmptyChunks: false,
        splitChunks: false,
      };
    }
    return config;
  }
};
```
**Beneficio**: Reduce overhead de compilación y memoria

### **4. 🔥 Pre-warming de Cache**
```javascript
// Crea directorio .next/cache automáticamente
const preWarmCache = () => {
  const cacheDir = path.join(process.cwd(), '.next', 'cache');
  fs.mkdirSync(cacheDir, { recursive: true });
};
```
**Beneficio**: Compilación más rápida en subsecuentes requests

### **5. 🚀 Integración con Runtime Setup**
```javascript
// scripts/choreo-runtime-setup.js
if (process.env.NODE_ENV === 'development' || process.env.CHOREO_ENVIRONMENT === 'Development') {
  const { optimizeDevStartup } = require('./optimize-dev-startup');
  await optimizeDevStartup();
}
```
**Beneficio**: Optimizaciones se aplican automáticamente en development

## 📊 **RESULTADOS ESPERADOS**

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| **Startup Time** | 60+ segundos | 10-15 segundos | **75-80% más rápido** |
| **TypeScript Install** | 52 segundos | 0 segundos | **100% eliminado** |
| **Page Compilation** | 29s por página | <5s por página | **80% más rápido** |
| **Package Installation** | 767 packages | Pre-instalado | **Runtime eliminado** |

## 🛠️ **CÓMO APLICAR LAS OPTIMIZACIONES**

### **Método 1: Script Automático**
```bash
npm run apply:dev-optimizations
```

### **Método 2: Manual**
1. Verificar que `Dockerfile` tenga la línea de TypeScript pre-install
2. Ejecutar optimizador: `npm run optimize:dev-startup`
3. Aplicar config optimizada: `cp next.config.dev-optimized.js next.config.js`

### **Método 3: Deployment**
```bash
# Las optimizaciones se aplican automáticamente en deployment
git add .
git commit -m "feat: optimize development startup time"
git push
# Redeploy en Choreo
```

## 🔍 **VERIFICACIÓN DE OPTIMIZACIONES**

### **1. Logs de Startup Esperados:**
```
⚡ [Dev Optimizer] Starting development startup optimization...
📦 [Dev Optimizer] TypeScript: ✅
🆔 [Dev Optimizer] Created BUILD_ID: dev-1234567890
⚙️ [Dev Optimizer] Next.js optimizations applied
🔥 [Dev Optimizer] Cache pre-warmed
⚡ [Dev Optimizer] Expected startup time: 10-15 seconds
```

### **2. Indicadores de Éxito:**
- ✅ No instalación de TypeScript en logs
- ✅ BUILD_ID presente en logs
- ✅ Startup en <15 segundos
- ✅ Páginas compilan <5 segundos

### **3. Troubleshooting:**
```bash
# Si las optimizaciones no se aplican
node scripts/optimize-dev-startup.js

# Si BUILD_ID no se crea
ls -la .next/BUILD_ID

# Si TypeScript sigue instalándose
docker logs <container-id> | grep "typescript"
```

## 🎯 **PRÓXIMOS PASOS**

1. **Commit y Push** estos cambios
2. **Redeploy** en Choreo development environment
3. **Monitorear logs** de startup para verificar mejoras
4. **Medir tiempo** de startup real vs esperado
5. **Aplicar a production** si los resultados son satisfactorios

## 📈 **MÉTRICAS DE MONITOREO**

### **KPIs de Startup:**
- **Tiempo total de startup**: Target <15 segundos
- **Tiempo de instalación de deps**: Target 0 segundos
- **Tiempo primera página**: Target <5 segundos
- **Uso de memoria**: Target <2GB durante startup

### **Comandos de Monitoreo:**
```bash
# Tiempo de startup
curl -w "@curl-format.txt" -o /dev/null -s "http://your-app.choreo.dev/api/health"

# Verificar BUILD_ID
curl "http://your-app.choreo.dev/api/health" | jq '.buildId'

# Monitorear logs en tiempo real
# (En Choreo dashboard > Logs > Real-time)
```

## 🆘 **SOPORTE**

Si las optimizaciones no mejoran el tiempo de startup:

1. **Verificar logs** de Choreo para errores
2. **Confirmar** que TypeScript deps están pre-instalados
3. **Validar** que BUILD_ID se está creando
4. **Revisar** configuración Next.js aplicada
5. **Contactar soporte** con logs específicos

**Objetivo**: Reducir startup de 60+ segundos a 10-15 segundos ⚡ 