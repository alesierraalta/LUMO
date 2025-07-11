#!/usr/bin/env node

/**
 * VERCEL PRODUCTION 401 ERROR TROUBLESHOOTING SCRIPT
 * Helps diagnose and fix authentication issues specific to Vercel deployments
 */

const { execSync } = require('child_process');
const https = require('https');
const fs = require('fs');

console.log('🔍 VERCEL PRODUCTION 401 ERROR TROUBLESHOOTING');
console.log('===============================================');

// Load local environment for comparison
require('dotenv').config({ path: '.env.local' });

const localConfig = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseProjectId: process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')[0].replace('https://', ''),
  hasJwtSecret: !!process.env.JWT_SECRET,
  jwtSecretPreview: process.env.JWT_SECRET?.substring(0, 20) + '...',
  environment: process.env.APP_ENVIRONMENT || 'development'
};

async function checkProductionDiagnostics() {
  return new Promise((resolve, reject) => {
    const url = 'https://lumo-woad.vercel.app/api/debug-production';
    
    https.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

async function main() {
  try {
    console.log('1. 📊 LOCAL ENVIRONMENT ANALYSIS');
    console.log('=================================');
    console.log(`Local Supabase Project: ${localConfig.supabaseProjectId}`);
    console.log(`Local Environment: ${localConfig.environment}`);
    console.log(`Local JWT Secret: ${localConfig.jwtSecretPreview}`);
    
    console.log('\n2. 🌐 PRODUCTION ENVIRONMENT ANALYSIS');
    console.log('=====================================');
    
    try {
      const prodDiagnostics = await checkProductionDiagnostics();
      
      if (prodDiagnostics.status === 'success') {
        console.log('✅ Production diagnostic endpoint accessible');
        console.log(`Production Supabase Project: ${prodDiagnostics.diagnostics.supabase.projectId}`);
        console.log(`Production Environment: ${prodDiagnostics.diagnostics.environment.APP_ENVIRONMENT}`);
        console.log(`Production JWT Secret: ${prodDiagnostics.diagnostics.auth.jwtSecretPreview}`);
        
        // Compare environments
        console.log('\n3. 🔍 ENVIRONMENT COMPARISON');
        console.log('============================');
        
        const projectMismatch = localConfig.supabaseProjectId !== prodDiagnostics.diagnostics.supabase.projectId;
        const jwtMismatch = localConfig.jwtSecretPreview !== prodDiagnostics.diagnostics.auth.jwtSecretPreview;
        
        if (projectMismatch) {
          console.log('❌ ISSUE FOUND: Supabase project mismatch');
          console.log(`   Local:      ${localConfig.supabaseProjectId}`);
          console.log(`   Production: ${prodDiagnostics.diagnostics.supabase.projectId}`);
          console.log('   → This is the likely cause of your 401 errors!');
        } else {
          console.log('✅ Supabase projects match');
        }
        
        if (jwtMismatch) {
          console.log('❌ ISSUE FOUND: JWT secret mismatch');
          console.log('   → Different JWT secrets between environments');
        } else {
          console.log('✅ JWT secrets match');
        }
        
        // Display production issues
        if (prodDiagnostics.issues.length > 0) {
          console.log('\n4. 🚨 PRODUCTION ISSUES DETECTED');
          console.log('=================================');
          prodDiagnostics.issues.forEach(issue => {
            console.log(`❌ ${issue}`);
          });
        }
        
        // Provide solutions
        console.log('\n5. 💡 SOLUTION RECOMMENDATIONS');
        console.log('===============================');
        
        if (projectMismatch) {
          console.log('🔧 AUTHENTICATION ENVIRONMENT MISMATCH SOLUTION:');
          console.log('   Option 1: Use same Supabase project for both environments');
          console.log('   Option 2: Ensure user authenticates to correct environment');
          console.log('   Option 3: Configure proper environment separation');
        }
        
        prodDiagnostics.recommendations.forEach(rec => {
          console.log(`   • ${rec}`);
        });
        
      } else {
        console.log('❌ Failed to get production diagnostics');
        console.log('   → Deploy the debug-production endpoint first');
      }
      
    } catch (error) {
      console.log('❌ Cannot access production diagnostic endpoint');
      console.log('   → You need to deploy the debug-production endpoint first');
      console.log('   → Run: npm run build && vercel --prod');
    }
    
    console.log('\n6. 🚀 NEXT STEPS');
    console.log('================');
    console.log('1. Deploy this script by running: npm run build && vercel --prod');
    console.log('2. Access: https://lumo-woad.vercel.app/api/debug-production');
    console.log('3. Check Vercel dashboard environment variables');
    console.log('4. Ensure user authenticates to production environment');
    console.log('5. Test DELETE request after fixes');
    
  } catch (error) {
    console.error('❌ Script execution failed:', error.message);
  }
}

main().catch(console.error);