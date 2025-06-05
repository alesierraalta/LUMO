@echo off
echo ==============================================
echo INICIANDO BUILD RAPIDO - LUMO Inventory System
echo ==============================================

set NODE_OPTIONS=--max-old-space-size=4096
set NEXT_TELEMETRY_DISABLED=1
set NEXT_OPTIMIZE_FONTS=1
set ENABLE_TURBO_CACHE=true

echo [1/3] Ejecutando optimizacion prebuild...
node scripts/optimize-build.js

echo [2/3] Ejecutando build principal...
call next build

echo [3/3] Ejecutando optimizacion postbuild...
node scripts/optimize-postbuild.js

echo ==============================================
echo BUILD COMPLETO!
echo ============================================== 