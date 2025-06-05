# Deployment Checklist - Prisma P6001 Fix

## Pre-Deployment Verification

### ✅ Code Changes Applied
- [ ] `src/lib/prisma.ts` - Removed explicit `datasourceUrl`
- [ ] `src/lib/auth.ts` - Fixed Prisma client access patterns  
- [ ] `scripts/runtime-env-check.js` - Removed `datasourceUrl` override
- [ ] `scripts/choreo-deployment-fix.js` - Created deployment-specific fix
- [ ] `package.json` - Updated start command with Prisma fix

### ✅ Scripts Validation
- [ ] Run: `node scripts/fix-prisma-protocol-error.js`
- [ ] Run: `npm run prisma:validate`
- [ ] Run: `npm run choreo:fix-prisma` (with production env)

### ✅ Build Process
- [ ] Clear build cache: `rm -rf .next`
- [ ] Clean install: `npm ci`
- [ ] Build application: `npm run build`
- [ ] Verify build success (no P6001 errors)

## Deployment Process

### 1. Environment Variables Check
```bash
# Verify these are set in Choreo:
DATABASE_URL=postgresql://... (or postgres://...)
NODE_ENV=production
CHOREO_DEPLOYMENT=true
JWT_SECRET=your-secret-key
```

### 2. Deploy to Choreo
- [ ] Push code changes to repository
- [ ] Trigger Choreo deployment
- [ ] Monitor deployment logs

### 3. Startup Verification
Look for these log entries:
```
✅ prismaConfig: PASSED
✅ Prisma client configuration validated
✅ Database connection assumed healthy
🚀 Ready for deployment!
```

## Post-Deployment Testing

### 1. Application Health Check
- [ ] Visit application URL
- [ ] Check health endpoint: `/api/health`
- [ ] Verify no 500 errors

### 2. Authentication Testing
- [ ] Navigate to login page
- [ ] Attempt login with valid credentials
- [ ] Verify successful authentication
- [ ] Check for P6001 errors in logs

### 3. Database Operations
- [ ] Test inventory operations
- [ ] Verify data persistence
- [ ] Check API endpoints functionality

## Troubleshooting Guide

### If P6001 Error Still Occurs

1. **Check Deployment Logs:**
   ```bash
   # Look for these error patterns:
   Error validating datasource `db`: the URL must start with the protocol `prisma://`
   ```

2. **Verify Start Command:**
   ```bash
   # Should include:
   node scripts/choreo-deployment-fix.js
   ```

3. **Check Environment Variables:**
   ```bash
   # In Choreo console, verify:
   DATABASE_URL format
   CHOREO_DEPLOYMENT=true
   ```

4. **Force Rebuild:**
   - Clear all caches in Choreo
   - Redeploy from scratch
   - Monitor startup logs

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| P6001 during startup | Check preflight scripts order |
| P6001 during login | Verify auth.ts fixes applied |
| Database connection failed | Check DATABASE_URL accessibility |
| Prisma client not found | Ensure `prisma generate` runs |

## Success Criteria

### ✅ Deployment Successful When:
- [ ] No P6001 errors in startup logs
- [ ] Preflight checks all pass
- [ ] Login functionality works
- [ ] Database queries execute
- [ ] Application responds to requests

### ✅ Performance Indicators:
- [ ] Startup time < 30 seconds
- [ ] Login response time < 2 seconds
- [ ] Database queries < 500ms
- [ ] No memory leaks detected

## Rollback Plan

### If Deployment Fails:
1. **Immediate Rollback:**
   - Revert to previous working deployment
   - Restore previous environment variables

2. **Investigation:**
   - Download deployment logs
   - Identify specific error patterns
   - Test fixes locally first

3. **Re-deployment:**
   - Apply additional fixes
   - Test thoroughly in staging
   - Deploy with monitoring

## Contact Information

**For Deployment Issues:**
- Check: `CHOREO_PRISMA_FIX.md`
- Review: Application logs in Choreo console
- Verify: All checklist items completed

---

**Last Updated:** 2025-01-05  
**Version:** 1.0  
**Status:** Ready for Production 