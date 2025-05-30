@echo off
echo 🔄 Cambiando a modo desarrollo...

REM Mover archivo .env si existe
if exist .env (
    echo ✓ Guardando .env como .env.production
    move .env .env.production
)

REM Crear archivo .env para desarrollo
echo DATABASE_URL=file:./dev.db > .env
echo NODE_ENV=development >> .env
echo DEVELOPMENT_MODE=true >> .env
echo JWT_SECRET=dev-jwt-secret-key-for-lumo-inventory-system-2024-local >> .env

REM Actualizar schema de Prisma
echo ✓ Actualizando schema a SQLite...
powershell -Command "(Get-Content prisma\schema.prisma) -replace 'provider = \"postgresql\"', 'provider = \"sqlite\"' | Set-Content prisma\schema.prisma"

REM Configurar base de datos
echo ✓ Configurando base de datos SQLite...
set DATABASE_URL=file:./dev.db
npx prisma db push --accept-data-loss

REM Poblar con datos de desarrollo
echo ✓ Poblando con datos de desarrollo...
npm run dev:seed

echo ✅ Modo desarrollo activado
echo 📊 Base de datos: SQLite (./dev.db)
echo 🚀 Ejecuta: npm run dev
pause 