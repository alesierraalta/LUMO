// Script de debugging para verificar permisos en el frontend
// Ejecutar en la consola del navegador: fetch('/debug-frontend.js').then(r => r.text()).then(eval)

async function debugFrontendPermissions() {
  console.log('🔍 DEPURACIÓN DE PERMISOS EN EL FRONTEND');
  console.log('=======================================');
  
  try {
    // 1. Verificar respuesta de API /auth/me
    console.log('\n1️⃣ VERIFICANDO API /auth/me...');
    const response = await fetch('/api/auth/me', {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`   Status: ${response.status}`);
    
    if (!response.ok) {
      console.log('❌ Error en API /auth/me');
      console.log(`   Error: ${response.statusText}`);
      return;
    }
    
    const userData = await response.json();
    console.log('✅ Respuesta de API /auth/me:');
    console.log('   Datos completos:', userData);
    console.log(`   Email: ${userData.user?.email}`);
    console.log(`   Rol: ${userData.user?.role}`);
    console.log(`   Activo: ${userData.user?.isActive}`);
    
    // 2. Verificar cookies
    console.log('\n2️⃣ VERIFICANDO COOKIES...');
    const cookies = document.cookie.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth-token='));
    
    if (authCookie) {
      console.log('✅ Cookie de autenticación encontrada');
      console.log(`   Cookie: ${authCookie.substring(0, 30)}...`);
    } else {
      console.log('❌ Cookie de autenticación NO encontrada');
      console.log('   Cookies disponibles:', cookies);
    }
    
    // 3. Simular función hasPermission
    console.log('\n3️⃣ SIMULANDO hasPermission...');
    const user = userData.user;
    
    if (!user) {
      console.log('❌ No hay usuario cargado');
      return;
    }
    
    const testPermissions = [
      'dashboard:view',
      'inventory:view',
      'categories:view',
      'locations:view',
      'users:view',
      'settings:view'
    ];
    
    // Simular la lógica de hasPermission de permissions-client.ts
    function simulateHasPermission(user, permissionId) {
      if (!user || !user.isActive) return false;
      
      // Los administradores siempre tienen todos los permisos
      if (user.role === 'ADMIN') return true;
      
      // Aquí normalmente verificaría localStorage o roles predefinidos
      return false;
    }
    
    testPermissions.forEach(perm => {
      const hasIt = simulateHasPermission(user, perm);
      console.log(`   ${hasIt ? '✅' : '❌'} ${perm}`);
    });
    
    // 4. Verificar localStorage
    console.log('\n4️⃣ VERIFICANDO LOCALSTORAGE...');
    try {
      const rolePermissions = localStorage.getItem('rolePermissions');
      if (rolePermissions) {
        console.log('📦 rolePermissions en localStorage:', JSON.parse(rolePermissions));
      } else {
        console.log('📦 No hay rolePermissions en localStorage (esto es normal)');
      }
    } catch (e) {
      console.log('📦 Error leyendo localStorage:', e.message);
    }
    
    // 5. Conclusiones
    console.log('\n🎯 CONCLUSIONES:');
    console.log('================');
    
    if (user.role === 'ADMIN') {
      console.log('✅ Usuario tiene rol ADMIN');
      console.log('✅ La función hasPermission() debería retornar true');
      console.log('✅ El sidebar debería mostrar todas las opciones');
      console.log('');
      console.log('💡 Si no funciona, intenta:');
      console.log('   1. Refrescar la página (Ctrl+F5)');
      console.log('   2. Limpiar caché del navegador');
      console.log('   3. Cerrar sesión y volver a iniciar');
    } else {
      console.log('❌ Usuario NO tiene rol ADMIN');
      console.log('💡 Esto explica por qué el sidebar no muestra opciones');
    }
    
  } catch (error) {
    console.error('❌ Error en debugging:', error);
  }
}

// Ejecutar automáticamente
debugFrontendPermissions(); 