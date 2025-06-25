@echo off
echo 🐳 Docker Desktop Check
echo ====================

echo.
echo 🔍 Checking if Docker Desktop is installed...

where docker >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found in PATH
    echo.
    echo 📋 SOLUTION:
    echo 1. Download Docker Desktop from: https://www.docker.com/products/docker-desktop
    echo 2. Install Docker Desktop
    echo 3. Restart your computer
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is installed

echo.
echo 🔍 Checking if Docker Desktop is running...

docker version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Desktop is not running
    echo.
    echo 📋 SOLUTION:
    echo 1. Look for Docker Desktop in your system tray (bottom right)
    echo 2. If not there, search for "Docker Desktop" in Start Menu
    echo 3. Click on Docker Desktop to start it
    echo 4. Wait for "Docker Desktop is running" message
    echo 5. Run this script again
    echo.
    echo 🚀 Starting Docker Desktop automatically...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    echo.
    echo ⏳ Please wait for Docker Desktop to start (30-60 seconds)
    echo    You'll see a whale icon in your system tray when ready
    echo.
    pause
    exit /b 1
)

echo ✅ Docker Desktop is running

echo.
echo 🧪 Testing Docker functionality...

docker ps >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is running but not responding properly
    echo.
    echo 📋 SOLUTION:
    echo 1. Right-click Docker Desktop icon in system tray
    echo 2. Select "Restart Docker Desktop"
    echo 3. Wait for restart to complete
    echo 4. Run this script again
    echo.
    pause
    exit /b 1
)

echo ✅ Docker is working correctly

echo.
echo 🎉 SUCCESS! Docker Desktop is ready
echo ✅ You can now run Choreo build tests
echo.
echo 📋 Available commands:
echo    npm run test:choreo:quick   - Quick test (2-3 minutes)
echo    npm run test:choreo:full    - Full test (5-8 minutes)
echo.
pause 