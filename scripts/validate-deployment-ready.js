const fs = require('fs');
const path = require('path');

console.log('🔍 LUMO Deployment Validation - Starting...\n');

// Validation results
const results = {
  passed: [],
  warnings: [],
  failed: [],
  score: 0,
  maxScore: 0
};

function addResult(category, message, points = 1) {
  results[category].push(message);
  if (category === 'passed') results.score += points;
  results.maxScore += points;
}

// Test 1: Next.js Configuration
function validateNextConfig() {
  console.log('1️⃣ Validating Next.js Configuration...');
  
  try {
    const nextConfig = require(path.join(process.cwd(), 'next.config.js'));
    
    // Check essential properties
    if (nextConfig.output === 'standalone') {
      addResult('passed', 'Output set to standalone ✅');
    } else {
      addResult('failed', 'Output not set to standalone ❌');
    }
    
    if (nextConfig.experimental && !nextConfig.experimental.turbotrace) {
      addResult('passed', 'No deprecated turbotrace option ✅');
    } else if (nextConfig.experimental && nextConfig.experimental.turbotrace) {
      addResult('failed', 'Deprecated turbotrace option found ❌');
    } else {
      addResult('passed', 'No experimental turbotrace ✅');
    }
    
    if (nextConfig.eslint && nextConfig.eslint.ignoreDuringBuilds) {
      addResult('passed', 'ESLint ignored during builds ✅');
    } else {
      addResult('warnings', 'ESLint not ignored - may slow builds ⚠️');
    }
    
    if (nextConfig.typescript && nextConfig.typescript.ignoreBuildErrors) {
      addResult('passed', 'TypeScript errors ignored ✅');
    } else {
      addResult('warnings', 'TypeScript errors not ignored - may fail builds ⚠️');
    }
    
  } catch (error) {
    addResult('failed', `Next.js config error: ${error.message} ❌`);
  }
  
  console.log('   ✅ Next.js configuration check complete\n');
}

// Test 2: Package.json Scripts
function validatePackageScripts() {
  console.log('2️⃣ Validating Package.json Scripts...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    const requiredScripts = {
      'build': 'should include prisma generate and next build',
      'start': 'should include deployment scripts',
      'fix:deployment-errors': 'should have deployment fix script'
    };
    
    Object.entries(requiredScripts).forEach(([script, description]) => {
      if (packageJson.scripts[script]) {
        addResult('passed', `Script "${script}" exists ✅`);
      } else {
        addResult('failed', `Missing script "${script}" - ${description} ❌`);
      }
    });
    
    // Check for build optimization
    if (packageJson.scripts.build && packageJson.scripts.build.includes('prisma generate')) {
      addResult('passed', 'Build includes Prisma generation ✅');
    } else {
      addResult('warnings', 'Build may not include Prisma generation ⚠️');
    }
    
  } catch (error) {
    addResult('failed', `Package.json error: ${error.message} ❌`);
  }
  
  console.log('   ✅ Package.json validation complete\n');
}

// Test 3: Prisma Configuration
function validatePrismaConfig() {
  console.log('3️⃣ Validating Prisma Configuration...');
  
  const schemaPath = path.join('prisma', 'schema.prisma');
  if (fs.existsSync(schemaPath)) {
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    if (schema.includes('generator client')) {
      addResult('passed', 'Prisma client generator found ✅');
    } else {
      addResult('failed', 'Prisma client generator missing ❌');
    }
    
    if (schema.includes('provider = "sqlite"') || schema.includes('provider = "postgresql"')) {
      addResult('passed', 'Database provider configured ✅');
    } else {
      addResult('warnings', 'Database provider not clearly configured ⚠️');
    }
    
    // Check for environment-aware configuration
    if (schema.includes('env("DATABASE_URL")')) {
      addResult('passed', 'Environment-aware database URL ✅');
    } else {
      addResult('warnings', 'Database URL not environment-aware ⚠️');
    }
    
  } else {
    addResult('failed', 'Prisma schema file not found ❌');
  }
  
  console.log('   ✅ Prisma configuration check complete\n');
}

// Test 4: TypeScript Configuration
function validateTypeScriptConfig() {
  console.log('4️⃣ Validating TypeScript Configuration...');
  
  const tsconfigPath = 'tsconfig.json';
  if (fs.existsSync(tsconfigPath)) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));
      
      if (tsconfig.compilerOptions.skipLibCheck) {
        addResult('passed', 'skipLibCheck enabled for faster builds ✅');
      } else {
        addResult('warnings', 'skipLibCheck not enabled - may slow builds ⚠️');
      }
      
      if (!tsconfig.compilerOptions.strict) {
        addResult('passed', 'Strict mode disabled for deployment ✅');
      } else {
        addResult('warnings', 'Strict mode enabled - may cause build errors ⚠️');
      }
      
      if (tsconfig.compilerOptions.incremental) {
        addResult('passed', 'Incremental compilation enabled ✅');
      } else {
        addResult('warnings', 'Incremental compilation not enabled ⚠️');
      }
      
    } catch (error) {
      addResult('failed', `TypeScript config parse error: ${error.message} ❌`);
    }
  } else {
    addResult('warnings', 'TypeScript config not found - using defaults ⚠️');
  }
  
  console.log('   ✅ TypeScript configuration check complete\n');
}

