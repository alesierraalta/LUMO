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
COPY --from=builder /app/scripts/fix-manifests.js ./scripts/fix-manifests.js
COPY --from=builder /app/monkey-patch.js ./monkey-patch.js
COPY --from=builder /app/ultimate-fix.js ./ultimate-fix.js
COPY --from=builder /app/runtime-fix.js ./runtime-fix.js
COPY --from=builder /app/css-fix-server.js ./css-fix-server.js
COPY --from=builder /app/preload-fix.js ./preload-fix.js

# Create scripts directory if not exists
RUN mkdir -p scripts

# Install production dependencies
RUN npm ci --omit=dev

# Make scripts executable
RUN chmod +x scripts/fix-manifests.js && chmod +x preload-fix.js

# Create a startup script
RUN echo '#!/bin/sh' > start.sh && \
    echo 'echo "[STARTUP] Running comprehensive preload fix..."' >> start.sh && \
    echo 'node preload-fix.js' >> start.sh && \
    echo 'echo "[STARTUP] Starting with targeted CSS runtime fix..."' >> start.sh && \
    echo 'if [ -f .next/standalone/server.js ]; then' >> start.sh && \
    echo '    echo "[STARTUP] Using standalone server with targeted CSS fix"' >> start.sh && \
    echo '    exec node -r ./runtime-fix.js .next/standalone/server.js' >> start.sh && \
    echo 'else' >> start.sh && \
    echo '    echo "[STARTUP] Using custom server with targeted CSS fix"' >> start.sh && \
    echo '    exec node -r ./runtime-fix.js server.js' >> start.sh && \
    echo 'fi' >> start.sh && \
    chmod +x start.sh

EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1
CMD ["./start.sh"] 