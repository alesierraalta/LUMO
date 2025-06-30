#!/bin/bash
set -e

# Validate essentials
[ -z "$NEXT_PUBLIC_SUPABASE_URL" ] && echo "❌ Missing SUPABASE_URL" && exit 1
[ -z "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ] && echo "❌ Missing SUPABASE_KEY" && exit 1
[ -z "$JWT_SECRET" ] && echo "❌ Missing JWT_SECRET" && exit 1

# Start
echo "🚀 Starting LUMO..."
exec node server.js 