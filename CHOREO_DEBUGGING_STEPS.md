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

# Fixing the entryCSSFiles Error in Choreo Deployment

This document explains how to fix the `Cannot read properties of undefined (reading 'entryCSSFiles')` error when deploying a Next.js application to Choreo.

## Problem Description

The error occurs when deploying a Next.js application that uses CSS/styling in Choreo. The error message is:

```
[TypeError: Cannot read properties of undefined (reading 'entryCSSFiles')]
```

This happens because the CSS manifest files in the Next.js build output are not properly initialized or are missing the `entryCSSFiles` property.

## Solution Overview

We've implemented several fixes to resolve this issue:

1. **Simplified server.js**: Created a more robust server.js file that initializes CSS manifests at startup
2. **Fixed start script**: Simplified the npm start script to use the server.js directly
3. **Updated Dockerfile**: Created a cleaner Dockerfile with a specific CSS manifest fix script
4. **Updated Next.js config**: Modified next.config.ts to better handle CSS in production builds

## Implementation Details

### 1. Server.js

The server.js file now includes code to check and fix CSS manifest files before starting the Next.js server:

```javascript
// At the beginning of server.js
const fs = require('fs');
const path = require('path');

// Fix CSS manifest files to prevent entryCSSFiles error
try {
  console.log('[SERVER] Fixing CSS manifest files...');
  
  // Fix build-manifest.json
  const buildManifestPath = path.join(process.cwd(), '.next/build-manifest.json');
  if (fs.existsSync(buildManifestPath)) {
    const buildManifest = JSON.parse(fs.readFileSync(buildManifestPath, 'utf8'));
    
    // Ensure entryCSSFiles exists and has proper structure
    if (!buildManifest.entryCSSFiles || typeof buildManifest.entryCSSFiles !== 'object') {
      buildManifest.entryCSSFiles = {
        '/_app': [],
        '/': []
      };
      fs.writeFileSync(buildManifestPath, JSON.stringify(buildManifest, null, 2));
    }
  }
  
  // Fix app-build-manifest.json if it exists
  const appBuildManifestPath = path.join(process.cwd(), '.next/app-build-manifest.json');
  if (fs.existsSync(appBuildManifestPath)) {
    const appBuildManifest = JSON.parse(fs.readFileSync(appBuildManifestPath, 'utf8'));
    
    // Ensure entryCSSFiles exists
    if (!appBuildManifest.entryCSSFiles || typeof appBuildManifest.entryCSSFiles !== 'object') {
      appBuildManifest.entryCSSFiles = {};
      fs.writeFileSync(appBuildManifestPath, JSON.stringify(appBuildManifest, null, 2));
    }
  }
} catch (error) {
  console.log('[SERVER] Error fixing CSS manifests:', error.message);
}

// Rest of the server.js code...
```

### 2. Package.json Start Script

The start script has been simplified to:

```json
"start": "node server.js"
```

### 3. Docker Startup Script

The Docker startup script now includes a specific CSS manifest fix:

```bash
#!/bin/sh
echo "[STARTUP] Starting CSS manifest fix..."
node fix-manifests.js
echo "[STARTUP] Starting server..."
exec node server.js
```

### 4. Next.js Configuration

The next.config.ts file has been updated with settings to better handle CSS:

```typescript
experimental: {
  optimizeCss: false,
  forceSwcTransforms: false,
  optimizePackageImports: [],
  serverMinification: false,
  bundlePagesExternals: false,
},
```

## Deploying to Choreo

When deploying to Choreo:

1. Use the simplified choreo-simple.yaml configuration
2. Make sure your server.js file includes the CSS manifest fix
3. Check that package.json uses the simple start script

## Troubleshooting

If you still encounter CSS-related errors:

1. Check the server logs for specific error messages
2. Verify that the .next/build-manifest.json file contains an entryCSSFiles property
3. Try running the fix-manifests.js script manually before starting the server

For further assistance, please open an issue on the repository. 