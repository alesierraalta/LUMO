#!/bin/bash

echo "🚀 [Choreo Start] Initializing LUMO application..."

# Step 1: Environment Detection and Configuration
echo "🔍 [Choreo Start] Detecting and configuring environment..."
cd /workspace
node scripts/choreo-env-detector.js

# Check if environment detection was successful
if [ $? -ne 0 ]; then
    echo "❌ [Choreo Start] Environment detection failed"
    exit 1
fi

# Step 2: Runtime Setup (includes environment-specific optimizations)
echo "⚙️ [Choreo Start] Running runtime setup..."
node scripts/choreo-runtime-setup.js

# Check if runtime setup was successful
if [ $? -ne 0 ]; then
    echo "❌ [Choreo Start] Runtime setup failed"
    exit 1
fi

# Step 3: Determine startup mode based on detected environment
echo "🎯 [Choreo Start] Determining startup mode..."

# Check environment variables set by the detector
DETECTED_ENV=${CHOREO_DETECTED_ENV:-production}
USE_STANDALONE=${CHOREO_USE_STANDALONE:-true}

echo "📊 [Choreo Start] Environment Configuration:"
echo "   - Detected Environment: $DETECTED_ENV"
echo "   - Use Standalone: $USE_STANDALONE"
echo "   - Node Environment: $NODE_ENV"

# Step 4: Start application based on environment
if [ "$USE_STANDALONE" = "true" ]; then
    echo "⚡ [Choreo Start] Starting in PRODUCTION mode (standalone build)..."
    echo "✅ [Choreo Start] Using pre-compiled Next.js standalone server"
    
    # Verify standalone build exists
    if [ ! -f "server.js" ]; then
        echo "❌ [Choreo Start] Standalone server.js not found!"
        echo "📁 [Choreo Start] Contents of /workspace:"
        ls -la /workspace/
        exit 1
    fi
    
    # Start standalone server
    exec node server.js
    
else
    echo "🧪 [Choreo Start] Starting in DEVELOPMENT mode (custom server)..."
    echo "🔧 [Choreo Start] Using development optimizations"
    
    # Check if we have a custom server for development
    if [ -f "server-custom.js" ]; then
        echo "🔧 [Choreo Start] Using custom development server"
        exec node server-custom.js
    elif [ -f "server.js" ]; then
        echo "🔧 [Choreo Start] Using standard server in development mode"
        exec node server.js
    else
        echo "🔧 [Choreo Start] Using Next.js built-in server"
        exec npx next start
    fi
fi 