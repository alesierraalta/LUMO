# Build stage - Install ALL dependencies here
FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev) in build stage
RUN npm ci --include=dev && npm cache clean --force

# Copy source code
COPY . .

# Build the application with all optimizations
RUN npm run build

# Production stage - Zero runtime dependencies
FROM node:20-alpine AS runner
WORKDIR /app

# Create user
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Copy ONLY the standalone build (no source code)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 8080

# Force production environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8080

# Start the pre-built server directly
CMD ["node", "server.js"]
