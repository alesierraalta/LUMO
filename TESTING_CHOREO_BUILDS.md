# 🧪 TESTING CHOREO BUILDS

## 🎯 **¿POR QUÉ TESTEAR?**

Testear tus builds antes de subirlos a Choreo te permite:

- ✅ **Detectar problemas temprano** - Evita fallos en Choreo
- ✅ **Ahorrar tiempo** - No esperar 10+ minutos por cada deploy fallido  
- ✅ **Sin Docker local** - Usa GitHub Actions en la nube
- ✅ **Verificar BUILD_ID** - Asegurar que el standalone build funciona
- ✅ **Probar startup** - Verificar tiempos de arranque

## 🚀 **OPCIONES DE TESTING**

### **1. 🌟 GitHub Actions (RECOMENDADO - Sin Docker)**

Perfecto para usuarios sin Docker local. Usa la infraestructura de GitHub.

#### **🏃‍♂️ Test Rápido (2-3 minutos)**
Se ejecuta automáticamente en cada push/PR:
- ✅ Validación de estructura de archivos
- ✅ Verificación de sintaxis JSON
- ✅ Detección de conflictos de merge
- ✅ Verificación de build
- ✅ Validación de dependencias

#### **🔬 Test Completo (5-10 minutos)**
Ejecutar manualmente para validación completa:

1. **Ir a GitHub Actions**:
   - Visita tu repositorio en GitHub
   - Haz clic en "Actions"
   - Selecciona "Test Choreo Build"

2. **Ejecutar Workflow**:
   - Haz clic en "Run workflow"
   - Elige tipo: `quick`, `full`, o `production`
   - Haz clic en "Run workflow"

3. **Monitorear Resultados**:
   - Ve logs en tiempo real
   - Descarga reportes de artifacts
   - Revisa puntuación de confianza

#### **Configurar Secrets en GitHub**

Para testing completo, agrega estos secrets en GitHub Settings > Secrets:

```
NEXT_PUBLIC_SUPABASE_URL=tu_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
DATABASE_URL=tu_database_url
JWT_SECRET=tu_jwt_secret_32_chars_minimum
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key
```

### **2. 🐳 Testing Local con Docker**

Para usuarios con Docker Desktop instalado:

#### **Test Rápido (2-3 minutos)**
```bash
# Windows
scripts\quick-build-test.bat

# Manual
node scripts/github-test-choreo.js
```

#### **Test Completo (5-10 minutos)**
```bash
# Windows  
scripts\test-choreo-build.bat

# Manual
node scripts/test-choreo-build.js --full
```

## 📋 **QUÉ SE TESTEA**

### **GitHub Actions Testing**
- ✅ **Estructura de Archivos**: Todos los archivos requeridos presentes
- ✅ **Validación de Sintaxis**: JSON/YAML correcto
- ✅ **Conflictos de Merge**: Sin marcadores de conflicto
- ✅ **Build Docker**: Imagen se construye exitosamente
- ✅ **Test de Container**: Inicia y responde a health checks
- ✅ **BUILD_ID**: Detección de standalone server
- ✅ **Performance**: Validación de tiempo de respuesta
- ✅ **Environment**: Configuración de variables

### **Testing Local Docker**
- ✅ **Sistema de Build**: Build de Next.js se completa
- ✅ **Salida Standalone**: Server.js generado
- ✅ **Startup Container**: Container Docker ejecuta
- ✅ **Health Checks**: Endpoints API responden
- ✅ **Uso de Memoria**: Dentro de límites esperados

## 🎯 **CRITERIOS DE ÉXITO**

Tu build está listo para Choreo cuando:

- ✅ **90%+ tasa de éxito en tests**
- ✅ **Container inicia en <10 segundos**
- ✅ **Health endpoint responde en <2 segundos**
- ✅ **Sin errores críticos en logs**
- ✅ **BUILD_ID detectado correctamente**
- ✅ **Standalone server ejecutando**

## 📊 **RESULTADOS DE GITHUB ACTIONS**

### **Alta Confianza (90%+)**
```
🎉 HIGH CONFIDENCE - Listo para deployment en Choreo!

✅ Docker build successful
✅ Container startup successful  
✅ Health endpoint responding
✅ BUILD_ID validation passed
✅ Standalone server detected
```

### **Necesita Atención (<90%)**
```
⚠️ NEEDS ATTENTION - Arreglar errores antes de deploy

❌ BUILD_ID missing after build
❌ Container failed to start
⚠️ Health check timeout
```

## 🛠️ **PROBLEMAS COMUNES Y SOLUCIONES**

