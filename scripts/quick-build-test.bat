@echo off
echo 🧪 Quick Choreo Build Test
echo ========================

echo.
echo 🔍 Checking Docker availability...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker not found or not running
    echo 📋 Please start Docker Desktop and try again
    pause
    exit /b 1
)
echo ✅ Docker is available

echo.
echo 🏗️ Building Docker image (this may take a few minutes)...
docker build --no-cache -t lumo-quick-test . --quiet
if %errorlevel% neq 0 (
    echo ❌ Docker build failed
    echo 📋 Check the error messages above
    pause
    exit /b 1
)
echo ✅ Docker build completed

echo.
echo 🔍 Quick verification tests...

echo   📁 Checking BUILD_ID...
docker run --rm lumo-quick-test ls -la .next/BUILD_ID >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ BUILD_ID not found
    goto :failed
)
echo   ✅ BUILD_ID exists

echo   📁 Checking standalone server...
docker run --rm lumo-quick-test ls -la server.js >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ Standalone server not found
    goto :failed
)
echo   ✅ Standalone server exists

echo   📁 Checking startup script...
docker run --rm lumo-quick-test ls -la start.sh >nul 2>&1
if %errorlevel% neq 0 (
    echo   ❌ Startup script not found
    goto :failed
)
echo   ✅ Startup script exists

echo.
echo 🎉 QUICK TEST PASSED!
echo ✅ Your build looks good for Choreo deployment
echo 🚀 Run 'npm run test:choreo:full' for comprehensive testing
echo.

echo 🧹 Cleaning up test image...
docker rmi lumo-quick-test >nul 2>&1

echo ✅ Quick test completed successfully!
pause
exit /b 0

:failed
echo.
echo ❌ QUICK TEST FAILED!
echo 🔧 There are issues with your build
echo 📋 Run 'npm run test:choreo:full' for detailed analysis
echo.
echo 🧹 Cleaning up test image...
docker rmi lumo-quick-test >nul 2>&1
pause
exit /b 1 