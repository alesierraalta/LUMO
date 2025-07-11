# 🔧 Vercel Production 401 Error Troubleshooting Guide

## Problem Description
- **Local Environment**: DELETE requests to `/api/categories/[id]` work perfectly
- **Production Environment**: Same requests return 401 Unauthorized
- **URL**: `https://lumo-woad.vercel.app/api/categories/[id]`

## Root Cause Analysis

### Most Likely Cause: Environment Mismatch
Your local development environment is configured to use the **development Supabase project** (`ndprriqyhddjoixrlqnz`), but your production environment on Vercel is likely configured to use the **production Supabase project** (`ubjujxtvlubxowsphvuk`).

When you authenticate locally, you're getting tokens for the development project, but when you try to access the production API, it's validating against the production project's user database.

## Step-by-Step Solution

### Step 1: Deploy Diagnostic Tools
```bash
# Deploy the diagnostic endpoint
npm run build
vercel --prod
```

### Step 2: Run Production Diagnostics
```bash
# Run the diagnostic script
node scripts/debug-vercel-production.js
```

Or visit directly:
```
https://lumo-woad.vercel.app/api/debug-production
```

### Step 3: Check Vercel Environment Variables
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to Settings > Environment Variables
4. Verify these variables are set:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`
   - `NEXTAUTH_SECRET`
   - `DATABASE_URL`

### Step 4: Verify Environment Configuration

#### Option A: Use Same Environment (Simple Fix)
If you want production to use the same Supabase project as development:

**In Vercel Dashboard Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://ndprriqyhddjoixrlqnz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAxMDg0MDAsImV4cCI6MjA2NTY4NDQwMH0.4rzi6UFGnN6ien_706ETHjBylZMK6jt0vjRvvnJ1J-8
```

#### Option B: Use Separate Environments (Production Setup)
If you want proper environment separation:

**In Vercel Dashboard Environment Variables:**
```
NEXT_PUBLIC_SUPABASE_URL=https://ubjujxtvlubxowsphvuk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[production-anon-key]
SUPABASE_SERVICE_ROLE_KEY=[production-service-key]
JWT_SECRET=[production-jwt-secret]
```

### Step 5: Authentication Strategy

#### For Option A (Same Environment):
- Your existing local authentication will work in production
- No additional setup needed

#### For Option B (Separate Environments):
- Create a user account in the production Supabase project
- Authenticate using the production login form
- Ensure the same user exists in both environments

### Step 6: Common Issues and Solutions

#### Issue 1: CORS Configuration
```javascript
// In your API routes, ensure CORS headers are set
export async function DELETE(request: Request) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'DELETE, GET, POST, PUT',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
  
  // Your existing code...
}
```

#### Issue 2: JWT Secret Mismatch
Ensure the JWT_SECRET in Vercel matches your local environment:
```bash
# Check your local JWT secret
cat .env.local | grep JWT_SECRET
```

#### Issue 3: Cookie Domain Issues
In production, cookies might not be set correctly. Check your authentication code for domain-specific cookie settings.

### Step 7: Testing the Fix
1. Deploy your changes: `vercel --prod`
2. Visit your production site
3. Log in to the production environment
4. Try deleting a category
5. Check browser network tab for the request details

### Step 8: Verification Commands
```bash
# Check production environment
curl https://lumo-woad.vercel.app/api/debug-production

# Test authentication endpoint
curl -X POST https://lumo-woad.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email","password":"your-password"}'
```

## Debugging Tips

### Enable Production Logging
Add logging to your production API routes:
```javascript
console.log('Production Auth Debug:', {
  hasToken: !!token,
  tokenPreview: token?.substring(0, 20),
  userFound: !!user,
  environment: process.env.NODE_ENV
});
```

### Check Vercel Function Logs
```bash
vercel logs --follow
```

### Browser Developer Tools
1. Open Network tab
2. Try to delete a category
3. Check the request headers
4. Verify Authorization header is present
5. Check response details

## Prevention

### Environment Variable Management
- Use different environment files for different stages
- Document all required environment variables
- Use the environment validation system we implemented

### Testing Strategy
- Test production deployments before going live
- Use staging environments for testing
- Implement health checks for authentication

## Quick Fix Summary

**Most likely solution:**
1. Go to Vercel Dashboard > Your Project > Settings > Environment Variables
2. Set `NEXT_PUBLIC_SUPABASE_URL` to your development URL: `https://ndprriqyhddjoixrlqnz.supabase.co`
3. Set `NEXT_PUBLIC_SUPABASE_ANON_KEY` to your development anon key
4. Redeploy: `vercel --prod`
5. Test authentication

This should resolve the 401 error by ensuring both environments use the same Supabase project.