### **BUILD_ID Faltante**
```bash
# Problema: "Could not find a production build"
# GitHub Actions mostrará: ❌ BUILD_ID not found
# Solución: Verificar next.config.js standalone output
```

### **Container No Inicia**
```bash
# Problema: Container se cierra inmediatamente
# GitHub Actions mostrará: ❌ Container failed to start
# Solución: Verificar Dockerfile WORKDIR /workspace
```

### **Conflictos de Merge**
```bash
# Problema: Errores de parsing JSON
# GitHub Actions mostrará: ❌ Merge conflict markers found
# Solución: Resolver conflictos en package.json, Dockerfile
```

## 🔍 **TESTING DE ENTORNOS**

Testear diferentes entornos en GitHub Actions:

```yaml
# En workflow_dispatch inputs
test_type:
  - quick      # Validación básica
  - full       # Testing completo Docker
  - production # Testing de performance
```

## 📈 **BENCHMARKS DE PERFORMANCE**

Performance esperada (GitHub Actions):

| Métrica | Target | Actual |
|---------|--------|--------|
| Tiempo Build | <5 minutos | ~3 minutos |
| Container Start | <30 segundos | ~15 segundos |
| Health Response | <5 segundos | ~2 segundos |
| Tiempo Total Test | <10 minutos | ~7 minutos |

## 🔧 **TROUBLESHOOTING**

### **Debugging GitHub Actions**

1. **Revisar Logs de Workflow**:
   - Ve a tab Actions
   - Haz clic en run fallido
   - Expande steps fallidos
   - Revisa logs detallados

2. **Descargar Artifacts**:
   - Ve al final del workflow run
   - Descarga reportes de test
   - Revisa análisis detallado

3. **Re-ejecutar con Debug**:
   - Usa "Re-run jobs" con debug logging
   - Revisa container logs en output

### **Debugging Local Docker**
```bash
# Habilitar logging detallado
DEBUG=1 node scripts/test-choreo-build.js

# Revisar logs de container
docker logs lumo-test

# Reset todo
docker system prune -a
rm -rf .next node_modules
npm install
```

## 🎯 **FLUJO DE TRABAJO RECOMENDADO**

### **1. Validación Rápida (Cada Push)**
- GitHub Actions ejecuta automáticamente
- Detecta problemas básicos inmediatamente
- Loop de feedback de 2-3 minutos

### **2. Testing Completo (Antes de Deployment)**
- Ejecutar "Test Choreo Build" workflow manualmente
- Simulación completa Docker
- Check comprensivo de 5-10 minutos

### **3. Deploy con Confianza**
- Solo hacer deploy cuando tests muestren 90%+ éxito
- Monitorear logs de Choreo para problemas runtime
- Esperar startup rápido (2-3 segundos vs 40+ segundos)

## 📋 **PRÓXIMOS PASOS**

### **Para Usuarios Sin Docker:**
1. **Configurar GitHub Secrets** (variables de entorno)
2. **Push cambios** para activar test rápido
3. **Ejecutar workflow completo** manualmente antes de deployment
4. **Deploy a Choreo** cuando confianza es HIGH

### **Para Usuarios Con Docker:**
1. **Ejecutar test rápido**: `scripts\quick-build-test.bat`
2. **Arreglar problemas** de test output
3. **Ejecutar test completo**: `scripts\test-choreo-build.bat`
4. **Deploy con confianza** cuando todos los tests pasen

## 🆘 **SOPORTE**

Si encuentras problemas:

1. **Revisar logs de GitHub Actions** para mensajes de error detallados
2. **Revisar reportes de test** descargados de artifacts
3. **Asegurar secrets configurados** en repositorio GitHub
4. **Verificar estructura de archivos** coincide con requerimientos
5. **Testear localmente** si tienes Docker disponible

**Recuerda**: Éxito en GitHub Actions testing = Éxito en deployment Choreo! 🚀

## 🌟 **BENEFICIOS DE GITHUB ACTIONS TESTING**

- ✅ **Sin Docker local requerido**
- ✅ **Gratis para repositorios públicos**
- ✅ **Entorno cloud consistente**
- ✅ **Reportes de test detallados**
- ✅ **Automático en cada push**
- ✅ **Mismo entorno que Choreo**
- ✅ **Fácil compartir resultados**

## 🚀 **COMANDOS RÁPIDOS**

```bash
# Para testing local rápido
npm run test:choreo:quick

# Para testing local completo  
npm run test:choreo:full

# Para build + test
npm run test:build

# Para validación standalone
node scripts/github-test-choreo.js
``` 