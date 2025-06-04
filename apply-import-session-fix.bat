@echo off
echo ===== Running ImportSession Schema Fix =====

echo 1. Applying migration...
npm run fix:import-session

echo 2. Fix complete! Starting the application...
npm run start 