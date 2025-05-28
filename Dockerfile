# syntax=docker/dockerfile:1

# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app

# Install necessary build tools
RUN apk add --no-cache libc6-compat

# Add build arguments for environment variables
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_SKIP_CLERK_AUTH

# Set environment variables for build time
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-pk_test_dummy-key-for-build}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY:-sk_test_dummy-key-for-build}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
ENV NEXT_PUBLIC_SKIP_CLERK_AUTH=${NEXT_PUBLIC_SKIP_CLERK_AUTH:-true}
ENV NODE_ENV=production

# Copy package files first for better caching
COPY package.json package-lock.json ./
COPY prisma ./prisma/

# Install dependencies with cache optimization
RUN npm ci --prefer-offline --no-audit --omit=dev && npm cache clean --force

# Copy source files
COPY . .

# Run manifest validation before build
RUN npm run prebuild

# Build the application with proper CSS handling
RUN npm run build

# Run post-build validation
RUN npm run postbuild

# Verify build artifacts
RUN echo "[BUILD-VERIFY] Checking build artifacts..." && \
    ls -la .next/ && \
    echo "[BUILD-VERIFY] Checking manifests:" && \
    test -f .next/build-manifest.json && echo "✓ build-manifest.json exists" || echo "✗ build-manifest.json missing" && \
    test -f .next/app-build-manifest.json && echo "✓ app-build-manifest.json exists" || echo "✗ app-build-manifest.json missing" && \
    echo "[BUILD-VERIFY] Checking CSS directory:" && \
    ls -la .next/static/css/ || echo "CSS directory not found" && \
    echo "[BUILD-VERIFY] Standalone check:" && \
    test -f .next/standalone/server.js && echo "✓ Standalone server exists" || echo "✗ Standalone server missing"

# Stage 2: Production runtime
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache \
    curl \
    dumb-init \
    && addgroup --system --gid 1001 nodejs \
    && adduser --system --uid 1001 nextjs

# Set production environment
ENV NODE_ENV=production
ENV PORT=8080
ENV HOSTNAME=0.0.0.0

# Set runtime environment variables
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG NEXT_PUBLIC_SKIP_CLERK_AUTH

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV NEXT_PUBLIC_SKIP_CLERK_AUTH=${NEXT_PUBLIC_SKIP_CLERK_AUTH:-false}

# Copy essential files from builder
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma/
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts/
COPY --from=builder --chown=nextjs:nodejs /app/server.js ./
COPY --from=builder --chown=nextjs:nodejs /app/choreo-server.js ./
COPY --from=builder --chown=nextjs:nodejs /app/debug-choreo.js ./

# Copy Next.js build artifacts
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Ensure proper permissions
RUN chown -R nextjs:nodejs /app && \
    chmod +x scripts/manifest-validator.js && \
    chmod +x server.js && \
    chmod +x choreo-server.js && \
    chmod +x debug-choreo.js

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8080

# Health check using the enhanced health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8080/api/health || exit 1

# Use Choreo-optimized server with proper signal handling
CMD ["dumb-init", "node", "choreo-server.js"] 