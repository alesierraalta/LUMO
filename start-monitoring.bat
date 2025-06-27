@echo off
REM CHOREO MONITORING QUICK START
REM Automatically generated configuration

echo 🚀 Iniciando monitoreo post-deploy para Choreo...
echo 📍 URL: https://lumoapp.choreoapps.dev
echo ⏱️ Duración: 10 minutos
echo.

REM Set environment variables
set CHOREO_APP_URL=https://lumoapp.choreoapps.dev

REM Start monitoring
node scripts/choreo-post-deploy-monitor.js 10
