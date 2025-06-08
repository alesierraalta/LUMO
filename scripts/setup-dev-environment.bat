@echo off
echo Setting up development environment...
echo.

echo 1. Setting DATABASE_URL for SQLite
set DATABASE_URL=file:./dev.db

echo 2. Clearing caches...
if exist .next rmdir /s /q .next
if exist node_modules\.prisma rmdir /s /q node_modules\.prisma

echo 3. Generating Prisma client...
npx prisma generate

echo 4. Creating/updating database...
npx prisma db push

echo 5. Testing connection...
node scripts/test-driver-adapter-fix.js

echo.
echo ✅ Development environment ready!
echo.
echo To start development server, run:
echo npm run dev
echo.
echo Make sure to set DATABASE_URL before running dev server:
echo $env:DATABASE_URL="file:./dev.db"; npm run dev
pause 