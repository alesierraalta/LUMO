// LUMO Pre-Commit Hook - Automatic Quality Gate
const { execSync } = require('child_process');

console.log('🔒 [PRE-COMMIT] Executing quality gate...');
console.log('================================================');

try {
  // Run the comprehensive quality gate
  execSync('node scripts/github-quality-gate.js', { stdio: 'inherit' });
  
  console.log('\n🎉 Pre-commit validation PASSED!');
  console.log('✅ Code meets all quality standards');
  console.log('🚀 Proceeding with commit...');
  
  process.exit(0);
} catch (error) {
  console.log('\n❌ Pre-commit validation FAILED!');
  console.log('🚫 Commit blocked - Quality standards not met');
  console.log('🔧 Fix all issues before attempting to commit');
  console.log('\nTo bypass (NOT RECOMMENDED): git commit --no-verify');
  
  process.exit(1);
} 