@echo off
echo 🧪 PRUEBA RAPIDA DEL SERVIDOR HIBRIDO
echo =====================================
echo.

echo 🔍 Verificando archivos necesarios...

if not exist "hybrid-server.js" (
    echo ❌ ERROR: hybrid-server.js no encontrado
    echo 💡 Asegurate de estar en la raiz del proyecto LUMO
    pause
    exit /b 1
)

if not exist "scripts\test-hybrid-server.js" (
    echo ❌ ERROR: scripts\test-hybrid-server.js no encontrado
    pause
    exit /b 1
)

echo ✅ Archivos encontrados
echo.

echo 🚀 Ejecutando pruebas del servidor hibrido...
echo ⏱️ Esto tomara aproximadamente 1-2 minutos
echo.

node scripts\test-hybrid-server.js

echo.
echo 📋 RESUMEN:
echo - Si todas las pruebas pasaron: ✅ Listo para Choreo
echo - Si algunas fallaron: ⚠️ Revisar configuracion
echo - Si todas fallaron: ❌ Contactar soporte
echo.

pause 