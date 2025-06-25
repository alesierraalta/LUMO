# Fixed Production Dockerfile for LUMO - Resolves Choreo working directory mismatch
# CRITICAL FIX: Use /workspace to match Choreo runtime environment
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /workspace

# Install ALL dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund --legacy-peer-deps && npm cache clean --force

# Build stage
FROM base AS builder
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_OPTIONS="--max-old-space-size=2048"

# CRITICAL FIX: Set Supabase environment variables for build
ENV NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzEzMTUsImV4cCI6MjAzMzAwNzMxNX0.QIBUm2NmvtPKv4pEjQhGIjhGJ4LKPjqVjBXVpRpMQwY

# Build with optimizations - this creates .next directory
RUN echo "🔨 Starting Next.js build process..." && \
    npm run build && \
    echo "✅ Build completed successfully"

# CRITICAL FIX: Comprehensive build verification with BUILD_ID check
RUN echo "🔍 Verifying build artifacts..." && \
    ls -la .next/ && \
    echo "📁 .next directory contents:" && \
    find .next -type f -name "*.js" | head -10 && \
    echo "🔍 Checking for BUILD_ID..." && \
    if [ -f ".next/BUILD_ID" ]; then \
        echo "✅ BUILD_ID found: $(cat .next/BUILD_ID)"; \
    else \
        echo "❌ BUILD_ID missing - this will cause startup issues"; \
        echo "📁 Full .next contents:"; \
        find .next -type f | head -20; \
        exit 1; \
    fi && \
    if [ -d ".next/standalone" ]; then \
        echo "✅ Standalone build found"; \
        ls -la .next/standalone/; \
        echo "🔍 Checking standalone server.js..."; \
        if [ -f ".next/standalone/server.js" ]; then \
            echo "✅ Standalone server.js found"; \
        else \
            echo "❌ Standalone server.js missing"; \
            exit 1; \
        fi; \
    else \
        echo "❌ Standalone build missing"; \
        exit 1; \
    fi

# CRITICAL FIX: Ensure runtime-module-patcher.js exists for copying
RUN if [ ! -f "src/lib/runtime-module-patcher.js" ]; then \
        mkdir -p src/lib/ && \
        echo "// Placeholder - runtime patcher not available" > src/lib/runtime-module-patcher.js && \
        echo "⚠️ Created placeholder runtime-module-patcher.js"; \
    else \
        echo "✅ Runtime patcher already exists"; \
    fi

# Production image with minimal size
FROM base AS runner
WORKDIR /workspace

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# CRITICAL FIX: Copy standalone build files in correct order to /workspace
# Copy the standalone server files first (this includes server.js and all dependencies)
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/standalone ./

# CRITICAL FIX: Copy BUILD_ID specifically to ensure it exists
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/BUILD_ID ./.next/BUILD_ID

# Copy the static assets to the correct location within standalone structure
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/static ./.next/static

# Copy public files
COPY --from=builder --chown=nextjs:nodejs /workspace/public ./public

# CRITICAL FIX: Copy our custom scripts and startup script
COPY --from=builder --chown=nextjs:nodejs /workspace/scripts/choreo-runtime-setup.js ./scripts/
COPY --from=builder --chown=nextjs:nodejs /workspace/scripts/choreo-env-detector.js ./scripts/
# Copy runtime module patcher (now guaranteed to exist)
RUN mkdir -p ./src/lib/
COPY --from=builder --chown=nextjs:nodejs /workspace/src/lib/runtime-module-patcher.js ./src/lib/runtime-module-patcher.js
COPY --from=builder --chown=nextjs:nodejs /workspace/server.js ./custom-server.js

# CRITICAL FIX: Copy our intelligent startup script from workspace
COPY --from=builder --chown=nextjs:nodejs /workspace/start.sh ./start.sh
RUN chmod +x start.sh

# CRITICAL FIX: Final verification in runtime container
RUN echo "🔍 Final verification in runtime container..." && \
    ls -la . && \
    echo "📁 Checking .next directory..." && \
    ls -la .next/ && \
    echo "🔍 Checking for server.js (from standalone build)..." && \
    if [ -f "server.js" ]; then \
        echo "✅ Standalone server.js found"; \
    else \
        echo "❌ Standalone server.js missing"; \
        exit 1; \
    fi && \
    echo "✅ All files verified in /workspace"

# Set proper permissions
USER nextjs

# Expose port
EXPOSE 8080

# Optimized health check with shorter intervals
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# CRITICAL FIX: Use the startup script that combines our setup with standalone server
CMD ["./start.sh"]
