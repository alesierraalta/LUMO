# Multi-stage Node.js Dockerfile for LUMO Inventory Management System
# Optimized for Choreo deployment with buildpack bypass

# Stage 1: Base Node.js setup
FROM node:20-slim AS base

# Set working directory
WORKDIR /app

# Install required system dependencies for Node.js and Prisma
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Stage 2: Dependencies installation
FROM base AS deps

# Install dependencies
RUN npm ci --only=production --ignore-scripts

# Stage 3: Build stage
FROM base AS build

# Install all dependencies (including dev dependencies)
RUN npm ci --ignore-scripts

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate --no-engine

# Build the application
RUN npm run build

# Stage 4: Runtime stage
FROM node:20-slim AS runtime

# Set working directory
WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    openssl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd --gid 1001 nodejs
RUN useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Copy built application from build stage
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public
COPY --from=build --chown=nextjs:nodejs /app/prisma ./prisma

# Copy deployment scripts
COPY --from=build --chown=nextjs:nodejs /app/scripts ./scripts

# Copy package.json for reference
COPY --from=build --chown=nextjs:nodejs /app/package.json ./package.json

# Set proper permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["node", "server.js"] 