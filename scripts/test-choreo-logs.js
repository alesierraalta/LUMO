#!/usr/bin/env node

/**
 * 🔍 Test Choreo Configuration Diagnostic Tool
 * Cross-platform Node.js script to test the diagnostic with real Choreo logs
 * 
 * Usage: node scripts/test-choreo-logs.js
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const TEMP_LOG_FILE = path.join(__dirname, '..', 'temp-choreo-logs.txt');

// Sample Choreo dev logs from user's issue
const CHOREO_LOGS = `2025-06-28T00:52:07.127260738Z npm warn config cache-max This option has been deprecated in favor of \`--prefer-online\`
2025-06-28T00:52:07.600078999Z 
2025-06-28T00:52:07.600100423Z > new-inventory-app@0.1.0 start
2025-06-28T00:52:07.600104090Z > node lumo-static-server.js
2025-06-28T00:52:07.600106437Z 
2025-06-28T00:52:07.993395707Z 🚀 [LUMO] Starting LUMO with static assets on port 8080
2025-06-28T00:52:07.993839418Z 🚀 [LUMO] Starting standalone server on port 8081...
2025-06-28T00:52:08.797717110Z 🚀 [STANDALONE] ▲ Next.js 15.3.1
2025-06-28T00:52:08.798056882Z 🚀 [STANDALONE] - Local:        http://lumo-1615540597-79fd798569-4px8k:8081
2025-06-28T00:52:08.798068387Z    - Network:      http://lumo-1615540597-79fd798569-4px8k:8081
2025-06-28T00:52:08.798070608Z 
2025-06-28T00:52:08.798072894Z  ✓ Starting...
2025-06-28T00:52:09.298789334Z 🚀 [STANDALONE] ✓ Ready in 576ms
2025-06-28T00:52:09.416638567Z 🚀 [STANDALONE] 🔧 Environment Detection: {
2025-06-28T00:52:09.416654059Z   isServer: true,
2025-06-28T00:52:09.416656588Z   isBuild: false,
2025-06-28T00:52:09.416659070Z   hasMissingConfig: true,
2025-06-28T00:52:09.416661375Z   NODE_ENV: 'production',
2025-06-28T00:52:09.416666128Z   NEXT_PHASE: undefined,
2025-06-28T00:52:09.416668300Z   BUILD_ID: false,
2025-06-28T00:52:09.416670680Z   hasSupabaseUrl: true
2025-06-28T00:52:09.416672903Z }
2025-06-28T00:52:09.416730123Z 🚀 [STANDALONE] ⚠️ RUNTIME MODE: Missing Supabase configuration - using fallback client
2025-06-28T00:52:09.417159818Z ⚠️ [STANDALONE] ⚠️ Missing Supabase configuration - using fallback client
2025-06-28T00:52:09.417260114Z 🚀 [STANDALONE] ✓ Minimal Supabase client initialized safely
2025-06-28T00:52:09.424370361Z 🚀 [STANDALONE] 🔧 [SERVER-ONLY] Environment Detection: {
2025-06-28T00:52:09.424379140Z   isServer: true,
2025-06-28T00:52:09.424380978Z   isBuild: false,
2025-06-28T00:52:09.424383028Z   hasMissingConfig: true,
2025-06-28T00:52:09.424384749Z   NODE_ENV: 'production',
2025-06-28T00:52:09.424386698Z   NEXT_PHASE: undefined,
2025-06-28T00:52:09.424388454Z   BUILD_ID: false,
2025-06-28T00:52:09.424390447Z   hasSupabaseUrl: true
2025-06-28T00:52:09.424392208Z }
2025-06-28T00:52:09.424447664Z 🚀 [STANDALONE] ⚠️ [SERVER-ONLY] RUNTIME MODE: Missing Supabase configuration - using fallback client
2025-06-28T00:52:09.424459279Z ⚠️ [SERVER-ONLY] Using fallback client due to missing configuration
2025-06-28T00:52:09.424461622Z ⚠️ [SERVER-ONLY] Using fallback client - check Supabase configuration
2025-06-28T00:52:09.807839399Z 🚀 [STANDALONE] ⚠️ RUNTIME MODE: Missing Supabase configuration - using fallback client
2025-06-28T00:52:11.207977474Z 🚀 [STANDALONE] ⚠️ RUNTIME MODE: Missing Supabase configuration - using fallback client
2025-06-28T00:52:11.316388338Z 🚀 [STANDALONE] 🔧 [SERVER-ONLY] Environment Detection: {
2025-06-28T00:52:11.316401551Z   isServer: true,
2025-06-28T00:52:11.316403668Z   isBuild: false,
2025-06-28T00:52:11.316405940Z   hasMissingConfig: true,
2025-06-28T00:52:11.316407847Z   NODE_ENV: 'production',
2025-06-28T00:52:11.316409781Z   NEXT_PHASE: undefined,
2025-06-28T00:52:11.316411460Z   BUILD_ID: false,
2025-06-28T00:52:11.316413311Z   hasSupabaseUrl: true
2025-06-28T00:52:11.316415446Z }
2025-06-28T00:52:11.316529272Z 🚀 [STANDALONE] ⚠️ [SERVER-ONLY] RUNTIME MODE: Missing Supabase configuration - using fallback client
2025-06-28T00:52:11.316533072Z ⚠️ [SERVER-ONLY] Using fallback client due to missing configuration
2025-06-28T00:52:11.316534970Z ⚠️ [SERVER-ONLY] Using fallback client - check Supabase configuration
2025-06-28T00:52:11.317303015Z 🚀 [STANDALONE] 🔧 Environment Detection: {
2025-06-28T00:52:11.317305757Z   isServer: true,
2025-06-28T00:52:11.317307543Z   isBuild: false,
2025-06-28T00:52:11.317309132Z   hasMissingConfig: true,
2025-06-28T00:52:11.317310989Z   NODE_ENV: 'production',
2025-06-28T00:52:11.317312595Z   NEXT_PHASE: undefined,
2025-06-28T00:52:11.317314341Z   BUILD_ID: false,
2025-06-28T00:52:11.317316068Z   hasSupabaseUrl: true
2025-06-28T00:52:11.317317707Z }
2025-06-28T00:52:11.317356227Z 🚀 [STANDALONE] ⚠️ RUNTIME MODE: Missing Supabase configuration - using fallback client`;

async function main() {
  console.log('🔍 Testing Choreo Configuration Diagnostic Tool...\n');

  try {
    // Create temporary log file
    console.log('📝 Creating temporary log file...');
    fs.writeFileSync(TEMP_LOG_FILE, CHOREO_LOGS);
    console.log(`✅ Log file created: ${TEMP_LOG_FILE}\n`);

    // Run diagnostic tool
    console.log('🚀 Running diagnostic analysis...\n');
    
    const diagnosticScript = path.join(__dirname, 'choreo-config-diagnostic.js');
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [diagnosticScript, TEMP_LOG_FILE], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });

      child.on('close', (code) => {
        console.log('\n🧹 Cleaning up temporary files...');
        
        // Clean up temporary file
        if (fs.existsSync(TEMP_LOG_FILE)) {
          fs.unlinkSync(TEMP_LOG_FILE);
          console.log('✅ Temporary files cleaned up');
        }

        console.log('\n✅ Diagnostic test completed!');
        console.log(`Exit code: ${code}`);

        if (code === 1) {
          console.log('🚨 Critical issues detected - review the diagnostic report above');
        } else {
          console.log('✅ No critical issues detected');
        }

        console.log('\n📊 Check logs/choreo-config-analysis.json for detailed analysis\n');
        
        resolve(code);
      });

      child.on('error', (error) => {
        console.error('❌ Failed to run diagnostic:', error.message);
        
        // Clean up on error
        if (fs.existsSync(TEMP_LOG_FILE)) {
          fs.unlinkSync(TEMP_LOG_FILE);
        }
        
        reject(error);
      });
    });

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    // Clean up on error
    if (fs.existsSync(TEMP_LOG_FILE)) {
      fs.unlinkSync(TEMP_LOG_FILE);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  main().then(code => {
    process.exit(code || 0);
  }).catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
}

module.exports = { main }; 