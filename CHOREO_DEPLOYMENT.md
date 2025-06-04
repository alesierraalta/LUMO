# Choreo Deployment Guide

This guide provides step-by-step instructions for deploying this application to Choreo.

## Prerequisites

- GitHub repository with access to the Choreo platform
- Proper environment variables configured in Choreo

## Automatic Fixes

The application includes several automatic fixes for Choreo deployment:

1. `scripts/prepare-choreo-build.js`: Temporarily disables problematic features during build
2. `scripts/fix-client-components.js`: Adds 'use client' directive to components that need it
3. `scripts/fix-prisma-binaries.js`: Ensures Prisma binary targets are configured correctly
4. `scripts/manifest-validator.js`: Validates and repairs Next.js manifests
5. `scripts/restore-disabled-features.js`: Restores disabled features after deployment

These scripts run automatically during the build process in Choreo.

## Deployment Steps

### 1. Prepare Environment Variables

Ensure you have the following environment variables set in Choreo:

```
DATABASE_URL=postgresql://user:password@host:port/dbname
NEXTAUTH_URL=https://your-choreo-app-url
NEXTAUTH_SECRET=your-secret-here
```

### 2. Deploy to Choreo

1. Log in to the Choreo console
2. Create a new component
3. Connect to your GitHub repository
4. Select the main branch or your deployment branch
5. Configure the build settings:
   - Build Command: `npm run build`
   - Start Command: `npm start` 
6. Add the required environment variables
7. Deploy the application

### 3. Verify Deployment

After deployment, verify the following:

1. The application is running correctly
2. Database connections are working
3. API endpoints are responding as expected

### 4. Troubleshooting

If you encounter issues during deployment:

1. Check the Choreo build logs for specific errors
2. Verify environment variables are correctly set
3. Ensure database connectivity is working
4. Check that Prisma binary targets are correctly configured

## Post-Deployment

After successful deployment, you can restore any disabled features:

```bash
node scripts/restore-disabled-features.js
```

## Known Issues

- The duplicate detector feature is temporarily disabled in production
- Some auth-related paths may be modified for Choreo compatibility

## Additional Information

For more detailed information about specific Choreo features, refer to the following documents:

- [CHOREO_AUTH_SOLUTION.md](./CHOREO_AUTH_SOLUTION.md)
- [CHOREO_ENVIRONMENT_VARIABLES.md](./CHOREO_ENVIRONMENT_VARIABLES.md)
- [CHOREO_SSL_FIX.md](./CHOREO_SSL_FIX.md)

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