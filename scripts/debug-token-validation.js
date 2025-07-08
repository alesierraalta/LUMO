// Debug token validation issue
console.log('🔍 Debugging token validation...\n');

// Test the auth server functions directly
async function testTokenValidation() {
  try {
    // Import the auth functions
    const { getTokenFromRequest, getCurrentUserFromToken } = require('../src/lib/auth-server');
    
    console.log('✅ Auth server functions imported successfully\n');
    
    // Mock a request with Authorization header
    const mockRequest = {
      headers: {
        get: (name) => {
          if (name === 'authorization') {
            // This is a sample Supabase JWT token format
            return 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVianVqeHR2bHVieG93c3BodnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU5MzQ0MDAsImV4cCI6MjA1MTUxMDQwMH0.sample-token';
          }
          return null;
        }
      }
    };
    
    console.log('🔍 Test 1: Testing getTokenFromRequest...');
    const token = getTokenFromRequest(mockRequest);
    console.log('📊 Extracted token:', token ? 'Token extracted successfully' : 'No token found');
    console.log('🔑 Token (first 50 chars):', token?.substring(0, 50) + '...\n');
    
    if (!token) {
      console.error('❌ No token extracted from request');
      return;
    }
    
    console.log('🔍 Test 2: Testing getCurrentUserFromToken...');
    const user = await getCurrentUserFromToken(token);
    console.log('📊 User result:', user ? 'User found' : 'No user found');
    
    if (user) {
      console.log('✅ User data:', {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isActive: user.isActive
      });
    } else {
      console.log('❌ No user found - token validation failed');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test with environment variables
console.log('🔍 Environment check:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
console.log('- NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
console.log('');

// Run the test
testTokenValidation().catch(console.error); 