#!/usr/bin/env node

/**
 * Test Existing Routes
 * Verify that all existing application routes work correctly
 */

const DEV_URL = 'https://42bcb564-7feb-4cae-857b-6f5ff7243ab2.e1-us-east-azure.choreoapps.dev';

async function testRoute(path, name) {
  try {
    console.log(`\n🔍 Testing ${name}`);
    console.log('='.repeat(20 + name.length));
    
    const response = await fetch(`${DEV_URL}${path}`, {
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    console.log(`URL: ${DEV_URL}${path}`);
    console.log(`Status: ${response.status}`);
    console.log(`Content-Type: ${response.headers.get('content-type')}`);
    
    if (response.ok) {
      const content = await response.text();
      
      if (content.includes('<!DOCTYPE html>') || content.includes('<html')) {
        console.log('✅ Returns HTML page');
        
        // Check for specific content
        const hasReact = content.includes('__NEXT_DATA__') || content.includes('_next');
        const hasContent = content.length > 1000; // Basic content check
        
        console.log(`   React App: ${hasReact ? '✅' : '❌'}`);
        console.log(`   Has Content: ${hasContent ? '✅' : '❌'}`);
        console.log(`   Content Length: ${content.length} chars`);
        
        return { success: true, hasReact, hasContent, length: content.length };
      } else {
        console.log('❌ Does not return HTML');
        console.log(`   Response: ${content.substring(0, 100)}...`);
        return { success: false, error: 'Not HTML' };
      }
    } else {
      console.log(`❌ Failed: HTTP ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function testAuthAPI() {
  console.log('\n🔐 Testing Auth API');
  console.log('==================');
  
  try {
    // Test if the auth API is working with the new key
    const response = await fetch(`${DEV_URL}/api/debug-env-supabase`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Debug endpoint working');
      console.log(`   Service Key Exists: ${data.supabase.serviceKeyExists ? '✅' : '❌'}`);
      console.log(`   Service Key Length: ${data.supabase.serviceKeyLength}`);
      console.log(`   Recommendation: ${data.recommendation}`);
      
      return { success: true, keyConfigured: data.supabase.serviceKeyExists };
    } else {
      console.log(`❌ Debug endpoint failed: ${response.status}`);
      return { success: false, error: `HTTP ${response.status}` };
    }
    
  } catch (error) {
    console.error(`❌ Auth API error: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runExistingRouteTests() {
  console.log('🧪 TESTING EXISTING APPLICATION ROUTES');
  console.log('======================================');
  console.log(`Target URL: ${DEV_URL}`);
  console.log(`Test Time: ${new Date().toLocaleString()}\n`);
  
  // Test the routes that should exist
  const routes = [
    { path: '/', name: 'Home Page (Root)' },
    { path: '/auth/login', name: 'Auth Login Page' },
    { path: '/dashboard', name: 'Dashboard (Protected)' },
    { path: '/api/health', name: 'Health API' }
  ];
  
  const results = {};
  
  // Test all routes
  for (const route of routes) {
    results[route.path] = await testRoute(route.path, route.name);
    await new Promise(resolve => setTimeout(resolve, 500)); // Small delay
  }
  
  // Test auth configuration
  results.authAPI = await testAuthAPI();
  
  console.log('\n🎯 FINAL RESULTS');
  console.log('================');
  
  let allWorking = true;
  
  for (const [path, result] of Object.entries(results)) {
    if (path === 'authAPI') {
      console.log(`Auth Config: ${result.success ? '✅ WORKING' : '❌ FAILED'}`);
      if (result.success && !result.keyConfigured) {
        console.log('   ⚠️ Supabase key not configured');
        allWorking = false;
      }
    } else {
      console.log(`${path}: ${result.success ? '✅ WORKING' : '❌ FAILED'}`);
      if (!result.success) {
        console.log(`   Error: ${result.error}`);
        allWorking = false;
      }
    }
  }
  
  if (allWorking) {
    console.log('\n🎉 ALL ROUTES WORKING!');
    console.log('======================');
    console.log('✅ Application is accessible');
    console.log('✅ Routes are responding');
    console.log('✅ HTML pages are loading');
    
    console.log('\n📝 Next Steps:');
    console.log('==============');
    console.log('1. Visit the application in your browser');
    console.log('2. Check if you see the login page or loading screen');
    console.log('3. If you see loading forever, check browser console');
    console.log('4. If login works, check if sidebar appears');
    
  } else {
    console.log('\n⚠️ SOME ISSUES FOUND');
    console.log('====================');
    console.log('The application has some routing or configuration issues');
    console.log('Check the specific errors above for troubleshooting');
  }
  
  return allWorking;
}

runExistingRouteTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(console.error); 