# Choreo Prisma P6001 Error Fix

## Problem Description

**Error:** `Error validating datasource 'db': the URL must start with the protocol 'prisma://'`  
**Error Code:** P6001  
**Environment:** Choreo deployment  
**Impact:** Complete authentication failure

## Root Cause

The error occurs because:
1. **Mixed Protocol Expectations**: Some parts of the code expect `prisma://` (Prisma Accelerate) while others use `postgresql://`
2. **Explicit datasourceUrl Overrides**: PrismaClient instances with explicit `datasourceUrl` configurations
3. **Build Cache Issues**: Cached build files with old configurations

## Solution Applied

### 1. Fixed PrismaClient Configurations

**Before (Problematic):**
```typescript
const client = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL, // ❌ Explicit override
});
```

**After (Fixed):**
```typescript
const client = new PrismaClient({
  // ✅ Uses schema.prisma configuration automatically
});
```

### 2. Updated Files

- ✅ `src/lib/prisma.ts` - Removed explicit datasourceUrl
- ✅ `src/lib/auth.ts` - Fixed Prisma client access patterns
- ✅ `scripts/runtime-env-check.js` - Removed datasourceUrl override
- ✅ `scripts/choreo-preflight.js` - Added Prisma validation
- ✅ `src/lib/database-url-fix.ts` - Enhanced URL format handling

### 3. Added Deployment Scripts

**New Scripts:**
- `scripts/validate-prisma-config.js` - Validates Prisma configuration
- `scripts/choreo-deployment-fix.js` - Choreo-specific fixes
- `scripts/fix-prisma-protocol-error.js` - Comprehensive fix script

### 4. Updated Start Process

**New Start Command:**
```bash
node scripts/choreo-preflight.js && 
node scripts/choreo-deployment-fix.js && 
node scripts/ensure-import-dirs.js && 
node .next/standalone/server.js
```

## Deployment Instructions

### For Immediate Fix (Choreo Environment)

1. **Rebuild the application:**
   ```bash
   npm run build
   ```

2. **Clear build cache if needed:**
   ```bash
   rm -rf .next
   npm run build
   ```

3. **Deploy to Choreo with updated configuration**

### For Local Testing

1. **Run the fix script:**
   ```bash
   npm run choreo:fix-prisma
   ```

2. **Validate configuration:**
   ```bash
   npm run prisma:validate
   ```

3. **Test locally:**
   ```bash
   npm run start:debug
   ```

## Verification Steps

### 1. Check Preflight Logs
Look for these success indicators:
```
✅ prismaConfig: PASSED
✅ Prisma client configuration validated
✅ Database connection assumed healthy
```

### 2. Test Login Functionality
- Navigate to login page
- Attempt login with valid credentials
- Should not see P6001 errors

### 3. Monitor Application Logs
Watch for:
- ✅ Successful Prisma client initialization
- ✅ No P6001 errors during API calls
- ✅ Successful database queries

## Troubleshooting

### If P6001 Error Persists

1. **Check for remaining explicit datasourceUrl:**
   ```bash
   grep -r "datasourceUrl" src/ scripts/
   ```

2. **Verify DATABASE_URL format:**
   ```bash
   echo $DATABASE_URL | head -c 50
   ```

3. **Clear all caches:**
   ```bash
   rm -rf .next node_modules/.prisma
   npm install
   npm run build
   ```

4. **Check Prisma schema:**
   ```bash
   cat prisma/schema.prisma | grep -A 5 "datasource"
   ```

### Common Issues

**Issue:** "Prisma client not initialized"
**Solution:** Ensure `src/lib/prisma.ts` exports the client correctly

**Issue:** "Database connection failed"
**Solution:** Verify DATABASE_URL is accessible from Choreo environment

**Issue:** "Model not found"
**Solution:** Run `npx prisma generate` to regenerate client

## Environment Variables

### Required for Choreo
```bash
DATABASE_URL=postgresql://user:pass@host:port/db
NODE_ENV=production
CHOREO_DEPLOYMENT=true
JWT_SECRET=your-secret-key
```

### URL Format Support
- ✅ `postgresql://` - Standard PostgreSQL
- ✅ `postgres://` - Auto-converted to postgresql://
- ✅ `prisma://` - Prisma Accelerate (if configured)

## Prevention

### Best Practices
1. **Never use explicit datasourceUrl** in PrismaClient constructor
2. **Always use schema.prisma configuration** for database connection
3. **Test locally** before deploying to Choreo
4. **Monitor logs** for P6001 errors during deployment

### Code Review Checklist
- [ ] No `datasourceUrl` in PrismaClient constructors
- [ ] All Prisma imports use centralized client from `src/lib/prisma.ts`
- [ ] Environment variables properly configured
- [ ] Build process includes Prisma generation

## Success Indicators

✅ **Preflight checks pass**  
✅ **No P6001 errors in logs**  
✅ **Login functionality works**  
✅ **Database queries execute successfully**  
✅ **Application starts without errors**

---

**Last Updated:** 2025-01-05  
**Status:** ✅ RESOLVED  
**Next Review:** After next deployment 