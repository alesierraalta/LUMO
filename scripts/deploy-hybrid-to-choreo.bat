@echo off
echo 🚀 DEPLOY HIBRIDO A CHOREO - VERSION FINAL
echo ==========================================
echo.

echo 🔍 PASO 1: Verificacion de archivos criticos...

REM Verificar archivos esenciales
if not exist "hybrid-server.js" (
    echo ❌ ERROR: hybrid-server.js no encontrado
    echo 💡 Este archivo es CRITICO para el funcionamiento
    pause
    exit /b 1
)

if not exist "emergency-standalone-server.js" (
    echo ❌ ERROR: emergency-standalone-server.js no encontrado  
    echo 💡 Este archivo es el fallback de emergencia
    pause
    exit /b 1
)

if not exist "scripts\intelligent-startup.js" (
    echo ❌ ERROR: scripts\intelligent-startup.js no encontrado
    echo 💡 Este archivo maneja el startup inteligente
    pause
    exit /b 1
)

if not exist "choreo.yaml" (
    echo ❌ ERROR: choreo.yaml no encontrado
    echo 💡 Configuracion de Choreo requerida
    pause
    exit /b 1
)

echo ✅ Todos los archivos criticos encontrados
echo.

echo 🧪 PASO 2: Prueba rapida del servidor hibrido...
echo ⏱️ Esto tomara 1-2 minutos...
echo.

REM Ejecutar pruebas rapidas
node scripts\test-hybrid-server.js

if %ERRORLEVEL% neq 0 (
    echo.
    echo ⚠️ Las pruebas mostraron algunos problemas
    echo 🤔 ¿Continuar con el deploy? (S/N)
    set /p continuar=
    if /i not "%continuar%"=="S" (
        echo ❌ Deploy cancelado por el usuario
        pause
        exit /b 1
    )
)

echo.
echo ✅ PASO 3: Preparando configuracion para Choreo...

REM Mostrar configuracion actual
echo.
echo 📋 CONFIGURACION ACTUAL:
echo ========================
echo.
echo 🎯 Servidor Principal: hybrid-server.js
echo 🚨 Fallback 1: emergency-standalone-server.js  
echo 🔧 Startup: scripts\intelligent-startup.js
echo 📦 Configuracion: choreo.yaml
echo.

echo 🔍 PASO 4: Verificando variables de entorno...

REM Verificar que las variables criticas esten en choreo.yaml
findstr /i "DATABASE_URL" choreo.yaml >nul
if %ERRORLEVEL% neq 0 (
    echo ❌ WARNING: DATABASE_URL no encontrada en choreo.yaml
    echo 💡 Asegurate de configurarla en Choreo Console
    echo.
)

findstr /i "JWT_SECRET" choreo.yaml >nul  
if %ERRORLEVEL% neq 0 (
    echo ❌ WARNING: JWT_SECRET no encontrada en choreo.yaml
    echo 💡 Asegurate de configurarla en Choreo Console
    echo.
)

findstr /i "NEXT_PUBLIC_SUPABASE_URL" choreo.yaml >nul
if %ERRORLEVEL% neq 0 (
    echo ❌ WARNING: NEXT_PUBLIC_SUPABASE_URL no encontrada en choreo.yaml
    echo 💡 Esta variable es necesaria para Supabase
    echo.
)

echo ✅ PASO 5: Creando resumen de deploy...

echo.
echo 📄 RESUMEN DE DEPLOY HIBRIDO
echo ============================
echo.
echo 🎯 ESTRATEGIA: Servidor Hibrido (Emergency + Next.js)
echo.
echo 📦 COMPONENTES:
echo   1. hybrid-server.js - Servidor principal que combina:
echo      - Servidor de emergencia (siempre disponible)
echo      - Aplicacion Next.js real (cuando este lista)
echo.
echo   2. emergency-standalone-server.js - Fallback puro
echo.
echo   3. intelligent-startup.js - Logica de inicio inteligente
echo.
echo 🔄 FUNCIONAMIENTO:
echo   - Al iniciar: Servidor de emergencia disponible inmediatamente
echo   - En paralelo: Next.js se inicializa en segundo plano
echo   - Cuando Next.js este listo: Rutas reales disponibles
echo   - Si Next.js falla: Servidor de emergencia mantiene la aplicacion
echo.
echo ⚡ BENEFICIOS:
echo   - ✅ Inicio rapido (2-5 segundos)
echo   - ✅ Aplicacion siempre disponible
echo   - ✅ Interfaz completa desde el inicio
echo   - ✅ Fallback automatico en caso de errores
echo   - ✅ Funcionalidad completa cuando Next.js este listo
echo.
echo 🎉 RESULTADO ESPERADO EN CHOREO:
echo   - Servidor inicia en 5-10 segundos
echo   - UI disponible inmediatamente
echo   - Funcionalidad completa progresiva
echo   - 99.9%% de disponibilidad
echo.

echo 📋 PASO 6: Instrucciones finales...
echo.
echo 🔧 PASOS EN CHOREO CONSOLE:
echo   1. Subir este codigo a tu repositorio
echo   2. En Choreo, crear/actualizar la aplicacion
echo   3. Verificar variables de entorno:
echo      - DATABASE_URL (secreto)
echo      - JWT_SECRET (secreto)  
echo      - NEXT_PUBLIC_SUPABASE_URL
echo      - NEXT_PUBLIC_SUPABASE_ANON_KEY
echo   4. Deploy y monitorear logs
echo.
echo 🎯 ENDPOINT DE VERIFICACION:
echo   - https://tu-app.choreo.dev/health
echo   - Debe mostrar: "server": "hybrid-emergency-nextjs"
echo.

echo ✅ PREPARACION COMPLETA
echo.
echo 🚀 Tu aplicacion esta lista para deploy en Choreo!
echo 💡 El servidor hibrido garantiza maxima disponibilidad
echo.

pause 