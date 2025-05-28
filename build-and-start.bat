@echo off
ECHO === Inventory App Build and Start Script ===
ECHO.

REM Set environment variables
SET PORT=8080
SET NODE_ENV=production
SET NEXT_TELEMETRY_DISABLED=1

ECHO 1. Checking dependencies...
call npm install --no-audit --no-fund

ECHO.
ECHO 2. Building application...
call npm run build

ECHO.
ECHO 3. Testing health endpoint accessibility...
powershell -Command "try { $null = Invoke-WebRequest -Uri 'http://localhost:%PORT%/health' -Method HEAD -TimeoutSec 1; Write-Host 'Health endpoint is already accessible' } catch { Write-Host 'Health endpoint will be created on startup' }"

ECHO.
ECHO 4. Starting Choreo server with improved reliability...
call npm run start:choreo

ECHO.
IF %ERRORLEVEL% NEQ 0 (
    ECHO Server failed to start. Trying fallback method...
    node minimal-fix.js
    node choreo-server.js
)

ECHO.
ECHO === Server process exited with code %ERRORLEVEL% === 