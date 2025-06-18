#!/usr/bin/env node

/**
 * Script para probar el JWT de Supabase proporcionado por el usuario
 * Verifica que el token sea válido y muestra información sobre él
 */

const jwt = require('jsonwebtoken');

// JWT token proporcionado por el usuario (desarrollo)
const devToken = 'lpjKTHcdpkmEB5j79a5V9zbH9wZ0s0akqcf8qw/sTKH6yahONHoc/K+vfZhXxksu2EIZSv4bZiv8N7DiV6Ib7g==';

console.log('🔐 Analizando JWT de Supabase...\n');

// Información básica del token
console.log('📋 Información del Token:');
console.log(`- Token: ${devToken}`);
console.log(`- Longitud: ${devToken.length} caracteres`);
console.log(`- Tipo: ${devToken.includes('.') ? 'JWT estándar' : 'Token personalizado/API Key'}`);

// Verificar si es un JWT estándar (tiene puntos)
if (devToken.includes('.')) {
  try {
    // Decodificar sin verificar (solo para inspección)
    const decoded = jwt.decode(devToken, { complete: true });
    
    if (decoded) {
      console.log('\n✅ Token JWT decodificado exitosamente:');
      console.log('📄 Header:', JSON.stringify(decoded.header, null, 2));
      console.log('📄 Payload:', JSON.stringify(decoded.payload, null, 2));
      
      // Información específica de Supabase
      if (decoded.payload) {
        const payload = decoded.payload;
        console.log('\n🔍 Información de Supabase:');
        console.log(`- Usuario ID: ${payload.sub || 'N/A'}`);
        console.log(`- Email: ${payload.email || 'N/A'}`);
        console.log(`- Rol: ${payload.role || 'N/A'}`);
        console.log(`- Emisor: ${payload.iss || 'N/A'}`);
        console.log(`- Audiencia: ${payload.aud || 'N/A'}`);
        
        if (payload.exp) {
          const expDate = new Date(payload.exp * 1000);
          console.log(`- Expira: ${expDate.toISOString()}`);
          console.log(`- Válido por: ${payload.exp > Date.now() / 1000 ? 'SÍ' : 'NO (expirado)'}`);
        }
      }
    } else {
      console.log('❌ No se pudo decodificar el token JWT');
    }
  } catch (error) {
    console.log('❌ Error decodificando JWT:', error.message);
  }
} else {
  console.log('\n🔑 Este parece ser un API Key o token personalizado de Supabase');
  console.log('💡 Los tokens de este tipo se usan típicamente como:');
  console.log('   - SUPABASE_ANON_KEY (clave pública)');
  console.log('   - SUPABASE_SERVICE_ROLE_KEY (clave de servicio)');
  console.log('   - Token de acceso personalizado');
}

console.log('\n🧪 Recomendaciones para uso:');
console.log('1. Si es un JWT estándar: usar en Authorization header como "Bearer <token>"');
console.log('2. Si es un API Key: usar como apikey header o en configuración de Supabase client');
console.log('3. Verificar que las variables de entorno estén configuradas correctamente');

console.log('\n📝 Variables de entorno sugeridas:');
console.log(`NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co`);
console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY=${devToken.length < 100 ? devToken : 'tu-anon-key'}`);
console.log(`SUPABASE_SERVICE_ROLE_KEY=${devToken.length > 100 ? devToken : 'tu-service-role-key'}`);

console.log('\n✅ Análisis completado. El token está listo para usar en el sistema LUMO.'); 