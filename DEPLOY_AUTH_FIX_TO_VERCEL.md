# Deploy Authentication Fix to Vercel

## Current Status
✅ Code changes have been implemented locally  
❌ Changes NOT deployed to production (Vercel)

## What Was Changed
1. Created `src/lib/api-client.ts` - Centralized API client with automatic auth headers
2. Updated `src/app/(main)/dashboard/page.tsx` - Now uses `apiGet()` instead of plain `fetch()`
3. Updated `src/app/(main)/inventory/page.tsx` - Now uses `apiGet()` for authenticated requests
4. Updated `src/app/(main)/categories/page.tsx` - Now uses `apiGet()` for authenticated requests

## Deployment Steps

### Option 1: Automatic Deployment (if connected to Git)
1. Commit the changes:
   ```bash
   git add -A
   git commit -m "fix: Add authentication headers to API requests"
   git push origin main
   ```
2. Vercel will automatically deploy the changes

### Option 2: Manual Deployment via Vercel CLI
1. Install Vercel CLI (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. Deploy to production:
   ```bash
   vercel --prod
   ```

### Option 3: Manual Deployment via Dashboard
1. Build the project locally:
   ```bash
   npm run build
   ```

2. Go to Vercel Dashboard: https://vercel.com/dashboard
3. Select your project: **lumo-woad**
4. Click "Import" and upload your project

## Verification Steps
After deployment:

1. Visit https://lumo-woad.vercel.app/dashboard
2. Open browser console (F12)
3. Check that API calls return 200 OK instead of 401
4. Verify data loads correctly in Dashboard, Inventory, and Categories pages

## What This Fixes
- API calls will include `Authorization: Bearer <token>` headers
- Backend will be able to verify the user's authentication
- All 401 Unauthorized errors will be resolved

## Technical Details
The issue was that frontend API calls weren't including the Supabase session token in the Authorization header. The backend API routes require this token to authenticate requests using `getCurrentUserFromToken()`.

The solution adds authentication headers automatically to all API requests using the centralized `apiGet()`, `apiPost()`, `apiPut()`, and `apiDelete()` functions.