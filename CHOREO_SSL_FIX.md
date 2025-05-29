# Choreo SSL Certificate Fix for Clerk Authentication

## Problem Description

When deploying to Choreo with production Clerk keys, the following SSL certificate error occurs:

```
GET https://clerk.42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev/npm/@clerk/clerk-js@5/dist/clerk.browser.js 
net::ERR_CERT_COMMON_NAME_INVALID
```

This happens because:
1. Clerk tries to load its JavaScript from a subdomain of your Choreo deployment
2. The Choreo-generated subdomain (`42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev`) doesn't have a valid SSL certificate for Clerk's assets
3. The browser rejects the connection due to certificate mismatch

## Solution Implemented

### 1. ClerkSSLFix Component (`/src/components/clerk-ssl-fix.tsx`)
- **Purpose**: Intercepts problematic Clerk JS requests on the client side
- **Method**: Overrides `window.fetch` to redirect Clerk requests to the official CDN
- **Target**: Requests to `*.choreoapps.dev/npm/@clerk/clerk-js*`
- **Redirect**: `https://js.clerk.com/v1/clerk.js`

### 2. Next.js Configuration (`/next.config.js`)
- **Headers**: Added security headers including HSTS
- **Rewrites**: Proxy `/clerk/*` requests to `https://js.clerk.com/*`
- **CORS**: Configured proper CORS headers for API routes

### 3. Environment Configuration (`/public/env-config.js`)
- **Detection**: Automatically detects Choreo environment
- **Override**: Sets up Clerk configuration to use official CDN
- **Fallback**: Provides configuration for when Clerk loads

### 4. Layout Integration (`/src/app/layout.tsx`)
- **Preload**: Added preload link for Clerk JS from official CDN
- **Component**: Integrated ClerkSSLFix component
- **Configuration**: Applied proper Clerk appearance settings

## How It Works

1. **Detection Phase**:
   ```javascript
   const isChoreo = window.location.hostname.includes('.choreoapps.dev');
   ```

2. **Interception Phase**:
   ```javascript
   window.fetch = function(input, init) {
     const url = typeof input === 'string' ? input : input.url;
     if (url.includes('.choreoapps.dev/npm/@clerk/clerk-js')) {
       return originalFetch('https://js.clerk.com/v1/clerk.js', init);
     }
     return originalFetch(input, init);
   };
   ```

3. **Preload Phase**:
   ```html
   <link rel="preload" href="https://js.clerk.com/v1/clerk.js" as="script" />
   ```

## Testing the Fix

### Check Debug Endpoint
```bash
curl https://your-choreo-app.choreoapps.dev/api/clerk-debug
```

### Expected Response
```json
{
  "clerkConfig": {
    "isChoreo": true,
    "domain": "js.clerk.com"
  },
  "connectivityTest": {
    "accessible": true,
    "status": 200
  },
  "solution": {
    "status": "Active"
  }
}
```

### Browser Console Logs
```
[CLERK-SSL-FIX] Applying SSL certificate fix for Choreo
[CLERK-SSL-FIX] Intercepting Clerk request: https://clerk.42bcb...
[CLERK-SSL-FIX] Redirecting to: https://js.clerk.com/v1/clerk.js
[CLERK-SSL-FIX] Clerk loaded successfully from official CDN
```

## Verification Steps

1. **Deploy to Choreo**: Ensure all changes are deployed
2. **Check Browser Console**: Look for SSL fix logs
3. **Test Authentication**: Verify login/logout works
4. **Network Tab**: Confirm requests go to `js.clerk.com`
5. **Debug Endpoint**: Check `/api/clerk-debug` for status

## Alternative Solutions

If this fix doesn't work, consider:

1. **Use Development Keys**: Switch to `pk_test_*` keys for testing
2. **Custom Domain**: Configure a custom domain with proper SSL
3. **Clerk Configuration**: Update Clerk dashboard settings for your domain
4. **Environment Variables**: Set `NEXT_PUBLIC_SKIP_CLERK_AUTH=true` temporarily

## Files Modified

- `/src/components/clerk-ssl-fix.tsx` - Main fix component
- `/src/app/layout.tsx` - Integration and preload
- `/next.config.js` - Rewrites and headers
- `/public/env-config.js` - Client-side configuration
- `/src/lib/clerk-config.ts` - Choreo detection and config
- `/src/app/api/clerk-debug/route.ts` - Debug endpoint

## Environment Variables

Ensure these are set in your Choreo deployment:

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CHOREO_DEPLOYMENT=true
NODE_ENV=production
```

## Monitoring

Monitor these logs for successful operation:
- `[CLERK-SSL-FIX] Applying SSL certificate fix for Choreo`
- `[CLERK-SSL-FIX] Clerk loaded successfully from official CDN`
- No `net::ERR_CERT_COMMON_NAME_INVALID` errors in console 