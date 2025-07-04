/**
 * Test script to verify auth context is not in infinite loop
 */

console.log('🔍 Testing auth context for infinite loops...');

// Test dashboard loading behavior
async function testDashboardLoading() {
  try {
    console.log('📊 Testing dashboard loading behavior...');
    
    const response = await fetch('http://localhost:3000/dashboard');
    
    if (response.ok) {
      const html = await response.text();
      
      // Check if it contains loading states
      const hasLoadingAuth = html.includes('Cargando autenticación');
      const hasLoadingDashboard = html.includes('Cargando dashboard');
      const hasDebugInfo = html.includes('Debug Info');
      const hasUserData = html.includes('Usuario:');
      
      console.log('📋 Dashboard Analysis:');
      console.log(`  Loading Auth: ${hasLoadingAuth ? '⚠️ YES' : '✅ NO'}`);
      console.log(`  Loading Dashboard: ${hasLoadingDashboard ? '⚠️ YES' : '✅ NO'}`);
      console.log(`  Debug Info: ${hasDebugInfo ? '✅ YES' : '❌ NO'}`);
      console.log(`  User Data: ${hasUserData ? '✅ YES' : '❌ NO'}`);
      
      if (hasLoadingAuth || hasLoadingDashboard) {
        console.log('⚠️ Dashboard is still in loading state - possible infinite loop');
        return false;
      } else if (hasDebugInfo && hasUserData) {
        console.log('✅ Dashboard loaded successfully with user data');
        return true;
      } else {
        console.log('❓ Dashboard state unclear');
        return false;
      }
    } else {
      console.error(`❌ Dashboard request failed: ${response.status}`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error testing dashboard:', error.message);
    return false;
  }
}

// Test multiple requests to check for consistency
async function testConsistency() {
  console.log('🔄 Testing consistency with multiple requests...');
  
  const results = [];
  
  for (let i = 0; i < 3; i++) {
    console.log(`  Request ${i + 1}/3...`);
    const result = await testDashboardLoading();
    results.push(result);
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  const successCount = results.filter(r => r).length;
  console.log(`📊 Consistency Results: ${successCount}/3 successful`);
  
  return successCount === 3;
}

// Main test function
async function runLoopTests() {
  console.log('🚀 Starting auth loop tests...\n');
  
  // Wait for server to be ready
  console.log('⏳ Waiting for server to be ready...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const dashboardTest = await testDashboardLoading();
  console.log('');
  
  const consistencyTest = await testConsistency();
  console.log('');
  
  console.log('📊 Test Results:');
  console.log(`Dashboard Loading: ${dashboardTest ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Consistency: ${consistencyTest ? '✅ PASS' : '❌ FAIL'}`);
  
  if (dashboardTest && consistencyTest) {
    console.log('\n🎉 All tests passed! Auth context is working correctly without loops.');
  } else {
    console.log('\n⚠️ Some tests failed. Auth context may still have issues.');
  }
}

// Run tests
runLoopTests().catch(console.error); 