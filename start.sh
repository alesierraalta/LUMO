#!/bin/bash

# LUMO Inventory System - Choreo Production Startup Script
# This script handles the production startup for Choreo deployment

set -e

echo "🚀 LUMO Choreo Production Startup"
echo "================================="

# Display environment info
echo "🔍 Environment Information:"
echo "   NODE_ENV: ${NODE_ENV:-not-set}"
echo "   PORT: ${PORT:-not-set}"
echo "   DATABASE_URL: ${DATABASE_URL:+[CONFIGURED]}"
echo "   NEXT_PUBLIC_SUPABASE_URL: ${NEXT_PUBLIC_SUPABASE_URL:+[CONFIGURED]}"

# Validate critical environment variables
if [ -z "$DATABASE_URL" ]; then
    echo "❌ ERROR: DATABASE_URL is not set"
    echo "Please configure DATABASE_URL secret in Choreo Console"
    exit 1
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "❌ ERROR: NEXT_PUBLIC_SUPABASE_URL is not set"
    echo "Please configure Supabase secrets in Choreo Console"
    exit 1
fi

# Set default values
export NODE_ENV=${NODE_ENV:-production}
export PORT=${PORT:-8080}
export HOSTNAME=${HOSTNAME:-0.0.0.0}

echo "✅ Environment variables validated"

# Check for standalone build
if [ -f ".next/standalone/server.js" ]; then
    echo "🎯 Using Next.js standalone server"
    cd .next/standalone
    exec node server.js
elif [ -f "production-server.js" ]; then
    echo "🎯 Using custom production server"
    exec node production-server.js
elif [ -f "server.js" ]; then
    echo "🎯 Using root server.js"
    exec node server.js
else
    echo "❌ ERROR: No server file found"
    echo "Available files:"
    ls -la | grep -E '\.(js|json)$' || true
    exit 1
fi 