// Test 5: Deployment Scripts
function validateDeploymentScripts() {
  console.log('5️⃣ Validating Deployment Scripts...');
  
  const requiredScripts = [
    'scripts/choreo-deployment-complete.js',
    'scripts/fix-deployment-errors.js',
    'scripts/choreo-startup-fix.js'
  ];
  
  requiredScripts.forEach(script => {
    if (fs.existsSync(script)) {
      addResult('passed', `Deployment script exists: ${path.basename(script)} ✅`);
    } else {
      addResult('failed', `Missing deployment script: ${path.basename(script)} ❌`);
    }
  });
  
  console.log('   ✅ Deployment scripts check complete\n');
}

// Test 6: Cache and Temporary Files
function validateCleanState() {
  console.log('6️⃣ Validating Clean State...');
  
  const problematicPaths = [
    '.next',
    'node_modules/.cache',
    'next.config.backup.ts',
    'next.config.simple.js'
  ];
  
  problematicPaths.forEach(filePath => {
    if (!fs.existsSync(filePath)) {
      addResult('passed', `Clean state: ${filePath} not present ✅`);
    } else {
      addResult('warnings', `May have cached/deprecated files: ${filePath} ⚠️`);
    }
  });
  
  console.log('   ✅ Clean state check complete\n');
}

// Test 7: Environment Variables
function validateEnvironmentVars() {
  console.log('7️⃣ Validating Environment Variables...');
  
  const requiredVars = ['DATABASE_URL', 'NODE_ENV'];
  const optionalVars = ['JWT_SECRET', 'ADMIN_EMAIL'];
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      addResult('passed', `Required env var present: ${varName} ✅`);
    } else {
      addResult('warnings', `Required env var missing: ${varName} ⚠️ (will be set in production)`);
    }
  });
  
  optionalVars.forEach(varName => {
    if (process.env[varName]) {
      addResult('passed', `Optional env var present: ${varName} ✅`);
    }
    // Don't penalize for missing optional vars
  });
  
  console.log('   ✅ Environment variables check complete\n');
}

// Generate report
function generateReport() {
  console.log('📊 DEPLOYMENT VALIDATION REPORT\n');
  console.log('=' * 50);
  
  const percentage = Math.round((results.score / results.maxScore) * 100);
  console.log(`\n🎯 Overall Score: ${results.score}/${results.maxScore} (${percentage}%)`);
  
  if (percentage >= 90) {
    console.log('🟢 EXCELLENT - Ready for deployment! 🚀');
  } else if (percentage >= 75) {
    console.log('🟡 GOOD - Deploy with minor warnings ⚠️');
  } else if (percentage >= 60) {
    console.log('🟠 FAIR - Consider fixing issues before deploy ⚠️');
  } else {
    console.log('🔴 POOR - Fix critical issues before deploy ❌');
  }
  
  if (results.passed.length > 0) {
    console.log('\n✅ PASSED CHECKS:');
    results.passed.forEach(item => console.log(`   ${item}`));
  }
  
  if (results.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    results.warnings.forEach(item => console.log(`   ${item}`));
  }
  
  if (results.failed.length > 0) {
    console.log('\n❌ FAILED CHECKS:');
    results.failed.forEach(item => console.log(`   ${item}`));
  }
  
  console.log('\n💡 RECOMMENDATIONS:');
  
  if (results.failed.length > 0) {
    console.log('   1. Run: npm run fix:deployment-errors');
    console.log('   2. Fix any critical configuration issues');
    console.log('   3. Re-run this validation');
  } else if (results.warnings.length > 0) {
    console.log('   1. Consider running: npm run fix:deployment-errors');
    console.log('   2. Review warnings for potential optimizations');
  } else {
    console.log('   1. Your deployment configuration is excellent!');
    console.log('   2. Run: npm run build (to test)');
    console.log('   3. Deploy to Choreo with confidence! 🚀');
  }
  
  console.log('\n' + '=' * 50);
  
  // Save validation results
  const reportPath = 'deployment-validation-report.json';
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    score: results.score,
    maxScore: results.maxScore,
    percentage: percentage,
    status: percentage >= 75 ? 'ready' : 'needs_attention',
    details: results
  }, null, 2));
  
  console.log(`📄 Detailed report saved to: ${reportPath}`);
}

// Main execution
async function main() {
  try {
    validateNextConfig();
    validatePackageScripts();
    validatePrismaConfig();
    validateTypeScriptConfig();
    validateDeploymentScripts();
    validateCleanState();
    validateEnvironmentVars();
    generateReport();
    
    // Exit with appropriate code
    const percentage = Math.round((results.score / results.maxScore) * 100);
    process.exit(percentage >= 60 ? 0 : 1);
    
  } catch (error) {
    console.error('\n❌ Validation failed:', error.message);
    process.exit(1);
  }
}

main(); 