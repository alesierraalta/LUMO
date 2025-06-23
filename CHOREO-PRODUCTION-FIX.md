# Choreo Production Timeout Fix - Deployment Instructions

## Issue Diagnosed
- **Error**: "context marked done while waiting for workload reach > 0 replicas: context deadline exceeded"
- **Root Cause**: Health checks taking too long, causing deployment timeout
- **Solution**: Optimized configuration with faster startup and reduced resource requirements

## Files Created
1. `choreo-optimized.yaml` - Optimized Choreo configuration
2. `Dockerfile-optimized` - Faster startup Dockerfile
3. `src/app/api/health/route-enhanced.ts` - Enhanced health endpoint
4. `scripts/choreo-startup.sh` - Startup optimization script

## Deployment Steps

### 1. Replace Current Configuration
```bash
# Backup current configuration
cp choreo.yaml choreo-backup.yaml
cp Dockerfile Dockerfile-backup

# Apply optimized configuration
cp choreo-optimized.yaml choreo.yaml
cp Dockerfile-optimized Dockerfile
cp src/app/api/health/route-enhanced.ts src/app/api/health/route.ts
```

### 2. Key Optimizations Applied

#### Health Check Timing
- **Readiness Probe**: 20s initial delay (was 45s)
- **Liveness Probe**: 30s initial delay (was 60s)  
- **Startup Probe**: 10s initial delay, 20 failure threshold
- **Check Intervals**: Reduced to 5-15s for faster feedback

#### Resource Allocation
- **CPU**: Reduced to 2 units (was 4)
- **Memory**: Reduced to 4Gi (was 8Gi)
- **Replicas**: Conservative 1-3 (was 2-5)

#### Container Optimizations
- **Node Memory**: Reduced to 2048MB for faster startup
- **Health Check**: 15s intervals with 5s timeout
- **Dependencies**: Minimal Alpine image with curl

### 3. Deploy to Choreo
1. Commit changes to your repository
2. Push to trigger Choreo deployment
3. Monitor deployment logs for faster startup

### 4. Verification
Run the diagnostic script to verify fix:
```bash
node scripts/diagnose-choreo-production.js
```

## Expected Results
- **Startup Time**: < 30 seconds (was timing out)
- **Health Checks**: Pass within 20 seconds
- **Resource Usage**: Lower CPU/memory for stable deployment
- **Deployment Success**: No more "context deadline exceeded" errors

## Monitoring
- Check Choreo console for deployment status
- Monitor application logs for startup performance
- Verify health endpoint responds quickly

## Rollback Plan
If issues occur, restore backup files:
```bash
cp choreo-backup.yaml choreo.yaml
cp Dockerfile-backup Dockerfile
```

## Contact
If deployment still fails, check:
1. Choreo console logs
2. Container startup logs  
3. Resource allocation in Choreo dashboard
4. Environment variables configuration