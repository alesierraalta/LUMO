# Choreo Debugging: Missing Clerk Environment Variables

## Current Status
✅ Port configuration fixed (8080)  
❌ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY not reaching middleware

## All Possible Causes

### 1. **Secret Configuration Issues**
- Secret names don't match exactly (case-sensitive)
- Secrets created after deployment
- Secret values have trailing spaces or invisible characters
- Using wrong secret type in Choreo dashboard

### 2. **Build vs Runtime Variable Issues**
- NEXT_PUBLIC_ variables must be available at build time
- Build uses dummy keys, runtime should use real secrets
- Environment variable injection timing problems

### 3. **Middleware Execution Timing**
- Middleware runs before environment variables are fully loaded
- Next.js standalone server environment loading issues
- Docker container environment propagation problems

### 4. **Platform-Specific Issues**
- Choreo platform secret injection delays
- Container restart required after secret changes
- Build cache containing old environment values

## Step-by-Step Debugging Plan

### Step 1: Verify Secret Configuration in Choreo
Go to **Choreo Dashboard** → **Your Component** → **Settings** → **Secrets**

**Required Secrets** (exact names):
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
DATABASE_URL
```

**Verify**:
- [ ] Secret names match exactly (no typos)
- [ ] Values start with `pk_live_` and `sk_live_`
- [ ] No trailing spaces in values
- [ ] Secrets were saved successfully

### Step 2: Check Environment Debug Endpoint
```bash
curl https://your-choreo-url/api/debug-env
```

**Look for**:
```json
{
  "clerk_variables": {
    "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY": {
      "exists": false,  // ← Should be true
      "prefix": "MISSING"  // ← Should show "pk_live_..."
    }
  }
}
```

### Step 3: Force New Deployment
- Make a small code change (add a comment)
- Push to trigger new build
- Secrets must exist BEFORE deployment starts

### Step 4: Check Build Logs
Look for these patterns:
```
✅ Build variables: pk_test_dummy-key-for-build (expected)
✅ Runtime variables: pk_live_... (should show real key prefix)
❌ Runtime variables: pk_test_dummy-key-for-build (means secrets not injected)
```

### Step 5: Verify Choreo Secret Reference Syntax
In `choreo.yaml`, verify exact syntax:
```yaml
env:
  - name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
    valueFrom:
      secretRef:
        name: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY  # Must match dashboard exactly
```

## Advanced Debugging

### Option 1: Temporary Skip Auth
Add this to Choreo secrets **temporarily**:
```
NEXT_PUBLIC_SKIP_CLERK_AUTH=true
```
This will bypass authentication to test if the app works otherwise.

### Option 2: Add Console Logging
Modify `src/middleware.ts` to log environment variables:
```typescript
export default clerkMiddleware(async (auth, req) => {
  // Debug logging
  console.log('Middleware - NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY exists:', !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);
  console.log('Middleware - CLERK_SECRET_KEY exists:', !!process.env.CLERK_SECRET_KEY);
  
  // Your existing middleware code...
});
```

### Option 3: Check Container Environment
If you have container access:
```bash
printenv | grep CLERK
printenv | grep NEXT_PUBLIC
```

## Common Solutions

### Solution 1: Secret Name Mismatch
**Problem**: `CLERK_PUBLISHABLE_KEY` instead of `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
**Fix**: Use exact name `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`

### Solution 2: Secret Creation Timing
**Problem**: Secrets created after deployment
**Fix**: Create all secrets first, then deploy

### Solution 3: Cache Issues
**Problem**: Build cache contains old values
**Fix**: Clear build cache or make code change to force rebuild

### Solution 4: Platform Secret Propagation
**Problem**: Choreo takes time to propagate secrets
**Fix**: Wait 5-10 minutes after creating secrets, then redeploy

## Next Actions

1. **Immediate**: Check your Choreo dashboard secrets configuration
2. **Test**: Access `/api/debug-env` endpoint after next deployment
3. **Compare**: Check if secret names in dashboard match `choreo.yaml` exactly
4. **Verify**: Ensure secrets were created BEFORE the deployment

---
**If all secrets are configured correctly and the issue persists, there may be a Choreo platform issue with secret injection.** 