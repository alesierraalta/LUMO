@echo off
echo 🚀 CONFIGURACION GITHUB ACTIONS PARA CHOREO TESTING
echo ================================================
echo.

echo 📋 Este script te ayudara a configurar GitHub Actions para testear tus builds de Choreo
echo    sin necesidad de tener Docker instalado localmente.
echo.

echo 🔍 Verificando archivos necesarios...

REM Check if workflows directory exists
if not exist ".github\workflows" (
    echo 📁 Creando directorio .github\workflows...
    mkdir .github\workflows
)

REM Check if workflow files exist
if exist ".github\workflows\test-choreo-build.yml" (
    echo ✅ test-choreo-build.yml ya existe
) else (
    echo ❌ test-choreo-build.yml no encontrado
    echo    Este archivo deberia haber sido creado automaticamente.
)

if exist ".github\workflows\quick-choreo-test.yml" (
    echo ✅ quick-choreo-test.yml ya existe
) else (
    echo ❌ quick-choreo-test.yml no encontrado
    echo    Este archivo deberia haber sido creado automaticamente.
)

if exist "scripts\github-test-choreo.js" (
    echo ✅ scripts\github-test-choreo.js ya existe
) else (
    echo ❌ scripts\github-test-choreo.js no encontrado
    echo    Este archivo deberia haber sido creado automaticamente.
)

echo.
echo 📝 CONFIGURACION DE SECRETS EN GITHUB
echo =====================================
echo.
echo Para que los tests funcionen completamente, necesitas configurar estos secrets
echo en tu repositorio de GitHub:
echo.
echo 1. Ve a tu repositorio en GitHub
echo 2. Haz clic en "Settings"
echo 3. En el menu izquierdo, haz clic en "Secrets and variables" ^> "Actions"
echo 4. Haz clic en "New repository secret" para cada uno de estos:
echo.
echo    📌 NEXT_PUBLIC_SUPABASE_URL
echo       Valor: tu URL de Supabase (ej: https://abcdef.supabase.co)
echo.
echo    📌 NEXT_PUBLIC_SUPABASE_ANON_KEY  
echo       Valor: tu clave anonima de Supabase
echo.
echo    📌 DATABASE_URL_DEV
echo       Valor: tu URL de base de datos PostgreSQL de DESARROLLO
echo.
echo    📌 DATABASE_URL_PROD
echo       Valor: tu URL de base de datos PostgreSQL de PRODUCCION
echo.
echo    📌 JWT_SECRET
echo       Valor: tu secreto JWT (minimo 32 caracteres)
echo.
echo    📌 SUPABASE_SERVICE_ROLE_KEY
echo       Valor: tu clave de service role de Supabase
echo.

echo 🔧 COMO OBTENER TUS VALORES DE SUPABASE
echo =======================================
echo.
echo 1. Ve a https://supabase.com/dashboard
echo 2. Selecciona tu proyecto
echo 3. Ve a Settings ^> API
echo 4. Copia los valores necesarios:
echo    - Project URL = NEXT_PUBLIC_SUPABASE_URL
echo    - anon/public key = NEXT_PUBLIC_SUPABASE_ANON_KEY  
echo    - service_role key = SUPABASE_SERVICE_ROLE_KEY
echo.
echo 5. Para DATABASE_URL_DEV y DATABASE_URL_PROD:
echo    - Ve a cada proyecto de Supabase (DEV y PROD)
echo    - Ve a Settings ^> Database
echo    - Copia la "Connection string" y cambia [YOUR-PASSWORD] por tu password
echo    - Configura un secret para cada base de datos
echo.

echo 🚀 COMO USAR GITHUB ACTIONS TESTING
echo ===================================
echo.
echo 1. TESTING AUTOMATICO (cada push):
echo    - GitHub Actions ejecutara automaticamente el "Quick Choreo Test"
echo    - Veras el resultado en la tab "Actions" de tu repositorio
echo.
echo 2. TESTING MANUAL COMPLETO:
echo    - Ve a tu repositorio en GitHub
echo    - Haz clic en "Actions"
echo    - Selecciona "Test Choreo Build" 
echo    - Haz clic en "Run workflow"
echo    - Elige el tipo de test: quick, full, o production
echo    - Haz clic en "Run workflow"
echo.
echo 3. INTERPRETAR RESULTADOS:
echo    - Verde = Todo bien, listo para deploy a Choreo
echo    - Rojo = Hay errores que arreglar
echo    - Descarga los "artifacts" para reportes detallados
echo.

echo 📊 BENEFICIOS
echo =============
echo ✅ Sin necesidad de Docker local
echo ✅ Testing en entorno similar a Choreo  
echo ✅ Feedback automatico en cada push
echo ✅ Reportes detallados descargables
echo ✅ Ahorra tiempo evitando deploys fallidos
echo ✅ Gratis para repositorios publicos
echo.

echo 🎯 PROXIMOS PASOS
echo ================
echo.
echo 1. Configura los secrets en GitHub (arriba)
echo 2. Haz commit y push de tus cambios
echo 3. Ve a la tab "Actions" para ver el test automatico
echo 4. Ejecuta el test completo manualmente antes de deploy a Choreo
echo 5. Deploy a Choreo cuando el test de 90%+ confianza
echo.

echo 📚 DOCUMENTACION COMPLETA
echo =========================
echo Lee TESTING_CHOREO_BUILDS.md para instrucciones detalladas
echo.

pause
echo.
echo 🎉 CONFIGURACION COMPLETA
echo ========================
echo GitHub Actions esta listo para testear tus builds de Choreo!
echo Recuerda configurar los secrets en GitHub para testing completo.
echo. 