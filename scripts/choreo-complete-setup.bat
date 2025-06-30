@echo off
setlocal enabledelayedexpansion

echo.
echo ═══════════════════════════════════════════════════════════════
echo 🚀 CHOREO COMPLETE SETUP - DESDE CERO
echo ═══════════════════════════════════════════════════════════════
echo.

echo 📋 LUMO Inventory Management System - Configuración Completa
echo 🗓️  Fecha: %date% %time%
echo 📁 Directorio: %cd%
echo.

REM Verificar prerequisitos
echo 🔍 [STEP 1] Verificando prerequisitos...
echo.

node --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Node.js no está instalado o no está en PATH
    echo 💡 Instala Node.js desde: https://nodejs.org/
    pause
    exit /b 1
)

npm --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: npm no está disponible
    pause
    exit /b 1
)

git --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Git no está instalado o no está en PATH
    echo 💡 Instala Git desde: https://git-scm.com/
    pause
    exit /b 1
)

echo ✅ Node.js: 
node --version
echo ✅ npm: 
npm --version
echo ✅ Git: 
git --version
echo.

REM Verificar directorio correcto
echo 🔍 [STEP 2] Verificando directorio del proyecto...
echo.

if not exist "package.json" (
    echo ❌ ERROR: No se encontró package.json
    echo 💡 Asegúrate de estar en el directorio del proyecto LUMO
    pause
    exit /b 1
)

if not exist "src" (
    echo ❌ ERROR: No se encontró directorio src
    echo 💡 Asegúrate de estar en el directorio correcto del proyecto
    pause
    exit /b 1
)

echo ✅ Directorio del proyecto verificado
echo.

REM Limpiar estado anterior
echo 🧹 [STEP 3] Limpiando estado anterior...
echo.

if exist ".next" (
    echo 🗑️  Eliminando directorio .next anterior...
    rmdir /s /q ".next" 2>nul
)

if exist "node_modules" (
    echo 🗑️  Eliminando node_modules anterior...
    rmdir /s /q "node_modules" 2>nul
)

if exist "package-lock.json" (
    echo 🗑️  Eliminando package-lock.json anterior...
    del "package-lock.json" 2>nul
)

echo ✅ Estado anterior limpiado
echo.

REM Verificar/Crear Dockerfile
echo 🐳 [STEP 4] Configurando Dockerfile...
echo.

if not exist "Dockerfile" (
    echo 📝 Creando Dockerfile de producción...
    
    echo # Dockerfile de producción para LUMO > Dockerfile
    echo FROM node:18-alpine AS base >> Dockerfile
    echo. >> Dockerfile
    echo # Instalar dependencias solo cuando sea necesario >> Dockerfile
    echo FROM base AS deps >> Dockerfile
    echo RUN apk add --no-cache libc6-compat >> Dockerfile
    echo WORKDIR /workspace >> Dockerfile
    echo. >> Dockerfile
    echo # Instalar dependencias >> Dockerfile
    echo COPY package.json package-lock.json* ./ >> Dockerfile
    echo RUN npm ci >> Dockerfile
    echo. >> Dockerfile
    echo # Rebuild para producción >> Dockerfile
    echo FROM base AS builder >> Dockerfile
    echo WORKDIR /workspace >> Dockerfile
    echo COPY --from=deps /workspace/node_modules ./node_modules >> Dockerfile
    echo COPY . . >> Dockerfile
    echo. >> Dockerfile
    echo # Configurar variables de entorno para build >> Dockerfile
    echo ENV NODE_ENV=production >> Dockerfile
    echo ENV NEXT_TELEMETRY_DISABLED=1 >> Dockerfile
    echo. >> Dockerfile
    echo # Build de la aplicación >> Dockerfile
    echo RUN npm run build >> Dockerfile
    echo. >> Dockerfile
    echo # Imagen de producción >> Dockerfile
    echo FROM base AS runner >> Dockerfile
    echo WORKDIR /workspace >> Dockerfile
    echo. >> Dockerfile
    echo ENV NODE_ENV=production >> Dockerfile
    echo ENV NEXT_TELEMETRY_DISABLED=1 >> Dockerfile
    echo. >> Dockerfile
    echo RUN addgroup --system --gid 1001 nodejs >> Dockerfile
    echo RUN adduser --system --uid 1001 nextjs >> Dockerfile
    echo. >> Dockerfile
    echo # Copiar archivos públicos >> Dockerfile
    echo COPY --from=builder /workspace/public ./public >> Dockerfile
    echo. >> Dockerfile
    echo # Copiar build standalone >> Dockerfile
    echo COPY --from=builder --chown=nextjs:nodejs /workspace/.next/standalone ./ >> Dockerfile
    echo COPY --from=builder --chown=nextjs:nodejs /workspace/.next/static ./.next/static >> Dockerfile
    echo. >> Dockerfile
    echo # Copiar scripts necesarios >> Dockerfile
    echo COPY --from=builder /workspace/lumo-static-server.js ./ >> Dockerfile
    echo COPY --from=builder /workspace/start.sh ./ >> Dockerfile
    echo. >> Dockerfile
    echo # Hacer ejecutable el script de inicio >> Dockerfile
    echo RUN chmod +x ./start.sh >> Dockerfile
    echo. >> Dockerfile
    echo USER nextjs >> Dockerfile
    echo. >> Dockerfile
    echo EXPOSE 8080 8081 >> Dockerfile
    echo. >> Dockerfile
    echo ENV PORT=8081 >> Dockerfile
    echo. >> Dockerfile
    echo CMD ["./start.sh"] >> Dockerfile
    
    echo ✅ Dockerfile creado
) else (
    echo ✅ Dockerfile ya existe
)
echo.

