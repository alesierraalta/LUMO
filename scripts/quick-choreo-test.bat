@echo off
:: 🚀 LUMO - Test Rápido de Choreo (Windows)
:: Este script ejecuta un test rápido de 2-3 minutos para validar el deployment

echo.
echo ===============================================
echo 🚀 LUMO - Test Rápido de Choreo
echo ===============================================
echo Validando deployment antes de subir a Choreo...
echo Tiempo estimado: 2-3 minutos
echo.

:: Verificar que estamos en el directorio correcto
if not exist "package.json" (
    echo ❌ Error: package.json no encontrado
    echo    Asegúrate de ejecutar este script desde la raíz del proyecto LUMO
    pause
    exit /b 1
)

:: Cargar variables de entorno si existen
if exist ".env.local" (
    echo 📋 Cargando variables de entorno desde .env.local...
    for /f "usebackq tokens=*" %%i in (".env.local") do (
        set "%%i" 2>nul
    )
)

:: Ejecutar test rápido
echo 🧪 Ejecutando tests de validación...
node scripts/test-choreo-local.js --mode=quick

:: Verificar el resultado
if %ERRORLEVEL% equ 0 (
    echo.
    echo ✅ ¡TEST EXITOSO! Tu deployment debería funcionar en Choreo.
    echo 💡 Puedes proceder con el deployment.
) else (
    echo.
    echo ❌ TEST FALLÓ. Revisa los errores antes de hacer deployment.
    echo 💡 Esto te ahorra 10-15 minutos de deployment fallido.
)

echo.
echo Presiona cualquier tecla para continuar...
pause >nul 