const fs = require('fs');

console.log('🔧 Adding SUPABASE_SERVICE_ROLE_KEY to .env.local...');

const serviceKey = '\n# CRÍTICO: Clave de servicio para operaciones del servidor (APIs)\nSUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5kcHJyaXF5aGRkam9peHJscW56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDEwODQwMCwiZXhwIjoyMDY1Njg0NDAwfQ.Nqs_Lm2qdqcbgNV0r9BsxmkJPCEgPiZeKUOz0eJWXKI\n\n# JWT Secret para autenticación\nJWT_SECRET=lumo-super-secret-jwt-key-2024-production-ready-32chars\n';

try {
  if (fs.existsSync('.env.local')) {
    const content = fs.readFileSync('.env.local', 'utf8');
    if (!content.includes('SUPABASE_SERVICE_ROLE_KEY')) {
      fs.appendFileSync('.env.local', serviceKey);
      console.log('✅ SUPABASE_SERVICE_ROLE_KEY added successfully');
    } else {
      console.log('⚠️ SUPABASE_SERVICE_ROLE_KEY already exists');
    }
  } else {
    console.log('❌ .env.local file not found');
  }
} catch (error) {
  console.error('❌ Error:', error.message);
}

console.log('\n🎯 Next: Restart your server with: npm run dev'); 