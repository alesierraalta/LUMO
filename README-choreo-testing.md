# 🚀 Sistema de Testing Local para Choreo

## Problema Resuelto

¿Cansado de perder 10-15 minutos cada vez que un deployment falla en Choreo? Este sistema te permite **validar tu deployment localmente en 2-3 minutos** antes de subirlo.

## ⚡ Uso Rápido

### 🚀 Primera vez? (Configuración en 30 segundos)
```bash
# 1. Genera JWT_SECRET automáticamente
node scripts/generate-jwt-secret.js

# 2. Ejecuta el test
scripts\quick-choreo-test.bat
```

### Opción 1: Script de Windows (Más Fácil)
```bash
# Desde la raíz del proyecto LUMO
scripts\quick-choreo-test.bat
```

### Opción 2: Comando Node.js
```bash
# Test rápido (2-3 minutos)
node scripts/test-choreo-local.js --mode=quick

# Test completo con Docker (5-8 minutos)
node scripts/test-choreo-local.js --mode=full
```

## 🛠️ Qué Valida el Sistema

### Test Rápido (2-3 minutos)
- ✅ Variables de entorno requeridas
- ✅ Build de producción (`next build`)
- ✅ Servidor standalone funcional
- ✅ Configuración de Choreo válida
- ✅ Dependencias correctas
- ✅ Health endpoints

### Test Completo (5-8 minutos)
- ✅ Todo lo del test rápido
- ✅ Build de Docker
- ✅ Test de contenedor
- ✅ Validación de puertos
- ✅ Test de memoria y rendimiento

## 📋 Configuración Inicial

### 1. Variables de Entorno
Crea un archivo `.env.local` con las variables necesarias:

```env
# Supabase (Requerido)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Base de datos (Requerido)
DATABASE_URL=your_database_url

# Opcional
NEXT_PUBLIC_APP_ENV=development
```

### 2. Instalación de Dependencias
```bash
npm install
```

## 🎯 Casos de Uso

### Antes de cada Deployment
```bash
# Ejecuta esto antes de hacer push a Choreo
scripts\quick-choreo-test.bat
```

### Debugging de Problemas
```bash
# Si el test rápido falla, usa el completo para más detalles
node scripts/test-choreo-local.js --mode=full --verbose
```

### Integración en CI/CD
```bash
# En tu pipeline
node scripts/test-choreo-local.js --mode=quick --ci
```

## 📊 Interpretación de Resultados

### ✅ Test Exitoso
```
✅ ¡TEST EXITOSO! Tu deployment debería funcionar en Choreo.
💡 Puedes proceder con el deployment.
```
**Acción**: Procede con confianza al deployment en Choreo.

### ❌ Test Fallido
```
❌ TEST FALLÓ. Revisa los errores antes de hacer deployment.
💡 Esto te ahorra 10-15 minutos de deployment fallido.
```
**Acción**: Revisa los errores mostrados y corrígelos antes del deployment.

## 🔧 Solución de Problemas Comunes

### Error: Variables de entorno faltantes
```bash
❌ Variable JWT_SECRET no encontrada
❌ Variable SUPABASE_SERVICE_ROLE_KEY no encontrada
```
**Solución Rápida**: Ejecuta el generador automático:
```bash
node scripts/generate-jwt-secret.js
```
Esto creará o actualizará tu `.env.local` con un JWT_SECRET seguro.

**Solución Manual**: Agrega las variables a tu `.env.local`:
```env
JWT_SECRET=tu_jwt_secret_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

### Error: Build falla
```bash
❌ Production Build: Build failed: Command failed: rm -rf .next
'rm' is not recognized as an internal or external command
```
**Solución**: Este error ya está corregido en la nueva versión del script. El sistema ahora usa comandos compatibles con Windows.

### Error: Build de producción general
```bash
❌ Build de producción falló
```
**Solución**: Ejecuta `npm run build` manualmente para ver errores detallados

### Error: Puerto en uso
```bash
❌ Puerto 3000 ya está en uso
```
**Solución**: Cierra otros procesos de Node.js o cambia el puerto

### Error: Docker no disponible
```bash
⚠️ Docker no disponible, saltando tests de contenedor
```
**Solución**: Instala Docker Desktop o usa solo el modo `quick`

## 📈 Beneficios

- 🕐 **Ahorra tiempo**: 2-3 minutos vs 10-15 minutos de deployment fallido
- 🎯 **Mayor confianza**: Sabes que funcionará antes de deployar
- 🔍 **Debugging local**: Errores más fáciles de debuggear localmente
- 🚀 **Productividad**: Menos interrupciones en tu flujo de trabajo

## 🔄 Integración con el Workflow

### Workflow Recomendado
1. **Desarrolla** tu feature
2. **Testa localmente** con `npm run dev`
3. **Valida deployment** con `scripts\quick-choreo-test.bat`
4. **Si pasa**, haz commit y push
5. **Deploya en Choreo** con confianza

### Comandos Útiles
```bash
# Desarrollo normal
npm run dev

# Test antes de deployment
scripts\quick-choreo-test.bat

# Si necesitas más detalles
node scripts/test-choreo-local.js --mode=full

# Build manual para debugging
npm run build
npm start
```

## 🎛️ Opciones Avanzadas

### Flags Disponibles
- `--mode=quick`: Test rápido (default)
- `--mode=full`: Test completo con Docker
- `--verbose`: Output detallado
- `--ci`: Modo para CI/CD (sin colores)
- `--port=3001`: Puerto personalizado

### Ejemplos
```bash
# Test completo con output detallado
node scripts/test-choreo-local.js --mode=full --verbose

# Test para CI/CD
node scripts/test-choreo-local.js --mode=quick --ci

# Test en puerto personalizado
node scripts/test-choreo-local.js --port=3001
```

## 📝 Logs y Debugging

Los logs se guardan automáticamente en:
- `logs/choreo-test-latest.log`: Último test ejecutado
- `logs/choreo-test-[timestamp].log`: Logs históricos

### Ver logs en tiempo real
```bash
# Windows
tail -f logs/choreo-test-latest.log

# O simplemente abre el archivo en tu editor
```

## 🤝 Contribuir

Si encuentras problemas o tienes sugerencias:
1. Revisa los logs en `logs/choreo-test-latest.log`
2. Reporta el issue con el log completo
3. Incluye tu configuración de entorno (sin credenciales)

## 📚 Referencias

- [Documentación de Choreo](https://wso2.com/choreo/docs/)
- [Next.js Production Builds](https://nextjs.org/docs/deployment)
- [Docker para Next.js](https://nextjs.org/docs/deployment/docker)

---

**💡 Tip**: Ejecuta `scripts\quick-choreo-test.bat` antes de cada deployment para ahorrar tiempo y frustración. 