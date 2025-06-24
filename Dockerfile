# Fixed Production Dockerfile for LUMO - Resolves Choreo working directory mismatch
# CRITICAL FIX: Use /workspace to match Choreo runtime environment

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /workspace

# Install ALL dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# CRITICAL FIX: Set Supabase environment variables for build
# These are needed for the build process to complete successfully
ENV NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTc0MzEzMTUsImV4cCI6MjAzMzAwNzMxNX0.QIBUm2NmvtPKv4pEjQhGIjhGJ4LKPjqVjBXVpRpMQwY

# Build with optimizations - this creates .next directory
RUN echo "🔨 Starting Next.js build process..." && \
    npm run build && \
    echo "✅ Build completed successfully"

# CRITICAL FIX: Comprehensive build verification
RUN echo "🔍 Verifying build artifacts..." && \
    ls -la .next/ && \
    echo "📁 .next directory contents:" && \
    find .next -type f -name "*.js" | head -10 && \
    if [ -d ".next/standalone" ]; then \
        echo "✅ Standalone build found"; \
        ls -la .next/standalone/; \
    else \
        echo "❌ Standalone build missing"; \
        exit 1; \
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

# Copy the static assets to the correct location within standalone structure
COPY --from=builder --chown=nextjs:nodejs /workspace/.next/static ./.next/static

# Copy public files
COPY --from=builder --chown=nextjs:nodejs /workspace/public ./public

# CRITICAL FIX: Copy our custom scripts for Choreo runtime setup
COPY --from=builder --chown=nextjs:nodejs /workspace/scripts/choreo-runtime-setup.js ./scripts/
COPY --from=builder --chown=nextjs:nodejs /workspace/src/lib/runtime-module-patcher.js ./src/lib/ 2>/dev/null || echo "Runtime patcher not found, skipping"

# CRITICAL FIX: Final verification in runtime container
RUN echo "🔍 Final verification in runtime container..." && \
    ls -la . && \
    ls -la .next/ && \
    ls -la server.js && \
    echo "✅ All files verified in /workspace"

# Set proper permissions
USER nextjs

# Expose port
EXPOSE 8080

# Optimized health check with shorter intervals
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# CRITICAL FIX: Use the Next.js standalone server directly with our runtime setup
CMD ["sh", "-c", "echo '🚀 Starting from /workspace' && pwd && ls -la && node scripts/choreo-runtime-setup.js && node server.js"] 