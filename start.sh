#!/bin/bash

# LUMO Inventory - Choreo Startup Script
# Handles Next.js standalone server startup with proper environment validation

set -e  # Exit on any error

echo "🚀 [LUMO Startup] Starting LUMO Inventory Management System..."
echo "📍 [LUMO Startup] Working directory: $(pwd)"
echo "🌍 [LUMO Startup] Environment: ${NODE_ENV:-production}"

# Critical environment variable validation
echo "🔍 [LUMO Startup] Validating environment variables..."

MISSING_VARS=()

# Check critical variables
if [ -z "$DATABASE_URL" ]; then
    MISSING_VARS+=("DATABASE_URL")
fi

if [ -z "$JWT_SECRET" ]; then
    MISSING_VARS+=("JWT_SECRET")
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_URL")
fi

if [ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    MISSING_VARS+=("NEXT_PUBLIC_SUPABASE_ANON_KEY")
fi

# Report missing variables
if [ ${#MISSING_VARS[@]} -gt 0 ]; then
    echo "❌ [LUMO Startup] CRITICAL: Missing required environment variables:"
    for var in "${MISSING_VARS[@]}"; do
        echo "   - $var"
    done
    echo "💡 [LUMO Startup] Please configure these secrets in Choreo Console"
    exit 1
fi

echo "✅ [LUMO Startup] All critical environment variables are present"

# Validate Supabase configuration
echo "🔍 [LUMO Startup] Validating Supabase configuration..."
if [[ "$NEXT_PUBLIC_SUPABASE_URL" == *"supabase.co"* ]]; then
    echo "✅ [LUMO Startup] Supabase URL format is valid"
else
    echo "⚠️ [LUMO Startup] Warning: Supabase URL format may be invalid"
fi

# Check for standalone server
STANDALONE_SERVER=".next/standalone/server.js"
if [ -f "$STANDALONE_SERVER" ]; then
    echo "✅ [LUMO Startup] Standalone server found: $STANDALONE_SERVER"
    SERVER_COMMAND="node $STANDALONE_SERVER"
else
    echo "⚠️ [LUMO Startup] Standalone server not found, checking alternatives..."
    
    # Check for regular Next.js server
    if [ -f "package.json" ] && command -v npm >/dev/null 2>&1; then
        echo "📦 [LUMO Startup] Using npm start as fallback"
        SERVER_COMMAND="npm start"
    else
        echo "❌ [LUMO Startup] No valid server startup method found"
        exit 1
    fi
fi

# Set default port if not specified
export PORT=${PORT:-8080}
echo "🌐 [LUMO Startup] Server will start on port: $PORT"

# Environment detection
if [ "$NODE_ENV" = "production" ]; then
    echo "🏭 [LUMO Startup] Production mode detected"
    export NEXT_TELEMETRY_DISABLED=1
else
    echo "🛠️ [LUMO Startup] Development mode detected"
fi

# Start the server
echo "🎯 [LUMO Startup] Starting server with command: $SERVER_COMMAND"
echo "⏰ [LUMO Startup] Startup time: $(date)"
echo "🔗 [LUMO Startup] Health check endpoint: http://localhost:$PORT/api/health"
echo ""

# Execute the server command
exec $SERVER_COMMAND 