# syntax=docker/dockerfile:1

# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app

# Add build arguments for environment variables
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG NEXT_PUBLIC_APP_VERSION
ARG NEXT_PUBLIC_SKIP_CLERK_AUTH

# Set environment variables for build time
ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:-pk_test_dummy-key-for-build}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY:-sk_test_dummy-key-for-build}
ENV NEXT_PUBLIC_APP_VERSION=${NEXT_PUBLIC_APP_VERSION}
# Default to skipping auth during build to avoid API calls
ENV NEXT_PUBLIC_SKIP_CLERK_AUTH=${NEXT_PUBLIC_SKIP_CLERK_AUTH:-true}

# Copy package files
COPY package.json package-lock.json ./

# Copy prisma directory
COPY prisma ./prisma/

# Install all dependencies
RUN npm ci

# Copy configuration files
COPY postcss.config.mjs ./
COPY next.config.ts ./
COPY components.json ./
COPY tsconfig.json ./

# Copy all source files
COPY . .

# Build the application
RUN npm run build

# Verify standalone build completed correctly
RUN echo "[BUILD-DEBUG] Checking standalone build..." && \
    ls -la .next/ && \
    echo "[BUILD-DEBUG] Standalone directory contents:" && \
    ls -la .next/standalone/ && \
    echo "[BUILD-DEBUG] server.js exists in standalone:" && \
    [ -f .next/standalone/server.js ] && echo "YES" || echo "NO"

# Stage 2: Production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Set runtime environment variables
ARG NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
ARG CLERK_SECRET_KEY
ARG NEXT_PUBLIC_SKIP_CLERK_AUTH

ENV NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=${NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
ENV CLERK_SECRET_KEY=${CLERK_SECRET_KEY}
ENV NEXT_PUBLIC_SKIP_CLERK_AUTH=${NEXT_PUBLIC_SKIP_CLERK_AUTH:-false}

# Validation warning
RUN if [ "$NEXT_PUBLIC_SKIP_CLERK_AUTH" != "true" ] && [ -z "$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" ]; then \
    echo "Warning: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not provided. Ensure it's set via secrets in deployment."; \
fi

# Copy prisma directory
COPY --from=builder /app/prisma ./prisma

# Install production dependencies (CSS packages now in dependencies)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Copy ALL standalone files (CRITICAL FIX - copy everything from standalone)
COPY --from=builder /app/.next/standalone/ ./
# Copy static files to the correct location
COPY --from=builder /app/.next/static ./.next/static
# Copy public files
COPY --from=builder /app/public ./public

# Copy configuration files
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/components.json ./
COPY --from=builder /app/scripts ./scripts

# Verify server.js exists after copy
RUN echo "[COPY-DEBUG] Verifying server.js after copy..." && \
    ls -la server.js && \
    echo "[COPY-DEBUG] server.js file size:" && \
    wc -c server.js

# Create multiple startup debugging scripts
RUN echo '#!/bin/sh' > start.sh && \
    echo 'echo "[STARTUP] ==================================="' >> start.sh && \
    echo 'echo "[STARTUP] STARTING APPLICATION WITH DEBUG"' >> start.sh && \
    echo 'echo "[STARTUP] ==================================="' >> start.sh && \
    echo 'echo "[STARTUP] Working directory: $(pwd)"' >> start.sh && \
    echo 'echo "[STARTUP] Node version: $(node --version)"' >> start.sh && \
    echo 'echo "[STARTUP] Files in current directory:"' >> start.sh && \
    echo 'ls -la' >> start.sh && \
    echo 'echo "[STARTUP] Files in .next directory:"' >> start.sh && \
    echo 'ls -la .next/ 2>/dev/null || echo "No .next directory"' >> start.sh && \
    echo 'echo "[STARTUP] Files in .next/static:"' >> start.sh && \
    echo 'ls -la .next/static/ 2>/dev/null || echo "No .next/static directory"' >> start.sh && \
    echo 'echo "[STARTUP] Environment variables:"' >> start.sh && \
    echo 'echo "NODE_ENV: $NODE_ENV"' >> start.sh && \
    echo 'echo "PORT: $PORT"' >> start.sh && \
    echo 'echo "CLERK_SECRET_KEY exists: $([ -n \"$CLERK_SECRET_KEY\" ] && echo true || echo false)"' >> start.sh && \
    echo 'echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exists: $([ -n \"$NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY\" ] && echo true || echo false)"' >> start.sh && \
    echo 'node scripts/debug-runtime.js 2>&1 || echo "[STARTUP] Debug script failed"' >> start.sh && \
    echo 'echo "[STARTUP] Starting Next.js server..."' >> start.sh && \
    echo 'exec node server.js' >> start.sh && \
    chmod +x start.sh

# Create alternative debug scripts that can be called from different entry points
RUN echo '#!/bin/sh' > debug-quick.sh && \
    echo 'echo "[QUICK-DEBUG] Files exist check:"' >> debug-quick.sh && \
    echo 'echo "server.js: $([ -f server.js ] && echo EXISTS || echo MISSING)"' >> debug-quick.sh && \
    echo 'echo ".next/static: $([ -d .next/static ] && echo EXISTS || echo MISSING)"' >> debug-quick.sh && \
    echo 'echo "scripts/debug-runtime.js: $([ -f scripts/debug-runtime.js ] && echo EXISTS || echo MISSING)"' >> debug-quick.sh && \
    chmod +x debug-quick.sh

# Add debugging to the server.js file itself by creating a wrapper
RUN echo 'console.log("[SERVER-DEBUG] Starting server.js with debugging...");' > server-debug.js && \
    echo 'console.log("[SERVER-DEBUG] Current working directory:", process.cwd());' >> server-debug.js && \
    echo 'console.log("[SERVER-DEBUG] Node version:", process.version);' >> server-debug.js && \
    echo 'const fs = require("fs");' >> server-debug.js && \
    echo 'console.log("[SERVER-DEBUG] server.js exists:", fs.existsSync("server.js"));' >> server-debug.js && \
    echo 'console.log("[SERVER-DEBUG] .next/static exists:", fs.existsSync(".next/static"));' >> server-debug.js && \
    echo 'try {' >> server-debug.js && \
    echo '  console.log("[SERVER-DEBUG] Loading original server.js...");' >> server-debug.js && \
    echo '  require("./server.js");' >> server-debug.js && \
    echo '} catch (error) {' >> server-debug.js && \
    echo '  console.error("[SERVER-DEBUG] Error loading server.js:", error.message);' >> server-debug.js && \
    echo '  console.error("[SERVER-DEBUG] Error stack:", error.stack);' >> server-debug.js && \
    echo '}' >> server-debug.js

EXPOSE 8080
ENV PORT=8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1
CMD ["./start.sh"] 