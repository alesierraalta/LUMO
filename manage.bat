@echo off
title Next.js Inventory App Manager
color 0A

:menu
cls
echo ================================
echo Next.js Inventory App Manager
echo ================================
echo.
echo Choose an option:
echo.
echo 1. Setup (Install dependencies and setup database)
echo 2. Start Development Server
echo 3. Build and Start Production Server
echo 4. Update Dependencies
echo 5. Reset Database
echo 6. Exit
echo.
echo ================================
echo.

set /p choice=Enter your choice (1-6): 

if "%choice%"=="1" goto setup
if "%choice%"=="2" goto start_dev
if "%choice%"=="3" goto start_prod
if "%choice%"=="4" goto update_deps
if "%choice%"=="5" goto reset_db
if "%choice%"=="6" goto exit
echo Invalid choice. Please try again.
timeout /t 2 > nul
goto menu

:setup
cls
echo ================================
echo Setting up the application...
echo ================================
echo.
call npm install
call npx prisma generate
call npx prisma db push
echo.
echo Setup completed!
pause
goto menu

:start_dev
cls
echo ================================
echo Starting development server...
echo ================================
echo.
echo Press Ctrl+C to stop the server and return to menu
echo The application will be available at: http://localhost:3000
echo.
call npm run dev
goto menu

:start_prod
cls
echo ================================
echo Building and starting production server...
echo ================================
echo.
call npm run build
echo.
echo Press Ctrl+C to stop the server and return to menu
echo The application will be available at: http://localhost:3000
echo.
call npm run start
goto menu

:update_deps
cls
echo ================================
echo Updating dependencies...
echo ================================
echo.
call npm update
call npx prisma generate
echo.
echo Dependencies updated!
pause
goto menu

:reset_db
cls
echo ================================
echo Reset Database
echo ================================
echo.
echo WARNING: This will reset your database!
echo All data will be lost!
echo.
set /p confirm=Are you sure you want to continue? (Y/N): 
if /i not "%confirm%"=="Y" goto menu
echo.
echo Resetting database...
call npx prisma migrate reset --force
echo.
echo Database reset completed!
pause
goto menu

:exit
cls
echo ================================
echo Thank you for using Next.js Inventory App
echo ================================
echo.
timeout /t 2 > nul
exit 