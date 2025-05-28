@echo off
echo Configurando la aplicación de inventario...

echo Generando archivos Prisma...
npx prisma generate

echo Ejecutando migraciones de base de datos...
npx prisma migrate deploy

echo Inicializando datos básicos...
node src/scripts/init-db.js

echo Configuración completada con éxito!
echo Puedes iniciar la aplicación con: npm run dev 