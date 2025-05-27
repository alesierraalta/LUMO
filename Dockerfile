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
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Copy source files
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

# Create a production image
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

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

# Copy necessary files from builder
COPY --from=builder /app/package.json /app/package-lock.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
COPY --from=builder /app/server.js ./

# Install production dependencies
RUN npm ci --omit=dev

# Create a fix-manifests script
RUN echo '#!/usr/bin/env node' > fix-manifests.js && \
    echo 'console.log("[FIX-MANIFESTS] Starting CSS manifest fix...");' >> fix-manifests.js && \
    echo 'const fs = require("fs");' >> fix-manifests.js && \
    echo 'const path = require("path");' >> fix-manifests.js && \
    echo '' >> fix-manifests.js && \
    echo '// Ensure .next/static/css directory exists' >> fix-manifests.js && \
    echo 'fs.mkdirSync(path.join(process.cwd(), ".next/static/css"), { recursive: true });' >> fix-manifests.js && \
    echo '' >> fix-manifests.js && \
    echo '// Fix build-manifest.json' >> fix-manifests.js && \
    echo 'const buildManifestPath = path.join(process.cwd(), ".next/build-manifest.json");' >> fix-manifests.js && \
    echo 'if (fs.existsSync(buildManifestPath)) {' >> fix-manifests.js && \
    echo '  try {' >> fix-manifests.js && \
    echo '    const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, "utf8"));' >> fix-manifests.js && \
    echo '    buildManifest.entryCSSFiles = buildManifest.entryCSSFiles || {};' >> fix-manifests.js && \
    echo '    buildManifest.entryCSSFiles["/_app"] = buildManifest.entryCSSFiles["/_app"] || [];' >> fix-manifests.js && \
    echo '    buildManifest.entryCSSFiles["/"] = buildManifest.entryCSSFiles["/"] || [];' >> fix-manifests.js && \
    echo '    fs.writeFileSync(buildManifestPath, JSON.stringify(buildManifest, null, 2));' >> fix-manifests.js && \
    echo '    console.log("[FIX-MANIFESTS] Fixed build-manifest.json");' >> fix-manifests.js && \
    echo '  } catch (e) {' >> fix-manifests.js && \
    echo '    console.error("[FIX-MANIFESTS] Error fixing build-manifest.json:", e.message);' >> fix-manifests.js && \
    echo '  }' >> fix-manifests.js && \
    echo '}' >> fix-manifests.js && \
    echo '' >> fix-manifests.js && \
    echo '// Fix app-build-manifest.json' >> fix-manifests.js && \
    echo 'const appBuildManifestPath = path.join(process.cwd(), ".next/app-build-manifest.json");' >> fix-manifests.js && \
    echo 'if (fs.existsSync(appBuildManifestPath)) {' >> fix-manifests.js && \
    echo '  try {' >> fix-manifests.js && \
    echo '    const appBuildManifest = JSON.parse(fs.readFileSync(appBuildManifestPath, "utf8"));' >> fix-manifests.js && \
    echo '    appBuildManifest.entryCSSFiles = appBuildManifest.entryCSSFiles || {};' >> fix-manifests.js && \
    echo '    fs.writeFileSync(appBuildManifestPath, JSON.stringify(appBuildManifest, null, 2));' >> fix-manifests.js && \
    echo '    console.log("[FIX-MANIFESTS] Fixed app-build-manifest.json");' >> fix-manifests.js && \
    echo '  } catch (e) {' >> fix-manifests.js && \
    echo '    console.error("[FIX-MANIFESTS] Error fixing app-build-manifest.json:", e.message);' >> fix-manifests.js && \
    echo '  }' >> fix-manifests.js && \
    echo '}' >> fix-manifests.js && \
    echo 'console.log("[FIX-MANIFESTS] CSS manifest fix complete");' >> fix-manifests.js && \
    chmod +x fix-manifests.js

# Create a startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'echo "[STARTUP] Starting CSS manifest fix..."' >> start.sh && \
    echo 'node fix-manifests.js' >> start.sh && \
    echo 'echo "[STARTUP] Starting server..."' >> start.sh && \
    echo 'exec node server.js' >> start.sh && \
    chmod +x start.sh

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1
CMD ["./start.sh"] 