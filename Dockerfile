# Fixed Production Dockerfile for LUMO - Resolves missing .next build
# Addresses Choreo "context deadline exceeded" errors + build issues

FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

# Install ALL dependencies (including devDependencies for build)
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund && npm cache clean --force

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=2048"

# Build with optimizations - this creates .next directory
RUN npm run build

# Verify build was created (debugging step)
RUN ls -la .next/ || echo "ERROR: .next directory not found after build"
RUN ls -la .next/standalone/ || echo "ERROR: .next/standalone directory not found after build"

# Production image with minimal size
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080
ENV HOSTNAME="0.0.0.0"

# Install curl for health checks
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# CRITICAL FIX: Copy standalone build files in correct order
# Copy the standalone server files first (this includes server.js and all dependencies)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./

# Copy the static assets to the correct location within standalone structure
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy public files
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# CRITICAL FIX: Copy our custom scripts for Choreo runtime setup
COPY --from=builder --chown=nextjs:nodejs /app/scripts/choreo-runtime-setup.js ./scripts/
COPY --from=builder --chown=nextjs:nodejs /app/src/lib/runtime-module-patcher.js ./src/lib/ 2>/dev/null || echo "Runtime patcher not found, skipping"

# Verify files are in place (debugging step)
RUN ls -la .next/ || echo "ERROR: .next directory missing in runner stage"
RUN ls -la server.js || echo "ERROR: server.js missing in runner stage"

# Set proper permissions
USER nextjs

# Expose port
EXPOSE 8080

# Optimized health check with shorter intervals
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=5 \
  CMD curl -f http://localhost:8080/api/health || exit 1

# CRITICAL FIX: Use the Next.js standalone server directly with our runtime setup
CMD ["sh", "-c", "node scripts/choreo-runtime-setup.js && node server.js"] 