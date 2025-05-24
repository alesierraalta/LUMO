# CI/CD Pipeline Documentation

## Overview

LUMO uses a comprehensive CI/CD pipeline built with GitHub Actions to ensure code quality, security, and reliable deployments.

## Pipeline Structure

### 1. Continuous Integration (`ci.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
- **Code Quality**: ESLint, TypeScript checking
- **Database Setup**: Prisma client generation and schema validation
- **Security**: npm audit and vulnerability scanning
- **Build**: Next.js production build
- **Docker Testing**: Container build and health validation

**Key Features:**
- Uses SQLite for testing (faster, no external dependencies)
- Comprehensive health checks with timeout handling
- Artifact cleanup to save storage space
- Parallel execution where possible

### 2. Continuous Deployment (`cd.yml`)

**Triggers:**
- Push to `main` branch
- Published releases

**Jobs:**
- **Build & Push**: Multi-platform Docker images to GitHub Container Registry
- **Database Migrations**: Automated Prisma migrations
- **Deployment**: Production deployment with rollback capabilities
- **Health Checks**: Comprehensive post-deployment validation
- **Notifications**: Success/failure reporting

**Key Features:**
- Multi-platform support (AMD64, ARM64)
- Automatic rollback on deployment failure
- Performance monitoring integration
- Comprehensive health validation

### 3. Security Scanning (`security.yml`)

**Triggers:**
- Scheduled daily at 2 AM UTC
- Pull requests to `main` or `develop` branches
- Manual dispatch

**Jobs:**
- **Dependency Audit**: npm audit with detailed reporting
- **Code Analysis**: Sensitive data pattern detection
- **Security Best Practices**: Dockerfile and configuration checks
- **Report Generation**: Automated security reports

## Environment Configuration

### Required Environment Variables

```bash
# Database
DATABASE_URL=file:./app.db  # SQLite for development
# DATABASE_URL=postgresql://user:pass@host:port/db  # PostgreSQL for production

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# Application
NEXT_PUBLIC_APP_VERSION=development
NODE_ENV=development|production|test
```

### GitHub Secrets (for CI/CD)

Required secrets in your GitHub repository:

```bash
# Testing (optional, fallback values provided)
CLERK_SECRET_KEY_TEST=test_clerk_secret
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY_TEST=test_clerk_publishable

# Production (configure as needed)
PRODUCTION_DATABASE_URL=your_production_database_url
PRODUCTION_CLERK_SECRET_KEY=your_production_clerk_secret
```

## Health Monitoring

### Health Endpoint (`/api/health`)

The enhanced health endpoint provides comprehensive system monitoring:

```typescript
interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  responseTime: string;
  checks: {
    database: 'healthy' | 'unhealthy' | 'unknown';
    auth: 'configured' | 'not_configured' | 'error';
  };
}
```

**Status Levels:**
- `healthy`: All systems operational
- `degraded`: Some non-critical issues detected
- `unhealthy`: Critical systems failing

### Monitoring Integration

The health endpoint is used by:
- CI/CD pipeline for deployment validation
- Container orchestration for health checks
- Monitoring systems for alerting
- Load balancers for traffic routing

## Best Practices

### For Developers

1. **Pre-commit Checks**
   ```bash
   npm run lint        # Check code quality
   npm run build       # Verify build
   npx prisma validate # Validate schema
   ```

2. **Local Testing**
   ```bash
   # Test with SQLite (matches CI environment)
   DATABASE_URL=file:./test.db npx prisma db push
   npm run build
   ```

3. **Security**
   - Never commit sensitive data
   - Use environment variables for configuration
   - Keep dependencies updated

### For Operations

1. **Deployment Monitoring**
   - Monitor health endpoint after deployments
   - Set up alerts for failed health checks
   - Configure rollback procedures

2. **Security**
   - Review security scan reports regularly
   - Address vulnerabilities promptly
   - Monitor for unusual activity

3. **Performance**
   - Track deployment response times
   - Monitor resource usage
   - Optimize based on metrics

## Troubleshooting

### Common Issues

**CI Pipeline Failures:**
```bash
# TypeScript errors
npm run lint:fix
npx tsc --noEmit

# Build failures
rm -rf .next
npm run build

# Docker issues
docker system prune
docker buildx prune
```

**Deployment Issues:**
```bash
# Health check failures
curl -f http://localhost:3000/api/health
docker logs container_name

# Database connectivity
npx prisma db push
npx prisma generate
```

**Security Scan Issues:**
```bash
# Fix vulnerabilities
npm audit fix
npm update

# Review patterns
grep -r "password\|secret" src/
```

### Getting Help

1. Check workflow logs in GitHub Actions
2. Review health endpoint responses
3. Monitor application logs
4. Consult this documentation

## Future Improvements

Planned enhancements to the CI/CD pipeline:

- [ ] Integration testing with database seeding
- [ ] Performance testing and benchmarking
- [ ] Blue-green deployment strategy
- [ ] Automated backup and restore procedures
- [ ] Enhanced monitoring and alerting
- [ ] Code coverage reporting
- [ ] Dependency vulnerability auto-fixing 