# 🔧 Fix Authentication 401 Errors on Vercel

## 📋 Problem Summary
Your Vercel deployment is missing the `SUPABASE_SERVICE_ROLE_KEY` environment variable. This key is required for server-side authentication verification in your API routes.

## 🚨 Current Issue
- Frontend authentication works ✅
- API calls return 401 Unauthorized ❌
- Reason: The server can't verify tokens without the service role key

## 🛠️ Solution Steps

### Step 1: Get Your Production Service Role Key

1. Go to your Supabase dashboard:
   ```
   https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk/settings/api
   ```

2. Look for **"Project API keys"** section

3. Find **"service_role"** (secret key)
   - It starts with: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - ⚠️ This is SECRET - never expose it publicly!

4. Copy the entire key

### Step 2: Add to Vercel Environment Variables

1. Go to your Vercel dashboard:
   ```
   https://vercel.com/dashboard
   ```

2. Select your project: **lumo-woad**

3. Go to **Settings** → **Environment Variables**

4. Add the following variable:
   ```
   Name: SUPABASE_SERVICE_ROLE_KEY
   Value: [paste your service_role key from Step 1]
   Environment: ✅ Production, ✅ Preview, ✅ Development
   ```

5. Click **Save**

### Step 3: Add Database URL (if missing)

While you're there, also ensure you have:

1. Get the Database URL from:
   ```
   https://supabase.com/dashboard/project/ubjujxtvlubxowsphvuk/settings/database
   ```

2. Look for **"Connection string"** → **"URI"**

3. Add to Vercel:
   ```
   Name: DATABASE_URL
   Value: postgresql://postgres.[YOUR_REF]:[YOUR_PASSWORD]@aws-0-us-east-2.pooler.supabase.com:6543/postgres
   Environment: ✅ Production, ✅ Preview, ✅ Development
   ```

### Step 4: Verify All Required Variables

Ensure these are ALL present in Vercel:

✅ **NEXT_PUBLIC_SUPABASE_URL**
```
https://ubjujxtvlubxowsphvuk.supabase.co
```

✅ **NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4
```

✅ **SUPABASE_SERVICE_ROLE_KEY** ← THIS IS MISSING!
```
[Get from Supabase dashboard]
```

✅ **SUPABASE_URL**
```
https://ubjujxtvlubxowsphvuk.supabase.co
```

✅ **SUPABASE_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk1MTIzODQsImV4cCI6MjA2NTA4ODM4NH0.SapRqhZCDJypL1fMCiEChK0ehZRR5CSI1fRgt3Za8r4
```

✅ **DATABASE_URL**
```
[Get from Supabase dashboard]
```

✅ **JWT_SECRET**
```
lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==
```

✅ **FORCE_SUPABASE**
```
true
```

### Step 5: Redeploy

1. After adding all variables, go to your Vercel project

2. Go to **Deployments** tab

3. Click on the three dots (⋮) next to your latest deployment

4. Select **Redeploy**

5. Click **Redeploy** in the dialog

### Step 6: Test the Fix

After redeployment (takes ~2-3 minutes):

1. Visit: https://lumo-woad.vercel.app
2. Log in with your credentials
3. Check browser console - API calls should now return 200 OK ✅

## 🎯 Expected Result

- ✅ No more 401 errors
- ✅ API endpoints respond correctly
- ✅ Full functionality restored

## 🔍 How to Verify It's Working

Open browser DevTools console and you should see:
```
✅ Auth context initialized: alesierraalta@gmail.com
GET https://lumo-woad.vercel.app/api/users 200 OK ✅
GET https://lumo-woad.vercel.app/api/inventory 200 OK ✅
GET https://lumo-woad.vercel.app/api/categories 200 OK ✅
```

## 💡 Why This Fixes the Issue

Your API routes use `getCurrentUserFromToken()` which requires the service role key to verify JWT tokens server-side. Without it, Supabase can't validate the authentication, causing 401 errors even though the user is logged in on the frontend.

The service role key has elevated permissions that allow server-side verification of user sessions.

## ⚠️ Security Note

- NEVER expose the service role key in client-side code
- Only use it in server-side API routes
- Keep it in environment variables only

---

## Need Help?

If you still see 401 errors after following these steps:
1. Check that all environment variables are correctly set
2. Ensure you copied the complete service role key
3. Try clearing your browser cache and cookies
4. Check Vercel deployment logs for any errors