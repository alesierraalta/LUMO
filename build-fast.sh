#!/bin/bash

echo "=============================================="
echo "INICIANDO BUILD RAPIDO - LUMO Inventory System"
echo "=============================================="

# Configurar variables de entorno para optimizar
export NODE_OPTIONS="--max-old-space-size=4096"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_OPTIMIZE_FONTS=1
export ENABLE_TURBO_CACHE=true

echo "[1/3] Ejecutando optimizacion prebuild..."
node scripts/optimize-build.js

echo "[2/3] Ejecutando build principal..."
next build

echo "[3/3] Ejecutando optimizacion postbuild..."
node scripts/optimize-postbuild.js

echo "=============================================="
echo "BUILD COMPLETO!"
echo "==============================================" 