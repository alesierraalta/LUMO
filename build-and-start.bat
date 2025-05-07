@echo off
echo ================================
echo Building and Starting Next.js Inventory App in Production Mode
echo ================================
echo.

echo Building production version...
call npm run build

echo.
echo Starting production server...
echo The application will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

call npm run start 