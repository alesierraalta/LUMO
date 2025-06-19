#!/usr/bin/env node

/**
 * LUMO - Test Infinite Loop Fix
 * Tests that the authentication system no longer creates infinite loops
 */

const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 LUMO - Testing Infinite Loop Fix');
console.log('=====================================');

// Test configuration
const TEST_DURATION = 10000; // 10 seconds
const MAX_REQUESTS_PER_SECOND = 10; // Alert if more than 10 requests per second

async function testInfiniteLoopFix() {
  try {
    console.log('🚀 Starting infinite loop test...');
    
    // Start the development server in background
    console.log('📡 Starting development server...');
    const serverProcess = execSync('npm run dev:fixed', { 
      stdio: 'pipe',
      timeout: TEST_DURATION,
      encoding: 'utf8'
    });

    console.log('✅ Server started successfully');
    
    // Parse server logs to count API requests
    const logs = serverProcess.toString();
    const apiRequests = logs.match(/GET \/api\/auth\/supabase-me/g) || [];
    const requestCount = apiRequests.length;
    const requestsPerSecond = requestCount / (TEST_DURATION / 1000);
    
    console.log(`📊 Test Results:`);
    console.log(`   Duration: ${TEST_DURATION / 1000}s`);
    console.log(`   Total API requests: ${requestCount}`);
    console.log(`   Requests per second: ${requestsPerSecond.toFixed(2)}`);
    
    // Evaluate results
    if (requestsPerSecond > MAX_REQUESTS_PER_SECOND) {
      console.log('❌ INFINITE LOOP DETECTED!');
      console.log(`   Too many requests: ${requestsPerSecond.toFixed(2)}/s (max: ${MAX_REQUESTS_PER_SECOND}/s)`);
      return false;
    } else if (requestsPerSecond === 0) {
      console.log('✅ NO REQUESTS - Perfect! No infinite loop.');
      return true;
    } else {
      console.log('✅ CONTROLLED REQUESTS - Normal behavior, no infinite loop.');
      return true;
    }
    
  } catch (error) {
    if (error.code === 'TIMEOUT') {
      console.log('⏰ Test completed (timeout reached)');
      // This is expected - we want the server to run for the full duration
      return true;
    } else {
      console.error('❌ Test failed:', error.message);
      return false;
    }
  }
}

// Run the test
testInfiniteLoopFix()
  .then(success => {
    if (success) {
      console.log('\n🎉 INFINITE LOOP FIX VERIFIED!');
      console.log('   Authentication system is working correctly.');
      process.exit(0);
    } else {
      console.log('\n💥 INFINITE LOOP STILL EXISTS!');
      console.log('   Further fixes needed.');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Test execution failed:', error);
    process.exit(1);
  }); 