REM Verificar/Crear start.sh
echo 📜 [STEP 5] Configurando start.sh...
echo.

if not exist "start.sh" (
    echo 📝 Creando script start.sh...
    
    echo #!/bin/bash > start.sh
    echo # start.sh - Script de inicio para LUMO >> start.sh
    echo. >> start.sh
    echo echo "🚀 [LUMO] Starting LUMO Deployment Verification..." >> start.sh
    echo. >> start.sh
    echo # Función para logging >> start.sh
    echo log() { >> start.sh
    echo     echo "🔍 [LUMO] $1" >> start.sh
    echo } >> start.sh
    echo. >> start.sh
    echo # Verificar variables de entorno críticas >> start.sh
    echo log "Checking critical environment variables..." >> start.sh
    echo. >> start.sh
    echo # Verificar Supabase URLs >> start.sh
    echo if [[ -z "$NEXT_PUBLIC_SUPABASE_URL" ]]; then >> start.sh
    echo     log "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL not set" >> start.sh
    echo     exit 1 >> start.sh
    echo fi >> start.sh
    echo. >> start.sh
    echo if [[ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]]; then >> start.sh
    echo     log "❌ ERROR: NEXT_PUBLIC_SUPABASE_ANON_KEY not set" >> start.sh
    echo     exit 1 >> start.sh
    echo fi >> start.sh
    echo. >> start.sh
    echo if [[ -z "$JWT_SECRET" ]]; then >> start.sh
    echo     log "❌ ERROR: JWT_SECRET not set" >> start.sh
    echo     exit 1 >> start.sh
    echo fi >> start.sh
    echo. >> start.sh
    echo # Validar que no sean placeholders >> start.sh
    echo if [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"your-project"* ]] ^|^| [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"placeholder"* ]]; then >> start.sh
    echo     log "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL contains placeholder values" >> start.sh
    echo     exit 1 >> start.sh
    echo fi >> start.sh
    echo. >> start.sh
    echo log "✅ All environment variables validated successfully" >> start.sh
    echo log "🚀 Starting LUMO with static assets on port 8080" >> start.sh
    echo log "🚀 Starting standalone server on port 8081..." >> start.sh
    echo. >> start.sh
    echo # Ejecutar el servidor >> start.sh
    echo exec node lumo-static-server.js >> start.sh
    
    echo ✅ start.sh creado
) else (
    echo ✅ start.sh ya existe
)
echo.

REM Instalar dependencias
echo 📦 [STEP 6] Instalando dependencias...
echo.

echo 🔄 Ejecutando npm ci...
npm ci
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Falló la instalación de dependencias
    pause
    exit /b 1
)

echo ✅ Dependencias instaladas correctamente
echo.

REM Build de verificación
echo 🔨 [STEP 7] Ejecutando build de verificación...
echo.

echo 🔄 Ejecutando npm run build...
npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ❌ ERROR: Falló el build de la aplicación
    echo 💡 Revisa los errores de TypeScript o dependencias
    pause
    exit /b 1
)

echo ✅ Build completado exitosamente
echo.

REM Verificar archivos generados
echo 🔍 [STEP 8] Verificando archivos generados...
echo.

