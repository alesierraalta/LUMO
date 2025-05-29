# 🔍 Guía Completa de Acceso a Debug Detallado

## 📋 **Opciones de Debug Disponibles**

### 1. **Interfaz Web de Debug** ⭐ (RECOMENDADO)
```
🌐 https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/debug
```

**Características:**
- ✅ Interfaz visual completa y organizada
- ✅ Información en tiempo real con botón de actualizar
- ✅ Tabs organizadas por categoría (Clerk/SSL, Entorno, Base de datos, etc.)
- ✅ Resumen de salud del sistema con recomendaciones
- ✅ Acciones rápidas para acceder a endpoints específicos

---

### 2. **Endpoints de API para Debug JSON**

#### **🔧 Debug Completo del Sistema**
```bash
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug"
```

**Información incluida:**
- Environment (sistema, variables de entorno, proceso)
- Clerk (configuración, SSL fix, URLs)
- Database (estado, latencia, conexión)
- Logging (salud del logger, configuración)
- Choreo (detección, deployment info, SSL)
- Connectivity (pruebas de URLs críticas)
- Performance (métricas de tiempo de respuesta)
- Health Summary (resumen general con problemas y recomendaciones)

#### **🔐 Debug Específico de Clerk/SSL**
```bash
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/clerk-debug"
```

**Información incluida:**
- Configuración de Clerk
- Estado del SSL fix
- URLs problemáticas vs. corregidas
- Pruebas de conectividad
- Configuración específica de Choreo

#### **🏥 Salud Avanzada del Sistema**
```bash
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/health-advanced"
```

**Información incluida:**
- Logger health check
- Database health check
- Authentication health check
- System metrics (memoria, CPU)
- Dependencies check
- Choreo-specific health

#### **📊 Salud Simple**
```bash
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/health"
```

---

### 3. **Endpoints de Logs**

#### **📝 Logs del Sistema con Filtros**
```bash
# Todos los logs (últimos 50)
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug/logs"

# Solo errores
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug/logs?level=error"

# Buscar logs relacionados con SSL
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug/logs?search=ssl"

# Logs por correlation ID específico
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug/logs?correlationId=debug-"

# Combinar filtros (últimos 10 warnings con "clerk")
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug/logs?level=warn&search=clerk&limit=10"
```

**Opciones de filtro:**
- `level`: all, trace, debug, info, warn, error, fatal
- `search`: buscar en mensaje y correlation ID
- `correlationId`: filtrar por ID específico
- `limit`: número máximo de resultados (default: 50)

---

## 🚀 **Métodos de Acceso**

### **Desde el Navegador** (Más Fácil)
1. Abrir: https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/debug
2. Ver toda la información organizada en tabs
3. Usar botón "Actualizar" para información en tiempo real
4. Usar "Acciones Rápidas" para abrir endpoints específicos

### **Desde PowerShell/Terminal**
```powershell
# PowerShell en Windows
Invoke-RestMethod -Uri "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug" | ConvertTo-Json -Depth 10

# Con formato legible
(Invoke-RestMethod -Uri "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug") | ConvertTo-Json -Depth 10 | Out-File debug-output.json
```

```bash
# En Linux/macOS con curl y jq
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug" | jq '.'

# Guardar en archivo
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug" | jq '.' > debug-output.json
```

### **Desde Herramientas de Desarrollo del Navegador**
```javascript
// En la consola del navegador
fetch('/api/debug')
  .then(response => response.json())
  .then(data => {
    console.log('🔍 Debug Info:', data);
    console.log('📊 Health Summary:', data.healthSummary);
    console.log('🔐 Clerk Status:', data.clerk);
    console.log('💾 Database Status:', data.database);
  });
```

---

## 📋 **Checklist de Debug para Problema SSL/Clerk**

### **Información Crítica a Verificar:**

#### ✅ **Clerk Configuration**
- [ ] `clerk.publishableKey.exists`: debe ser `true`
- [ ] `clerk.publishableKey.isProduction`: debe ser `true` para producción
- [ ] `clerk.sslFix.active`: debe ser `true` en Choreo
- [ ] `clerk.sslFix.detectedChoreo`: debe ser `true`

#### ✅ **SSL Fix Status**
- [ ] `choreo.detected`: debe ser `true`
- [ ] `choreo.ssl.status`: debe ser "Fixed via ClerkSSLFix component"
- [ ] `connectivity["https://js.clerk.com/v1/clerk.js"].accessible`: debe ser `true`

#### ✅ **Environment**
- [ ] `environment.isChoreoDeployment`: debe ser `true`
- [ ] `environment.envVars.hasClerkPublishable`: debe ser `true`
- [ ] `environment.envVars.hasClerkSecret`: debe ser `true`

#### ✅ **Health Summary**
- [ ] `healthSummary.overall`: debe ser "healthy" o "degraded" (no "unhealthy")
- [ ] `healthSummary.issues`: revisar lista de problemas
- [ ] `healthSummary.recommendations`: seguir recomendaciones

---

## 🔧 **Comandos de Debug Específicos**

### **Verificar SSL Fix está funcionando:**
```bash
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/clerk-debug" | grep -E "(sslFix|connectivity)"
```

### **Obtener solo el resumen de salud:**
```bash
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug" | jq '.healthSummary'
```

### **Verificar configuración de Clerk:**
```bash
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug" | jq '.clerk'
```

### **Verificar conectividad:**
```bash
curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug" | jq '.connectivity'
```

---

## 📱 **Monitoreo en Tiempo Real**

### **Script de Monitoreo Continuo**
```bash
# Bash/Linux/macOS
while true; do
  echo "$(date): Checking system health..."
  curl -s "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug" | jq '.healthSummary.overall'
  sleep 30
done
```

```powershell
# PowerShell
while ($true) {
  Write-Host "$(Get-Date): Checking system health..."
  $health = (Invoke-RestMethod -Uri "https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/debug").healthSummary.overall
  Write-Host "Status: $health"
  Start-Sleep -Seconds 30
}
```

---

## 🆘 **Troubleshooting Rápido**

### **Si la página de debug no carga:**
1. Verificar: https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/api/health
2. Si el API responde, el problema es en el frontend
3. Si no responde, hay un problema de deployment

### **Si necesitas información específica:**
- **Solo SSL/Clerk**: `/api/clerk-debug`
- **Solo salud del sistema**: `/api/health-advanced`
- **Solo logs de errores**: `/api/debug/logs?level=error`
- **Solo connectivity**: `/api/debug` y buscar sección `connectivity`

### **Para reportar problemas:**
1. Ir a: https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/debug
2. Copiar correlation ID del resumen
3. Incluir información de `healthSummary.issues` y `healthSummary.recommendations` 