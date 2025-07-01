#!/bin/bash
set -e

# Ultra-fast validation - only critical checks
[ -z "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "❌ Missing SUPABASE_URL" && exit 1
[ -z "$JWT_SECRET" ] && echo "❌ Missing JWT_SECRET" && exit 1

# Silent mode for faster startup
export CHOREO_SILENT=true
export NEXT_TELEMETRY_DISABLED=1

# Start with minimal logging
exec node server.js 