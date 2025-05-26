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

# Install production dependencies and CSS packages
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    npm install --save postcss autoprefixer @tailwindcss/postcss tailwindcss

# Copy standalone build files - fix for CSS loading
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Copy configuration files
COPY --from=builder /app/next.config.ts ./
COPY --from=builder /app/postcss.config.mjs ./
COPY --from=builder /app/components.json ./
COPY --from=builder /app/scripts ./scripts

# Create startup script with debugging
RUN echo '#!/bin/sh' > start.sh && \
    echo 'echo "[STARTUP] Starting application..."' >> start.sh && \
    echo 'node scripts/debug-runtime.js' >> start.sh && \
    echo 'echo "[STARTUP] Debug complete, starting server..."' >> start.sh && \
    echo 'exec node server.js' >> start.sh && \
    chmod +x start.sh

EXPOSE 8080
ENV PORT=8080
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 CMD wget --no-verbose --tries=1 --spider http://localhost:8080/api/health || exit 1
CMD ["./start.sh"] 