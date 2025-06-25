# 🧪 Testing Choreo Builds - LUMO

## 🎯 **¿POR QUÉ TESTEAR?**

Testear tus builds antes de subirlos a Choreo te permite:

- ✅ **Detectar problemas temprano** - Evita fallos en Choreo
- ✅ **Ahorrar tiempo** - No esperar 10+ minutos por cada deploy fallido  
- ✅ **Sin Docker local** - Usa GitHub Actions en la nube
- ✅ **Verificar BUILD_ID** - Asegurar que el standalone build funciona
- ✅ **Probar startup** - Verificar tiempos de arranque

## 📋 **RESUMEN DE TESTING ACTUALIZADO**

Se ha implementado un sistema de testing híbrido que separa tests unitarios (con mocks) de tests de integración (con DB real):

### **✅ PROBLEMAS RESUELTOS:**
- ❌ **Dependencia faltante**: Agregado `@testing-library/dom`
- ❌ **Supabase en CI**: Sistema de mocks completo implementado
- ❌ **Tests de integración en GitHub**: Separados de tests unitarios
- ❌ **Configuración Jest**: Mejorada para entorno CI

---

## 🎯 **ESTRATEGIAS DE TESTING**

### **1. 🤖 GitHub Actions (CI/CD)**
**Para testing automatizado sin Docker local**

```bash
# Tests que se ejecutan en GitHub Actions
npm run test:unit:ci        # Tests unitarios con mocks
npm run test:e2e           # Tests End-to-End
npm run test:performance   # Tests de rendimiento
```

**✅ Ventajas:**
- No requiere Docker local
- Tests unitarios con mocks completos
- Validación de build y sintaxis
- Gratuito para repositorios públicos

**❌ Limitaciones:**
- No tests de integración con DB real
- Entorno simulado, no idéntico a producción

### **2. 🏠 Testing Local**
**Para testing completo con base de datos real**

```bash
# Ejecutar script interactivo
scripts/run-tests-local.bat

# O manualmente:
npm run test:unit:ci           # Tests unitarios (mocks)
npm run test:integration:local # Tests integración (DB real)
npm run test:e2e              # Tests End-to-End
```

**✅ Ventajas:**
- Tests de integración con Supabase real
- Validación completa de funcionalidad
- Debugging más fácil

**❌ Limitaciones:**
- Requiere configuración de DB
- Variables de entorno Supabase necesarias

---

## 🔧 **CONFIGURACIÓN ACTUALIZADA**

### **Scripts de Package.json:**
```json
{
  "test:unit:ci": "jest --testPathIgnorePatterns=integration --testPathIgnorePatterns=e2e --verbose",
  "test:integration:local": "jest --config jest.config.integration.js --runInBand --detectOpenHandles",
  "test:unit": "jest",
  "test:integration": "jest --config jest.config.integration.js --runInBand"
}
```

### **Mocks Implementados:**
- **Supabase Client**: Mock completo con todas las operaciones CRUD
- **Next.js Router**: Navegación simulada
- **Fetch API**: Respuestas HTTP simuladas
- **Storage APIs**: localStorage y sessionStorage

---

## 🚀 **WORKFLOWS DE GITHUB ACTIONS**

### **Workflow Principal: `.github/workflows/tests.yml`**
```yaml
- name: 🧪 Run Unit Tests (CI Mode)
  run: npm run test:unit:ci
  
- name: 🧪 Run Integration Tests  
  run: npm run test:integration -- --runInBand --maxWorkers=1
  
- name: 🧪 Run E2E Tests
  run: npm run test:e2e
```

### **Configuración de Secretos GitHub:**
```
JWT_SECRET=tu-jwt-secret-32-chars
SUPABASE_URL_DEV=https://ndprriqyhddjoixrlqnz.supabase.co
SUPABASE_KEY_DEV=tu-key-dev
SUPABASE_URL_PROD=https://ubjujxtvlubxowsphvuk.supabase.co
SUPABASE_KEY_PROD=tu-key-prod
```

---

## 📊 **RESULTADOS ESPERADOS**

### **GitHub Actions (CI):**
```
✅ Unit Tests: ~50-100 tests passing (mocked)
✅ Build Validation: Syntax and imports
✅ E2E Tests: User flows simulation
⏭️ Integration Tests: Skipped (no real DB)
```

### **Local Testing:**
```
✅ Unit Tests: ~50-100 tests passing (mocked)
✅ Integration Tests: ~20-50 tests (real DB)
✅ E2E Tests: Full user flows
✅ Build Validation: Complete
```

---

## 🎯 **COMANDOS RÁPIDOS**

### **Para desarrollo diario:**
```bash
# Tests rápidos (solo unitarios)
npm run test:unit:ci

# Tests completos locales
scripts/run-tests-local.bat

# Tests específicos
npm test -- --testNamePattern="Categories"
```

### **Para CI/CD:**
```bash
# GitHub Actions ejecuta automáticamente:
# - En cada push a main/develop
# - En cada Pull Request
# - Manualmente desde Actions tab
```

---

## 🔍 **DEBUGGING DE TESTS**

### **Tests Unitarios Fallando:**
```bash
# Ejecutar con más detalle
npm run test:unit:ci -- --verbose --no-cache

# Test específico
npm test -- --testNamePattern="specific test name"
```

### **Tests de Integración Fallando:**
```bash
# Verificar conexión DB
node -e "console.log(process.env.NEXT_PUBLIC_SUPABASE_URL)"

# Ejecutar con debugging
npm run test:integration:local -- --detectOpenHandles --verbose
```

---

## 📈 **MÉTRICAS DE ÉXITO**

### **GitHub Actions:**
- ✅ **Build Success Rate**: >95%
- ✅ **Unit Test Pass Rate**: >98%
- ✅ **E2E Test Pass Rate**: >90%
- ✅ **Build Time**: <10 minutos

### **Local Testing:**
- ✅ **Full Test Pass Rate**: >95%
- ✅ **Integration Test Pass Rate**: >90%
- ✅ **Code Coverage**: >80%

---

## 🎉 **BENEFICIOS DEL NUEVO SISTEMA**

1. **🚀 Velocidad**: Tests unitarios rápidos en CI
2. **🔒 Confiabilidad**: Mocks estables y predecibles
3. **💰 Costo**: Sin necesidad de Docker o DB en CI
4. **🔧 Flexibilidad**: Tests locales con DB real cuando se necesite
5. **📊 Visibilidad**: Reportes detallados en GitHub Actions

---

## 📞 **SOPORTE**

Si encuentras problemas:

1. **Tests unitarios fallando**: Revisar mocks en `jest.setup.js`
2. **Tests integración fallando**: Verificar variables Supabase
3. **GitHub Actions fallando**: Revisar secrets y workflows
4. **Build errors**: Ejecutar `npm run test:clear-cache`

**🎯 Próximos pasos sugeridos:**
1. Ejecutar `npm install` para instalar nueva dependencia
2. Probar `npm run test:unit:ci` localmente
3. Commitear cambios y ver GitHub Actions
4. Usar `scripts/run-tests-local.bat` para tests completos

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