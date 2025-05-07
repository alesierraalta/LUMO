@echo off
echo ================================
echo Installing Next.js Inventory App
echo ================================
echo.

echo Installing npm dependencies...
call npm install

echo.
echo Generating Prisma client...
call npx prisma generate

echo.
echo Setting up the database...
call npx prisma db push

echo.
echo ================================
echo Installation completed!
echo.
echo To start the application, run:
echo   start.bat
echo ================================
echo.
pause 