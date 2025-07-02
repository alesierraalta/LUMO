#!/usr/bin/env node

/**
 * Local Bcrypt Test
 * Test if the bcrypt hash comparison works locally
 */

const bcrypt = require('bcryptjs');

async function testBcryptLocal() {
  console.log('🧪 LOCAL BCRYPT TEST');
  console.log('====================');
  
  // The exact hash from the database
  const storedHash = '$2b$12$ywIBxm7hMvxReEL04gHhXORaOdIqZ57M44ECEgS/8Jp6nmXjWZJM.';
  const inputPassword = 'admin123';
  
  console.log('Input password:', inputPassword);
  console.log('Stored hash:', storedHash);
  
  try {
    console.log('\n🔍 Testing bcrypt.compare...');
    const startTime = Date.now();
    
    const isValid = await bcrypt.compare(inputPassword, storedHash);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log('Result:', isValid);
    console.log('Duration:', duration + 'ms');
    
    if (isValid) {
      console.log('✅ LOCAL BCRYPT TEST PASSED');
      console.log('The hash comparison works correctly');
      console.log('The issue is likely in the server environment');
    } else {
      console.log('❌ LOCAL BCRYPT TEST FAILED');
      console.log('There might be an issue with the hash itself');
    }
    
  } catch (error) {
    console.error('❌ Bcrypt error:', error.message);
    console.error('Stack:', error.stack);
  }
  
  // Also test generating a new hash
  console.log('\n🔧 Generating new hash for comparison...');
  try {
    const newHash = await bcrypt.hash(inputPassword, 12);
    console.log('New hash:', newHash);
    
    const newHashValid = await bcrypt.compare(inputPassword, newHash);
    console.log('New hash valid:', newHashValid);
    
    if (newHashValid) {
      console.log('✅ New hash generation works');
    } else {
      console.log('❌ New hash generation failed');
    }
    
  } catch (error) {
    console.error('❌ Hash generation error:', error.message);
  }
}

testBcryptLocal().catch(console.error); 