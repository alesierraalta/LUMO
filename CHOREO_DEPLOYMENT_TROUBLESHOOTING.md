# Choreo Deployment Troubleshooting Guide

## Current Issue: Missing Clerk Environment Variables

### Problem Description
The deployment logs show:
```
Error: @clerk/nextjs: Missing publishableKey. You can get your key at https://dashboard.clerk.com/last-active?path=api-keys.
```

### Root Cause Analysis
1. **Port Mismatch**: ✅ **FIXED** - Updated from 3000 to 8080 to match Choreo's platform behavior
2. **Missing Secrets**: Environment variables for Clerk are not being injected at runtime

### Required Actions in Choreo Dashboard

#### 1. Verify Secret Configuration
Go to your Choreo component → **Settings** → **Secrets** and ensure these secrets exist with **EXACT** names:

```bash
# Required Secrets (case-sensitive)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_your_actual_key_here
CLERK_SECRET_KEY=sk_live_your_actual_secret_here
DATABASE_URL=your_database_connection_string
```

#### 2. Verify Secret Names Match choreo.yaml
The secret names in `choreo.yaml` must **exactly match** the names in Choreo dashboard:

```yaml
env:
  - name: CLERK_SECRET_KEY              # Must match secret name
    valueFrom:
      secretRef:
        name: CLERK_SECRET_KEY          # Must match secret name
  - name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    valueFrom:
      secretRef:
        name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
```

### Debugging Steps

#### Step 1: Check Health Endpoint
Once deployed, check the health endpoint to see what environment variables are detected:

```bash
# Replace YOUR_CHOREO_URL with your actual deployment URL
curl https://YOUR_CHOREO_URL/api/health
```

Expected healthy response:
```json
{
  "status": "ok",
  "auth_config": {
    "clerk_publishable_key_set": true,
    "clerk_secret_key_set": true,
    "clerk_publishable_key_prefix": "pk_live_...",
    "clerk_secret_key_prefix": "sk_live_..."
  }
}
```

#### Step 2: Check Deployment Logs
Look for these patterns in Choreo deployment logs:
- ✅ `Ready in XXXms` - App starts successfully
- ❌ `Missing publishableKey` - Secrets not injected
- ❌ `Port 3000` - Should show `Port 8080`

### Common Issues and Solutions

#### Issue 1: Secret Names Don't Match
**Symptom**: Health endpoint shows `clerk_publishable_key_set: false`
**Solution**: Verify secret names in Choreo dashboard exactly match `choreo.yaml`

#### Issue 2: Using Development Keys in Production
**Symptom**: Health endpoint shows `clerk_publishable_key_prefix: "pk_test_..."`
**Solution**: Ensure production Clerk keys (starting with `pk_live_` and `sk_live_`) are configured

#### Issue 3: Secrets Not Propagating
**Symptom**: Secrets exist in dashboard but health endpoint shows them as missing
**Solution**: 
1. Redeploy the component
2. Check if secrets were created before or after the deployment
3. Verify secret values don't have trailing spaces or special characters

### Updated Configuration Files

The following files have been updated to fix the port mismatch:

- ✅ `choreo.yaml` - Updated health checks and expose to port 8080
- ✅ `Dockerfile` - Updated EXPOSE and health check to port 8080  
- ✅ `docker-compose.prod.yml` - Updated port mapping and health check
- ✅ `src/app/api/health/route.ts` - Enhanced debugging information

### Next Steps

1. **Verify Secrets**: Check Choreo dashboard for correct secret configuration
2. **Redeploy**: Trigger a new deployment after verifying secrets
3. **Test Health**: Check `/api/health` endpoint after deployment
4. **Check Logs**: Monitor deployment logs for the `Missing publishableKey` error

### Contact Information

If the issue persists after following these steps:
1. Verify your Clerk application settings allow your Choreo domain
2. Check that production Clerk keys are valid and active
3. Ensure DATABASE_URL is accessible from Choreo infrastructure

---
**Last Updated**: January 2025
**Status**: Ready for deployment testing 