@echo off
echo ========================================
echo REMOVING PRISMA AND SQLITE FILES
echo ========================================

echo.
echo 1. Removing Prisma directory...
if exist "prisma" (
    rmdir /s /q "prisma"
    echo ✅ Removed /prisma directory
) else (
    echo ⚠️ /prisma directory not found
)

echo.
echo 2. Removing SQLite database files...
if exist "dev.db" (
    del /f "dev.db"
    echo ✅ Removed dev.db
) else (
    echo ⚠️ dev.db not found
)

if exist "dev.db-journal" (
    del /f "dev.db-journal"
    echo ✅ Removed dev.db-journal
) else (
    echo ⚠️ dev.db-journal not found
)

echo.
echo 3. Removing Prisma-related files in src/lib...
if exist "src\lib\prisma-safe.ts" (
    del /f "src\lib\prisma-safe.ts"
    echo ✅ Removed prisma-safe.ts
)

if exist "src\lib\prisma-monkey-patch.ts" (
    del /f "src\lib\prisma-monkey-patch.ts"
    echo ✅ Removed prisma-monkey-patch.ts
)

if exist "src\lib\prisma-monkey-patch.d.ts" (
    del /f "src\lib\prisma-monkey-patch.d.ts"
    echo ✅ Removed prisma-monkey-patch.d.ts
)

if exist "src\lib\prisma-monkey-patch.js" (
    del /f "src\lib\prisma-monkey-patch.js"
    echo ✅ Removed prisma-monkey-patch.js
)

if exist "src\lib\runtime-p6001-patch.ts" (
    del /f "src\lib\runtime-p6001-patch.ts"
    echo ✅ Removed runtime-p6001-patch.ts
)

if exist "src\lib\db\enhanced-prisma.ts" (
    del /f "src\lib\db\enhanced-prisma.ts"
    echo ✅ Removed enhanced-prisma.ts
)

echo.
echo 4. Removing Prisma-related scripts...
for %%f in (
    "scripts\*prisma*.js"
    "scripts\*p6001*.js"
    "scripts\fix-import-session*.js"
    "scripts\apply-import-session-fix.js"
    "scripts\audit-import-session-migrations.js"
    "scripts\choreo-deployment-fix.js"
    "scripts\ensure-prisma-accelerate.js"
    "scripts\fix-prisma-*.js"
    "scripts\validate-prisma-config.js"
    "scripts\verify-prisma-client.js"
    "scripts\test-prisma-accelerate.js"
    "scripts\runtime-prisma-fix.js"
) do (
    if exist "%%f" (
        del /f "%%f"
        echo ✅ Removed %%f
    )
)

echo.
echo 5. Removing other Prisma-related files...
if exist "runtime-schema-check.js" (
    del /f "runtime-schema-check.js"
    echo ✅ Removed runtime-schema-check.js
)

if exist "fix-min-stock-level.js" (
    del /f "fix-min-stock-level.js"
    echo ✅ Removed fix-min-stock-level.js
)

echo.
echo 6. Removing Prisma references from types...
if exist "src\types\global.ts" (
    echo Updating src\types\global.ts to remove Prisma imports...
    powershell -Command "(Get-Content 'src\types\global.ts') -replace \"import.*@prisma/client.*\", '' | Set-Content 'src\types\global.ts'"
    echo ✅ Updated global.ts
)

echo.
echo ========================================
echo PRISMA REMOVAL COMPLETE!
echo ========================================
echo.
echo Next steps:
echo 1. Copy environment variables from supabase.env to your .env.local
echo 2. Run: npm install (to update dependencies)
echo 3. Update any remaining imports to use src/lib/db-supabase.ts
echo 4. Test the application
echo.
pause 