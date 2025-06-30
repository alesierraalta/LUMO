#!/bin/bash

# LUMO Inventory Management System - Choreo Startup Script
# This script handles the production startup for Choreo deployment

set -e  # Exit on any error

echo "🚀 Starting LUMO Inventory Management System..."
echo "📅 Timestamp: $(date)"
echo "🌍 Environment: ${NODE_ENV:-production}"
echo "🔧 Choreo Environment: ${CHOREO_ENVIRONMENT:-unknown}"

# Validate critical environment variables
echo "🔍 Validating environment configuration..."

# Check required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_SECRET"
    "NEXT_PUBLIC_SUPABASE_URL"
    "NEXT_PUBLIC_SUPABASE_ANON_KEY"
)

MISSING_VARS=()
for var in "${REQUIRED_VARS[@]}"; do
    if [[ -z "${!var}" ]]; then
        MISSING_VARS+=("$var")
        echo "❌ Missing required environment variable: $var"
    else
        echo "✅ $var is configured"
    fi
done

if [[ ${#MISSING_VARS[@]} -gt 0 ]]; then
    echo "💥 FATAL: Missing required environment variables: ${MISSING_VARS[*]}"
    echo "🔧 Please configure these variables in Choreo secrets"
    exit 1
fi

# Validate Supabase configuration
echo "🔍 Validating Supabase configuration..."
if [[ "$NEXT_PUBLIC_SUPABASE_URL" == "https://placeholder.supabase.co" ]] || [[ "$NEXT_PUBLIC_SUPABASE_ANON_KEY" == "placeholder-key" ]]; then
    echo "❌ FATAL: Supabase configuration contains placeholder values"
    echo "🔧 Please update Supabase URL and key in Choreo secrets"
    exit 1
fi

# Validate JWT secret length
if [[ ${#JWT_SECRET} -lt 32 ]]; then
    echo "❌ FATAL: JWT_SECRET must be at least 32 characters long"
    echo "🔧 Current length: ${#JWT_SECRET} characters"
    exit 1
fi

echo "✅ All environment variables validated successfully"

# Check if standalone build exists
if [[ ! -f ".next/standalone/server.js" ]]; then
    echo "❌ FATAL: Standalone build not found at .next/standalone/server.js"
    echo "🔧 Please ensure 'output: standalone' is configured in next.config.js"
    exit 1
fi

echo "✅ Standalone build found"

# Set default port if not specified
export PORT=${PORT:-8080}
echo "🌐 Server will start on port: $PORT"

# Start the Next.js standalone server
echo "🚀 Starting Next.js standalone server..."
echo "📂 Working directory: $(pwd)"
echo "🔧 Node.js version: $(node --version)"

# Change to standalone directory and start server
cd .next/standalone

# Start the server with proper error handling
exec node server.js 