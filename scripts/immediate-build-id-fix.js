#!/usr/bin/env node

/**
 * Immediate BUILD_ID Fix for Choreo Production
 * Creates BUILD_ID instantly to fix production deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🆘 IMMEDIATE BUILD_ID FIX');
console.log('========================');

const buildIdPath = path.join(process.cwd(), '.next', 'BUILD_ID');
const nextDir = path.join(process.cwd(), '.next');

console.log(`📁 Working directory: ${process.cwd()}`);
console.log(`📁 Target BUILD_ID path: ${buildIdPath}`);

try {
  // Ensure .next directory exists
  if (!fs.existsSync(nextDir)) {
    fs.mkdirSync(nextDir, { recursive: true });
    console.log('✅ Created .next directory');
  } else {
    console.log('✅ .next directory exists');
  }

  // Create BUILD_ID
  const emergencyBuildId = Date.now().toString();
  fs.writeFileSync(buildIdPath, emergencyBuildId);
  console.log(`✅ Emergency BUILD_ID created: ${emergencyBuildId}`);

  // Verify creation
  if (fs.existsSync(buildIdPath)) {
    const verifyId = fs.readFileSync(buildIdPath, 'utf8').trim();
    console.log(`✅ BUILD_ID verified: ${verifyId}`);
    console.log('🎉 SUCCESS: BUILD_ID fix completed!');
    process.exit(0);
  } else {
    console.error('❌ FAILED: BUILD_ID file not created');
    process.exit(1);
  }

} catch (error) {
  console.error('❌ ERROR creating BUILD_ID:', error.message);
  console.error('Stack:', error.stack);
  process.exit(1);
} 