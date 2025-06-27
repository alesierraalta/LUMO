@echo off
echo ============================================
echo LUMO Server PowerShell Compatibility Test
echo ============================================

echo.
echo Testing default port (8080)...
echo.
start /B cmd /c "npm start > server-test-default.log 2>&1"
timeout /t 5 /nobreak >nul

echo Checking server response...
curl -s http://localhost:8080/api/health > health-response.json 2>nul
if %errorlevel% equ 0 (
    echo ✅ Default port test: SUCCESS
    type health-response.json
) else (
    echo ❌ Default port test: FAILED
)

echo.
echo Stopping server...
taskkill /f /im node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo.
echo Testing custom port (8081) with PowerShell syntax...
echo.
set PORT=8081
start /B cmd /c "npm start > server-test-custom.log 2>&1"
timeout /t 5 /nobreak >nul

echo Checking custom port response...
curl -s http://localhost:8081/api/health > health-response-custom.json 2>nul
if %errorlevel% equ 0 (
    echo ✅ Custom port test: SUCCESS
    type health-response-custom.json
) else (
    echo ❌ Custom port test: FAILED
)

echo.
echo Stopping server...
taskkill /f /im node.exe >nul 2>&1

echo.
echo ============================================
echo Test completed! Check log files for details:
echo - server-test-default.log
echo - server-test-custom.log
echo ============================================
pause 