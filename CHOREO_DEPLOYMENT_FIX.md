# Choreo Deployment Fix Guide

## Issues Identified

Your Choreo deployment is experiencing several database schema and authentication issues:

### 1. Database Schema Mismatch
- **Error**: `Could not find the 'min_stock_level' column of 'inventory_items' in the schema cache`
- **Cause**: The Supabase migration file was missing the `min_stock_level`, `margin`, and `image_url` columns
- **Impact**: Product creation fails because the application expects these columns

### 2. Authentication Issues
- **Error**: Categories and locations returning empty arrays (status 200 but no data)
- **Cause**: APIs require authentication but no admin user exists in the database
- **Impact**: Frontend cannot load categories and locations for product creation

### 3. Missing Default Data
- **Issue**: No default categories, locations, or admin user in the database
- **Impact**: Application appears empty and unusable

## Solutions Implemented

### ✅ 1. Fixed Prisma Schema
Updated `prisma/schema.prisma` to include:
- `margin` field for profit margin calculations
- `imageUrl` field with proper database mapping (`@map("image_url")`)
- Proper field mappings for Supabase compatibility

### ✅ 2. Updated Supabase Migration
Updated `supabase-migration.sql` to include:
- `min_stock_level INTEGER DEFAULT 0`
- `margin DECIMAL(10,2) DEFAULT 0`
- `image_url TEXT`

### ✅ 3. Created Schema Fix Script
Created `supabase-schema-fix.sql` to add missing columns to existing database:
- Adds missing columns with proper defaults
- Creates default categories and locations
- Handles existing data migration

### ✅ 4. Created Choreo Setup Script
Created `scripts/choreo-setup.js` for complete deployment setup:
- Creates admin user with proper authentication
- Sets up roles and permissions
- Creates default categories and locations
- Verifies database connection and setup

### ✅ 5. Fixed API Authentication
Updated `src/app/api/products/route.ts`:
- Added proper authentication checks
- Fixed `createdById` field assignment
- Improved error handling for missing fields

## Deployment Instructions

### Step 1: Apply Database Schema Fix

1. **Login to your Supabase dashboard**
2. **Go to SQL Editor**
3. **Run the schema fix script**:
   ```sql
   -- Copy and paste the contents of supabase-schema-fix.sql
   -- This will add missing columns and create default data
   ```

### Step 2: Run Choreo Setup Script

1. **In your Choreo deployment environment**, run:
   ```bash
   node scripts/choreo-setup.js
   ```

   This script will:
   - ✅ Verify Supabase connection
   - ✅ Create roles (ADMIN, MANAGER, USER)
   - ✅ Create permissions system
   - ✅ Create admin user: `alesierraalta@gmail.com` / `admin123`
   - ✅ Create default categories (General, Electrónicos, Ropa, Hogar)
   - ✅ Create default locations (Almacén Principal, Tienda, Depósito)

### Step 3: Verify the Fix

1. **Login to your application** with:
   - Email: `alesierraalta@gmail.com`
   - Password: `admin123`

2. **Test the following**:
   - ✅ Dashboard loads without errors
   - ✅ Categories dropdown shows default categories
   - ✅ Locations dropdown shows default locations
   - ✅ Product creation works without schema errors

### Step 4: Create a Test Product

Try creating a product with these details:
```json
{
  "name": "Test Product",
  "sku": "TEST-001",
  "price": 100,
  "cost": 50,
  "quantity": 10,
  "minStockLevel": 5,
  "categoryId": "[select from dropdown]",
  "locationId": "[select from dropdown]"
}
```

## Environment Variables Required

Ensure these environment variables are set in Choreo:

```bash
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Authentication
JWT_SECRET=your_jwt_secret_key

# Deployment Flag
CHOREO_DEPLOYMENT=true
NODE_ENV=production
```

## Troubleshooting

### If Categories/Locations Still Empty:
1. Check browser console for authentication errors
2. Verify admin user was created: `SELECT * FROM users WHERE email = 'alesierraalta@gmail.com';`
3. Check if categories exist: `SELECT * FROM categories;`
4. Ensure you're logged in with the admin credentials

### If Product Creation Still Fails:
1. Check if all columns exist: 
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'inventory_items' 
   AND column_name IN ('min_stock_level', 'margin', 'image_url');
   ```
2. Verify the schema fix script ran successfully
3. Check application logs for specific error messages

### If Authentication Issues Persist:
1. Verify JWT_SECRET is set in environment variables
2. Check if roles and permissions were created properly
3. Ensure admin user has the ADMIN role assigned

## Database Schema Verification

Run this query in Supabase SQL Editor to verify the fix:

```sql
-- Check if all required columns exist
SELECT 'inventory_items columns' as info, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'inventory_items' 
AND column_name IN ('min_stock_level', 'margin', 'image_url');

-- Check data counts
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'categories', COUNT(*) FROM categories
UNION ALL
SELECT 'locations', COUNT(*) FROM locations
UNION ALL
SELECT 'roles', COUNT(*) FROM roles
UNION ALL
SELECT 'permissions', COUNT(*) FROM permissions;

-- Check admin user
SELECT email, name, is_active, role:roles(name) 
FROM users 
WHERE email = 'alesierraalta@gmail.com';
```

## Success Indicators

After applying these fixes, you should see:
- ✅ No more "min_stock_level column not found" errors
- ✅ Categories dropdown populated with default categories
- ✅ Locations dropdown populated with default locations
- ✅ Successful product creation
- ✅ Admin user can access all features
- ✅ Dashboard displays properly

## Next Steps

1. **Change default admin password** after first login
2. **Create additional users** as needed
3. **Customize categories and locations** for your business
4. **Test all application features** thoroughly
5. **Set up regular database backups**

## Support

If you encounter any issues after following this guide:
1. Check the Choreo deployment logs
2. Verify all environment variables are set correctly
3. Ensure the Supabase database is accessible
4. Review the browser console for client-side errors

The application should now be fully functional with proper authentication and database schema! 