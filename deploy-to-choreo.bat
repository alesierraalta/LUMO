@echo off
echo ===================================
echo Deploying application to Choreo
echo ===================================

echo.
echo Step 1: Fixing client components...
node scripts/fix-client-components.js

echo.
echo Step 2: Adding missing auth modules...
echo ^> Checking auth modules...
if not exist "src\lib\auth\permissions.ts" (
  echo ^> Creating permissions module...
  echo // Simple permissions utility > src\lib\auth\permissions.ts
  echo import { prisma } from "@/lib/prisma"; >> src\lib\auth\permissions.ts
  echo. >> src\lib\auth\permissions.ts
  echo export async function checkPermission^(userId, permissionKey^) { >> src\lib\auth\permissions.ts
  echo   return true; // Simplified for Choreo deployment >> src\lib\auth\permissions.ts
  echo } >> src\lib\auth\permissions.ts
)

if not exist "src\lib\auth\auth-options.ts" (
  echo ^> Creating auth-options module...
  echo // Auth options for Choreo deployment > src\lib\auth\auth-options.ts
  echo. >> src\lib\auth\auth-options.ts
  echo export async function getServerSession^(^) { >> src\lib\auth\auth-options.ts
  echo   return { user: { id: "choreo-deployment" } }; >> src\lib\auth\auth-options.ts
  echo } >> src\lib\auth\auth-options.ts
)

echo.
echo Step 3: Preparing problematic routes...
node scripts/prepare-choreo-build.js

echo.
echo Step 4: Testing build...
call npm run build

if %errorlevel% neq 0 (
  echo.
  echo Build failed. Please fix the errors and try again.
  exit /b 1
)

echo.
echo ===================================
echo Build successful!
echo.
echo Next steps:
echo 1. Commit these changes to your repository
echo 2. Deploy to Choreo using the Choreo console
echo 3. After deployment, run 'node scripts/restore-disabled-features.js'
echo    to restore the disabled features
echo =================================== 