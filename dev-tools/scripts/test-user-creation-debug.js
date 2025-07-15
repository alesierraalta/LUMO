/**
 * Debug User Creation API
 * Tests the user creation endpoint specifically
 */

const testUserCreation = async () => {
  console.log('🔍 Testing User Creation API...\n');
  
  try {
    // First, test if the API endpoint exists
    console.log('1. Testing API endpoint availability...');
    const response = await fetch('http://localhost:3000/api/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Development-Mode': 'true'
      },
      body: JSON.stringify({
        name: 'Test User Debug',
        email: 'test-debug@example.com',
        password: 'testpass123',
        roleId: '550e8400-e29b-41d4-a716-446655440001', // USER role UUID
        isActive: true
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.log('Error response body:', errorText);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('Parsed error:', errorJson);
      } catch (e) {
        console.log('Could not parse error as JSON');
      }
    } else {
      const data = await response.json();
      console.log('Success response:', data);
    }

    // Test roles endpoint to ensure we have roles
    console.log('\n2. Testing roles availability...');
    const rolesResponse = await fetch('http://localhost:3000/api/roles', {
      headers: { 'X-Development-Mode': 'true' }
    });
    
    if (rolesResponse.ok) {
      const rolesData = await rolesResponse.json();
      console.log('Available roles:', rolesData.roles?.map(r => ({ id: r.id, name: r.name })));
    } else {
      console.log('Roles API failed:', rolesResponse.status);
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
};

testUserCreation();