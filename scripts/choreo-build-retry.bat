@echo off
setlocal enabledelayedexpansion

REM Choreo Build Retry Script with Network Resilience
REM Handles network failures and implements retry logic

echo.
echo ============================================
echo    CHOREO BUILD RETRY WITH NETWORK FIX
echo ============================================
echo.

REM Configuration
set MAX_RETRIES=3
set RETRY_DELAY=30
set CURRENT_RETRY=0

REM Colors for output
set GREEN=[32m
set RED=[31m
set YELLOW=[33m
set BLUE=[34m
set NC=[0m

:RETRY_LOOP
set /a CURRENT_RETRY+=1
echo %BLUE%[INFO]%NC% Attempt %CURRENT_RETRY% of %MAX_RETRIES%
echo.

REM Step 1: Run network resilience fix
echo %YELLOW%[STEP 1]%NC% Running network resilience fix...
node scripts/choreo-network-fix.js
if !errorlevel! neq 0 (
    echo %RED%[ERROR]%NC% Network fix failed, but continuing...
)
echo.

REM Step 2: Clear npm cache
echo %YELLOW%[STEP 2]%NC% Clearing npm cache...
npm cache clean --force
if !errorlevel! neq 0 (
    echo %RED%[ERROR]%NC% Cache clear failed, but continuing...
)
echo.

REM Step 3: Configure npm for resilience
echo %YELLOW%[STEP 3]%NC% Configuring npm for network resilience...
npm config set fetch-retries 5
npm config set fetch-retry-factor 2
npm config set fetch-retry-mintimeout 10000
npm config set fetch-retry-maxtimeout 60000
npm config set fetch-timeout 300000
npm config set network-timeout 300000
npm config set maxsockets 15
echo %GREEN%[SUCCESS]%NC% NPM configured for resilience
echo.

REM Step 4: Test npm connectivity
echo %YELLOW%[STEP 4]%NC% Testing npm registry connectivity...
npm ping
if !errorlevel! neq 0 (
    echo %RED%[WARNING]%NC% NPM ping failed, but attempting build anyway...
)
echo.

REM Step 5: Install dependencies with retry
echo %YELLOW%[STEP 5]%NC% Installing dependencies...
npm ci --no-optional --no-audit --progress=false
set INSTALL_RESULT=!errorlevel!

if !INSTALL_RESULT! equ 0 (
    echo %GREEN%[SUCCESS]%NC% Dependencies installed successfully!
    goto BUILD_SUCCESS
) else (
    echo %RED%[FAILED]%NC% Dependency installation failed with exit code !INSTALL_RESULT!
    
    if !CURRENT_RETRY! lss !MAX_RETRIES! (
        echo %YELLOW%[RETRY]%NC% Waiting !RETRY_DELAY! seconds before retry...
        timeout /t !RETRY_DELAY! /nobreak >nul
        echo.
        goto RETRY_LOOP
    ) else (
        echo %RED%[FINAL FAILURE]%NC% All retry attempts exhausted
        goto BUILD_FAILED
    )
)

:BUILD_SUCCESS
echo.
echo %GREEN%============================================%NC%
echo %GREEN%    CHOREO BUILD PREPARATION SUCCESSFUL    %NC%
echo %GREEN%============================================%NC%
echo.
echo %BLUE%[INFO]%NC% Dependencies installed successfully after %CURRENT_RETRY% attempt(s)
echo %BLUE%[INFO]%NC% Project is ready for Choreo deployment
echo.
echo %YELLOW%[NEXT STEPS]%NC%
echo 1. Commit the updated .npmrc configuration
echo 2. Push changes to trigger Choreo deployment
echo 3. Monitor Choreo build logs for success
echo.

REM Generate success report
echo {> logs\build-success-report.json
echo   "timestamp": "%date% %time%",>> logs\build-success-report.json
echo   "status": "success",>> logs\build-success-report.json
echo   "attempts": %CURRENT_RETRY%,>> logs\build-success-report.json
echo   "maxRetries": %MAX_RETRIES%,>> logs\build-success-report.json
echo   "networkFix": "applied",>> logs\build-success-report.json
echo   "npmConfig": "optimized">> logs\build-success-report.json
echo }>> logs\build-success-report.json

goto END

:BUILD_FAILED
echo.
echo %RED%============================================%NC%
echo %RED%    CHOREO BUILD PREPARATION FAILED        %NC%
echo %RED%============================================%NC%
echo.
echo %RED%[CRITICAL]%NC% Unable to install dependencies after %MAX_RETRIES% attempts
echo %RED%[CRITICAL]%NC% Network connectivity issues persist
echo.
echo %YELLOW%[TROUBLESHOOTING]%NC%
echo 1. Check your internet connection
echo 2. Verify npm registry accessibility
echo 3. Check for corporate firewall/proxy issues
echo 4. Consider using alternative registry (yarn, pnpm)
echo 5. Contact Choreo support for infrastructure issues
echo.

REM Generate failure report
echo {> logs\build-failure-report.json
echo   "timestamp": "%date% %time%",>> logs\build-failure-report.json
echo   "status": "failed",>> logs\build-failure-report.json
echo   "attempts": %CURRENT_RETRY%,>> logs\build-failure-report.json
echo   "maxRetries": %MAX_RETRIES%,>> logs\build-failure-report.json
echo   "lastError": "npm ci failed",>> logs\build-failure-report.json
echo   "networkFix": "applied",>> logs\build-failure-report.json
echo   "recommendation": "check network connectivity">> logs\build-failure-report.json
echo }>> logs\build-failure-report.json

exit /b 1

:END
endlocal 