// Debug específico para la API de autenticación
async function debugAuthAPI() {
  console.log('🔍 DEBUG DETALLADO DE API DE AUTENTICACIÓN');
  console.log('==========================================');
  
  try {
    // 1. Verificar cookies
    console.log('\n1️⃣ VERIFICANDO COOKIES...');
    const cookies = document.cookie.split(';').map(c => c.trim());
    console.log('Todas las cookies:', cookies);
    
    const authCookie = cookies.find(c => c.startsWith('auth-token='));
    if (authCookie) {
      console.log('✅ Cookie auth-token encontrada:', authCookie.substring(0, 50) + '...');
    } else {
      console.log('❌ Cookie auth-token NO encontrada');
      return;
    }
    
    // 2. Llamar directamente a la API con fetch
    console.log('\n2️⃣ LLAMANDO DIRECTAMENTE A /api/auth/me...');
    
    const response = await fetch('/api/auth/me', {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    if (!response.ok) {
      console.log('❌ Error en respuesta');
      const errorText = await response.text();
      console.log('Error text:', errorText);
      return;
    }
    
    const responseText = await response.text();
    console.log('Raw response text:', responseText);
    
    try {
      const data = JSON.parse(responseText);
      console.log('✅ Parsed response data:', data);
      
      if (data.user) {
        console.log('✅ Usuario encontrado en respuesta:');
        console.log('   Email:', data.user.email);
        console.log('   Role:', data.user.role);
        console.log('   Active:', data.user.isActive);
        console.log('   ID:', data.user.id);
      } else {
        console.log('❌ No hay usuario en la respuesta');
      }
      
    } catch (parseError) {
      console.log('❌ Error parseando JSON:', parseError);
    }
    
    // 3. Simular el comportamiento de auth-client.ts
    console.log('\n3️⃣ SIMULANDO getCurrentUser de auth-client.ts...');
    
    try {
      // Simular el código exacto de getCurrentUser
      let token = null;
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, value] = cookie.trim().split('=');
          if (name === 'auth-token') {
            token = value;
            break;
          }
        }
      }
      
      console.log('Token extraído:', token ? token.substring(0, 30) + '...' : 'null');
      
      const headers = {
        'Content-Type': 'application/json',
      };
      
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('Headers a enviar:', headers);
      
      const simulatedResponse = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers,
      });
      
      console.log('Simulated response status:', simulatedResponse.status);
      
      if (!simulatedResponse.ok) {
        console.log('❌ Simulated response no OK');
        return;
      }
      
      const simulatedData = await simulatedResponse.json();
      console.log('✅ Simulated data:', simulatedData);
      
      const user = simulatedData.user || null;
      console.log('✅ Usuario final extraído:', user);
      
    } catch (simulationError) {
      console.log('❌ Error en simulación:', simulationError);
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

// Ejecutar inmediatamente
debugAuthAPI(); 