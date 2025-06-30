@echo off
echo.
echo ═══════════════════════════════════════════════════════════════
echo 🔍 CHOREO ENVIRONMENT VARIABLES VERIFICATION
echo ═══════════════════════════════════════════════════════════════
echo.

echo 📋 Checking current Choreo deployment configuration...
echo.

echo 🌐 Calling debug endpoint: https://lumo-1615540597.choreoapis.dev/api/debug-env-config
echo.

curl -s "https://lumo-1615540597.choreoapis.dev/api/debug-env-config" > choreo-config-check.json

if %ERRORLEVEL% EQU 0 (
    echo ✅ Successfully retrieved configuration status!
    echo.
    echo 📄 Configuration report saved to: choreo-config-check.json
    echo.
    echo 🔍 Opening configuration report...
    type choreo-config-check.json | jq . 2>nul || (
        echo ⚠️  jq not found, showing raw JSON:
        echo.
        type choreo-config-check.json
    )
) else (
    echo ❌ Failed to connect to debug endpoint
    echo.
    echo 🔧 Possible issues:
    echo    • Choreo deployment not running
    echo    • Network connectivity issues
    echo    • Debug endpoint not deployed
    echo.
    echo 💡 Try accessing manually: https://lumo-1615540597.choreoapis.dev/api/debug-env-config
)

echo.
echo ═══════════════════════════════════════════════════════════════
echo 📋 QUICK REFERENCE - Expected Values:
echo ═══════════════════════════════════════════════════════════════
echo.
echo NEXT_PUBLIC_SUPABASE_URL should be:
echo https://ubjujxtvlubxowsphvuk.supabase.co
echo.
echo NEXT_PUBLIC_SUPABASE_ANON_KEY should start with:
echo eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
echo.
echo JWT_SECRET should start with:
echo pvkn4ZqUlFJ6/BRynEb+as4VZ+JjOJLkTvVvm3vMflM...
echo.
echo ❌ These values should NOT appear (placeholders):
echo    • your-project-id
echo    • YOUR_SUPABASE_URL  
echo    • your_anon_key_here
echo    • placeholder
echo    • example
echo.
echo ═══════════════════════════════════════════════════════════════

pause 