# MIN_STOCK_LEVEL Column Fix Summary

## 🔍 Problem Analysis

The LUMO application was encountering a Supabase error when creating products:

```
Error creating product: {
  code: 'PGRST204',
  details: null,
  hint: null,
  message: "Could not find the 'min_stock_level' column of 'inventory_items' in the schema cache"
}
```

## 🔧 Root Cause

**Schema Mismatch**: The application code was trying to use `minStockLevel` field, but the Supabase database table expected a `min_stock_level` column (snake_case naming).

### Investigation Results:

1. **Current Schema** (`schema.prisma`): Used `minLevel` field for SQLite
2. **PostgreSQL Schema** (`schema.postgresql.prisma`): Used `minStockLevel` field  
3. **Production Code**: Attempted to create inventory items with `minStockLevel` field
4. **Supabase Database**: Expected `min_stock_level` column but it was missing

## ✅ Solution Implemented

### 1. Updated Prisma Schema

**File**: `prisma/schema.prisma`

Added the missing field with proper database column mapping:

```prisma
model InventoryItem {
  // ... existing fields ...
  minLevel       Int      @default(0)
  minStockLevel  Int      @default(0) @map("min_stock_level")  // ← NEW FIELD
  // ... rest of fields ...
}
```

**Key Points**:
- `minStockLevel` field maps to `min_stock_level` database column
- Maintained `minLevel` for backward compatibility
- Both fields default to `0`

### 2. Created SQL Migration Script

**File**: `fix-min-stock-level.sql`

```sql
-- Add missing min_stock_level column to Supabase
ALTER TABLE inventory_items 
ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5 NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_inventory_items_min_stock_level 
ON inventory_items(min_stock_level);
```

### 3. Automated Fix Script

**File**: `fix-min-stock-level.js`

Features:
- ✅ Automatic database connection testing
- ✅ SQL migration application (if psql available)
- ✅ Prisma client regeneration
- ✅ Verification testing
- ✅ Fallback instructions for manual execution

### 4. Added NPM Script

**File**: `package.json`

```json
{
  "scripts": {
    "fix:min-stock-level": "node fix-min-stock-level.js"
  }
}
```

## 🚀 How to Apply the Fix

### Option 1: Automatic Fix (Recommended)

```bash
npm run fix:min-stock-level
```

### Option 2: Manual Fix

1. **Apply SQL Migration in Supabase Dashboard**:
   ```sql
   ALTER TABLE inventory_items 
   ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 5 NOT NULL;
   
   CREATE INDEX IF NOT EXISTS idx_inventory_items_min_stock_level 
   ON inventory_items(min_stock_level);
   ```

2. **Regenerate Prisma Client**:
   ```bash
   npx prisma generate
   ```

3. **Deploy Updated Schema**

## 🔍 Verification

After applying the fix, test product creation:

1. Navigate to `/inventory/add`
2. Create a new product with minimum stock level
3. Verify no more `PGRST204` errors

## 📋 Files Modified

- ✅ `prisma/schema.prisma` - Added `minStockLevel` field
- ✅ `fix-min-stock-level.sql` - SQL migration script
- ✅ `fix-min-stock-level.js` - Automated fix script
- ✅ `package.json` - Added npm script
- ✅ `MIN_STOCK_LEVEL_FIX_SUMMARY.md` - This documentation

## 🎯 Expected Outcome

- ✅ Product creation works without `PGRST204` errors
- ✅ `minStockLevel` field properly maps to `min_stock_level` column
- ✅ Backward compatibility maintained with `minLevel` field
- ✅ Database schema synchronized with application code

## 🔄 Next Steps

1. **Deploy the fix** to your production environment
2. **Run the migration** in Supabase (automatically or manually)
3. **Test product creation** functionality
4. **Monitor logs** for any remaining schema issues

## 🛠️ Troubleshooting

If the fix doesn't work immediately:

1. **Check Supabase Connection**: Ensure `DATABASE_URL` is correctly configured
2. **Verify Column Addition**: Check in Supabase dashboard that `min_stock_level` column exists
3. **Regenerate Client**: Run `npx prisma generate` again
4. **Restart Application**: Ensure new Prisma client is loaded

## 📞 Support

If issues persist, check:
- Supabase dashboard for table structure
- Application logs for detailed error messages
- Network connectivity to Supabase
- Environment variable configuration 