#!/usr/bin/env node

/**
 * Detailed Bcrypt Debug
 * Test bcrypt hashing and comparison locally
 */

const bcrypt = require('bcryptjs');

async function debugBcrypt() {
  console.log('🔍 DETAILED BCRYPT DEBUGGING');
  console.log('============================');
  
  // The hash from the database
  const storedHash = '$2b$12$ywIBxm7hMvxReEL04gHhXORaOdIqZ57M44ECEgS/8Jp6nmXjWZJM.';
  const testPassword = 'admin123';
  
  console.log('\n📋 Test Data:');
  console.log('-------------');
  console.log(`Password: "${testPassword}"`);
  console.log(`Stored Hash: ${storedHash}`);
  console.log(`Hash Length: ${storedHash.length}`);
  console.log(`Hash Prefix: ${storedHash.substring(0, 4)}`);
  
  // Test 1: Direct bcrypt comparison
  console.log('\n🧪 Test 1: Direct Bcrypt Comparison');
  console.log('-----------------------------------');
  
  try {
    const result = await bcrypt.compare(testPassword, storedHash);
    console.log(`Bcrypt Compare Result: ${result}`);
    
    if (result) {
      console.log('✅ Password matches hash!');
    } else {
      console.log('❌ Password does not match hash');
      
      // Test different password variations
      console.log('\n🔄 Testing Password Variations:');
      console.log('-------------------------------');
      
      const variations = [
        'admin123',
        'Admin123',
        'admin123!',
        'Admin123!',
        'admin',
        'lumo123',
        'password'
      ];
      
      for (const pwd of variations) {
        const varResult = await bcrypt.compare(pwd, storedHash);
        console.log(`"${pwd}": ${varResult ? '✅' : '❌'}`);
        
        if (varResult) {
          console.log(`🎉 FOUND MATCHING PASSWORD: "${pwd}"`);
          break;
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Bcrypt comparison error:', error.message);
  }
  
  // Test 2: Generate new hash and test
  console.log('\n🧪 Test 2: Generate New Hash');
  console.log('----------------------------');
  
  try {
    const newHash = await bcrypt.hash(testPassword, 12);
    console.log(`New Hash: ${newHash}`);
    
    const newResult = await bcrypt.compare(testPassword, newHash);
    console.log(`New Hash Comparison: ${newResult ? '✅' : '❌'}`);
    
    if (newResult) {
      console.log('✅ New hash generation working correctly');
      
      // Test 3: Compare with API call
      console.log('\n🧪 Test 3: Test with API');
      console.log('------------------------');
      
      const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';
      
      // Create a test user with known password
      const testEmail = `bcrypt-test-${Date.now()}@lumo.com`;
      const testPassword = 'TestBcrypt123';
      
      console.log(`Creating test user: ${testEmail}`);
      
      const registerResponse = await fetch(`${DEV_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testEmail,
          password: testPassword,
          name: 'Bcrypt Test User'
        })
      });
      
      const registerData = await registerResponse.json();
      
      console.log(`Registration Status: ${registerResponse.status}`);
      console.log(`Registration Success: ${registerData.success}`);
      
      if (registerData.success) {
        console.log('✅ Test user created');
        
        // Try login immediately
        console.log('\n🔐 Testing login with new user...');
        
        const loginResponse = await fetch(`${DEV_URL}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: testEmail,
            password: testPassword
          })
        });
        
        const loginData = await loginResponse.json();
        
        console.log(`Login Status: ${loginResponse.status}`);
        console.log(`Login Success: ${loginData.success}`);
        console.log(`Login Message: ${loginData.message || 'N/A'}`);
        console.log(`Login Error: ${loginData.error || 'N/A'}`);
        
        if (loginData.success) {
          console.log('✅ New user login working!');
          console.log('The system is working for new users');
          
          console.log('\n💡 CONCLUSION:');
          console.log('==============');
          console.log('The bcrypt system works for new users.');
          console.log('The issue is with the specific admin hash.');
          console.log('Solution: Update admin password or use new admin.');
          
        } else {
          console.log('❌ New user login failed too');
          console.log('There might be a system-wide issue');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Hash generation error:', error.message);
  }
  
  // Test 4: Manual hash verification
  console.log('\n🧪 Test 4: Manual Hash Analysis');
  console.log('-------------------------------');
  
  console.log('Hash breakdown:');
  console.log(`- Algorithm: ${storedHash.substring(0, 4)}`);
  console.log(`- Cost: ${storedHash.substring(4, 6)}`);
  console.log(`- Salt: ${storedHash.substring(7, 29)}`);
  console.log(`- Hash: ${storedHash.substring(29)}`);
  
  // Test if hash is valid format
  const hashRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
  const isValidFormat = hashRegex.test(storedHash);
  console.log(`Valid bcrypt format: ${isValidFormat ? '✅' : '❌'}`);
  
  if (!isValidFormat) {
    console.log('❌ Hash format is invalid!');
    console.log('This explains why bcrypt comparison fails');
  }
}

debugBcrypt().catch(console.error); 