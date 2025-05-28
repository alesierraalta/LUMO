// Migración de base de datos para Choreo
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  return new Response(JSON.stringify({
    status: 'info',
    message: 'Database migration endpoint',
    instructions: [
      'Use POST method to execute migration',
      'Send JSON: {"action": "migrate"} to run db push',
      'Send JSON: {"action": "seed"} to seed initial data'
    ],
    available_actions: ['migrate', 'seed'],
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' }
  });
}

export async function POST(request: Request) {
  try {
    const { action, key } = await request.json();
    
    // Verificar clave de seguridad para operaciones sensibles
    if (key !== 'choreo-migrate-2025') {
      return new Response(JSON.stringify({
        status: 'error',
        message: 'Invalid security key',
        timestamp: new Date().toISOString()
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    if (action === 'migrate') {
      try {
        // Ejecutar db push para sincronizar schema
        const { execSync } = require('child_process');
        
        console.log('🔄 Starting database migration...');
        const output = execSync('npx prisma db push --skip-generate', { 
          encoding: 'utf8',
          timeout: 60000 // 60 segundos timeout
        });
        
        console.log('✅ Migration completed:', output);
        
        return new Response(JSON.stringify({
          status: 'success',
          message: 'Database migration completed successfully',
          output: output,
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (migrationError: any) {
        console.error('❌ Migration failed:', migrationError);
        
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Database migration failed',
          error: migrationError.message,
          output: migrationError.stdout || '',
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    if (action === 'seed') {
      try {
        console.log('🌱 Starting database seeding...');
        
        // Aquí iría el código de seeding
        // Por ahora retornamos un placeholder
        
        return new Response(JSON.stringify({
          status: 'info',
          message: 'Database seeding not implemented yet',
          timestamp: new Date().toISOString()
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
      } catch (seedError: any) {
        return new Response(JSON.stringify({
          status: 'error',
          message: 'Database seeding failed',
          error: seedError.message,
          timestamp: new Date().toISOString()
        }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }
    
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Invalid action. Use "migrate" or "seed"',
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: any) {
    return new Response(JSON.stringify({
      status: 'error',
      message: 'Invalid request format',
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
} 