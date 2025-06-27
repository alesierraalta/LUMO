# 🔍 Sistema de Monitoreo Post-Deploy para Choreo

## 📋 Descripción General

Sistema completo de monitoreo para verificar que el **Ultra Build Fix** de Supabase funciona correctamente en producción de Choreo. Detecta automáticamente errores de configuración, problemas de performance y fallos en el deployment.

## 🎯 Objetivos del Monitoreo

1. **Verificar Ultra Build Fix**: Confirmar que no hay errores "Missing Supabase configuration"
2. **Health Checks**: Monitorear endpoints críticos en tiempo real
3. **Performance Monitoring**: Analizar tiempos de respuesta y carga
4. **Alertas Automáticas**: Notificación inmediata de problemas
5. **Reportes Detallados**: Documentación completa de resultados

## 🚀 Configuración Rápida

### 1. Setup Inicial
```bash
# Configuración interactiva
npm run monitor:setup
```

### 2. Monitoreo Rápido (Supabase Fix)
```bash
# Verificación específica del build fix
npm run monitor:quick

# Con URL específica
node scripts/monitor-supabase-fix.js https://your-app.choreoapis.dev
```

### 3. Monitoreo Completo
```bash
# Monitoreo completo por 15 minutos
npm run monitor:full

# Monitoreo personalizado (30 minutos)
node scripts/choreo-post-deploy-monitor.js 30
```

## 📊 Componentes del Sistema

### 🔧 1. Monitor de Supabase Build Fix
**Archivo**: `scripts/monitor-supabase-fix.js`

**Funcionalidades**:
- ✅ Detección específica de errores de Supabase
- ✅ Verificación de endpoints críticos
- ✅ Análisis de respuestas para patrones de error
- ✅ Reporte de status del build fix

**Endpoints Monitoreados**:
- `/api/health` (crítico)
- `/api/categories` (crítico) 
- `/api/auth/me` (no crítico)
- `/` (no crítico)

**Uso**:
```bash
# Verificación rápida
npm run monitor:supabase-fix

# Con URL específica
node scripts/monitor-supabase-fix.js https://your-choreo-app.com
```

### 🏥 2. Monitor General de Choreo
**Archivo**: `scripts/choreo-post-deploy-monitor.js`

**Funcionalidades**:
- 🔄 Monitoreo continuo con intervalos configurables
- 📈 Análisis de performance en tiempo real
- 🚨 Sistema de alertas multi-nivel
- 📋 Verificación de logs de deployment
- 📊 Reportes estadísticos completos

**Configuración**:
```javascript
{
  healthCheckInterval: 30000,     // 30 segundos
  logCheckInterval: 60000,        // 1 minuto
  performanceCheckInterval: 120000, // 2 minutos
  maxResponseTime: 5000,          // 5 segundos
  maxConsecutiveFailures: 3
}
```

### ⚙️ 3. Setup de Monitoreo
**Archivo**: `scripts/setup-monitoring.js`

**Funcionalidades**:
- 🛠️ Configuración interactiva
- 📝 Generación de archivos de configuración
- 🚀 Creación de scripts de inicio rápido
- 📁 Setup de directorios de logs

## 📈 Tipos de Monitoreo

### 🎯 Monitoreo Específico (Supabase Fix)
**Duración**: 1-2 minutos  
**Objetivo**: Verificar que el ultra build fix funciona  
**Comando**: `npm run monitor:quick`

**Verifica**:
- ❌ Ausencia de "Missing Supabase configuration"
- ✅ Endpoints críticos respondiendo
- ⚡ Tiempos de respuesta aceptables
- 🔧 Build fix implementado correctamente

### 🔄 Monitoreo Continuo
**Duración**: 10-30 minutos  
**Objetivo**: Monitoreo completo de producción  
**Comando**: `npm run monitor:full`

**Incluye**:
- 🏥 Health checks cada 30 segundos
- 📋 Análisis de logs cada minuto
- ⚡ Tests de performance cada 2 minutos
- 🚨 Alertas automáticas
- 📊 Reportes estadísticos

## 🚨 Sistema de Alertas

### Niveles de Severidad

#### 🚨 CRITICAL
- Health endpoint no responde
- Aplicación completamente caída
- **Acción**: Verificar deployment en Choreo

#### ⚠️ HIGH  
- Errores de Supabase detectados
- Múltiples endpoints fallando
- **Acción**: Revisar logs y configuración

#### 💡 MEDIUM
- Tiempos de respuesta lentos
- Errores intermitentes
- **Acción**: Monitorear de cerca

#### ✅ INFO
- Todo funcionando correctamente
- **Acción**: Continuar monitoreo normal

### Configuración de Alertas
```javascript
{
  maxResponseTime: 5000,          // > 5s = MEDIUM alert
  maxErrorRate: 0.05,             // > 5% = HIGH alert  
  maxConsecutiveFailures: 3,      // 3+ fallos = HIGH alert
  criticalEndpointDown: 'CRITICAL' // Endpoint crítico caído
}
```

## 📁 Archivos de Salida

### Logs Generados
```
logs/
├── choreo-alerts.log           # Alertas del sistema
├── supabase-fix-monitoring.json # Resultados JSON detallados
├── supabase-fix-report.txt     # Reporte de texto legible
└── application.log             # Logs generales
```