if not exist ".next" (
    echo ❌ ERROR: No se generó el directorio .next
    pause
    exit /b 1
)

if not exist ".next\standalone" (
    echo ❌ ERROR: No se generó el build standalone
    pause
    exit /b 1
)

if not exist ".next\standalone\server.js" (
    echo ❌ ERROR: No se generó server.js
    pause
    exit /b 1
)

echo ✅ Archivos de build verificados
echo.

REM Mostrar configuración de secrets
echo 🔑 [STEP 9] Configuración de Secrets para Choreo Console
echo.

echo ⚠️  IMPORTANTE: Copia estos valores EXACTOS en Choreo Console:
echo.
echo 🔗 NEXT_PUBLIC_SUPABASE_URL:
echo https://ubjujxtvlubxowsphvuk.supabase.co
echo.
echo 🔑 NEXT_PUBLIC_SUPABASE_ANON_KEY:
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4
echo.
echo 🔐 JWT_SECRET:
echo pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg==
echo.
echo 🗄️  DATABASE_URL:
echo postgresql://postgres.ubjujxtvlubxowsphvuk:Theale05042013$$@aws-0-us-east-1.pooler.supabase.com:6543/postgres
echo.
echo 🌐 NEXTAUTH_URL:
echo https://lumo-1615540597.choreoapis.dev
echo.

REM Crear archivo de configuración
echo 📝 Creando archivo de configuración completa...
echo.

echo # CHOREO SECRETS CONFIGURATION > CHOREO_SECRETS_CONFIG.txt
echo # Fecha: %date% %time% >> CHOREO_SECRETS_CONFIG.txt
echo # =============================================== >> CHOREO_SECRETS_CONFIG.txt
echo. >> CHOREO_SECRETS_CONFIG.txt
echo NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co >> CHOREO_SECRETS_CONFIG.txt
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4 >> CHOREO_SECRETS_CONFIG.txt
echo SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co >> CHOREO_SECRETS_CONFIG.txt
echo SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTUxMjM4NCwiZXhwIjoyMDY1MDg4Mzg0fQ.dBKGr8BqLGDSGAkCHnHI8FJQb-tTOaQ3gLHo_8rl4Eo >> CHOREO_SECRETS_CONFIG.txt
echo JWT_SECRET=pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg== >> CHOREO_SECRETS_CONFIG.txt
echo NEXTAUTH_SECRET=pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM5qKb+6JDr2hFbxMIHBPEbqju0Xdjbh2Nhlndvvv8AAg== >> CHOREO_SECRETS_CONFIG.txt
echo DATABASE_URL=postgresql://postgres.ubjujxtvlubxowsphvuk:Theale05042013$$@aws-0-us-east-1.pooler.supabase.com:6543/postgres >> CHOREO_SECRETS_CONFIG.txt
echo NEXTAUTH_URL=https://lumo-1615540597.choreoapis.dev >> CHOREO_SECRETS_CONFIG.txt

echo ✅ Configuración guardada en: CHOREO_SECRETS_CONFIG.txt
echo.

REM Verificar Git status
echo 📋 [STEP 10] Verificando estado de Git...
echo.

git status
echo.

echo 🎯 [STEP 11] Próximos pasos:
echo.
echo 1. 🌐 Ve a Choreo Console: https://console.choreo.dev/
echo 2. 🔧 Busca tu proyecto "LUMO"
echo 3. ⚙️  Ve a Settings → Environment Variables
echo 4. 🗑️  Elimina TODAS las variables existentes
echo 5. ➕ Agrega cada secret con los valores del archivo CHOREO_SECRETS_CONFIG.txt
echo 6. 💾 Guarda cada variable
echo 7. 🚀 Haz Deploy desde Choreo Console
echo.

echo ═══════════════════════════════════════════════════════════════
echo ✅ SETUP COMPLETO - LISTO PARA DESPLIEGUE
echo ═══════════════════════════════════════════════════════════════
echo.

echo 📁 Archivos creados/verificados:
echo   ✅ Dockerfile
echo   ✅ start.sh  
echo   ✅ .next/standalone/ (build completo)
echo   ✅ CHOREO_SECRETS_CONFIG.txt
echo.

echo 🔑 Configuración de secrets lista en: CHOREO_SECRETS_CONFIG.txt
echo 📖 Guía completa disponible en: CHOREO_DEPLOYMENT_COMPLETE_GUIDE.md
echo.

pause 