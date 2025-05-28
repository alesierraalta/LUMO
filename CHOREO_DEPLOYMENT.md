# Choreo Deployment Guide - LUMO Inventory System

## Pre-Deployment Checklist

### Required Environment Variables (Secrets in Choreo)

Configure these secrets in your Choreo project before deployment:

```bash
# Database Configuration
DATABASE_URL=your_production_database_url

# Clerk Authentication (Production Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_production_key
CLERK_SECRET_KEY=sk_live_your_production_secret_key

# Optional: Disable auth for testing (set to "true" only for testing)
# NEXT_PUBLIC_SKIP_CLERK_AUTH=false
```

### Choreo Project Configuration

1. **Create a new component** in Choreo:
   - Type: `Web Application`
   - Build Pack: `Node.js`
   - Runtime: `Node.js 20`

2. **Configure secrets** in Choreo dashboard:
   - Go to your component → Settings → Secrets
   - Add the environment variables listed above

3. **Connect your repository** and ensure `choreo.yaml` is in the root

## Deployment Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Choreo       │    │   Next.js App    │    │   Database      │
│   Load Balancer│───▶│   (Standalone)   │───▶│   (External)    │
│   Port: 8080   │    │   Port: 8080     │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

## File Configuration Summary

### choreo.yaml
- ✅ Configured for Node.js 20
- ✅ Standalone deployment command
- ✅ Health checks on `/api/health`
- ✅ Port 8080 (Choreo standard)
- ✅ Resource limits: 1 CPU, 1GB RAM
- ✅ Auto-scaling: 1-3 replicas

### Dockerfile
- ✅ Multi-stage build for optimization
- ✅ Production-ready Next.js standalone
- ✅ Health check with wget
- ✅ Proper environment variable handling
- ✅ Prisma client generation

### next.config.ts
- ✅ `output: 'standalone'` for container deployment
- ✅ Optimized for production builds
- ✅ External packages configured

## Build Process

1. **Build Stage** (in Choreo):
   ```bash
   npm ci
   npm run build
   ```

2. **Deploy Stage**:
   ```bash
   node .next/standalone/server.js
   ```

## Health Monitoring

The application includes comprehensive health checks:

- **Endpoint**: `/api/health`
- **Checks**: Environment variables, Clerk configuration
- **Response**: JSON with status and configuration validation

## Local Testing

Test the production build locally:

```bash
# Build production version
npm run build

# Test with production Docker
docker-compose -f docker-compose.prod.yml up

# Or test standalone directly
npm start
```

## Troubleshooting

### Common Issues

1. **"Failed to load Clerk" Error**:
   - Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` starts with `pk_live_`
   - Verify the Clerk app allows your Choreo domain
   - Check that secrets are properly configured in Choreo

2. **Build Failures**:
   - Verify all dependencies are in `package.json`
   - Check that `prisma generate` runs during build
   - Ensure PostCSS configuration is correct

3. **Database Connection Issues**:
   - Verify `DATABASE_URL` secret is configured
   - Check that database allows connections from Choreo IPs
   - Ensure Prisma migrations are applied

### Debug Commands

```bash
# Check health endpoint locally (local dev uses 3000, Choreo uses 8080)
curl http://localhost:3000/api/health

# Test database connection
npm run db:push

# Verify build output
ls -la .next/standalone/
```

## Deployment Commands

```bash
# Local production test
npm run build
npm start

# Docker production test
docker-compose -f docker-compose.prod.yml up --build

# Push to Choreo (automatic on git push)
git push origin main
```

## Performance Optimizations

- **Standalone Output**: Minimal container size
- **Multi-stage Build**: Optimized Docker layers
- **Health Checks**: Fast startup detection
- **Resource Limits**: Efficient scaling
- **Static Asset Optimization**: Next.js optimizations enabled

## Security Configuration

- Environment variables handled via Choreo secrets
- No sensitive data in build artifacts
- Health endpoint doesn't expose secrets
- Production-only authentication validation

---

**Last Updated**: January 2025
**Choreo Version**: Compatible with Choreo v2
**Next.js Version**: 15.3.1 