### Estructura de Reportes
```json
{
  "timestamp": "2025-01-15T10:30:00.000Z",
  "buildFixWorking": true,
  "supabaseErrors": [],
  "endpointTests": [
    {
      "endpoint": "/api/health",
      "statusCode": 200,
      "responseTime": 150,
      "success": true,
      "critical": true
    }
  ],
  "recommendations": [
    {
      "priority": "INFO",
      "issue": "All checks passed",
      "action": "Continue monitoring"
    }
  ]
}
```

## 🎮 Scripts NPM Disponibles

```bash
# Configuración inicial
npm run monitor:setup

# Monitoreo rápido (Supabase fix)
npm run monitor:quick
npm run monitor:supabase-fix

# Monitoreo completo
npm run monitor:choreo        # 10 minutos (default)
npm run monitor:full         # 15 minutos
```

## 🔧 Configuración Avanzada

### Variables de Entorno
```bash
# URL de la aplicación en Choreo
CHOREO_APP_URL=https://your-app.choreoapis.dev

# Duración del monitoreo (minutos)
MONITORING_DURATION=10

# Email para alertas (opcional)
ALERT_EMAIL=admin@yourcompany.com

# Habilitar monitoreo
MONITORING_ENABLED=true
```

### Personalización de Endpoints
```javascript
// En scripts/monitor-supabase-fix.js
const endpoints = [
  { path: '/api/health', critical: true },
  { path: '/api/categories', critical: true },
  { path: '/api/custom-endpoint', critical: false }
];
```

### Ajuste de Intervalos
```javascript
// En scripts/choreo-post-deploy-monitor.js
const MONITORING_CONFIG = {
  healthCheckInterval: 15000,     // 15 segundos (más frecuente)
  logCheckInterval: 30000,        // 30 segundos
  performanceCheckInterval: 60000, // 1 minuto
  maxResponseTime: 3000,          // 3 segundos (más estricto)
  maxConsecutiveFailures: 2       // 2 fallos (más sensible)
};
```

## 🎯 Casos de Uso

### 1. Verificación Post-Deploy Inmediata
```bash
# Después de hacer deploy a Choreo
npm run monitor:quick

# Resultado esperado: "SUCCESS: Ultra build fix is working correctly!"
```

### 2. Monitoreo de Estabilidad
```bash
# Monitoreo por 30 minutos después del deploy
node scripts/choreo-post-deploy-monitor.js 30

# Resultado: Reporte completo de estabilidad
```

### 3. Debugging de Problemas
```bash
# Si hay problemas, ejecutar monitoreo detallado
npm run monitor:supabase-fix

# Revisar logs específicos
cat logs/supabase-fix-report.txt
```

### 4. Monitoreo Continuo de Producción
```bash
# Setup para monitoreo automático
npm run monitor:setup

# Ejecutar monitoreo programado
./start-monitoring.sh  # Linux/Mac
start-monitoring.bat   # Windows
```

## ✅ Interpretación de Resultados

### 🎉 Éxito Total
```
🎯 FINAL STATUS: SUCCESS
✅ No Supabase configuration errors detected
✅ All critical endpoints responding  
✅ Build verification passed
```

### ⚠️ Atención Requerida
```
🎯 FINAL STATUS: ATTENTION NEEDED
❌ Issues detected with build fix
📋 Review recommendations above
🔧 May need to check deployment configuration
```

### 🚨 Problemas Críticos
```
🚨 [CRITICAL] Health endpoint not responding
⚠️ [HIGH] Supabase configuration errors detected
💡 [MEDIUM] Slow response times detected
```

## 🔄 Flujo de Trabajo Recomendado

### 1. Pre-Deploy
```bash
# Verificar que el build fix funciona localmente
npm run test:ultra-build
npm run choreo:ultra-safe
```

### 2. Post-Deploy Inmediato
```bash
# Verificación rápida (1-2 minutos)
npm run monitor:quick
```

### 3. Monitoreo de Estabilidad
```bash
# Monitoreo extendido (15-30 minutos)
npm run monitor:full
```

### 4. Monitoreo Continuo
```bash
# Setup para monitoreo automático
npm run monitor:setup
```

## 🛠️ Troubleshooting

### Problema: "Request timeout"
**Causa**: Aplicación no responde  
**Solución**: Verificar status en Choreo dashboard

### Problema: "Supabase configuration error detected"
**Causa**: Ultra build fix no funcionando  
**Solución**: Revisar variables de entorno y rebuild

### Problema: "Critical endpoint failing"
**Causa**: Problemas de deployment  
**Solución**: Verificar logs de Choreo y configuración

### Problema: "Slow response times"
**Causa**: Performance issues  
**Solución**: Revisar resource allocation en Choreo

## 📚 Referencias

- [Ultra Build Fix Documentation](./CHOREO_ULTRA_BUILD_FIX_FINAL.md)
- [Choreo Deployment Guide](./choreo.yaml)
- [Testing Framework](./scripts/test-ultra-build-fix.js)
- [Quality Gates](./scripts/github-quality-gate-simple.js)

## 🤝 Contribución

Para mejorar el sistema de monitoreo:

1. **Agregar nuevos endpoints**: Modificar arrays de endpoints en los scripts
2. **Nuevos tipos de alertas**: Extender el sistema de alertas
3. **Integraciones**: Conectar con Slack, email, etc.
4. **Métricas adicionales**: Agregar nuevos tipos de verificaciones

---

**Creado por**: Sistema de Monitoreo LUMO  
**Versión**: 1.0.0  
**Fecha**: 2025-01-15  
**Estado**: ✅ Completamente funcional 