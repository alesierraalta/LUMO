@echo off
echo 🔄 Cambiando a modo producción...

REM Restaurar archivo .env de producción
if exist .env.production (
    echo ✓ Restaurando .env de producción
    move .env.production .env
) else (
    echo ❌ No se encontró .env.production
    echo ⚠️  Necesitas configurar las variables de producción manualmente
    pause
    exit /b 1
)

REM Actualizar schema de Prisma
echo ✓ Actualizando schema a PostgreSQL...
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"sqlite\"', 'provider = \"postgresql\"' | Set-Content prisma\schema.prisma"

echo ✅ Modo producción activado
echo 📊 Base de datos: PostgreSQL (producción)
echo ⚠️  Ten cuidado con los cambios en producción
echo 🚀 Ejecuta: npm run build && npm run start
pause 