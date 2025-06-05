#!/bin/bash

echo "=============================================="
echo "INICIANDO BUILD TURBO - LUMO Inventory System"
echo "=============================================="

# Iniciar medición de tiempo
START_TIME=$(date +%s)

# Configurar variables de entorno para optimizar
export NODE_OPTIONS="--max-old-space-size=8192"
export NEXT_TELEMETRY_DISABLED=1
export NEXT_OPTIMIZE_FONTS=1
export NEXT_OPTIMIZE_IMAGES=1
export NEXT_OPTIMIZE_CSS=1
export NEXT_MINIMAL_TRACE=1
export NEXT_WEBPACK_DISABLE_DEV_CHECKS=1
export ENABLE_TURBO_CACHE=true
export TURBO_CACHE_DIR="/tmp/.turbo-cache"
export TURBO_TEAM="lumo-inventory"
export TURBO_REMOTE_ONLY=true
export SWC_MINIFY=true

# Configuración de paralelismo según disponibilidad de CPU
CORES=$(nproc 2>/dev/null || sysctl -n hw.ncpu 2>/dev/null || echo 2)
export NEXT_WEBPACK_PARALLELISM=$((CORES - 1))
export NEXT_SWC_THREADS=$((CORES - 1))
export NODE_PARALLEL_JOB_COUNT=$((CORES - 1))

# Mostrar configuración
echo "🔧 CPU Cores: $CORES | Parallelism: $NEXT_WEBPACK_PARALLELISM | RAM: ${NODE_OPTIONS}"

# Crear carpeta de caché si no existe
mkdir -p /tmp/.turbo-cache

# Limpiar archivos temporales no esenciales
echo "🧹 Eliminando archivos no esenciales para build..."
rm -rf .next/cache/images 2>/dev/null || true
rm -rf .next/cache/fetch-cache 2>/dev/null || true
rm -rf logs/*.log 2>/dev/null || true

echo "[1/4] Ejecutando optimización extrema..."
time node scripts/extreme-build-optimization.js

echo "[2/4] Instalando módulos optimizados para SWC..."
if [ ! -d "node_modules/swc" ]; then
  time npm install --no-save --no-package-lock --ignore-scripts swc
fi

# Usar NPX con indicador de no confirmación
echo "[3/4] Ejecutando build principal con optimizaciones..."
time next build

echo "[4/4] Ejecutando optimización postbuild..."
time node scripts/optimize-postbuild.js

# Verificar el tamaño de los archivos generados
if [ -d ".next/standalone" ]; then
  echo "📦 Tamaño del directorio standalone:"
  du -sh .next/standalone 2>/dev/null || dir .next/standalone
  
  echo "📦 Tamaño del directorio static:"
  du -sh .next/static 2>/dev/null || dir .next/static
fi

# Mostrar estadísticas del build
END_TIME=$(date +%s)
BUILD_DURATION=$((END_TIME - START_TIME))
BUILD_MINUTES=$((BUILD_DURATION / 60))
BUILD_SECONDS=$((BUILD_DURATION % 60))

echo "=============================================="
echo "🚀 BUILD COMPLETO en ${BUILD_MINUTES}m ${BUILD_SECONDS}s!"
echo "==============================================" 