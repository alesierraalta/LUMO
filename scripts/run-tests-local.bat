@echo off
echo.
echo ========================================
echo  🧪 LUMO - Tests Locales
echo ========================================
echo.

REM Configurar variables de entorno para tests locales
set NODE_ENV=test
set FORCE_SUPABASE=true
set SKIP_ENV_VALIDATION=true

echo ✅ Configurando entorno de testing...
echo.

REM Limpiar cache de tests
echo 🧹 Limpiando cache de tests...
call npm run test:clear-cache 2>nul

echo.
echo ========================================
echo  🧪 EJECUTANDO TESTS
echo ========================================
echo.

REM Ejecutar tests por categorías
echo 📋 1. Tests de Unidad (con mocks)...
call npm run test:unit:ci
if %ERRORLEVEL% neq 0 (
    echo ❌ Tests de unidad fallaron
    pause
    exit /b 1
)

echo.
echo 📋 2. Tests de Integración (requiere DB real)...
echo ⚠️  NOTA: Estos tests requieren conexión a Supabase
echo.
choice /C YN /M "¿Ejecutar tests de integración (requiere DB real)?"
if %ERRORLEVEL%==1 (
    call npm run test:integration:local
    if %ERRORLEVEL% neq 0 (
        echo ❌ Tests de integración fallaron
        pause
        exit /b 1
    )
) else (
    echo ⏭️  Tests de integración omitidos
)

echo.
echo 📋 3. Tests E2E (opcional)...
choice /C YN /M "¿Ejecutar tests End-to-End?"
if %ERRORLEVEL%==1 (
    call npm run test:e2e
    if %ERRORLEVEL% neq 0 (
        echo ❌ Tests E2E fallaron
        pause
        exit /b 1
    )
) else (
    echo ⏭️  Tests E2E omitidos
)

echo.
echo ========================================
echo  ✅ TESTS COMPLETADOS
echo ========================================
echo.
echo 🎉 Todos los tests seleccionados pasaron correctamente
echo.
pause 