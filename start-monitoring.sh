#!/bin/bash

# CHOREO MONITORING QUICK START
# Automatically generated configuration

echo "🚀 Iniciando monitoreo post-deploy para Choreo..."
echo "📍 URL: https://lumoapp.choreoapps.dev"
echo "⏱️ Duración: 10 minutos"
echo ""

# Set environment variables
export CHOREO_APP_URL="https://lumoapp.choreoapps.dev"

# Start monitoring
node scripts/choreo-post-deploy-monitor.js 10
