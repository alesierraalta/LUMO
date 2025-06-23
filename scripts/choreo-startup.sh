#!/bin/bash

# Choreo Production Startup Optimization Script
echo "🚀 Starting LUMO with Choreo optimizations..."

# Set optimized environment variables
export NODE_OPTIONS="--max-old-space-size=2048 --no-warnings"
export UV_THREADPOOL_SIZE=4
export NODE_ENV=production

# Reduce startup time
export NEXT_TELEMETRY_DISABLED=1
export DISABLE_ESLINT_PLUGIN=1

# Start the application
echo "✅ Environment optimized, starting server..."
exec node server.js